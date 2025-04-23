import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import File from '@/models/File';
import Keyword, { IKeyword } from '@/models/Keyword';
import mongoose from 'mongoose';

interface PopulatedFile extends Omit<Document, 'keywords'> {
  keywords: (IKeyword & { _id: mongoose.Types.ObjectId })[];
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const { folderPath, keywords } = await request.json();

    if (!folderPath || !Array.isArray(keywords)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Normalize keywords and ensure they exist in the keywords collection
    const normalizedKeywords = keywords.map(k => k.toLowerCase().trim());
    
    // Create or get keywords from the keywords collection
    const keywordDocs = await Promise.all(
      normalizedKeywords.map(async (keyword) => {
        const doc = await Keyword.findOneAndUpdate(
          { value: keyword },
          { value: keyword },
          { upsert: true, new: true }
        );
        return doc._id;
      })
    );

    // Find all files in the folder and its subfolders
    const files = await File.find({
      folderPath: { $regex: `^${folderPath}(/.*)?$` }
    }).populate('keywords') as PopulatedFile[];

    // Update each file's keywords
    for (const file of files) {
      const existingKeywordIds = file.keywords.map(k => k._id.toString());
      const newKeywordIds = keywordDocs.filter(id => !existingKeywordIds.includes(id.toString()));
      
      if (newKeywordIds.length > 0) {
        // Add new keyword references to the file
        file.keywords = [...file.keywords, ...newKeywordIds];
        await file.save();

        // Increment count for each newly added keyword
        const countOperations = newKeywordIds.map(keywordId => ({
          updateOne: {
            filter: { _id: keywordId },
            update: { $inc: { count: 1 } }
          }
        }));
        await Keyword.bulkWrite(countOperations);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/folders/keywords:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 