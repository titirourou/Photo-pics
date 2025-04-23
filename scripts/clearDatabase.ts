import { config } from 'dotenv';
config(); // Load environment variables from .env

import connectDB from '@/lib/mongodb';
import Folder from '@/models/Folder';
import File from '@/models/File';

async function clearDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();

    console.log('Deleting all folders...');
    await Folder.deleteMany({});

    console.log('Deleting all files...');
    await File.deleteMany({});

    console.log('Database cleared successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
}

clearDatabase(); 