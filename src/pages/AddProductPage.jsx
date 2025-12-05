import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import { useImageCompression } from '../hooks/useImageCompression';
import { useFormValidation } from '../hooks/useFormValidation';
import { useImageCache } from '../hooks/useImageCache';
import FormField from '../components/FormField';
import StoreSelector from '../components/StoreSelector';

const AddProductPage = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get product ID from URL params
  
  // Zustand store selectors
  const products = useAppStore((state) => state.products);
  const loading = useAppStore((state) => state.productsLoading);
  const addProduct = useAppStore((state) => state.addProduct);
  const updateProduct = useAppStore((state) => state.updateProduct);
  
  const { invalidateImage } = useImageCache();
  
  // Determine if we're in edit mode
  const isEditMode = !!id;
  const existingProduct = isEditMode ? products.find(p => p.id === parseInt(id)) : null;
  
  const {
    imagePreview,
    fileInputRef,
    handleImageChange: handleImageCompress,
    handleCameraCapture,
    handleFileSelect,
    removeImage: clearImage,
    setImage
  } = useImageCompression();
  
  // Form validation with custom hook
  const {
    values: formData,
    errors,
    handleChange,
    handleBlur,
    validate,
    setFieldValue,
    resetForm,
    setFormValues
  } = useFormValidation(
    {
      name: '',
      price: '',
      stock: '',
      category: '',
      image: ''
    },
    (values) => {
      const newErrors = {};
      
      if (!values.name.trim()) {
        newErrors.name = 'Product name is required';
      }
      
      if (!values.price || parseFloat(values.price) < 0) {
        newErrors.price = 'Price must be a valid number (0 or greater)';
      }
      
      if (!values.stock || parseInt(values.stock) < 0) {
        newErrors.stock = 'Stock must be a valid number (0 or greater)';
      }
      
      return newErrors;
    }
  );
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedProduct, setSubmittedProduct] = useState(null);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [categorySuggestions, setCategorySuggestions] = useState([]);

  // Load existing product data when in edit mode
  useEffect(() => {
    if (isEditMode && existingProduct) {
      // Populate form with existing product data using setFormValues
      setFormValues({
        name: existingProduct.name || '',
        price: existingProduct.price?.toString() || '',
        stock: existingProduct.stock?.toString() || '',
        category: existingProduct.category || '',
        image: existingProduct.image || ''
      });
      // Set the image preview
      setImage(existingProduct.image || null);
    } else if (!isEditMode) {
      // Reset form when adding new product
      resetForm();
      setImage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, products.length]); // Depend on id and products.length to detect when products are loaded

  // Get unique existing categories from products
  const existingCategories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();

  // Custom handler for category with autocomplete
  const handleCategoryChange = (e) => {
    handleChange(e); // Use form validation hook's handler
    
    const { value } = e.target;
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
  };

  const handleCategorySelect = (category) => {
    setFieldValue('category', category);
    setShowCategorySuggestions(false);
    setCategorySuggestions([]);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    handleImageCompress(
      file,
      (compressedImage) => {
        setFieldValue('image', compressedImage);
      },
      (errorMessage) => {
        alert(errorMessage);
      }
    );
  };

  const removeImage = () => {
    clearImage();
    setFieldValue('image', '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const productData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category: formData.category || 'Uncategorized',
        image: formData.image || '🛍️'
      };

      if (isEditMode) {
        // Update existing product
        await updateProduct(parseInt(id), productData);
        
        // Invalidate cached image to force refresh
        invalidateImage(parseInt(id));
      } else {
        // Add new product
        await addProduct(productData);
      }
      
      // Store the submitted product data for display in success modal
      setSubmittedProduct(productData);
      setShowSuccessModal(true);
    } catch (error) {
      alert(`Error ${isEditMode ? 'updating' : 'adding'} product: ` + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/pos');
  };

  // Show loading state while products are being fetched in edit mode
  if (isEditMode && loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
        <div className="text-white text-xl sm:text-2xl">Loading product...</div>
      </div>
    );
  }

  // Show not found if in edit mode but product doesn't exist
  if (isEditMode && !existingProduct && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 max-w-md text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Product Not Found</h2>
          <p className="text-gray-600 mb-6">The product you're trying to edit doesn't exist.</p>
          <button
            onClick={() => navigate('/products-management')}
            className="px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

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
          <h1 className="m-0 text-sm sm:text-base md:text-lg font-bold text-gray-800 flex-1">
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </h1>
          
          {/* Store Selector */}
          <StoreSelector className="flex-shrink-0" variant="light" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-2 sm:p-3 overflow-auto">
        <div className="max-w-2xl mx-auto h-full flex flex-col">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden flex-1 flex flex-col">
            {/* Form */}
            <form onSubmit={handleSubmit} className="p-3 sm:p-4 md:p-5 space-y-3 sm:space-y-4 flex-1 flex flex-col overflow-y-auto">
              {/* Product Name */}
              <FormField
                label="Product Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.name}
                required
                placeholder="e.g., Apple Juice 1L"
              />

              {/* Price and Stock Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Price */}
                <FormField
                  label="Price (₱)"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.price}
                  required
                  placeholder="0.00"
                  icon="₱"
                  inputProps={{ step: '0.01', min: '0' }}
                />

                {/* Stock */}
                <FormField
                  label="Stock Quantity"
                  name="stock"
                  type="number"
                  value={formData.stock}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.stock}
                  required
                  placeholder="0"
                  icon="📦"
                  inputProps={{ min: '0' }}
                />
              </div>

              {/* Category */}
              <div className="space-y-1 sm:space-y-1.5">
                <label htmlFor="category" className="block text-xs sm:text-sm font-semibold text-gray-700">
                  Category
                </label>
                <div className="relative">
                  <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 text-base sm:text-lg z-10">🏷️</span>
                  <input
                    id="category"
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleCategoryChange}
                    onFocus={() => {
                      if (formData.category && categorySuggestions.length > 0) {
                        setShowCategorySuggestions(true);
                      } else if (existingCategories.length > 0) {
                        // Show all categories when focused with empty field
                        setCategorySuggestions(existingCategories);
                        setShowCategorySuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      // Delay to allow click on suggestion
                      setTimeout(() => setShowCategorySuggestions(false), 200);
                    }}
                    placeholder="e.g., Beverages, Food, Snacks..."
                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-gray-50 border-2 border-transparent rounded-lg sm:rounded-xl text-base transition-all focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  
                  {/* Autocomplete Suggestions */}
                  {showCategorySuggestions && categorySuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 sm:mt-2 bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl shadow-xl max-h-48 sm:max-h-60 overflow-y-auto">
                      {categorySuggestions.map((category, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleCategorySelect(category)}
                          className="w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-primary/10 transition-colors border-b border-gray-100 last:border-b-0 flex items-center gap-2 sm:gap-3"
                        >
                          <span className="text-base sm:text-lg">🏷️</span>
                          <span className="text-xs sm:text-sm font-medium text-gray-700">{category}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                  {existingCategories.length > 0 
                    ? 'Start typing to see existing categories or enter a new one' 
                    : 'Enter a category name for this product'}
                </p>
              </div>

              {/* Image Upload */}
              <div className="space-y-1 sm:space-y-1.5">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                  Product Image
                </label>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                
                {/* Image Preview or Upload Buttons */}
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="w-full h-48 sm:h-56 object-cover rounded-lg sm:rounded-xl border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                      aria-label="Remove image"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={handleCameraCapture}
                      className="flex flex-col items-center justify-center gap-2 p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-300 rounded-lg sm:rounded-xl transition-all active:scale-95"
                    >
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-xs sm:text-sm font-semibold text-blue-700">Take Photo</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleFileSelect}
                      className="flex flex-col items-center justify-center gap-2 p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-2 border-purple-300 rounded-lg sm:rounded-xl transition-all active:scale-95"
                    >
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs sm:text-sm font-semibold text-purple-700">Upload Image</span>
                    </button>
                  </div>
                )}
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Images auto-compressed to 400px • Max 5MB upload</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-3 mt-auto">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold transition-all hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-transparent hover:border-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>{isEditMode ? 'Updating...' : 'Adding...'}</span>
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      <span>{isEditMode ? 'Update Product' : 'Add Product'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Helper Text */}
          <div className="mt-2 sm:mt-3 text-center flex-shrink-0">
            <p className="text-xs sm:text-sm text-white/80">
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
              <p className="text-green-50 text-sm">
                Product has been {isEditMode ? 'updated' : 'added to inventory'}
              </p>
            </div>

            {/* Product Details */}
            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 text-center">
                {submittedProduct?.image && submittedProduct.image.startsWith('data:image') ? (
                  <img
                    src={submittedProduct.image}
                    alt={submittedProduct.name}
                    className="w-32 h-32 mx-auto object-cover rounded-lg mb-3"
                  />
                ) : (
                  <div className="w-32 h-32 mx-auto bg-gray-200 rounded-lg mb-3 flex items-center justify-center text-6xl">
                    {submittedProduct?.image || '🛍️'}
                  </div>
                )}
                <h3 className="text-lg font-bold text-gray-800 mb-2">{submittedProduct?.name}</h3>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <span>₱</span>
                    <span className="font-semibold text-primary">{(submittedProduct?.price || 0).toFixed(2)}</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center gap-1">
                    <span>📦</span>
                    <span className="font-semibold">{submittedProduct?.stock || 0} in stock</span>
                  </div>
                </div>
                {submittedProduct?.category && submittedProduct.category !== 'Uncategorized' && (
                  <div className="mt-3">
                    <span className="inline-block bg-gradient-to-r from-primary to-primary-dark text-white text-xs px-3 py-1 rounded-full font-semibold uppercase">
                      {submittedProduct.category}
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

