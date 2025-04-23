import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import File, { IFile } from '@/models/File';
import Keyword, { IKeyword } from '@/models/Keyword';
import mongoose from 'mongoose';

interface PopulatedFile extends Omit<IFile, 'keywords'> {
  keywords: (IKeyword & { _id: mongoose.Types.ObjectId })[];
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { path, keyword } = await request.json();

    if (!path || !keyword) {
      return NextResponse.json(
        { error: 'Path and keyword are required' },
        { status: 400 }
      );
    }

    const normalizedKeyword = keyword.toLowerCase().trim();

    // Create or get the keyword document
    const keywordDoc = await Keyword.findOneAndUpdate(
      { value: normalizedKeyword },
      { value: normalizedKeyword },
      { upsert: true, new: true }
    ) as IKeyword & { _id: mongoose.Types.ObjectId };

    // Update the file's keywords
    const file = await File.findOne({ path }).populate('keywords') as PopulatedFile & { save: () => Promise<void> };
    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Check if keyword is already added to the file
    const existingKeywordIds = file.keywords.map(k => k._id.toString());
    const isNewKeyword = !existingKeywordIds.includes(keywordDoc._id.toString());

    if (isNewKeyword) {
      // Add the keyword reference to the file
      const currentKeywords = file.keywords.map(k => k._id);
      file.keywords = [...currentKeywords, keywordDoc._id] as any; // Cast needed due to mongoose typing
      await file.save();

      // Increment the keyword count
      await Keyword.updateOne(
        { _id: keywordDoc._id },
        { $inc: { count: 1 } }
      );
    }

    // Return populated file
    const updatedFile = await File.findById(file._id).populate('keywords');
    return NextResponse.json(updatedFile);
  } catch (error) {
    console.error('Error in POST /api/keywords/file:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 