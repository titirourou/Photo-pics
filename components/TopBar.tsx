import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, SunIcon, MoonIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { signOut } from 'next-auth/react';

interface TopBarProps {
  searchQuery: string;
  onSearch: (query: string) => void;
  selectedFolder: string | null;
  isUserView?: boolean;
}

interface KeywordSuggestion {
  _id: string;
  value: string;
  count: number;
}

export default function TopBar({ searchQuery, onSearch, selectedFolder, isUserView = false }: TopBarProps) {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<KeywordSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Initialize selected keywords from searchQuery
  useEffect(() => {
    if (searchQuery) {
      const keywords = searchQuery.split(' ').filter(k => k.trim());
      setSelectedKeywords(keywords);
      setInputValue('');
    } else {
      setSelectedKeywords([]);
      setInputValue('');
    }
  }, [searchQuery]);

  // Wait for mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchSuggestions = async (value: string) => {
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`/api/keywords/suggest?query=${encodeURIComponent(value)}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    fetchSuggestions(value);
  };

  const addKeyword = (keyword: string) => {
    const processedKeyword = keyword.trim();
    if (!processedKeyword) return;

    // If the keyword contains spaces and isn't already quoted, wrap it in quotes
    const formattedKeyword = processedKeyword.includes(' ') && !processedKeyword.startsWith('"') 
      ? `"${processedKeyword}"`
      : processedKeyword;

    if (!selectedKeywords.includes(formattedKeyword)) {
      const newKeywords = [...selectedKeywords, formattedKeyword];
      setSelectedKeywords(newKeywords);
      onSearch(newKeywords.join(' '));
      setInputValue('');
      setSuggestions([]);
    }
  };

  const removeKeyword = (keyword: string) => {
    const newKeywords = selectedKeywords.filter(k => k !== keyword);
    setSelectedKeywords(newKeywords);
    onSearch(newKeywords.join(' '));
  };

  const clearSearch = () => {
    setSelectedKeywords([]);
    setInputValue('');
    setSuggestions([]);
    onSearch(''); // This will clear the search in the parent component
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      // If the input contains a quote, make sure it's properly closed
      let processedInput = inputValue.trim();
      const quoteCount = (processedInput.match(/"/g) || []).length;
      
      if (quoteCount === 1) {
        // If there's only one quote, add the closing quote
        processedInput = processedInput.startsWith('"') 
          ? `${processedInput}"`
          : `"${processedInput}"`;
      }
      
      addKeyword(processedInput);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  if (!mounted) {
    return null;
  }

  const isSearchActive = selectedKeywords.length > 0 || inputValue.trim().length > 0;

  return (
    <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex-1 max-w-2xl relative">
            <div className={cn(
              "relative flex items-center flex-wrap gap-2 min-h-[42px] pl-10 pr-4 py-1 border rounded-lg focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent dark:bg-gray-800",
              isSearchActive ? "border-primary" : "border-gray-300 dark:border-gray-600"
            )}>
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              
              {/* Selected keyword tags */}
              {selectedKeywords.map((keyword, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary dark:bg-primary/20 rounded-full text-sm"
                >
                  {keyword.startsWith('"') ? keyword.slice(1, -1) : keyword}
                  <button
                    onClick={() => removeKeyword(keyword)}
                    className="hover:bg-primary/20 dark:hover:bg-primary/30 rounded-full p-0.5"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}

              {/* Search input */}
              <input
                type="text"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder={selectedKeywords.length === 0 ? "Search photos by keywords..." : ""}
                className="flex-1 min-w-[150px] outline-none bg-transparent dark:text-white dark:placeholder-gray-400"
              />

              {/* Clear search button */}
              {isSearchActive && (
                <button
                  onClick={clearSearch}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  title="Clear search"
                  type="button"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-400" />
                </button>
              )}
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <ul className="py-1">
                  {suggestions.map((suggestion) => (
                    <li
                      key={suggestion._id}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-gray-100 flex items-center justify-between group"
                      onClick={() => addKeyword(suggestion.value)}
                    >
                      <span className="flex items-center gap-2">
                        <span>{suggestion.value}</span>
                        {suggestion.value.includes(' ') && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100">
                            (multi-word)
                          </span>
                        )}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">({suggestion.count})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? (
                <SunIcon className="h-5 w-5 text-gray-400 dark:text-gray-300" />
              ) : (
                <MoonIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {/* Sign out button */}
            <button
              onClick={handleSignOut}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              title="Sign out"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 