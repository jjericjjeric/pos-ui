import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../context/useInventory';
import { useLazyLoad } from '../hooks/useLazyLoad';
import { useToast } from '../hooks/useToast';
import { useClickOutside } from '../hooks/useClickOutside';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchBar from '../components/SearchBar';
import { ToastContainer } from '../components/Toast';

const ProductsManagementPage = () => {
  const { products, loading, error, user, deleteProduct, logoutUser } = useInventory();
  const { toasts, addToast, removeToast } = useToast();
  const navigate = useNavigate();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('name'); // name, price, stock, category
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // table, grid
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [viewDetailsProduct, setViewDetailsProduct] = useState(null);
  const [deletedProductBackup, setDeletedProductBackup] = useState(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  
  const searchInputRef = useRef(null);
  const menuRef = useRef(null);
  const categoryMenuRef = useRef(null);
  const sortMenuRef = useRef(null);
  
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

  // Lazy loading for products
  const {
    displayedItems: displayedProducts,
    hasMore,
    isLoadingMore,
    loadingRef,
    displayedCount,
    totalCount
  } = useLazyLoad(filteredProducts, {
    viewType: viewMode, // 'table' or 'grid'
    loadMore: viewMode === 'table' ? 25 : 15,
    threshold: 400
  });
  
  // Product actions
  const handleEditProduct = (product) => {
    // Navigate to the add-product page with the product ID
    navigate(`/add-product/${product.id}`);
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
    if (selectedProducts.length === displayedProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(displayedProducts.map(p => p.id));
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

  // Close menu when clicking outside
  useClickOutside(menuRef, () => setShowMenu(false), showMenu);
  useClickOutside(categoryMenuRef, () => setShowCategoryMenu(false), showCategoryMenu);
  useClickOutside(sortMenuRef, () => setShowSortMenu(false), showSortMenu);

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
      {/* Compact Header */}
      <div className="bg-white/95 px-2 sm:px-3 py-1.5 sm:py-2 shadow-md z-50 flex items-center gap-2">
        {/* Back Button - Leftmost */}
        <button
          onClick={() => navigate('/pos')}
          className="p-2 hover:bg-gray-100 rounded-full transition-all active:bg-gray-200 min-w-11 min-h-11 flex items-center justify-center flex-shrink-0"
          aria-label="Go back"
        >
          <span className="text-xl sm:text-2xl text-gray-700">←</span>
        </button>
        
        {/* Title */}
        <h1 className="m-0 text-sm sm:text-base md:text-lg font-bold text-gray-800 truncate flex-1">📋 Products Management</h1>
        
        {/* Right side actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {user && (
            <span className="hidden sm:inline text-xs text-gray-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-200 whitespace-nowrap truncate">
              <strong>{user.username}</strong>
            </span>
          )}
          {/* Menu Button */}
          <div className="relative" ref={menuRef}>
            <button
              className="px-2 sm:px-2.5 py-1.5 bg-gray-600 text-white border-none rounded-lg font-semibold cursor-pointer shadow-md transition-all hover:shadow-lg active:scale-95 text-xs sm:text-sm min-w-11 min-h-11 flex items-center justify-center"
              onClick={() => setShowMenu(!showMenu)}
            >
              ☰ <span className="hidden xs:inline ml-1">Menu</span>
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-44 sm:w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-[9999]">
                <div className="py-2">
                  <button
                    className="w-full text-left px-3 sm:px-4 py-2.5 hover:bg-red-50 transition-colors text-red-600 border-none bg-transparent cursor-pointer text-sm font-semibold flex items-center gap-2"
                    onClick={() => {
                      setShowMenu(false);
                      logoutUser();
                      navigate('/');
                    }}
                  >
                    🚪 Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-2 sm:p-3 overflow-auto">
        <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-2 sm:p-3 md:p-4">
          {/* Search and Filters */}
          <div className="flex flex-col gap-2 sm:gap-3 mb-3 sm:mb-4">
            {/* Search Bar - First Priority */}
            <SearchBar
              inputRef={searchInputRef}
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search products by name or ID... (Ctrl+F)"
            />

            {/* Filter, Sort, and Order in Single Row - 40%, 40%, 20% */}
            <div className="flex gap-2 sm:gap-3 w-full">
              {/* Category Filter - 40% */}
              <div className="relative w-[40%]" ref={categoryMenuRef}>
                <button
                  onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                  className="w-full px-2 sm:px-3 md:px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg hover:border-primary hover:shadow-md transition-all text-xs sm:text-sm md:text-base min-h-11 flex items-center justify-between gap-1 sm:gap-2"
                >
                  <span className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                    <span className="flex-shrink-0 text-sm sm:text-base">🏷️</span>
                    <span className="font-medium truncate text-xs sm:text-sm md:text-base">{selectedCategory}</span>
                  </span>
                  <span className="text-gray-500 flex-shrink-0 text-xs sm:text-sm">▼</span>
                </button>
                
                {showCategoryMenu && (
                  <div className="absolute left-0 right-0 sm:left-0 sm:right-auto mt-2 w-full sm:min-w-[200px] bg-white rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-gray-200 overflow-hidden z-50 max-h-64 overflow-y-auto">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setShowCategoryMenu(false);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-none bg-transparent cursor-pointer text-sm sm:text-base flex items-center gap-2 ${
                          selectedCategory === cat ? 'bg-blue-50 text-primary font-semibold' : 'text-gray-700'
                        }`}
                      >
                        {selectedCategory === cat && <span className="text-primary flex-shrink-0">✓</span>}
                        <span className="truncate">{cat}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort By - 40% */}
              <div className="relative w-[40%]" ref={sortMenuRef}>
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="w-full px-2 sm:px-3 md:px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg hover:border-primary hover:shadow-md transition-all text-xs sm:text-sm md:text-base min-h-11 flex items-center justify-between gap-1 sm:gap-2"
                >
                  <span className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                    <span className="flex-shrink-0 text-sm sm:text-base">↕️</span>
                    <span className="font-medium truncate text-xs sm:text-sm md:text-base">
                      {sortBy === 'name' && 'Name'}
                      {sortBy === 'price' && 'Price'}
                      {sortBy === 'stock' && 'Stock'}
                      {sortBy === 'category' && 'Category'}
                    </span>
                  </span>
                  <span className="text-gray-500 flex-shrink-0 text-xs sm:text-sm">▼</span>
                </button>
                
                {showSortMenu && (
                  <div className="absolute left-0 right-0 sm:left-0 sm:right-auto mt-2 w-full sm:min-w-[200px] bg-white rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-gray-200 overflow-hidden z-50">
                    {[
                      { value: 'name', label: 'Name', icon: '📝' },
                      { value: 'price', label: 'Price', icon: '💰' },
                      { value: 'stock', label: 'Stock', icon: '📦' },
                      { value: 'category', label: 'Category', icon: '🏷️' }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setShowSortMenu(false);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-none bg-transparent cursor-pointer text-sm sm:text-base flex items-center gap-2 ${
                          sortBy === option.value ? 'bg-blue-50 text-primary font-semibold' : 'text-gray-700'
                        }`}
                      >
                        <span className="flex-shrink-0">{option.icon}</span>
                        <span className="flex-1 truncate">{option.label}</span>
                        {sortBy === option.value && <span className="text-primary flex-shrink-0">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort Order - 20% */}
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="w-[20%] px-1 sm:px-2 md:px-3 py-2.5 bg-white border-2 border-gray-300 rounded-lg hover:border-primary hover:shadow-md transition-all text-xs sm:text-sm md:text-base min-h-11 flex flex-col sm:flex-row items-center justify-center font-bold gap-0 sm:gap-1"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                <span className="text-base sm:text-lg md:text-xl font-black leading-none" style={{ fontWeight: 900 }}>
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </span>
                <span className="hidden lg:inline text-[10px] sm:text-xs font-semibold leading-tight">
                  {sortOrder === 'asc' ? 'Asc' : 'Desc'}
                </span>
              </button>
            </div>

            {/* Additional Actions Row */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-wrap">
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
                        checked={selectedProducts.length === displayedProducts.length && displayedProducts.length > 0}
                        onChange={handleSelectAll}
                        className="w-5 h-5 cursor-pointer"
                        title="Select all displayed products"
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
                  {displayedProducts.map((product) => (
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
                      <td className="p-3">
                        {product.image?.startsWith('data:image') || product.image?.startsWith('http') ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        ) : (
                          <span className="text-3xl">{product.image || '🛍️'}</span>
                        )}
                      </td>
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

              {/* Loading indicator for table view */}
              {hasMore && (
                <div 
                  ref={loadingRef}
                  className="text-center py-4 border-t border-gray-200"
                >
                  {isLoadingMore ? (
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading more products...</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">
                      Showing {displayedCount} of {totalCount} products
                    </span>
                  )}
                </div>
              )}

              {!hasMore && displayedProducts.length > 0 && (
                <div className="text-center py-4 text-gray-400 text-sm border-t border-gray-200">
                  All products loaded ({totalCount} total)
                </div>
              )}
              
              {filteredProducts.length === 0 && (
                <div className="text-center py-12 text-gray-500 text-lg">
                  No products found
                </div>
              )}
            </div>
          ) : null}

          {/* Card/Grid View (Mobile & Tablet) */}
          {viewMode === 'grid' || window.innerWidth < 768 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {displayedProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`bg-white rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all relative overflow-hidden ${
                      selectedProducts.includes(product.id) 
                        ? 'ring-2 ring-primary shadow-[0_4px_20px_rgba(102,126,234,0.3)]' 
                        : 'border border-gray-200 hover:border-primary'
                    }`}
                  >
                  {/* Material Design Checkbox */}
                  <div className="flex justify-between items-start mb-3">
                    <button
                      onClick={() => handleSelectProduct(product.id)}
                      className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all hover:bg-gray-100 active:bg-gray-200 ${
                        selectedProducts.includes(product.id) ? 'bg-primary/10' : ''
                      }`}
                      aria-label="Select product"
                    >
                      <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                        selectedProducts.includes(product.id) 
                          ? 'bg-primary border-primary' 
                          : 'border-gray-400 bg-white'
                      }`}>
                        {selectedProducts.includes(product.id) && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                    <div className="flex-1 text-center">
                      {product.image?.startsWith('data:image') || product.image?.startsWith('http') ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-24 h-24 mx-auto object-cover rounded-xl"
                        />
                      ) : (
                        <div className="text-5xl sm:text-6xl">{product.image || '🛍️'}</div>
                      )}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="space-y-2 mb-4">
                    <h3 className="font-bold text-base sm:text-lg text-gray-800 line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="flex justify-between items-center">
                      <span className="text-lg sm:text-xl font-bold text-primary">
                        ₱{product.price.toFixed(2)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                        product.stock === 0 ? 'bg-red-100 text-red-700' :
                        product.stock < 10 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        Stock: {product.stock}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full inline-block">
                      {product.category || 'Uncategorized'}
                    </div>
                  </div>

                  {/* Material Design Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(product)}
                      className="flex-1 px-3 py-2.5 bg-blue-50 text-blue-600 rounded-lg font-semibold hover:bg-blue-100 hover:shadow-md active:bg-blue-200 transition-all min-h-11 flex items-center justify-center gap-2 border border-blue-200"
                      title="View Details"
                    >
                      <span className="text-lg">👁️</span>
                      <span className="text-sm hidden sm:inline">View</span>
                    </button>
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="flex-1 px-3 py-2.5 bg-green-50 text-green-600 rounded-lg font-semibold hover:bg-green-100 hover:shadow-md active:bg-green-200 transition-all min-h-11 flex items-center justify-center gap-2 border border-green-200"
                      title="Edit Product"
                    >
                      <span className="text-lg">✏️</span>
                      <span className="text-sm hidden sm:inline">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product)}
                      className="flex-1 px-3 py-2.5 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 hover:shadow-md active:bg-red-200 transition-all min-h-11 flex items-center justify-center gap-2 border border-red-200"
                      title="Delete Product"
                    >
                      <span className="text-lg">🗑️</span>
                      <span className="text-sm hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              ))}
              </div>

              {/* Loading indicator for grid view */}
              {hasMore && (
                <div 
                  ref={loadingRef}
                  className="text-center py-6"
                >
                  {isLoadingMore ? (
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading more products...</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">
                      Showing {displayedCount} of {totalCount} products
                    </span>
                  )}
                </div>
              )}

              {!hasMore && displayedProducts.length > 0 && (
                <div className="text-center py-4 text-gray-400 text-sm">
                  All products loaded ({totalCount} total)
                </div>
              )}

              {displayedProducts.length === 0 && (
                <div className="text-center py-12 text-gray-500 text-base sm:text-lg">
                  No products found
                </div>
              )}
            </>
          ) : null}

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
            <div className="text-center mb-4">
              {viewDetailsProduct.image?.startsWith('data:image') || viewDetailsProduct.image?.startsWith('http') ? (
                <img
                  src={viewDetailsProduct.image}
                  alt={viewDetailsProduct.name}
                  className="w-48 h-48 mx-auto object-cover rounded-xl border-2 border-gray-200"
                />
              ) : (
                <div className="text-6xl sm:text-5xl">
                  {viewDetailsProduct.image || '🛍️'}
                </div>
              )}
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
