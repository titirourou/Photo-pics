'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import ImageGrid from '@/components/ImageGrid';

interface ImageFile {
  _id: string;
  filename: string;
  path: string;
  thumbnailPath: string;
  keywords: Array<{
    _id: string;
    value: string;
  }>;
}

export default function UserHome() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Handle folder selection
  const handleFolderSelect = (path: string | null) => {
    setSelectedFolder(path);
    // Clear search when changing folders
    setSearchQuery('');
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Clear folder selection when searching
    if (query) {
      setSelectedFolder(null);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    // Restore the last selected folder
    if (selectedFolder) {
      setSelectedFolder(selectedFolder);
    }
  };

  const handleKeywordsUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar
        selectedFolder={selectedFolder}
        onFolderSelect={handleFolderSelect}
        searchQuery={searchQuery}
        onSearch={handleSearch}
        isUserView={true}
      />
      <div className="flex-1 flex flex-col">
        <TopBar 
          searchQuery={searchQuery}
          onSearch={handleSearch}
          selectedFolder={selectedFolder}
          isUserView={true}
        />
        <main className="flex-1 overflow-auto p-4">
          <ImageGrid
            selectedFolder={selectedFolder}
            searchQuery={searchQuery}
            isUserView={true}
            refreshTrigger={refreshTrigger}
            onKeywordsUpdated={handleKeywordsUpdated}
            onClearSearch={handleClearSearch}
          />
        </main>
      </div>
    </div>
  );
} 