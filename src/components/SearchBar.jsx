/**
 * SearchBar Component
 * 
 * Reusable search input with icon and clear button
 * Mobile-first design with touch-friendly targets
 * 
 * @param {Object} props
 * @param {string} props.value - Current search query
 * @param {Function} props.onChange - Change handler (receives new value)
 * @param {string} props.placeholder - Placeholder text
 * @param {React.RefObject} props.inputRef - Optional ref for the input element
 * @param {string} props.className - Additional CSS classes
 */
const SearchBar = ({ 
  value, 
  onChange, 
  placeholder = 'Search...', 
  inputRef = null,
  className = '' 
}) => {
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base sm:text-lg">
        🔍
      </span>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className="w-full pl-9 sm:pl-10 pr-10 py-2 bg-white border border-gray-200 rounded-lg text-sm transition-all focus:outline-none focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20"
        inputMode="search"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 min-w-11 min-h-11 flex items-center justify-center"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default SearchBar;
