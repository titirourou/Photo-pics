import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import File from '@/models/File';
import Keyword from '@/models/Keyword';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keywords = searchParams.getAll('keyword');

    if (!keywords.length) {
      return NextResponse.json(
        { error: 'At least one keyword parameter is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Ensure Keyword model is registered
    if (!mongoose.models.Keyword) {
      await import('@/models/Keyword');
    }

    // Split keywords by quotes to handle multi-word keywords
    const searchTerms = keywords.flatMap(keyword => {
      // Extract quoted phrases and individual words
      const matches = keyword.match(/"([^"]+)"|([^"\s]+)/g) || [];
      return matches.map(term => {
        // Remove quotes and trim
        return term.replace(/^"(.*)"$/, '$1').toLowerCase().trim();
      }).filter(term => term.length > 0);
    });

    console.log('Search terms:', searchTerms);

    // First try exact matches for each term
    const exactMatches = await Keyword.find({
      value: { $in: searchTerms }
    });

    console.log('Exact matches found:', exactMatches.map(k => k.value));

    // If we found exact matches, find files that contain ALL the matched keywords
    if (exactMatches.length > 0) {
      const files = await File.find({
        keywords: { 
          $all: exactMatches.map(k => k._id) // Require ALL keywords to be present
        }
      })
        .populate({
          path: 'keywords',
          model: 'Keyword',
          select: 'value'
        })
        .sort({ filename: 1 });

      console.log('Found files with exact matches:', files.length);
      
      if (files.length > 0) {
        return NextResponse.json(files);
      }
    }

    // If no exact matches or no files found, try case-insensitive regex matches
    const regexPromises = searchTerms.map(term => 
      Keyword.find({
        value: new RegExp(term, 'i')
      })
    );

    const regexResults = await Promise.all(regexPromises);
    const matchedKeywords = regexResults.flat();

    console.log('Regex matches found:', matchedKeywords.map(k => k.value));

    // Find files that match ALL of the keywords (AND operation)
    const files = await File.find({
      keywords: { 
        $all: matchedKeywords.map(k => k._id) 
      }
    })
      .populate({
        path: 'keywords',
        model: 'Keyword',
        select: 'value'
      })
      .sort({ filename: 1 });

    console.log('Found files:', files.length);
    return NextResponse.json(files);

  } catch (error) {
    console.error('Error in GET /api/search:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 