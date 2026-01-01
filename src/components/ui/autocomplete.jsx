import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Check, ChevronsUpDown, X, Search, Loader2 } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';

const Autocomplete = ({
  options = [],
  value = '',
  onChange,
  placeholder = 'Search...',
  disabled = false,
  className = '',
  onSelect,
  loading = false,
  showSuggestions = true,
  maxSuggestions = 8,
  highlightMatches = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Memoized filtered options with fuzzy matching and highlighting
  const processedOptions = useMemo(() => {
    if (!value.trim()) {
      return showSuggestions ? options.slice(0, maxSuggestions) : [];
    }

    const searchTerm = value.toLowerCase();
    const filtered = options.filter(option => {
      const optionText = option.label.toLowerCase();
      return optionText.includes(searchTerm) ||
             optionText.split(' ').some(word => word.startsWith(searchTerm));
    });

    // Sort by relevance: exact matches first, then prefix matches, then contains
    return filtered.sort((a, b) => {
      const aLower = a.label.toLowerCase();
      const bLower = b.label.toLowerCase();

      // Exact match gets highest priority
      if (aLower === searchTerm) return -1;
      if (bLower === searchTerm) return 1;

      // Prefix match gets second priority
      const aStarts = aLower.startsWith(searchTerm);
      const bStarts = bLower.startsWith(searchTerm);
      if (aStarts && !bStarts) return -1;
      if (bStarts && !aStarts) return 1;

      // Contains match - sort by length difference
      return aLower.length - bLower.length;
    }).slice(0, maxSuggestions);
  }, [value, options, showSuggestions, maxSuggestions]);

  useEffect(() => {
    setFilteredOptions(processedOptions);
    setHighlightedIndex(-1);
  }, [processedOptions]);

  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex];
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleKeyDown = (e) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (option) => {
    onChange(option.label);
    onSelect?.(option);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(newValue.trim().length > 0);
  };

  const clearValue = () => {
    onChange('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  // Helper function to highlight matching text
  const highlightMatch = (text, searchTerm) => {
    if (!highlightMatches || !searchTerm.trim()) return text;

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-gray-900 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Search className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(value.trim().length > 0)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10 pr-20"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-describedby="autocomplete-help"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
          )}
          {value && (
            <button
              type="button"
              onClick={clearValue}
              className="text-muted-foreground hover:text-foreground p-1 rounded-sm hover:bg-accent"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen && value.trim().length > 0)}
            className="text-muted-foreground hover:text-foreground p-1 rounded-sm hover:bg-accent"
            aria-label="Toggle suggestions"
            disabled={!value.trim()}
          >
            <ChevronsUpDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Hidden help text for screen readers */}
      <div id="autocomplete-help" className="sr-only">
        Use arrow keys to navigate suggestions, Enter to select, Escape to close
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto"
          role="listbox"
        >
          {filteredOptions.map((option, index) => (
            <button
              key={`${option.value}-${index}`}
              type="button"
              onClick={() => handleSelect(option)}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-accent hover:text-accent-foreground flex items-center justify-between transition-colors ${
                index === highlightedIndex ? 'bg-accent text-accent-foreground' : ''
              }`}
              role="option"
              aria-selected={index === highlightedIndex}
            >
              <span className="flex-1">
                {highlightMatches ? highlightMatch(option.label, value) : option.label}
              </span>
              {option.type && (
                <span className="text-xs text-muted-foreground ml-2 px-2 py-1 bg-muted rounded-full">
                  {option.type}
                </span>
              )}
              {option.label.toLowerCase() === value.toLowerCase() && (
                <Check className="h-4 w-4 text-primary ml-2 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}

      {isOpen && filteredOptions.length === 0 && value && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg p-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            No results found for "{value}"
          </div>
          <div className="text-xs mt-1">
            Try searching for categories, brands, or product types
          </div>
        </div>
      )}

      {/* Recent/popular searches when no value */}
      {isOpen && !value && showSuggestions && options.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="p-2 border-b border-border">
            <div className="text-xs font-medium text-muted-foreground px-2 py-1">
              Popular searches
            </div>
          </div>
          {options.slice(0, maxSuggestions).map((option, index) => (
            <button
              key={`popular-${option.value}-${index}`}
              type="button"
              onClick={() => handleSelect(option)}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-accent hover:text-accent-foreground flex items-center justify-between transition-colors ${
                index === highlightedIndex ? 'bg-accent text-accent-foreground' : ''
              }`}
              role="option"
              aria-selected={index === highlightedIndex}
            >
              <span className="flex-1">{option.label}</span>
              {option.type && (
                <span className="text-xs text-muted-foreground ml-2 px-2 py-1 bg-muted rounded-full">
                  {option.type}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export { Autocomplete };