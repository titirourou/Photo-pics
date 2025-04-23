'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  TagIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchStore } from '@/lib/store';
import SyncDialog from '@/components/SyncDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface KeywordStats {
  totalKeywords: number;
  filesWithoutKeywords: number;
}

interface Keyword {
  _id: string;
  value: string;
  count: number;
}

interface Stats {
  totalPhotos: number;
  totalCollections: number;
  totalKeywords: number;
}

export default function AdminSettings() {
  const router = useRouter();
  const setPendingSearch = useSearchStore(state => state.setPendingSearch);
  const [stats, setStats] = useState<Stats>({
    totalPhotos: 0,
    totalCollections: 0,
    totalKeywords: 0
  });
  const [keywordStats, setKeywordStats] = useState<KeywordStats>({
    totalKeywords: 0,
    filesWithoutKeywords: 0
  });
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSyncDialog, setShowSyncDialog] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchKeywords();
    fetchKeywordStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch folders for collection count
      const foldersResponse = await fetch('/api/folders');
      const folderTree = await foldersResponse.json();
      const totalCollections = folderTree.length;
      
      // Fetch all photos
      const photosResponse = await fetch('/api/photos');
      const photos = await photosResponse.json();
      
      // Calculate total unique keywords
      const uniqueKeywords = new Set<string>();
      photos.forEach((photo: any) => {
        photo.keywords?.forEach((keyword: any) => uniqueKeywords.add(keyword.value));
      });

      setStats({
        totalPhotos: photos.length,
        totalCollections: totalCollections,
        totalKeywords: uniqueKeywords.size
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchKeywordStats = async () => {
    try {
      const response = await fetch('/api/keywords/stats');
      const data = await response.json();
      setKeywordStats(data);
    } catch (error) {
      console.error('Error fetching keyword stats:', error);
    }
  };

  const fetchKeywords = async () => {
    try {
      const response = await fetch('/api/keywords');
      const data = await response.json();
      setKeywords(data);
    } catch (error) {
      console.error('Error fetching keywords:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportKeywords = () => {
    const csvContent = keywords.map(k => `${k.value},${k.count}`).join('\n');
    const blob = new Blob(['Keyword,Count\n' + csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `keywords-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const keywords = text.split('\n')
        .slice(1) // Skip header row
        .map(line => line.trim())
        .filter(line => line) // Remove empty lines
        .map(line => line.split(',')[0]); // Get just the keyword, ignore count if present

      try {
        const response = await fetch('/api/keywords/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ keywords }),
        });

        if (response.ok) {
          fetchStats();
          fetchKeywords();
          fetchKeywordStats();
        }
      } catch (error) {
        console.error('Error uploading keywords:', error);
      }
    };
    reader.readAsText(file);
  };

  const handleSearchKeyword = (keyword: string) => {
    setPendingSearch(keyword);
    router.push('/admin');
  };

  const handleCleanup = async () => {
    try {
      const response = await fetch('/api/settings/cleanup', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to clean up data');
      }

      // Reload the page after successful cleanup
      window.location.reload();
    } catch (error) {
      console.error('Error during cleanup:', error);
      alert('Failed to clean up data. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Settings</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage your photo library settings
              </p>
            </div>
            <Link
              href="/admin"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Back to App
            </Link>
          </div>

          {/* Global Stats */}
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
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Files Without Keywords</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{keywordStats.filesWithoutKeywords}</p>
            </div>
          </div>

          {/* Settings Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <Tabs defaultValue="keywords" className="w-full">
              <TabsList className="flex w-full border-b border-gray-200 dark:border-gray-700">
                <TabsTrigger 
                  value="keywords" 
                  className="flex-1 px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary dark:data-[state=active]:text-primary hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <div className="flex items-center justify-center gap-2">
                    <TagIcon className="h-5 w-5" />
                    <span>Keywords Management</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="collections" 
                  className="flex-1 px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary dark:data-[state=active]:text-primary hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <div className="flex items-center justify-center gap-2">
                    <FolderIcon className="h-5 w-5" />
                    <span>Collections Management</span>
                  </div>
                </TabsTrigger>
              </TabsList>

              {/* Keywords Tab */}
              <TabsContent value="keywords" className="p-6 focus-visible:outline-none focus-visible:ring-0">
                {/* Keywords Actions */}
                <div className="mb-8">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Keyword Actions</h2>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={exportKeywords}
                      className="flex items-center gap-2"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                      Export Keywords
                    </Button>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Button
                        variant="outline"
                        className="flex items-center gap-2 w-full"
                      >
                        <ArrowUpTrayIcon className="h-5 w-5" />
                        Upload Keywords
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Keywords List */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">Keywords List</h2>
                    <Input
                      type="search"
                      placeholder="Search keywords..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-xs"
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Keyword</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Usage Count</th>
                          <th className="w-16"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {keywords
                          .filter(k => k.value.toLowerCase().includes(searchTerm.toLowerCase()))
                          .map((keyword) => (
                            <tr key={keyword._id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                                {keyword.value}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 text-right">{keyword.count}</td>
                              <td className="py-3 px-4 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSearchKeyword(keyword.value)}
                                  className="hover:bg-gray-100 dark:hover:bg-gray-700"
                                  title="Search images with this keyword"
                                >
                                  <MagnifyingGlassIcon className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              {/* Collections Tab */}
              <TabsContent value="collections" className="p-6">
                <div className="mb-8">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Collection Actions</h2>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={() => setShowSyncDialog(true)}
                      className="flex items-center gap-2"
                    >
                      <ArrowPathIcon className="h-5 w-5" />
                      Sync Collections
                    </Button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Collection Management</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Use the sync feature to update your photo collections. This will:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-2 text-gray-600 dark:text-gray-400">
                    <li>Scan your photo directories for new files</li>
                    <li>Update the database with new photos</li>
                    <li>Generate thumbnails for new photos</li>
                    <li>Remove entries for deleted photos</li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Sync Dialog */}
      {showSyncDialog && (
        <SyncDialog
          isOpen={showSyncDialog}
          onClose={() => setShowSyncDialog(false)}
          selectedFolder={null}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Manage application data and cleanup options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Clean All Data</h3>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                <p className="mb-2">This will remove all data from the application, including:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>All folder records</li>
                  <li>All file records</li>
                  <li>All keywords</li>
                  <li>Thumbnail cache</li>
                </ul>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    Clean All Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will permanently delete all application data. This includes all folder records, file records, keywords, and thumbnail cache. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCleanup}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, Clean All Data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 