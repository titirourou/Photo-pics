import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from 'next-themes';

interface TopBarProps {
  searchQuery: string;
  onSearch: (query: string) => void;
  selectedFolder: string | null;
  isUserView?: boolean;
}

interface Suggestion {
  keyword: string;
  count: number;
  fullQuery: string;
}

export default function TopBar({ searchQuery, onSearch, selectedFolder, isUserView = false }: TopBarProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Initialize selected keywords from searchQuery
  useEffect(() => {
    if (searchQuery) {
      setSelectedKeywords(searchQuery.split(' ').filter(k => k.trim()));
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

  // Function to fetch suggestions
  const fetchSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`/api/keywords/suggest?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  };

  // Debounce the fetch suggestions function
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions(inputValue);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (!value.trim()) {
      setSuggestions([]);
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    const newKeywords = selectedKeywords.filter(k => k !== keywordToRemove);
    setSelectedKeywords(newKeywords);
    onSearch(newKeywords.join(' '));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !inputValue && selectedKeywords.length > 0) {
      // Remove the last tag when backspace is pressed and input is empty
      const newKeywords = selectedKeywords.slice(0, -1);
      setSelectedKeywords(newKeywords);
      onSearch(newKeywords.join(' '));
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex-1 max-w-2xl relative">
            <div className="relative flex items-center flex-wrap gap-2 min-h-[42px] pl-10 pr-4 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent dark:bg-gray-800">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              
              {/* Selected keyword tags */}
              {selectedKeywords.map((keyword, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary dark:bg-primary/20 rounded-full text-sm"
                >
                  {keyword}
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
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white flex items-center justify-between"
                    onClick={() => {
                      setSelectedKeywords([...selectedKeywords, suggestion.keyword]);
                      setInputValue('');
                      onSearch([...selectedKeywords, suggestion.keyword].join(' '));
                      setShowSuggestions(false);
                    }}
                  >
                    <span>{suggestion.keyword}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">({suggestion.count})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="ml-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? (
              <SunIcon className="h-5 w-5 text-gray-400 dark:text-gray-300" />
            ) : (
              <MoonIcon className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 