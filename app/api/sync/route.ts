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
    await sharp(sourcePath)
      .resize(300, 300, {
        fit: 'cover',
        position: 'attention'
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    await sharp({
      create: {
        width: 300,
        height: 300,
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
        
        let filePath: string;
        if (isExternal) {
          filePath = await copyFileToLibrary(fullPath, subfolderPath);
        } else {
          filePath = relative(PHOTOS_ROOT, fullPath);
        }
        
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

async function copyFileToLibrary(sourcePath: string, subfolderPath: string = ''): Promise<string> {
  const filename = basename(sourcePath);
  const destinationDir = subfolderPath ? join(PHOTOS_ROOT, subfolderPath) : PHOTOS_ROOT;
  await ensureDirectoryExists(destinationDir);
  const destinationPath = join(destinationDir, filename);
  
  const image = await sharp(sourcePath).toBuffer();
  await sharp(image).toFile(destinationPath);
  
  return relative(PHOTOS_ROOT, destinationPath);
}

async function ensureDirectoryExists(dir: string) {
  try {
    await stat(dir);
  } catch (error) {
    await mkdir(dir, { recursive: true });
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

    const processPath = isExternal ? path : join(PHOTOS_ROOT, path);
    const baseFolderName = isExternal ? basename(processPath) : '';
    await processDirectory(processPath, isExternal, baseFolderName);

    return NextResponse.json({ message: 'Sync completed successfully' });
  } catch (error) {
    console.error('Error in POST /api/sync:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
} 