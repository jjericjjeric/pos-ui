import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../context/useInventory';

const AddProductPage = () => {
  const navigate = useNavigate();
  const { addProduct } = useInventory();
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    image: '🛍️'
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        image: formData.image || '🛍️'
      };

      await addProduct(newProduct);
      
  alert('Product added successfully!');
  navigate('/pos');
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
    <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] p-8 sm:p-4 flex justify-center items-center">
      <div className="bg-white rounded-xl p-8 sm:p-6 max-w-[500px] w-full shadow-[0_10px_40px_rgba(0,0,0,0.1)]">
        <h1 className="m-0 mb-8 sm:mb-6 text-gray-800 text-center text-3xl sm:text-2xl">Add New Product</h1>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="font-semibold text-gray-600 text-sm">Product Name *</label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter product name"
              className={`px-3 py-3 border-2 ${errors.name ? 'border-red-500' : 'border-gray-200'} rounded-lg text-base transition-colors focus:outline-none focus:border-[#667eea]`}
            />
            {errors.name && <span className="text-red-500 text-sm mt-1">{errors.name}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="price" className="font-semibold text-gray-600 text-sm">Price (₱) *</label>
            <input
              id="price"
              type="number"
              name="price"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              className={`px-3 py-3 border-2 ${errors.price ? 'border-red-500' : 'border-gray-200'} rounded-lg text-base transition-colors focus:outline-none focus:border-[#667eea]`}
            />
            {errors.price && <span className="text-red-500 text-sm mt-1">{errors.price}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="stock" className="font-semibold text-gray-600 text-sm">Stock Quantity *</label>
            <input
              id="stock"
              type="number"
              name="stock"
              min="0"
              value={formData.stock}
              onChange={handleChange}
              placeholder="0"
              className={`px-3 py-3 border-2 ${errors.stock ? 'border-red-500' : 'border-gray-200'} rounded-lg text-base transition-colors focus:outline-none focus:border-[#667eea]`}
            />
            {errors.stock && <span className="text-red-500 text-sm mt-1">{errors.stock}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="image" className="font-semibold text-gray-600 text-sm">Image Emoji (Optional)</label>
            <input
              id="image"
              type="text"
              name="image"
              value={formData.image}
              onChange={handleChange}
              placeholder="🛍️"
              maxLength="2"
              className="px-3 py-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-[#667eea]"
            />
            <small className="text-gray-500 text-[0.85rem] mt-1">Enter an emoji to represent the product</small>
          </div>

          <div className="flex gap-4 mt-4">
            <button
              type="button"
              className="flex-1 px-6 py-3 border-none rounded-lg text-base font-semibold cursor-pointer transition-all bg-gray-100 text-gray-800 hover:enabled:bg-gray-200 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 border-none rounded-lg text-base font-semibold cursor-pointer transition-all bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white hover:enabled:opacity-90 hover:enabled:-translate-y-0.5 hover:enabled:shadow-[0_4px_12px_rgba(102,126,234,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductPage;

