import { readdir, stat, mkdir } from 'fs/promises';
import { join, relative, extname, basename } from 'path';
import sharp from 'sharp';
import mongoose from 'mongoose';
import File from '../models/File';
import Folder from '../models/Folder';

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
  
  await sharp(sourcePath)
    .resize(300, 300, {
      fit: 'cover',
      position: 'attention'
    })
    .jpeg({ quality: 80 })
    .toFile(thumbnailPath);

  return relative(PHOTOS_ROOT, thumbnailPath);
}

async function processDirectory(dirPath: string) {
  // First check if this directory has any valid images (recursively)
  const hasValid = await hasValidImages(dirPath);
  if (!hasValid) {
    console.log('Skipping directory with no valid images:', dirPath);
    return;
  }

  const entries = await readdir(dirPath, { withFileTypes: true });
  const relativePath = relative(PHOTOS_ROOT, dirPath);

  // Create or update folder in database only if it contains valid images
  if (relativePath) {
    await Folder.findOneAndUpdate(
      { path: relativePath },
      {
        name: relativePath.split('/').pop() || '',
        parentPath: join('/', relativePath.split('/').slice(0, -1).join('/')),
      },
      { upsert: true }
    );
  }

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    
    if (entry.isDirectory() && !['thumbnails'].includes(entry.name)) {
      await processDirectory(fullPath);
    } else if (entry.isFile()) {
      // Skip if it's a RAW file
      if (await isRawFile(entry.name)) {
        console.log('Skipping RAW file:', entry.name);
        continue;
      }
      
      // Process only if it's a valid image file
      if (await isValidImageFile(entry.name)) {
        const stats = await stat(fullPath);
        const relativePath = relative(PHOTOS_ROOT, fullPath);
        const thumbnailPath = await generateThumbnail(fullPath, entry.name);

        await File.findOneAndUpdate(
          { path: relativePath },
          {
            filename: entry.name,
            folderPath: relative(PHOTOS_ROOT, dirPath),
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

async function main() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    await mongoose.connect(uri);
    await processDirectory(PHOTOS_ROOT);
    console.log('Sync completed successfully');
  } catch (error) {
    console.error('Error during sync:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main(); 