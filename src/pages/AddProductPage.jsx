import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../context/useInventory';

const AddProductPage = () => {
  const navigate = useNavigate();
  const { addProduct, products } = useInventory();
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    category: '',
    image: '🛍️'
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [categorySuggestions, setCategorySuggestions] = useState([]);

  // Get unique existing categories from products
  const existingCategories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Handle category autocomplete
    if (name === 'category') {
      const trimmedValue = value.trim();
      if (trimmedValue) {
        const filtered = existingCategories.filter(cat => 
          cat.toLowerCase().includes(trimmedValue.toLowerCase())
        );
        setCategorySuggestions(filtered);
        setShowCategorySuggestions(filtered.length > 0);
      } else {
        setCategorySuggestions([]);
        setShowCategorySuggestions(false);
      }
    }
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCategorySelect = (category) => {
    setFormData(prev => ({
      ...prev,
      category
    }));
    setShowCategorySuggestions(false);
    setCategorySuggestions([]);
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    
    if (!formData.price || parseFloat(formData.price) < 0) {
      newErrors.price = 'Price must be a valid number (0 or greater)';
    }
    
    if (!formData.stock || parseInt(formData.stock) < 0) {
      newErrors.stock = 'Stock must be a valid number (0 or greater)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const newProduct = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category: formData.category || 'Uncategorized',
        image: formData.image || '🛍️'
      };

      await addProduct(newProduct);
      
      setShowSuccessModal(true);
    } catch (error) {
      alert('Error adding product: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
  navigate('/pos');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex flex-col">
      {/* Compact Header */}
      <div className="bg-white/95 px-2 sm:px-3 py-1.5 sm:py-2 shadow-md z-50">
        <div className="flex items-center gap-2">
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-all active:bg-gray-200 min-w-11 min-h-11 flex items-center justify-center"
            aria-label="Go back"
          >
            <span className="text-xl sm:text-2xl text-gray-700">←</span>
          </button>
          <h1 className="m-0 text-sm sm:text-base md:text-lg font-bold text-gray-800">Add New Product</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-2 sm:p-3 md:p-4 overflow-auto">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
              {/* Product Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Apple Juice 1L"
                  className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl text-base transition-all focus:outline-none focus:bg-white ${
                    errors.name 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20'
                  }`}
                />
                {errors.name && (
                  <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
                    <span>⚠️</span>
                    <span>{errors.name}</span>
                  </div>
                )}
              </div>

              {/* Price and Stock Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Price */}
                <div className="space-y-2">
                  <label htmlFor="price" className="block text-sm font-semibold text-gray-700">
                    Price (₱) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">₱</span>
                    <input
                      id="price"
                      type="number"
                      name="price"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="0.00"
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border-2 rounded-xl text-base transition-all focus:outline-none focus:bg-white ${
                        errors.price 
                          ? 'border-red-300 focus:border-red-500' 
                          : 'border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20'
                      }`}
                    />
                  </div>
                  {errors.price && (
                    <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
                      <span>⚠️</span>
                      <span>{errors.price}</span>
                    </div>
                  )}
                </div>

                {/* Stock */}
                <div className="space-y-2">
                  <label htmlFor="stock" className="block text-sm font-semibold text-gray-700">
                    Stock Quantity <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">📦</span>
                    <input
                      id="stock"
                      type="number"
                      name="stock"
                      min="0"
                      value={formData.stock}
                      onChange={handleChange}
                      placeholder="0"
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border-2 rounded-xl text-base transition-all focus:outline-none focus:bg-white ${
                        errors.stock 
                          ? 'border-red-300 focus:border-red-500' 
                          : 'border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20'
                      }`}
                    />
                  </div>
                  {errors.stock && (
                    <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
                      <span>⚠️</span>
                      <span>{errors.stock}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label htmlFor="category" className="block text-sm font-semibold text-gray-700">
                  Category
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg z-10">🏷️</span>
                  <input
                    id="category"
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    onFocus={() => {
                      if (formData.category && categorySuggestions.length > 0) {
                        setShowCategorySuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      // Delay to allow click on suggestion
                      setTimeout(() => setShowCategorySuggestions(false), 200);
                    }}
                    placeholder="e.g., Beverages, Food, Snacks..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-base transition-all focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  
                  {/* Autocomplete Suggestions */}
                  {showCategorySuggestions && categorySuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                      {categorySuggestions.map((category, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleCategorySelect(category)}
                          className="w-full text-left px-4 py-3 hover:bg-primary/10 transition-colors border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                        >
                          <span className="text-lg">🏷️</span>
                          <span className="text-sm font-medium text-gray-700">{category}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {existingCategories.length > 0 
                    ? 'Start typing to see existing categories or enter a new one' 
                    : 'Enter a category name for this product'}
                </p>
              </div>

              {/* Image Emoji */}
              <div className="space-y-2">
                <label htmlFor="image" className="block text-sm font-semibold text-gray-700">
                  Product Icon
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      id="image"
                      type="text"
                      name="image"
                      value={formData.image}
                      onChange={handleChange}
                      placeholder="🛍️"
                      maxLength="2"
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-base transition-all focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center text-4xl shadow-inner">
                    {formData.image || '🛍️'}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Enter an emoji to represent your product</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3.5 bg-gray-100 text-gray-700 rounded-xl text-base font-semibold transition-all hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-transparent hover:border-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-base font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      <span>Add Product</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Helper Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-white/80">
              Fields marked with <span className="text-red-300">*</span> are required
            </p>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4"
          onClick={() => {
            setShowSuccessModal(false);
            navigate('/pos');
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-[scale-in_0.3s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success Icon */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center">
              <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
                <span className="text-5xl">✓</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Success!</h2>
              <p className="text-green-50 text-sm">Product has been added to inventory</p>
            </div>

            {/* Product Details */}
            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 text-center">
                <div className="text-6xl mb-3">{formData.image}</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{formData.name}</h3>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <span>₱</span>
                    <span className="font-semibold text-primary">{parseFloat(formData.price).toFixed(2)}</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center gap-1">
                    <span>📦</span>
                    <span className="font-semibold">{formData.stock} in stock</span>
                  </div>
                </div>
                {formData.category && formData.category !== 'Uncategorized' && (
                  <div className="mt-3">
                    <span className="inline-block bg-gradient-to-r from-primary to-primary-dark text-white text-xs px-3 py-1 rounded-full font-semibold uppercase">
                      {formData.category}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/pos');
                }}
                className="w-full px-6 py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-base font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 shadow-md"
              >
                Back to POS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddProductPage;

