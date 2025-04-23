import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import File from '@/models/File';
import Folder from '@/models/Folder';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, keyword } = body;

    if (!path || !keyword) {
      return NextResponse.json(
        { error: 'Path and keyword are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const folder = await Folder.findOne({ path });
    
    if (!folder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }

    // Add keyword to folder
    if (!folder.keywords.includes(keyword)) {
      folder.keywords.push(keyword);
      await folder.save();
    }

    // Add keyword to all files in folder
    await File.updateMany(
      { folderPath: path },
      { $addToSet: { keywords: keyword } }
    );

    const updatedFiles = await File.find({ folderPath: path })
      .select('filename path thumbnailPath keywords');

    return NextResponse.json({
      folder,
      files: updatedFiles
    });
  } catch (error) {
    console.error('Error in POST /api/keywords/folder:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 