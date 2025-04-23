import File from '@/models/File';
import { IFile } from '@/models/File';

/**
 * Get all files in a folder and its subfolders
 * @param folderPath The path of the folder
 * @returns Array of files
 */
export async function getPhotosInFolder(folderPath: string): Promise<IFile[]> {
  try {
    const files = await File.find({ folderPath });
    return files;
  } catch (error) {
    console.error('Error getting files in folder:', error);
    throw error;
  }
}

/**
 * Remove all files in a folder and its subfolders
 * @param folderPath The path of the folder
 */
export async function removePhotosInFolder(folderPath: string): Promise<void> {
  try {
    await File.deleteMany({ folderPath });
  } catch (error) {
    console.error('Error removing files in folder:', error);
    throw error;
  }
} 