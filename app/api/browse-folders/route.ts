import { NextRequest, NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join, basename } from 'path';
import os from 'os';

const getDefaultStartPath = () => {
  const platform = process.platform;
  if (platform === 'win32') {
    return 'C:\\';
  } else {
    return '/';
  }
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let path = searchParams.get('path') || '';

    // If no path provided, start from root or home directory
    if (!path) {
      path = getDefaultStartPath();
    }

    const entries = await readdir(path, { withFileTypes: true });
    
    // Filter out hidden files and get directory information
    const folders = entries
      .filter(entry => !entry.name.startsWith('.')) // Skip hidden files
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