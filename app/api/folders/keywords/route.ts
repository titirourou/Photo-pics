import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Folder from '@/models/Folder';
import File from '@/models/File';

export async function POST(request: Request) {
  try {
    const { folderPath, keywords } = await request.json();
    
    if (!folderPath || !keywords || !Array.isArray(keywords)) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    await connectDB();
    
    // Find the target folder and all its subfolders
    const folders = await Folder.find({
      $or: [
        { path: folderPath },
        { path: new RegExp(`^${folderPath}/`) }
      ]
    });

    // Get all folder paths for file query
    const folderPaths = folders.map(folder => folder.path);

    // Update each folder's keywords
    const folderUpdatePromises = folders.map(folder => {
      const existingKeywords = new Set(folder.keywords || []);
      keywords.forEach(keyword => existingKeywords.add(keyword));
      
      return Folder.findByIdAndUpdate(
        folder._id,
        {
          $set: {
            keywords: Array.from(existingKeywords),
            updatedAt: new Date()
          }
        }
      );
    });

    // Find and update all files in the folders
    const files = await File.find({
      folderPath: { $in: folderPaths }
    });

    const fileUpdatePromises = files.map(file => {
      const existingKeywords = new Set(file.keywords || []);
      keywords.forEach(keyword => existingKeywords.add(keyword));

      return File.findByIdAndUpdate(
        file._id,
        {
          $set: {
            keywords: Array.from(existingKeywords),
            updatedAt: new Date()
          }
        }
      );
    });

    // Wait for all updates to complete
    await Promise.all([...folderUpdatePromises, ...fileUpdatePromises]);

    return NextResponse.json({ 
      success: true,
      foldersUpdated: folders.length,
      filesUpdated: files.length
    });
  } catch (error) {
    console.error('Error updating keywords:', error);
    return NextResponse.json(
      { error: 'Failed to update keywords' },
      { status: 500 }
    );
  }
} 