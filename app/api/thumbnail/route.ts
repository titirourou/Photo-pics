import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import File from '@/models/File';
import connectDB from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { error: 'Path parameter is required' },
        { status: 400 }
      );
    }

    // Connect to the database to get the file info
    await connectDB();
    const file = await File.findOne({ path });
    
    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Use the original file path
    const filePath = join(process.env.PHOTOS_ROOT || '', file.path);
    const buffer = await readFile(filePath);

    // Determine content type based on file extension
    const contentType = file.path.toLowerCase().endsWith('.png') 
      ? 'image/png' 
      : file.path.toLowerCase().endsWith('.gif')
      ? 'image/gif'
      : 'image/jpeg';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error in GET /api/thumbnail:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 