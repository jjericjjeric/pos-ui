import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../context/useInventory';
import Modal from '../components/Modal';
import EditProductModal from '../components/EditProductModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { ToastContainer } from '../components/Toast';

const ProductsManagementPage = () => {
  const { products, loading, error, user, updateProduct, deleteProduct, logoutUser } = useInventory();
  const navigate = useNavigate();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('name'); // name, price, stock, category
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // table, grid
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [viewDetailsProduct, setViewDetailsProduct] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [deletedProductBackup, setDeletedProductBackup] = useState(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  
  const toastIdCounter = useRef(0);
  const searchInputRef = useRef(null);
  
  // Categories
  const categories = ['All', ...new Set(products.map(p => p.category || 'Uncategorized'))];
  
  // Filter products
  let filteredProducts = products;
  
  if (searchQuery) {
    filteredProducts = filteredProducts.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toString().includes(searchQuery)
    );
  }
  
  if (selectedCategory !== 'All') {
    filteredProducts = filteredProducts.filter(p => 
      (p.category || 'Uncategorized') === selectedCategory
    );
  }
  
  // Sort products
  filteredProducts = [...filteredProducts].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'price':
        comparison = a.price - b.price;
        break;
      case 'stock':
        comparison = a.stock - b.stock;
        break;
      case 'category':
        comparison = (a.category || 'Uncategorized').localeCompare(b.category || 'Uncategorized');
        break;
      default:
        comparison = 0;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  
  // Toast management
  const addToast = (message, type = 'success', duration = 3000, onUndo = null, undoLabel = 'Undo') => {
    const id = toastIdCounter.current++;
    setToasts(prev => [...prev, { id, message, type, duration, onUndo, undoLabel }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Product actions
  const handleEditProduct = (product) => {
    setEditingProduct(product);
  };

  const handleSaveProduct = async (productId, updatedData) => {
    try {
      await updateProduct(productId, updatedData);
      setEditingProduct(null);
      addToast('Product updated successfully', 'success');
    } catch (err) {
      addToast('Failed to update product', 'error');
    }
  };

  const handleDeleteProduct = (product) => {
    setDeletingProduct(product);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    
    const productToDelete = deletingProduct;
    setDeletedProductBackup(productToDelete);
    setDeletingProduct(null);
    
    try {
      await deleteProduct(productToDelete.id);
      addToast(
        `Deleted "${productToDelete.name}"`,
        'success',
        5000,
        handleUndoDelete,
        'Undo'
      );
    } catch (err) {
      addToast('Failed to delete product', 'error');
      setDeletedProductBackup(null);
    }
  };

  const handleUndoDelete = async () => {
    if (!deletedProductBackup) return;
    
    try {
      // Re-add the product (this would need an addProduct method)
      // For now, just show a message
      addToast('Undo not fully implemented yet', 'info');
      setDeletedProductBackup(null);
    } catch (err) {
      addToast('Failed to undo delete', 'error');
    }
  };

  const handleViewDetails = (product) => {
    setViewDetailsProduct(product);
  };

  // Bulk operations
  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const handleSelectProduct = (productId) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    } else {
      setSelectedProducts(prev => [...prev, productId]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedProducts.length === 0) {
      addToast('No products selected', 'warning');
      return;
    }
    setShowBulkDeleteConfirm(true);
  };

  const handleConfirmBulkDelete = async () => {
    setShowBulkDeleteConfirm(false);
    
    try {
      for (const productId of selectedProducts) {
        await deleteProduct(productId);
      }
      addToast(`Deleted ${selectedProducts.length} products`, 'success');
      setSelectedProducts([]);
    } catch (err) {
      addToast('Failed to delete some products', 'error');
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl/Cmd + F: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      
      // Alt + E: Edit first selected product
      if (e.altKey && e.key === 'e') {
        e.preventDefault();
        if (selectedProducts.length === 1) {
          const product = products.find(p => p.id === selectedProducts[0]);
          if (product) handleEditProduct(product);
        }
      }
      
      // Delete key: Delete selected products
      if (e.key === 'Delete' && selectedProducts.length > 0) {
        e.preventDefault();
        handleBulkDelete();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedProducts, products]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
        <div className="text-white text-xl sm:text-2xl">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
        <div className="text-white text-xl sm:text-2xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-md p-3 sm:p-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
          📋 Products Management
        </h1>
        <div className="flex items-center gap-2 sm:gap-3">
          {user && (
            <span className="text-xs sm:text-sm text-gray-700 bg-blue-50 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md border border-blue-200">
              {user.username} {user.role ? `(${user.role})` : ''}
            </span>
          )}
          <button
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base bg-gray-600 text-white rounded-lg font-semibold hover:-translate-y-0.5 transition-all"
            onClick={() => navigate('/pos')}
          >
            ← Back to POS
          </button>
          <button
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base bg-red-500 text-white rounded-lg font-semibold hover:-translate-y-0.5 transition-all"
            onClick={() => {
              logoutUser();
              navigate('/');
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
        <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-3 sm:p-4 md:p-6">
          {/* Search and Filters */}
          <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
            {/* Search Bar */}
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products by name or ID... (Ctrl+F)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none text-sm sm:text-base"
                inputMode="search"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl sm:text-2xl">
                🔍
              </span>
            </div>

            {/* Filters and Actions Row */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-wrap">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none text-sm sm:text-base min-h-[44px]"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none text-sm sm:text-base min-h-[44px]"
              >
                <option value="name">Sort by Name</option>
                <option value="price">Sort by Price</option>
                <option value="stock">Sort by Stock</option>
                <option value="category">Sort by Category</option>
              </select>

              {/* Sort Order */}
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="px-3 sm:px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-sm sm:text-base min-h-[44px] flex items-center justify-center gap-2"
              >
                {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
              </button>

              {/* View Mode Toggle */}
              <button
                onClick={() => setViewMode(prev => prev === 'table' ? 'grid' : 'table')}
                className="px-3 sm:px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-sm sm:text-base min-h-[44px] flex items-center justify-center gap-2"
              >
                {viewMode === 'table' ? '📋 Table' : '🎯 Grid'}
              </button>

              {/* Add Product Button */}
              <button
                onClick={() => navigate('/add-product')}
                className="px-3 sm:px-4 py-2 bg-gradient-to-br from-primary to-primary-dark text-white rounded-lg font-semibold hover:-translate-y-0.5 transition-all shadow-md text-sm sm:text-base min-h-[44px] flex items-center justify-center gap-2"
              >
                ➕ Add Product
              </button>
            </div>

            {/* Bulk Actions */}
            {selectedProducts.length > 0 && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3">
                <span className="text-sm sm:text-base font-semibold text-blue-700">
                  {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2 flex-wrap w-full sm:w-auto">
                  <button
                    onClick={handleBulkDelete}
                    className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors text-sm sm:text-base min-h-[44px]"
                  >
                    🗑️ Delete Selected
                  </button>
                  <button
                    onClick={() => setSelectedProducts([])}
                    className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors text-sm sm:text-base min-h-[44px]"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}

            {/* Results Count */}
            <div className="text-sm sm:text-base text-gray-600">
              Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> products
            </div>
          </div>

          {/* Products View */}
          {viewMode === 'table' ? (
            // Table View (Desktop)
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="p-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                        onChange={handleSelectAll}
                        className="w-5 h-5 cursor-pointer"
                      />
                    </th>
                    <th className="p-3 text-left font-semibold text-gray-700">Image</th>
                    <th className="p-3 text-left font-semibold text-gray-700">Name</th>
                    <th className="p-3 text-left font-semibold text-gray-700">Price</th>
                    <th className="p-3 text-left font-semibold text-gray-700">Stock</th>
                    <th className="p-3 text-left font-semibold text-gray-700">Category</th>
                    <th className="p-3 text-left font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                        selectedProducts.includes(product.id) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => handleSelectProduct(product.id)}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-3xl">{product.image}</td>
                      <td className="p-3 font-semibold text-gray-800">{product.name}</td>
                      <td className="p-3 text-gray-700">₱{product.price.toFixed(2)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-sm font-semibold ${
                          product.stock === 0 ? 'bg-red-100 text-red-700' :
                          product.stock < 10 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600">{product.category || 'Uncategorized'}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDetails(product)}
                            className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors min-h-[44px]"
                            title="View Details"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors min-h-[44px]"
                            title="Edit Product (Alt+E)"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product)}
                            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors min-h-[44px]"
                            title="Delete Product (Delete key)"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredProducts.length === 0 && (
                <div className="text-center py-12 text-gray-500 text-lg">
                  No products found
                </div>
              )}
            </div>
          ) : null}

          {/* Card/Grid View (Mobile & Tablet) */}
          {viewMode === 'grid' || window.innerWidth < 768 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`bg-white border-2 rounded-lg p-3 sm:p-4 shadow-md hover:shadow-lg transition-shadow ${
                    selectedProducts.includes(product.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  {/* Checkbox */}
                  <div className="flex justify-between items-start mb-3">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => handleSelectProduct(product.id)}
                      className="w-5 h-5 cursor-pointer min-w-[44px] min-h-[44px]"
                    />
                    <div className="text-5xl sm:text-6xl">{product.image}</div>
                  </div>

                  {/* Product Info */}
                  <div className="space-y-2 mb-3">
                    <h3 className="font-bold text-base sm:text-lg text-gray-800 line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="flex justify-between items-center">
                      <span className="text-lg sm:text-xl font-bold text-primary">
                        ₱{product.price.toFixed(2)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                        product.stock === 0 ? 'bg-red-100 text-red-700' :
                        product.stock < 10 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        Stock: {product.stock}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">
                      {product.category || 'Uncategorized'}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleViewDetails(product)}
                      className="px-2 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors min-h-[44px]"
                      title="View"
                    >
                      👁️
                    </button>
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="px-2 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors min-h-[44px]"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product)}
                      className="px-2 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors min-h-[44px]"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {filteredProducts.length === 0 && viewMode === 'grid' && (
            <div className="text-center py-12 text-gray-500 text-base sm:text-lg">
              No products found
            </div>
          )}

          {/* Keyboard Shortcuts Help */}
          <div className="mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-sm sm:text-base text-gray-700 mb-2">⌨️ Keyboard Shortcuts</h3>
            <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
              <li><kbd className="px-2 py-1 bg-white border border-gray-300 rounded">Ctrl+F</kbd> Focus search</li>
              <li><kbd className="px-2 py-1 bg-white border border-gray-300 rounded">Alt+E</kbd> Edit selected product (when 1 selected)</li>
              <li><kbd className="px-2 py-1 bg-white border border-gray-300 rounded">Delete</kbd> Delete selected products</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditProductModal
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        product={editingProduct}
        onSave={handleSaveProduct}
      />

      <ConfirmDialog
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? You'll have 5 seconds to undo."
        productName={deletingProduct?.name}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleConfirmBulkDelete}
        title="Bulk Delete"
        message={`Are you sure you want to delete ${selectedProducts.length} products?`}
        confirmText="Delete All"
        cancelText="Cancel"
        variant="danger"
      />

      <Modal
        isOpen={!!viewDetailsProduct}
        onClose={() => setViewDetailsProduct(null)}
        title="Product Details"
      >
        {viewDetailsProduct && (
          <div className="flex-1 flex flex-col gap-4">
            <div className="text-center text-6xl sm:text-5xl mb-4">
              {viewDetailsProduct.image}
            </div>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2 text-base sm:text-sm">
                <span className="font-semibold text-gray-600">Name:</span>
                <span className="text-gray-800 break-words text-right ml-2">{viewDetailsProduct.name}</span>
              </div>
              <div className="flex justify-between border-b pb-2 text-base sm:text-sm">
                <span className="font-semibold text-gray-600">Price:</span>
                <span className="text-gray-800">₱{viewDetailsProduct.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b pb-2 text-base sm:text-sm">
                <span className="font-semibold text-gray-600">Stock:</span>
                <span className="text-gray-800">{viewDetailsProduct.stock}</span>
              </div>
              <div className="flex justify-between border-b pb-2 text-base sm:text-sm">
                <span className="font-semibold text-gray-600">Category:</span>
                <span className="text-gray-800">{viewDetailsProduct.category || 'Uncategorized'}</span>
              </div>
              <div className="flex justify-between border-b pb-2 text-base sm:text-sm">
                <span className="font-semibold text-gray-600">Product ID:</span>
                <span className="text-gray-800">{viewDetailsProduct.id}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default ProductsManagementPage;
