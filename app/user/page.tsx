'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import ImageGrid from '@/components/ImageGrid';

export default function UserHome() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  return (
    <div className="flex h-screen">
      <Sidebar 
        selectedFolder={selectedFolder}
        onFolderSelect={setSelectedFolder}
        isUserView={true}
      />
      <div className="flex-1 flex flex-col">
        <TopBar 
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          selectedFolder={selectedFolder}
          isUserView={true}
        />
        <main className="flex-1 p-6 overflow-auto">
          <ImageGrid 
            selectedFolder={selectedFolder}
            searchQuery={searchQuery}
            isUserView={true}
          />
        </main>
      </div>
    </div>
  );
} 