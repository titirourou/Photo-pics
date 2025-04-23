import { useState, useEffect } from 'react';
import { ArrowPathIcon, FolderIcon, XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';

interface FolderItem {
  name: string;
  path: string;
  isDirectory: boolean;
}

interface SyncDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFolder: string | null;
}

export default function SyncDialog({ isOpen, onClose, selectedFolder }: SyncDialogProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [currentPath, setCurrentPath] = useState<string>('');
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [selectedExternalFolder, setSelectedExternalFolder] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      console.log('Dialog opened, fetching initial folders');
      fetchFolders('/Users');  // Start from the Users directory on macOS
    }
  }, [isOpen]);

  const fetchFolders = async (path: string) => {
    try {
      setIsLoading(true);
      console.log('Fetching folders for path:', path);
      const response = await fetch(`/api/browse-folders?path=${encodeURIComponent(path)}`);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error('Failed to fetch folders');
      }
      const data = await response.json();
      console.log('Received folders:', data);
      setFolders(data);
      setCurrentPath(path);
    } catch (error: any) {
      console.error('Error fetching folders:', error);
      setSyncStatus(`Error loading folders: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFolderClick = (folder: FolderItem) => {
    console.log('Folder clicked:', folder);
    if (folder.isDirectory) {
      fetchFolders(folder.path);
      setSelectedExternalFolder(folder.path);
    }
  };

  const handleNavigateUp = () => {
    console.log('Navigating up from:', currentPath);
    if (currentPath === '/') {
      console.log('Already at root, cannot go up');
      return;
    }
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    console.log('Parent path:', parentPath);
    fetchFolders(parentPath);
    setSelectedExternalFolder(null);
  };

  const handleSync = async () => {
    const folderToSync = selectedExternalFolder || selectedFolder;
    console.log('Starting sync for folder:', folderToSync);
    console.log('Is external folder:', !!selectedExternalFolder);
    console.log('Selected folder from sidebar:', selectedFolder);

    if (!folderToSync) {
      console.log('No folder selected, aborting sync');
      setSyncStatus('Please select a folder to sync');
      return;
    }

    try {
      setIsSyncing(true);
      setSyncStatus('Starting synchronization...');

      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: folderToSync,
          isExternal: !!selectedExternalFolder,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to sync folder');
      }

      const responseData = await response.json();
      console.log('Sync response:', responseData);

      setSyncStatus('Synchronization completed successfully');
      setTimeout(() => {
        onClose();
        setSyncStatus('');
        // Reload the page to refresh the folder tree and images
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error('Error syncing folder:', error);
      setSyncStatus(`Error syncing folder: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      {/* Background overlay */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

      {/* Full-screen container to center the panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl rounded-lg bg-white dark:bg-gray-800 shadow-xl">
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center">
                <FolderIcon className="h-6 w-6 text-primary mr-2" />
                <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                  Sync Folder
                </Dialog.Title>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400"
                disabled={isSyncing}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Folder browser */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-600 dark:text-gray-400">Browse external folders:</p>
                {currentPath && (
                  <button
                    onClick={handleNavigateUp}
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    Go up
                  </button>
                )}
              </div>
              <div className="border dark:border-gray-700 rounded-lg h-64 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <ArrowPathIcon className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <div className="divide-y dark:divide-gray-700">
                    {folders.map((folder) => (
                      <button
                        key={folder.path}
                        onClick={() => handleFolderClick(folder)}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center ${
                          selectedExternalFolder === folder.path ? 'bg-primary/10 dark:bg-primary/20' : ''
                        }`}
                      >
                        <FolderIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
                        <span className="flex-1 truncate text-gray-900 dark:text-white">{folder.name}</span>
                        {folder.isDirectory && (
                          <ChevronRightIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Status message */}
            {syncStatus && (
              <div className="mb-4">
                <p className={`text-sm ${
                  syncStatus.includes('Error') ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {syncStatus}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
                disabled={isSyncing}
              >
                Cancel
              </button>
              <button
                onClick={handleSync}
                disabled={(!selectedExternalFolder && !selectedFolder) || isSyncing}
                className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {isSyncing && (
                  <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                )}
                {isSyncing ? 'Syncing...' : 'Start Sync'}
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 