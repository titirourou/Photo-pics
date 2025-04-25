import { NextRequest, NextResponse } from 'next/server';
import { readdir, stat, mkdir } from 'fs/promises';
import { join, relative, extname, basename } from 'path';
import connectDB from '@/lib/mongodb';
import Folder from '@/models/Folder';
import File from '@/models/File';
import sharp from 'sharp';

const PHOTOS_ROOT = process.env.PHOTOS_ROOT || '';
const THUMBNAILS_DIR = join(PHOTOS_ROOT, 'thumbnails');

// Only allow these specific image formats
const VALID_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif'];

async function isValidImageFile(filename: string): Promise<boolean> {
  const ext = extname(filename).toLowerCase();
  return VALID_EXTENSIONS.includes(ext);
}

async function generateThumbnail(sourcePath: string, filename: string): Promise<string> {
  try {
    // Ensure thumbnails directory exists
    try {
      await stat(THUMBNAILS_DIR);
    } catch (error) {
      await mkdir(THUMBNAILS_DIR, { recursive: true });
    }

    const thumbnailFilename = basename(filename, extname(filename)) + '.jpg';
    const thumbnailPath = join(THUMBNAILS_DIR, thumbnailFilename);
    
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

    return relative(PHOTOS_ROOT, thumbnailPath);
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw error;
  }
}

async function processDirectory(dirPath: string, isExternal: boolean = false, subfolderPath: string = '') {
  try {
    console.log('Processing directory:', dirPath);
    const entries = await readdir(dirPath, { withFileTypes: true });
    const relativePath = isExternal ? subfolderPath : relative(PHOTOS_ROOT, dirPath);

    // Only create folder entry if it's not the root directory
    if (relativePath) {
      const pathParts = relativePath.split('/');
      const name = pathParts[pathParts.length - 1];
      const parentPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '/';

      // Create or update the folder
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
      } else if (entry.isFile() && await isValidImageFile(entry.name)) {
        const stats = await stat(fullPath);
        const filePath = isExternal ? fullPath : relative(PHOTOS_ROOT, fullPath);
        
        // Only generate thumbnail and update database if file is not already in database
        // or if file size has changed
        const existingFile = await File.findOne({ path: filePath });
        if (!existingFile || existingFile.size !== stats.size) {
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
  } catch (error: any) {
    if (error.code === 'EPERM') {
      console.error(`Permission denied accessing directory: ${dirPath}`);
      console.error('Please ensure the application has proper permissions to access Google Drive.');
      throw new Error(`Permission denied accessing directory: ${dirPath}. Please ensure Google Drive is properly mounted and accessible.`);
    }
    throw error;
  }
}

async function cleanupDuplicateFolders() {
  // Get all folders
  const folders = await Folder.find();
  
  // Create a map to track unique folder paths
  const folderPathMap = new Map();
  
  for (const folder of folders) {
    // Create a unique key based on the full path
    const key = folder.path;
    
    if (!folderPathMap.has(key)) {
      folderPathMap.set(key, folder);
    } else {
      // If we find a duplicate path, remove it
      await Folder.deleteOne({ _id: folder._id });
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!PHOTOS_ROOT) {
      console.error('PHOTOS_ROOT environment variable is not set');
      return NextResponse.json(
        { error: 'PHOTOS_ROOT environment variable is not set' },
        { status: 500 }
      );
    }

    // Check if PHOTOS_ROOT exists and is accessible
    try {
      await stat(PHOTOS_ROOT);
    } catch (error: any) {
      console.error('Error accessing PHOTOS_ROOT:', error);
      if (error.code === 'ENOENT') {
        return NextResponse.json(
          { error: 'PHOTOS_ROOT directory does not exist' },
          { status: 500 }
        );
      } else if (error.code === 'EPERM') {
        return NextResponse.json(
          { error: 'Permission denied accessing PHOTOS_ROOT. Please ensure Google Drive is properly mounted and accessible.' },
          { status: 403 }
        );
      }
      throw error;
    }

    await connectDB();

    // First, clean up any duplicate folders
    await cleanupDuplicateFolders();

    // Then process the directory structure
    await processDirectory(PHOTOS_ROOT);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in sync check:', error);
    
    // Handle specific error types
    if (error.code === 'EPERM') {
      return NextResponse.json(
        { error: 'Permission denied. Please ensure Google Drive is properly mounted and accessible.' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to sync changes' },
      { status: 500 }
    );
  }
} 