'use client';

import { useState, useEffect } from 'react';
import { ArrowLeftIcon, FolderIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import SyncDialog from '@/components/SyncDialog';

export default function AdminPage() {
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalPhotos: 0,
    totalCollections: 0,
    totalKeywords: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch folders for collection count
      const foldersResponse = await fetch('/api/folders');
      const folderTree = await foldersResponse.json();
      console.log('Folder tree:', folderTree);
      
      // Root level folders in the tree are collections
      const totalCollections = folderTree.length;
      console.log('Total collections:', totalCollections);
      
      // Fetch all photos
      const photosResponse = await fetch('/api/photos');
      const photos = await photosResponse.json();
      console.log('All photos:', photos);
      
      // Calculate total unique keywords
      const uniqueKeywords = new Set<string>();
      photos.forEach((photo: any) => {
        photo.keywords?.forEach((keyword: string) => uniqueKeywords.add(keyword));
      });
      console.log('Unique keywords:', Array.from(uniqueKeywords));

      setStats({
        totalPhotos: photos.length,
        totalCollections: totalCollections,
        totalKeywords: uniqueKeywords.size
      });
      
      console.log('Final stats:', {
        totalPhotos: photos.length,
        totalCollections: totalCollections,
        totalKeywords: uniqueKeywords.size
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Collection Management</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Sync folders and manage your photo collections
              </p>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Back to App
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Photos</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.totalPhotos}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Collections</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.totalCollections}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Keywords</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.totalKeywords}</p>
            </div>
          </div>

          {/* Actions Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Sync New Folder Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FolderIcon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">Sync New Folder</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Add a new folder to your collection and sync its contents
                  </p>
                  <button
                    onClick={() => setShowSyncDialog(true)}
                    className="mt-4 inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm"
                  >
                    <ArrowPathIcon className="w-4 h-4 mr-2" />
                    Start Sync
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Activity Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Dialog */}
      <SyncDialog
        isOpen={showSyncDialog}
        onClose={() => setShowSyncDialog(false)}
        selectedFolder={selectedFolder}
      />
    </div>
  );
} 