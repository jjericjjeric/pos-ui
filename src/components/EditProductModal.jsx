import { useState, useEffect } from 'react';
import Modal from './Modal';
import { useImageCompression } from '../hooks/useImageCompression';

/**
 * EditProductModal Component - Mobile-First Design
 * Form for editing product details with validation
 * Optimized for touch input and mobile keyboards
 */
const EditProductModal = ({ isOpen, onClose, product, onSave }) => {
  const {
    imagePreview,
    fileInputRef,
    handleImageChange: handleImageCompress,
    handleCameraCapture,
    handleFileSelect,
    removeImage: clearImage,
    setImage
  } = useImageCompression();

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    category: '',
    image: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when product changes or modal opens
  useEffect(() => {
    if (product && isOpen) {
      setFormData({
        name: product.name || '',
        price: product.price || '',
        stock: product.stock || '',
        category: product.category || '',
        image: product.image || '',
      });
      setImage(product.image || null);
      setErrors({});
    }
  }, [product, isOpen, setImage]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    const price = parseFloat(formData.price);
    if (!formData.price || isNaN(price) || price <= 0) {
      newErrors.price = 'Price must be a positive number';
    }

    const stock = parseInt(formData.stock, 10);
    if (formData.stock === '' || isNaN(stock) || stock < 0) {
      newErrors.stock = 'Stock must be a non-negative number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    handleImageCompress(
      file,
      (compressedImage) => {
        setFormData(prev => ({
          ...prev,
          image: compressedImage
        }));
      },
      (errorMessage) => {
        alert(errorMessage);
      }
    );
  };

  const removeImage = () => {
    clearImage();
    setFormData(prev => ({
      ...prev,
      image: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const updatedData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
        category: formData.category.trim(),
        image: formData.image.trim(),
      };
      
      await onSave(product.id, updatedData);
      onClose();
    } catch (error) {
      console.error('Error updating product:', error);
      setErrors({ submit: error.message || 'Failed to update product' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Product">
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4 overflow-y-auto">
        {/* Product Name - Mobile optimized input */}
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="font-semibold text-gray-700 text-base sm:text-sm">
            Product Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`px-4 py-3 sm:px-3 sm:py-2 border-2 rounded-lg focus:outline-none focus:border-primary transition-colors text-base ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter product name"
            autoComplete="off"
          />
          {errors.name && (
            <span className="text-red-500 text-sm" role="alert">{errors.name}</span>
          )}
        </div>

        {/* Price - Mobile keyboard optimized */}
        <div className="flex flex-col gap-2">
          <label htmlFor="price" className="font-semibold text-gray-700 text-base sm:text-sm">
            Price (₱) *
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            step="0.01"
            min="0"
            inputMode="decimal"
            className={`px-4 py-3 sm:px-3 sm:py-2 border-2 rounded-lg focus:outline-none focus:border-primary transition-colors text-base ${
              errors.price ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0.00"
          />
          {errors.price && (
            <span className="text-red-500 text-sm" role="alert">{errors.price}</span>
          )}
        </div>

        {/* Stock - Mobile keyboard optimized */}
        <div className="flex flex-col gap-2">
          <label htmlFor="stock" className="font-semibold text-gray-700 text-base sm:text-sm">
            Stock *
          </label>
          <input
            type="number"
            id="stock"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            min="0"
            inputMode="numeric"
            className={`px-4 py-3 sm:px-3 sm:py-2 border-2 rounded-lg focus:outline-none focus:border-primary transition-colors text-base ${
              errors.stock ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0"
          />
          {errors.stock && (
            <span className="text-red-500 text-sm" role="alert">{errors.stock}</span>
          )}
        </div>

        {/* Category */}
        <div className="flex flex-col gap-2">
          <label htmlFor="category" className="font-semibold text-gray-700 text-base sm:text-sm">
            Category
          </label>
          <input
            type="text"
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="px-4 py-3 sm:px-3 sm:py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary transition-colors text-base"
            placeholder="e.g., Electronics, Food, etc."
            autoComplete="off"
          />
        </div>

        {/* Image Upload */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-gray-700 text-base sm:text-sm">
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
                className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
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
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleCameraCapture}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-300 rounded-lg transition-all active:scale-95"
              >
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-semibold text-blue-700">Take Photo</span>
              </button>
              
              <button
                type="button"
                onClick={handleFileSelect}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-2 border-purple-300 rounded-lg transition-all active:scale-95"
              >
                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-semibold text-purple-700">Upload Image</span>
              </button>
            </div>
          )}
          <p className="text-xs text-gray-500">Images auto-compressed to 400px • Max 5MB upload</p>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-200" role="alert">
            {errors.submit}
          </div>
        )}

        {/* Action Buttons - Mobile first: Stack vertically */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end mt-auto pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 sm:px-4 sm:py-2 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-colors min-h-[48px] sm:min-h-[44px]"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 sm:px-4 sm:py-2 bg-gradient-to-br from-primary to-primary-dark text-white rounded-lg font-semibold transition-all hover:shadow-lg active:shadow-md disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] sm:min-h-[44px]"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditProductModal;
