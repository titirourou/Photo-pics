import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import File from '@/models/File';
import Keyword from '@/models/Keyword';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const searchQuery = searchParams.get('keyword');

    if (!searchQuery) {
      return NextResponse.json(
        { error: 'Keyword parameter is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Ensure Keyword model is registered
    if (!mongoose.models.Keyword) {
      await import('@/models/Keyword');
    }

    // Split the search query into individual keywords and trim whitespace
    const searchTerms = searchQuery.toLowerCase().split(' ').filter(k => k.trim());

    // Find keyword documents that match the search terms
    const keywordDocs = await Keyword.find({
      value: {
        $in: searchTerms.map(term => new RegExp(term, 'i'))
      }
    });

    // Get the IDs of matching keywords
    const keywordIds = keywordDocs.map(doc => doc._id);

    // Find files that have any of these keywords (global search)
    const files = await File.find({
      keywords: { $in: keywordIds }
    })
      .populate({
        path: 'keywords',
        model: 'Keyword',
        select: 'value'
      })
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