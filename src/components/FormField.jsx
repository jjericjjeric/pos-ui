/**
 * FormField Component
 * 
 * Reusable form input field with label, error display, and icon support
 * Mobile-first design following Google Material Design principles
 * 
 * @param {Object} props
 * @param {string} props.label - Field label text
 * @param {string} props.name - Input name attribute
 * @param {string} props.type - Input type (text, number, email, etc.)
 * @param {string} props.value - Current value
 * @param {Function} props.onChange - Change handler
 * @param {Function} props.onBlur - Blur handler (optional)
 * @param {string} props.error - Error message to display
 * @param {boolean} props.required - Whether field is required
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.icon - Optional emoji icon
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.inputProps - Additional input props
 */
const FormField = ({ 
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  required = false,
  placeholder = '',
  icon = null,
  className = '',
  inputProps = {}
}) => {
  return (
    <div className={`space-y-1 sm:space-y-1.5 ${className}`}>
      {/* Label */}
      <label htmlFor={name} className="block text-xs sm:text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {/* Input Container */}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 text-base sm:text-lg">
            {icon}
          </span>
        )}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`w-full ${icon ? 'pl-9 sm:pl-10' : 'pl-3 sm:pl-4'} pr-3 sm:pr-4 py-2 sm:py-2.5 bg-gray-50 border-2 rounded-lg sm:rounded-xl text-base transition-all focus:outline-none focus:bg-white ${
            error 
              ? 'border-red-300 focus:border-red-500' 
              : 'border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20'
          }`}
          {...inputProps}
        />
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-1.5 text-red-600 text-xs sm:text-sm mt-1">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FormField;
