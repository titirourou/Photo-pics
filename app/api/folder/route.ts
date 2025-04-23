import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import File from '@/models/File';

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

    await connectDB();

    const files = await File.find({ folderPath: path })
      .select('filename path thumbnailPath keywords')
      .sort({ filename: 1 });

    return NextResponse.json(files);
  } catch (error) {
    console.error('Error in GET /api/folder:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 