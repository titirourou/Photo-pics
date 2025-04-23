import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';

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

    const filePath = join(process.env.PHOTOS_ROOT || '', path);
    const buffer = await readFile(filePath);

    // If the path already points to a thumbnail, serve it directly
    if (path.includes('thumbnails/')) {
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    }

    // Otherwise, generate a thumbnail on the fly
    const thumbnail = await sharp(buffer)
      .resize(300, 300, {
        fit: 'cover',
        position: 'attention'
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    return new NextResponse(thumbnail, {
      headers: {
        'Content-Type': 'image/jpeg',
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