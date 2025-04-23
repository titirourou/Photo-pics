import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import File from '@/models/File';

export async function GET() {
  try {
    await connectDB();

    const files = await File.find()
      .select('filename path thumbnailPath keywords')
      .sort({ filename: 1 });

    return NextResponse.json(files);
  } catch (error) {
    console.error('Error in GET /api/photos:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 