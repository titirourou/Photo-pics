import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import File from '@/models/File';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get('keyword');

    if (!keyword) {
      return NextResponse.json(
        { error: 'Keyword parameter is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Split the search query into individual keywords and trim whitespace
    const keywords = keyword.split(' ').filter(k => k.trim());

    // Create an array of conditions for each keyword
    const conditions = keywords.map(k => ({
      keywords: {
        $regex: k,
        $options: 'i'
      }
    }));

    // Use $and to match all conditions
    const files = await File.find({
      $and: conditions
    })
      .select('filename path thumbnailPath keywords')
      .sort({ filename: 1 });

    return NextResponse.json(files);
  } catch (error) {
    console.error('Error in GET /api/search:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 