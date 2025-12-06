/**
 * CategoryFilter Component
 * 
 * Reusable category filter with pill buttons or dropdown
 * Mobile-first design with horizontal scroll on small screens
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
  mode = 'pills',
  className = '' 
}) => {
  if (mode === 'pills') {
    return (
      <div className={`flex gap-1.5 flex-wrap ${className}`}>
        {categories.map(category => (
          <button
            key={category}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
              selectedCategory === category
                ? 'bg-[#00C853] text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => onCategoryChange(category)}
          >
            {category}
          </button>
        ))}
      </div>
    );
  }

  // Dropdown mode (for compact displays)
  return (
    <div className={`relative ${className}`}>
      <select
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white border-2 border-gray-300 rounded-lg text-sm sm:text-base focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
      >
        {categories.map(category => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-xs sm:text-sm">
        ▼
      </span>
    </div>
  );
};

export default CategoryFilter;
