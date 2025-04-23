import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { PlusIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Masonry from 'react-masonry-css';

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

interface ImageGridProps {
  selectedFolder: string | null;
  searchQuery: string;
  isUserView: boolean;
  refreshTrigger: number;
  onKeywordsUpdated: () => void;
  onClearSearch?: () => void;
}

export default function ImageGrid({
  selectedFolder,
  searchQuery,
  isUserView,
  refreshTrigger,
  onKeywordsUpdated,
  onClearSearch
}: ImageGridProps) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);
  const [isAdmin] = useState(true); // TODO: Replace with actual auth check
  const [newKeyword, setNewKeyword] = useState('');
  const [showKeywordInput, setShowKeywordInput] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (selectedImage) {
      const index = images.findIndex(img => img._id === selectedImage._id);
      setSelectedImageIndex(index);
    }
  }, [selectedImage, images]);

  useEffect(() => {
    setError(null);
    loadImages();
  }, [selectedFolder, searchQuery, refreshTrigger]);

  const loadImages = async () => {
    setIsLoading(true);
    try {
      let url;
      if (searchQuery) {
        // When searching, always search globally (no folder filter)
        url = `/api/search?keyword=${encodeURIComponent(searchQuery)}`;
      } else {
        // When not searching, show folder contents or root
        url = selectedFolder
          ? `/api/folder?path=${encodeURIComponent(selectedFolder)}`
          : '/api/folder?path=/';
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch images');
      const data = await response.json();
      setImages(data);
    } catch (error) {
      console.error('Error loading images:', error);
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImage = async (image: ImageFile, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    try {
      const response = await fetch(`/api/image?path=${encodeURIComponent(image.path)}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = image.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const addKeyword = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!selectedImage || !newKeyword.trim()) return;

    try {
      const response = await fetch('/api/keywords/file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: selectedImage.path,
          keyword: newKeyword.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add keyword');
      }

      const updatedImage = await response.json();
      
      setImages(prevImages =>
        prevImages.map(img =>
          img._id === selectedImage._id
            ? { ...img, keywords: updatedImage.keywords }
            : img
        )
      );
      
      setSelectedImage(prev => prev ? { ...prev, keywords: updatedImage.keywords } : null);
      setNewKeyword('');
      setShowKeywordInput(false);
      onKeywordsUpdated();
    } catch (error) {
      console.error('Error adding keyword:', error);
      alert('Failed to add keyword. Please try again.');
    }
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (selectedImageIndex === -1) return;
    
    const newIndex = direction === 'next' 
      ? (selectedImageIndex + 1) % images.length
      : (selectedImageIndex - 1 + images.length) % images.length;
    
    setSelectedImage(images[newIndex]);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') navigateImage('prev');
    if (e.key === 'ArrowRight') navigateImage('next');
    if (e.key === 'Escape') setSelectedImage(null);
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedImageIndex, images]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const breakpointColumns = {
    default: 6, // Maximum columns for very large screens (>1920px)
    1920: 5,   // 5 columns for 1920px screens
    1536: 4,   // 4 columns for 1536px screens
    1280: 3,   // 3 columns for 1280px screens
    1024: 2,   // 2 columns for 1024px screens
    768: 2,    // 2 columns for tablets
    640: 1     // 1 column for mobile
  };

  return (
    <div className="space-y-4">
      {/* Search Results Header */}
      {searchQuery && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Search results for:
            </span>
            <div className="flex flex-wrap gap-2">
              {searchQuery.split(' ').map((term, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                >
                  {term}
                </span>
              ))}
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
              ({images.length} {images.length === 1 ? 'result' : 'results'})
            </span>
          </div>
          <button
            onClick={onClearSearch}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
            Clear search
          </button>
        </div>
      )}

      <Masonry
        breakpointCols={breakpointColumns}
        className="flex -ml-4 w-auto"
        columnClassName="pl-4 bg-clip-padding"
      >
        {images.map(image => (
          <div
            key={image._id}
            className="mb-4 group relative cursor-pointer rounded-lg overflow-hidden"
            onClick={() => setSelectedImage(image)}
          >
            <div className="relative">
              <Image
                src={`/api/thumbnail?path=${encodeURIComponent(image.path)}`}
                alt={image.filename}
                width={1200}
                height={800}
                className="w-full rounded-lg transition-transform duration-200 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, (max-width: 1536px) 25vw, (max-width: 1920px) 20vw, 16vw"
                style={{ height: 'auto' }}
                priority={false}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
              
              {/* Download button */}
              <button
                onClick={(e) => downloadImage(image, e)}
                className="absolute top-2 right-2 p-2 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/70"
                title="Download photo"
              >
                <ArrowDownTrayIcon className="w-4 h-4 text-white" />
              </button>

              {(image.keywords?.length ?? 0) > 0 && (
                <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1">
                  {image.keywords.slice(0, 3).map((keyword, index) => (
                    <span
                      key={index}
                      className="bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full"
                    >
                      {keyword?.value || ''}
                    </span>
                  ))}
                  {image.keywords.length > 3 && (
                    <span className="bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                      +{image.keywords.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </Masonry>

      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="p-0 max-w-[99vw] w-auto bg-black/95 border-none [&>button]:hidden">
          <div className="flex">
            {/* Image Section */}
            <div className="relative flex items-center justify-center">
              {selectedImage && (
                <>
                  <Image
                    src={`/api/image?path=${encodeURIComponent(selectedImage.path)}`}
                    alt={selectedImage.filename}
                    width={2400}
                    height={1600}
                    className="max-h-[99vh] max-w-[calc(99vw-20rem)] w-auto h-auto object-contain"
                    priority
                    style={{ margin: 0 }}
                  />
                  
                  {/* Navigation Buttons */}
                  <button
                    onClick={(e) => { e.stopPropagation(); navigateImage('prev'); }}
                    className="absolute left-6 p-2.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeftIcon className="w-7 h-7" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigateImage('next'); }}
                    className="absolute right-6 p-2.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRightIcon className="w-7 h-7" />
                  </button>
                </>
              )}
            </div>

            {/* Info Sidebar */}
            <div className="w-80 bg-white dark:bg-gray-800 shadow-xl flex flex-col max-h-[99vh]">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 relative">
                <h2 className="pr-8 font-medium truncate text-gray-900 dark:text-white">
                  {selectedImage?.filename}
                </h2>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-3 right-3 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  aria-label="Close modal"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-700 dark:text-gray-200">Keywords</h3>
                      {!isUserView && !showKeywordInput && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowKeywordInput(true)}
                          className="h-8 px-2"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {!isUserView && showKeywordInput && (
                      <div className="mb-3">
                        <form
                          onSubmit={(e) => addKeyword(e)}
                          className="flex gap-2"
                        >
                          <Input
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
                            placeholder="Add keyword..."
                            className="h-8 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                            autoFocus
                          />
                          <Button
                            type="submit"
                            size="sm"
                            className="h-8"
                            disabled={!newKeyword.trim()}
                          >
                            Add
                          </Button>
                        </form>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1.5">
                      {selectedImage?.keywords?.map((keyword, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-sm dark:bg-gray-700 dark:text-gray-200"
                        >
                          {keyword?.value || ''}
                        </Badge>
                      ))}
                      {(!selectedImage?.keywords || selectedImage.keywords.length === 0) && (
                        <p className="text-sm text-gray-400 dark:text-gray-500">No keywords added yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  className="w-full"
                  onClick={() => selectedImage && downloadImage(selectedImage)}
                >
                  Download Photo
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 