import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import File from '@/models/File';
import { PipelineStage } from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Split the query into words and get the last word (being typed)
    const words = query.split(' ');
    const lastWord = words[words.length - 1];
    const previousWords = words.slice(0, -1);

    // Build the aggregation pipeline
    const pipeline: PipelineStage[] = [];

    // If we have previous words, first match documents containing all of them
    if (previousWords.length > 0) {
      const previousConditions = previousWords.map(word => ({
        keywords: {
          $regex: word,
          $options: 'i'
        }
      }));

      pipeline.push({
        $match: {
          $and: previousConditions
        }
      });
    }

    // Then get unique keywords that match the last word
    pipeline.push(
      { $unwind: '$keywords' },
      {
        $match: {
          keywords: {
            $regex: lastWord,
            $options: 'i'
          }
        }
      },
      {
        $group: {
          _id: '$keywords',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 10 }
    );

    const files = await File.aggregate(pipeline);

    const suggestions = files.map(file => ({
      keyword: file._id,
      count: file.count,
      fullQuery: [...previousWords, file._id].join(' ')
    }));

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error in GET /api/keywords/suggest:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 