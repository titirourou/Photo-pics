import { NextRequest, NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join, basename } from 'path';

const PHOTOS_ROOT = process.env.PHOTOS_ROOT || '';

const isValidPath = (path: string): boolean => {
  // Check if the path is within PHOTOS_ROOT to prevent directory traversal
  return path.startsWith(PHOTOS_ROOT);
};

export async function GET(request: NextRequest) {
  try {
    if (!PHOTOS_ROOT) {
      return NextResponse.json(
        { error: 'PHOTOS_ROOT environment variable is not set' },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    let path = searchParams.get('path') || '';

    // If no path provided or invalid path, start from PHOTOS_ROOT
    if (!path || !isValidPath(path)) {
      path = PHOTOS_ROOT;
    }

    const entries = await readdir(path, { withFileTypes: true });
    
    // Filter and get directory information
    const folders = entries
      .filter(entry => 
        // Only show directories
        entry.isDirectory() &&
        // Exclude hidden files and the thumbnails folder
        !entry.name.startsWith('.') && 
        entry.name.toLowerCase() !== 'thumbnails'
      )
      .map(entry => ({
        name: entry.name,
        path: join(path, entry.name),
        isDirectory: true,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(folders);
  } catch (error) {
    console.error('Error in GET /api/browse-folders:', error);
    if ((error as any).code === 'EPERM') {
      return NextResponse.json(
        { error: 'Permission denied. Please ensure the photos directory is accessible.' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to read directory' },
      { status: 500 }
    );
  }
} 