'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import ImageGrid from '@/components/ImageGrid';

export default function AdminHome() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  return (
    <div className="flex h-screen">
      <Sidebar 
        selectedFolder={selectedFolder}
        onFolderSelect={setSelectedFolder}
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
          />
        </main>
      </div>
    </div>
  );
} 