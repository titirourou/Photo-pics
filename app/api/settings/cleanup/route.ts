import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import File from '@/models/File';
import Folder from '@/models/Folder';
import Keyword from '@/models/Keyword';
import { rm } from 'fs/promises';
import { join } from 'path';

export async function POST() {
  try {
    await connectDB();

    // Clean up database collections
    await Promise.all([
      File.deleteMany({}),
      Folder.deleteMany({}),
      Keyword.deleteMany({})
    ]);

    // Clean up thumbnail directory
    const PHOTOS_ROOT = process.env.PHOTOS_ROOT || '';
    const THUMBNAILS_DIR = join(PHOTOS_ROOT, 'thumbnails');
    
    try {
      await rm(THUMBNAILS_DIR, { recursive: true, force: true });
    } catch (error) {
      console.error('Error deleting thumbnails directory:', error);
      // Continue even if thumbnail deletion fails
    }

    return NextResponse.json({ 
      success: true,
      message: 'All application data has been cleaned up successfully'
    });
  } catch (error) {
    console.error('Error in cleanup:', error);
    return NextResponse.json(
      { error: 'Failed to clean up application data' },
      { status: 500 }
    );
  }
} 