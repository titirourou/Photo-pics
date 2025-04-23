'use client';

import { useState } from "react"
import Sidebar from "@/components/Sidebar"
import ImageGrid from "@/components/ImageGrid"
import TopBar from "@/components/TopBar"

export default function Home() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isUserView] = useState(false); // TODO: Replace with actual auth check

  const handleFolderSelect = (path: string) => {
    setSelectedFolder(path);
    setSearchQuery('');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedFolder(null);
  };

  const handleKeywordsUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <main className="flex h-screen overflow-hidden">
      <Sidebar
        selectedFolder={selectedFolder}
        onFolderSelect={handleFolderSelect}
        isUserView={isUserView}
        onKeywordsUpdated={handleKeywordsUpdated}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          searchQuery={searchQuery}
          onSearch={handleSearch}
          selectedFolder={selectedFolder}
          isUserView={isUserView}
        />
        <div className="flex-1 overflow-y-auto p-6">
          <ImageGrid
            selectedFolder={selectedFolder}
            searchQuery={searchQuery}
            isUserView={isUserView}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>
    </main>
  );
} 