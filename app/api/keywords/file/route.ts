import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import File from '@/models/File';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, keyword } = body;

    if (!path || !keyword) {
      return NextResponse.json(
        { error: 'Path and keyword are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const file = await File.findOne({ path });
    
    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    if (!file.keywords.includes(keyword)) {
      file.keywords.push(keyword);
      await file.save();
    }

    return NextResponse.json(file);
  } catch (error) {
    console.error('Error in POST /api/keywords/file:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 