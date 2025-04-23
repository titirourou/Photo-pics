import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Folder from '@/models/Folder';
import { removePhotosInFolder } from '@/lib/photos';
import fs from 'fs/promises';
import path from 'path';

interface FolderNode {
  _id: string;
  name: string;
  path: string;
  children: FolderNode[];
}

export async function GET() {
  try {
    await connectDB();

    // Get all folders and sort by path length to process parents first
    const folders = await Folder.find({}).sort({ path: 1 });
    console.log('Found folders:', folders);
    
    // Convert flat structure to tree
    const folderTree: FolderNode[] = [];
    const map = new Map<string, FolderNode>();

    // First pass: create all nodes
    folders.forEach(folder => {
      const node: FolderNode = {
        _id: folder._id.toString(),
        name: folder.name,
        path: folder.path,
        children: [],
      };
      map.set(folder.path, node);
    });

    // Second pass: build the tree
    folders.forEach(folder => {
      const node = map.get(folder.path);
      if (!node) return; // Skip if node not found (shouldn't happen)

      const parentPath = folder.parentPath;
      
      console.log('Processing folder:', {
        path: folder.path,
        name: folder.name,
        parentPath: parentPath
      });

      if (parentPath === '/') {
        // Top-level folder
        folderTree.push(node);
      } else {
        // Find the parent node
        const parent = map.get(parentPath);
        if (parent) {
          // Add as child to parent
          parent.children.push(node);
          console.log(`Added ${folder.path} as child of ${parentPath}`);
        } else {
          // If parent not found (shouldn't happen with proper sync)
          console.warn(`Parent folder ${parentPath} not found for ${folder.path}, adding to root`);
          folderTree.push(node);
        }
      }
    });

    // Sort the entire tree recursively
    const sortFolders = (nodes: FolderNode[]) => {
      nodes.sort((a, b) => a.name.localeCompare(b.name));
      nodes.forEach(node => {
        if (node.children.length > 0) {
          sortFolders(node.children);
        }
      });
    };
    sortFolders(folderTree);

    console.log('Generated folder tree:', JSON.stringify(folderTree, null, 2));
    return NextResponse.json(folderTree);
  } catch (error) {
    console.error('Error in GET /api/folders:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDB();

    const { folderPath } = await request.json();

    if (!folderPath) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Remove all photos in the folder and its subfolders from the database
    await removePhotosInFolder(folderPath);

    // Remove the folder from the database
    await Folder.deleteOne({ path: folderPath });

    // Remove any child folders from the database
    const pathRegex = new RegExp(`^${folderPath}(/.*)?$`);
    await Folder.deleteMany({ path: { $regex: pathRegex } });

    // Remove the folder and its contents from the filesystem
    try {
      await fs.rm(folderPath, { recursive: true });
    } catch (error) {
      console.error('Error removing folder from filesystem:', error);
      // Don't throw the error as we've already removed the data from the database
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/folders:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
