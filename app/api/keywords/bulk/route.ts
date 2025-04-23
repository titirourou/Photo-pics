import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Keyword from '@/models/Keyword';

export async function POST(request: Request) {
  try {
    await connectDB();

    const { keywords } = await request.json();

    if (!Array.isArray(keywords)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Process each keyword
    const operations = keywords.map(keyword => ({
      updateOne: {
        filter: { value: keyword.toLowerCase().trim() },
        update: { $setOnInsert: { value: keyword.toLowerCase().trim() } },
        upsert: true
      }
    }));

    await Keyword.bulkWrite(operations);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/keywords/bulk:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 