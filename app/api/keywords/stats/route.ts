import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Keyword from '@/models/Keyword';
import File from '@/models/File';

export async function GET() {
  try {
    await connectDB();

    // Get total keywords
    const totalKeywords = await Keyword.countDocuments();

    // Get count of files without keywords
    const filesWithoutKeywords = await File.countDocuments({
      $or: [
        { keywords: { $exists: false } },
        { keywords: { $size: 0 } }
      ]
    });

    return NextResponse.json({
      totalKeywords,
      filesWithoutKeywords
    });
  } catch (error) {
    console.error('Error in GET /api/keywords/stats:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 