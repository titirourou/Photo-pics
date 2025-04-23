import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Keyword from '@/models/Keyword';

export async function GET() {
  try {
    await connectDB();

    const keywords = await Keyword.find()
      .sort({ value: 1 }) // Sort alphabetically
      .select('value count');

    return NextResponse.json(keywords);
  } catch (error) {
    console.error('Error in GET /api/keywords:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 