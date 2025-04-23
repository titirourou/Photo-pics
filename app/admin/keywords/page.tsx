'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useSearchStore } from '@/lib/store';

interface KeywordStats {
  totalKeywords: number;
  filesWithoutKeywords: number;
}

interface Keyword {
  _id: string;
  value: string;
  count: number;
}

export default function KeywordsManagement() {
  const router = useRouter();
  const setPendingSearch = useSearchStore(state => state.setPendingSearch);
  const [stats, setStats] = useState<KeywordStats>({ totalKeywords: 0, filesWithoutKeywords: 0 });
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStats();
    fetchKeywords();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/keywords/stats');
      const data = await response.json();
      setStats(data);
      setIsLoading(false);
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Keywords Management</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage and organize your photo keywords
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

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Keywords</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {isLoading ? '...' : stats.totalKeywords}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Files Without Keywords</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {isLoading ? '...' : stats.filesWithoutKeywords}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
            <div className="p-6">
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
          </div>

          {/* Keywords List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6">
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
          </div>
        </div>
      </div>
    </div>
  );
} 