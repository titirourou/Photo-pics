import { useState, useEffect } from 'react';
import { FolderIcon, ChevronRightIcon, EllipsisHorizontalIcon, XMarkIcon, Cog6ToothIcon, TagIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface FolderNode {
  _id: string;
  name: string;
  path: string;
  children: FolderNode[];
}

interface SidebarProps {
  selectedFolder: string | null;
  onFolderSelect: (path: string | null) => void;
  searchQuery: string;
  onSearch: (query: string) => void;
  isUserView: boolean;
  onKeywordsUpdated?: () => void;
  className?: string;
}

export default function Sidebar({
  selectedFolder,
  onFolderSelect,
  searchQuery,
  onSearch,
  isUserView,
  onKeywordsUpdated,
  className
}: SidebarProps) {
  const [folderTree, setFolderTree] = useState<FolderNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [keywordModalOpen, setKeywordModalOpen] = useState(false);
  const [selectedFolderPath, setSelectedFolderPath] = useState<string | null>(null);
  const [keywordInput, setKeywordInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [folderToRemove, setFolderToRemove] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchFolders();
  }, []);

  // Add periodic check for changes
  useEffect(() => {
    if (isUserView) return; // Only check for changes in admin view

    const checkForChanges = async () => {
      try {
        const response = await fetch('/api/sync/check');
        if (!response.ok) throw new Error('Failed to check for changes');
        const data = await response.json();
        
        if (data.success) {
          console.log('Sync completed successfully');
          await fetchFolders();
          setLastSyncTime(new Date().toLocaleTimeString());
        }
      } catch (error) {
        console.error('Error checking for changes:', error);
      }
    };

    // Initial check and time set
    setLastSyncTime(new Date().toLocaleTimeString());
    checkForChanges();

    // Check for changes every 30 seconds
    const interval = setInterval(checkForChanges, 30000);

    return () => clearInterval(interval);
  }, [isUserView]);

  const fetchFolders = async () => {
    try {
      const response = await fetch('/api/folders');
      if (!response.ok) throw new Error('Failed to fetch folders');
      const data = await response.json();
      setFolderTree(data);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleMenuClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMenu(activeMenu === path ? null : path);
  };

  const handleAddKeywords = async (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMenu(null);
    setSelectedFolderPath(path);
    setKeywordModalOpen(true);
  };

  const handleSubmitKeywords = async () => {
    if (!selectedFolderPath || !keywordInput.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/folders/keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderPath: selectedFolderPath,
          keywords: keywordInput.split(',').map(k => k.trim()).filter(k => k),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update keywords');
      }

      // Refresh folders after update
      await fetchFolders();
      
      // Notify parent component to refresh images
      if (onKeywordsUpdated) {
        onKeywordsUpdated();
      }
      
      setKeywordModalOpen(false);
      setKeywordInput('');
    } catch (error) {
      console.error('Error updating keywords:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveFolder = async (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMenu(null);
    setFolderToRemove(path);
    setShowRemoveDialog(true);
  };

  const confirmRemoveFolder = async () => {
    if (!folderToRemove) return;
    
    try {
      const response = await fetch('/api/folders', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderPath: folderToRemove,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove folder');
      }

      // Refresh the folder tree
      await fetchFolders();
      
      // Notify parent component if the selected folder was removed
      if (selectedFolder === folderToRemove) {
        onFolderSelect(null);
      }
      
      setShowRemoveDialog(false);
      setFolderToRemove(null);
    } catch (error) {
      console.error('Error removing folder:', error);
      alert('Failed to remove folder. Please try again.');
    }
  };

  const renderFolder = (folder: FolderNode, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.path);
    const isSelected = selectedFolder === folder.path;
    const hasChildren = folder.children.length > 0;
    const isMenuOpen = activeMenu === folder.path;

    return (
      <div key={folder._id} className="relative">
        <div className="flex items-center relative group hover:bg-gray-50 dark:hover:bg-gray-700">
          {/* Indentation and vertical lines */}
          {level > 0 && (
            <div className="absolute h-full" style={{ left: `${level * 16}px` }}>
              <div className="absolute h-full w-px bg-gray-200 dark:bg-gray-700" />
            </div>
          )}
          
          <button
            onClick={() => {
              onFolderSelect(folder.path);
              if (hasChildren) {
                toggleFolder(folder.path);
              }
            }}
            className={cn(
              "flex-1 flex items-center h-8 text-sm transition-colors pr-8",
              isSelected ? "text-primary dark:text-primary" : "text-gray-700 dark:text-gray-300",
              level > 0 && `pl-${level * 4 + 4}`
            )}
            style={{ paddingLeft: level > 0 ? `${level * 16 + 16}px` : undefined }}
          >
            <div className="flex items-center min-w-0">
              {hasChildren && (
                <ChevronRightIcon
                  className={cn(
                    "w-4 h-4 mr-1 flex-shrink-0 transition-transform",
                    isExpanded && "rotate-90"
                  )}
                />
              )}
              <FolderIcon className={cn(
                "w-4 h-4 flex-shrink-0",
                !hasChildren && "ml-5",
                isSelected ? "text-primary dark:text-primary" : "text-gray-400 dark:text-gray-500"
              )} />
              <span className="ml-2 truncate">{folder.name}</span>
            </div>
          </button>

          {!isUserView && (
            <button
              onClick={(e) => handleMenuClick(e, folder.path)}
              className={cn(
                "absolute right-2 p-1 rounded-md transition-colors",
                isMenuOpen ? "bg-gray-100 dark:bg-gray-700" : "invisible group-hover:visible"
              )}
            >
              <EllipsisHorizontalIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          )}

          {/* Folder Actions Menu */}
          {!isUserView && isMenuOpen && (
            <div 
              className="absolute right-0 top-full mt-1 w-48 py-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50"
              onClick={e => e.stopPropagation()}
            >
              <button
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={(e) => handleAddKeywords(e, folder.path)}
              >
                Add Keywords
              </button>
              <button
                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={(e) => handleRemoveFolder(e, folder.path)}
              >
                Remove Folder
              </button>
            </div>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div className="relative">
            <div className="pt-1">
              {folder.children.map(child => renderFolder(child, level + 1))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activeMenu) {
        setActiveMenu(null);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeMenu]);

  return (
    <div className={`w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col ${className}`}>
      <div className="h-[75px] flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">PHOTO-KEY</h1>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {!isUserView && isMounted && lastSyncTime && (
          <div className="mb-4 text-xs text-gray-500 dark:text-gray-400">
            Last checked: {lastSyncTime}
          </div>
        )}
        {folderTree.map(folder => renderFolder(folder))}
      </div>

      {!isUserView && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/admin/settings"
            className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <Cog6ToothIcon className="h-5 w-5" />
            <span>Settings</span>
          </Link>
        </div>
      )}

      {keywordModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 relative">
            <button
              onClick={() => setKeywordModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
            
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Add Keywords</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Enter keywords separated by commas. These keywords will be applied to all files in this folder and its subfolders.
            </p>
            
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="e.g., nature, landscape, summer"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setKeywordModalOpen(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitKeywords}
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add Keywords'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRemoveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Remove Folder</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to remove this folder and all its contents? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowRemoveDialog(false);
                  setFolderToRemove(null);
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveFolder}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 