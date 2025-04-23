'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import ImageGrid from '@/components/ImageGrid';
import { useSearchStore } from '@/lib/store';

export default function AdminHome() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { pendingSearch, setPendingSearch } = useSearchStore();

  // Handle pending search from keywords management page
  useEffect(() => {
    if (pendingSearch) {
      setSearchQuery(pendingSearch);
      setPendingSearch(null);
    }
  }, [pendingSearch, setPendingSearch]);

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
    <div className="flex h-screen">
      <Sidebar 
        selectedFolder={selectedFolder}
        onFolderSelect={setSelectedFolder}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        isUserView={false}
      />
      <div className="flex-1 flex flex-col">
        <TopBar 
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          selectedFolder={selectedFolder}
          isUserView={false}
        />
        <main className="flex-1 p-6 overflow-auto">
          <ImageGrid 
            selectedFolder={selectedFolder}
            searchQuery={searchQuery}
            isUserView={false}
            refreshTrigger={refreshTrigger}
            onKeywordsUpdated={handleKeywordsUpdated}
            onClearSearch={handleClearSearch}
          />
        </main>
      </div>
    </div>
  );
} 