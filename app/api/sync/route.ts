import { NextRequest, NextResponse } from 'next/server';
import { readdir, stat, mkdir } from 'fs/promises';
import { join, relative, extname, basename } from 'path';
import sharp from 'sharp';
import connectDB from '@/lib/mongodb';
import File from '@/models/File';
import Folder from '@/models/Folder';

const PHOTOS_ROOT = process.env.PHOTOS_ROOT || '';
const THUMBNAILS_DIR = join(PHOTOS_ROOT, 'thumbnails');

// Only allow these specific image formats
const VALID_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif'];

// List of RAW formats to explicitly ignore
const RAW_EXTENSIONS = [
  '.raw', '.arw', '.cr2', '.cr3', '.crw', '.dcr', '.dng', 
  '.erf', '.kdc', '.mef', '.mos', '.mrw', '.nef', '.nrw',
  '.orf', '.pef', '.raf', '.rw2', '.rwl', '.sr2', '.srf',
  '.srw', '.x3f'
];

async function isValidImageFile(filename: string): Promise<boolean> {
  const ext = extname(filename).toLowerCase();
  return VALID_EXTENSIONS.includes(ext);
}

async function isRawFile(filename: string): Promise<boolean> {
  const ext = extname(filename).toLowerCase();
  return RAW_EXTENSIONS.includes(ext);
}

async function hasValidImages(dirPath: string): Promise<boolean> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name !== 'thumbnails') {
      const hasValidSubImages = await hasValidImages(join(dirPath, entry.name));
      if (hasValidSubImages) return true;
    } else if (entry.isFile()) {
      if (await isValidImageFile(entry.name)) {
        return true;
      }
    }
  }
  
  return false;
}

async function generateThumbnail(sourcePath: string, filename: string): Promise<string> {
  // Ensure thumbnails directory exists
  try {
    await stat(THUMBNAILS_DIR);
  } catch (error) {
    await mkdir(THUMBNAILS_DIR, { recursive: true });
  }

  const thumbnailFilename = basename(filename, extname(filename)) + '.jpg';
  const thumbnailPath = join(THUMBNAILS_DIR, thumbnailFilename);
  
  try {
    // Get image metadata first
    const metadata = await sharp(sourcePath).metadata();
    const aspectRatio = metadata.width! / metadata.height!;
    
    // Calculate dimensions maintaining aspect ratio
    let width = 600;
    let height = Math.round(width / aspectRatio);
    
    // If height is too extreme, adjust dimensions
    if (height > 800) {
      height = 800;
      width = Math.round(height * aspectRatio);
    }

    await sharp(sourcePath)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    // Fallback to a default thumbnail
    await sharp({
      create: {
        width: 600,
        height: 400,
        channels: 3,
        background: { r: 200, g: 200, b: 200 }
      }
    })
    .jpeg()
    .toFile(thumbnailPath);
  }

  return relative(PHOTOS_ROOT, thumbnailPath);
}

async function processDirectory(dirPath: string, isExternal: boolean = false, subfolderPath: string = '') {
  console.log('Processing directory:', dirPath);
  
  // First check if this directory has any valid images (recursively)
  const hasValid = await hasValidImages(dirPath);
  if (!hasValid) {
    console.log('Skipping directory with no valid images:', dirPath);
    return;
  }

  const entries = await readdir(dirPath, { withFileTypes: true });
  const relativePath = isExternal ? subfolderPath : relative(PHOTOS_ROOT, dirPath);

  // Create or update folder in database only if it contains valid images
  if (relativePath) {
    const pathParts = relativePath.split('/');
    const name = pathParts[pathParts.length - 1];
    
    // Ensure all parent folders exist in the database
    let currentPath = '';
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      const parentPath = currentPath || '/';
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      
      // Create parent folder if it doesn't exist
      await Folder.findOneAndUpdate(
        { path: currentPath },
        {
          name: part,
          parentPath: parentPath,
        },
        { upsert: true }
      );
    }

    // Create or update the current folder
    const parentPath = pathParts.length > 1 
      ? pathParts.slice(0, -1).join('/')
      : '/';
    
    await Folder.findOneAndUpdate(
      { path: relativePath },
      {
        name: name,
        parentPath: parentPath,
      },
      { upsert: true }
    );
  }

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    
    if (entry.isDirectory() && entry.name !== 'thumbnails') {
      const newSubfolderPath = isExternal
        ? (subfolderPath ? join(subfolderPath, entry.name) : entry.name)
        : relative(PHOTOS_ROOT, fullPath);
      
      await processDirectory(fullPath, isExternal, newSubfolderPath);
    } else if (entry.isFile()) {
      // Skip if it's a RAW file
      if (await isRawFile(entry.name)) {
        console.log('Skipping RAW file:', entry.name);
        continue;
      }
      
      // Process only if it's a valid image file
      if (await isValidImageFile(entry.name)) {
        const stats = await stat(fullPath);
        
        // For external files, use the original path instead of copying
        const filePath = isExternal ? fullPath : relative(PHOTOS_ROOT, fullPath);
        
        const thumbnailPath = await generateThumbnail(fullPath, entry.name);

        await File.findOneAndUpdate(
          { path: filePath },
          {
            filename: entry.name,
            folderPath: relativePath,
            size: stats.size,
            extension: extname(entry.name).slice(1).toLowerCase(),
            thumbnailPath,
          },
          { upsert: true }
        );
      }
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { path, isExternal = false } = await request.json();
    
    if (!path) {
      return NextResponse.json(
        { error: 'Path parameter is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Clean up old folders before syncing
    if (!isExternal) {
      console.log('Cleaning up old folders...');
      await Folder.deleteMany({});
    }

    console.log('Starting directory processing...');
    await processDirectory(path, isExternal);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/sync:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 