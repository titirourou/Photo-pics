import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Folder from '@/models/Folder';
import { removePhotosInFolder } from '@/lib/photos';
import fs from 'fs/promises';
import path from 'path';
import { NextRequest } from 'next/server';

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
      if (!node) return;

      const parentPath = folder.parentPath;

      if (parentPath === '/') {
        // Only add to root if not already added
        if (!folderTree.some(f => f.path === folder.path)) {
          folderTree.push(node);
        }
      } else {
        // Find the parent node
        const parent = map.get(parentPath);
        if (parent) {
          // Only add as child if not already added
          if (!parent.children.some(f => f.path === folder.path)) {
            parent.children.push(node);
          }
        } else {
          // If parent not found and node not already in root, add to root
          if (!folderTree.some(f => f.path === folder.path)) {
            folderTree.push(node);
          }
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

    return NextResponse.json(folderTree);
  } catch (error) {
    console.error('Error in GET /api/folders:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    // Delete all folders
    await Folder.deleteMany({});
    
    return NextResponse.json({ success: true, message: 'All folders deleted successfully' });
  } catch (error) {
    console.error('Error deleting folders:', error);
    return NextResponse.json(
      { error: 'Failed to delete folders' },
      { status: 500 }
    );
  }
}
