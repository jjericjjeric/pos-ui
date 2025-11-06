import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../context/useInventory';
import './AddProductPage.css';

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
      navigate('/');
    } catch (error) {
      alert('Error adding product: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="add-product-container">
      <div className="add-product-content">
        <h1>Add New Product</h1>
        
        <form onSubmit={handleSubmit} className="add-product-form">
          <div className="form-group">
            <label htmlFor="name">Product Name *</label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter product name"
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="price">Price (₱) *</label>
            <input
              id="price"
              type="number"
              name="price"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              className={errors.price ? 'error' : ''}
            />
            {errors.price && <span className="error-message">{errors.price}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="stock">Stock Quantity *</label>
            <input
              id="stock"
              type="number"
              name="stock"
              min="0"
              value={formData.stock}
              onChange={handleChange}
              placeholder="0"
              className={errors.stock ? 'error' : ''}
            />
            {errors.stock && <span className="error-message">{errors.stock}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="image">Image Emoji (Optional)</label>
            <input
              id="image"
              type="text"
              name="image"
              value={formData.image}
              onChange={handleChange}
              placeholder="🛍️"
              maxLength="2"
            />
            <small>Enter an emoji to represent the product</small>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
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

