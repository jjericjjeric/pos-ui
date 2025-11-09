import { useState, useEffect } from 'react';
import Modal from './Modal';

/**
 * EditProductModal Component - Mobile-First Design
 * Form for editing product details with validation
 * Optimized for touch input and mobile keyboards
 */
const EditProductModal = ({ isOpen, onClose, product, onSave }) => {
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
      setErrors({});
    }
  }, [product, isOpen]);

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

        {/* Image Emoji */}
        <div className="flex flex-col gap-2">
          <label htmlFor="image" className="font-semibold text-gray-700 text-base sm:text-sm">
            Image (Emoji)
          </label>
          <input
            type="text"
            id="image"
            name="image"
            value={formData.image}
            onChange={handleChange}
            className="px-4 py-3 sm:px-3 sm:py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary transition-colors text-base"
            placeholder="📦"
            maxLength="2"
          />
          {formData.image && (
            <div className="text-5xl sm:text-4xl text-center p-4 sm:p-2 bg-gray-50 rounded-lg">
              {formData.image}
            </div>
          )}
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
