import { NextRequest, NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join, basename } from 'path';
import os from 'os';

const getGoogleDrivePath = () => {
  const homeDir = os.homedir();
  return join(homeDir, 'Library/CloudStorage/GoogleDrive-trousseau@chalktalksports.com/My Drive');
};

const isGoogleDrivePath = (path: string): boolean => {
  return path.includes('Library/CloudStorage/GoogleDrive') && path.includes('My Drive');
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let path = searchParams.get('path') || '';

    // If no path provided, start from Google Drive My Drive
    if (!path) {
      path = getGoogleDrivePath();
    }

    // Only allow browsing within Google Drive My Drive
    if (!isGoogleDrivePath(path)) {
      return NextResponse.json([{
        name: 'My Drive',
        path: getGoogleDrivePath(),
        isDirectory: true,
      }]);
    }

    const entries = await readdir(path, { withFileTypes: true });
    
    // Filter and get directory information
    const folders = entries
      .filter(entry => !entry.name.startsWith('.')) // Filter out hidden files
      .map(entry => ({
        name: entry.name,
        path: join(path, entry.name),
        isDirectory: entry.isDirectory(),
      }))
      .sort((a, b) => {
        // Directories first, then alphabetically
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });

    return NextResponse.json(folders);
  } catch (error) {
    console.error('Error in GET /api/browse-folders:', error);
    return NextResponse.json(
      { error: 'Failed to read directory' },
      { status: 500 }
    );
  }
} 