import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Keyword from '@/models/Keyword';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json([]);
    }

    await connectDB();

    // Find keywords that match the query
    const keywords = await Keyword.find({
      value: {
        $regex: query,
        $options: 'i'
      }
    })
      .sort({ count: -1 }) // Sort by usage count
      .limit(10) // Limit to 10 suggestions
      .select('value count');

    return NextResponse.json(keywords);
  } catch (error) {
    console.error('Error in GET /api/keywords/suggest:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 