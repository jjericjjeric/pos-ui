import { useState, useRef, useEffect } from 'react';

/**
 * CategoryFilter Component
 * 
 * Reusable category filter with multiple display modes:
 * - 'pills': Horizontal scrollable pill buttons (best for touch devices)
 * - 'dropdown': Compact dropdown with search (best for many categories)
 * 
 * Mobile-first design with accessibility support
 * 
 * @param {Object} props
 * @param {Array<string>} props.categories - Array of category names
 * @param {string} props.selectedCategory - Currently selected category
 * @param {Function} props.onCategoryChange - Callback when category changes
 * @param {string} props.mode - Display mode: 'pills' or 'dropdown'
 * @param {string} props.className - Additional CSS classes
 */
const CategoryFilter = ({ 
  categories, 
  selectedCategory, 
  onCategoryChange, 
  mode = 'dropdown',
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  
  // Filter categories based on search term
  const filteredCategories = categories.filter(cat =>
    cat.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm(''); // Clear search when closing
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);
  
  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);
  
  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };
  
  if (mode === 'pills') {
    return (
      <div className={`${className}`}>
        <div className="relative">
          {/* Left fade indicator */}
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-linear-to-r from-white to-transparent z-10 pointer-events-none" />
          
          {/* Scrollable container */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth px-1 py-2">
            {categories.map(category => (
              <button
                key={category}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                  selectedCategory === category
                    ? 'bg-[#00C853] text-white shadow-md'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => onCategoryChange(category)}
              >
                {category}
              </button>
            ))}
          </div>
          
          {/* Right fade indicator */}
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-linear-to-l from-white to-transparent z-10 pointer-events-none" />
        </div>
      </div>
    );
  }

  // Dropdown mode with search (compact for many categories)
  return (
    <div 
      ref={dropdownRef} 
      className={`relative ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white border-2 border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-gray-400 transition-colors focus:outline-none focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="text-sm sm:text-base font-medium text-gray-700 truncate">
          📂 {selectedCategory}
        </span>
        <span 
          className={`text-gray-500 text-xs sm:text-sm ml-2 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          ▼
        </span>
      </button>
      
      {/* Dropdown menu */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg z-50 max-h-80 sm:max-h-96 flex flex-col"
          role="listbox"
        >
          {/* Search input */}
          <div className="p-2 sm:p-3 border-b border-gray-200 shrink-0">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="🔍 Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-3 pr-8 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20"
                aria-label="Search categories"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {filteredCategories.length} of {categories.length} categories
            </p>
          </div>
          
          {/* Categories list */}
          <div className="overflow-y-auto flex-1">
            {filteredCategories.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                No categories found for "{searchTerm}"
              </div>
            ) : (
              filteredCategories.map(category => (
                <button
                  key={category}
                  onClick={() => {
                    onCategoryChange(category);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left text-sm sm:text-base hover:bg-gray-50 transition-colors flex items-center justify-between ${
                    selectedCategory === category
                      ? 'bg-[#00C853] text-white font-semibold hover:bg-[#00C853]'
                      : 'text-gray-700'
                  }`}
                  role="option"
                  aria-selected={selectedCategory === category}
                >
                  <span className="truncate">{category}</span>
                  {selectedCategory === category && (
                    <span className="ml-2 shrink-0">✓</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryFilter;
