import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import { useLazyLoad } from '../hooks/useLazyLoad';
import { useToast } from '../hooks/useToast';
import { useClickOutside } from '../hooks/useClickOutside';
import ProductTile from '../components/ProductTile';
import Cart from '../components/Cart';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import MenuDropdown from '../components/MenuDropdown';
import StoreSelector from '../components/StoreSelector';
import ProgressiveImage from '../components/ProgressiveImage';
import SearchBar from '../components/SearchBar';
import CategoryFilter from '../components/CategoryFilter';
import { ToastContainer } from '../components/Toast';

const POSPage = () => {
  // Zustand store selectors
  const products = useAppStore((state) => state.products);
  const loading = useAppStore((state) => state.productsLoading);
  const user = useAppStore((state) => state.user);
  const cart = useAppStore((state) => state.cart);
  const cartBadgeBounce = useAppStore((state) => state.cartBadgeBounce);
  
  // Zustand actions (stable references)
  const logout = useAppStore((state) => state.logout);
  const deleteProduct = useAppStore((state) => state.deleteProduct);
  const addProduct = useAppStore((state) => state.addProduct);
  const addToCart = useAppStore((state) => state.addToCart);
  const removeFromCart = useAppStore((state) => state.removeFromCart);
  const updateCartQuantity = useAppStore((state) => state.updateCartQuantity);
  
  const { toasts, addToast, removeToast } = useToast();
  const navigate = useNavigate();
  const [showCartModal, setShowCartModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showDesktopMenu, setShowDesktopMenu] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [viewDetailsProduct, setViewDetailsProduct] = useState(null);
  const [deletedProductBackup, setDeletedProductBackup] = useState(null);
  const mobileMenuRef = useRef(null);
  const desktopMenuRef = useRef(null);

  // Helper functions for cart (memoized)
  const getTotalPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);
  
  const getTotalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Get unique categories from products
  const categories = ['All', ...new Set(products.map(p => p.category || 'Uncategorized'))];
  
  // Filter products by category and search query
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || (p.category || 'Uncategorized') === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
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
    viewType: 'pos',
    loadMore: 15,
    threshold: 300
  });

  // Close menu when clicking outside
  useClickOutside(mobileMenuRef, () => setShowMobileMenu(false), showMobileMenu);
  useClickOutside(desktopMenuRef, () => setShowDesktopMenu(false), showDesktopMenu);

  const handleAddToCart = (product) => {
    const result = addToCart(product);
    if (result && !result.success && result.message) {
      alert(result.message);
    }
  };

  const handleRemoveFromCart = (productId) => {
    removeFromCart(productId);
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.stock) {
      alert(`Cannot exceed stock quantity (${product.stock})`);
      return { success: false, message: `Cannot exceed stock quantity (${product.stock})` };
    }
    updateCartQuantity(productId, newQuantity);
    return { success: true };
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }
    navigate('/payment');
  };

  const totalPrice = getTotalPrice;
  const cartItemCount = getTotalItems;

  // Product management handlers
  const handleEditProduct = (product) => {
    // Navigate to the add-product page with the product ID
    navigate(`/add-product/${product.id}`);
  };

  const handleDeleteProduct = (product) => {
    setDeletingProduct(product);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    
    try {
      // Backup product for undo
      setDeletedProductBackup(deletingProduct);
      
      await deleteProduct(deletingProduct.id);
      
      // Show success toast with undo option (5 seconds)
      addToast(
        `"${deletingProduct.name}" deleted`,
        'success',
        5000,
        handleUndoDelete,
        'Undo'
      );
      
      setDeletingProduct(null);
    } catch (error) {
      addToast(error.message || 'Failed to delete product', 'error');
    }
  };

  const handleUndoDelete = async () => {
    if (!deletedProductBackup) return;
    
    try {
      // Re-add the deleted product (without id since it will be assigned by the server)
      const { id, ...productData } = deletedProductBackup;
      await addProduct(productData);
      addToast(`"${deletedProductBackup.name}" restored`, 'success');
      setDeletedProductBackup(null);
    } catch (error) {
      addToast('Failed to restore product', 'error');
    }
  };

  const handleViewDetails = (product) => {
    setViewDetailsProduct(product);
  };

  return (
    <div className="h-dvh w-full flex flex-col bg-gradient-to-br from-[#667eea] to-[#764ba2] overflow-hidden">
      {/* Guest Warning Banner */}
      {user?.role === 'GUEST' && (
        <div className="bg-yellow-500 text-white px-3 py-2 text-center text-xs sm:text-sm font-medium flex-shrink-0 shadow-md">
          <span className="inline-flex items-center gap-2">
            <span>⚠️</span>
            <span>Guest Mode: All products and data will be permanently deleted when you logout</span>
          </span>
        </div>
      )}
      
      {/* Compact Header - Only on mobile for Cart & Menu */}
      <div className="lg:hidden bg-white/95 px-2 sm:px-3 py-1.5 sm:py-2 shadow-md z-50 flex justify-between items-center gap-2 flex-shrink-0">
        <StoreSelector className="flex-shrink-0" variant="light" />
        {user && (
          <span className="hidden sm:inline text-xs text-gray-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-200 whitespace-nowrap truncate max-w-[100px]">
            <strong>{user.username}</strong>
          </span>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {/* Cart Icon Button */}
          <button
            className="relative p-2 bg-white border-2 border-gray-300 rounded-lg cursor-pointer transition-all hover:border-primary hover:shadow-md active:scale-95 w-11 h-11 flex items-center justify-center"
            onClick={() => setShowCartModal(true)}
            aria-label="View Cart"
          >
            <span className="text-xl sm:text-2xl">🛒</span>
            {cartItemCount > 0 && (
              <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full min-w-[18px] sm:min-w-[20px] text-center font-bold shadow-md transition-transform ${
                cartBadgeBounce ? 'animate-bounce-scale' : ''
              }`}>
                {cartItemCount}
              </span>
            )}
          </button>
          {/* Menu Button */}
          <div className="relative z-[100]" ref={mobileMenuRef}>
            <button
              className="px-2.5 sm:px-3 py-1.5 bg-gray-600 text-white border-none rounded-lg font-semibold cursor-pointer shadow-md transition-all hover:shadow-lg active:scale-95 text-xs sm:text-sm min-w-11 min-h-11 flex items-center justify-center"
              onClick={() => {
                console.log('Mobile menu button clicked, current state:', showMobileMenu);
                setShowMobileMenu(!showMobileMenu);
              }}
            >
              ☰ <span className="hidden xs:inline ml-1">Menu</span>
            </button>
            <MenuDropdown 
              isOpen={showMobileMenu}
              onClose={() => setShowMobileMenu(false)}
              logoutUser={logout}
              user={user}
            />
          </div>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden gap-2 p-2 lg:p-3 flex-col lg:flex-row max-w-full min-h-0">
        <div className="flex-[1_1_auto] lg:flex-[0_0_70%] min-h-0 bg-white rounded-xl overflow-hidden shadow-lg flex flex-col max-w-full relative">
          {/* Search and Category Filter - Sticky */}
          <div className="sticky top-0 bg-white z-10 px-2 sm:px-3 pt-2 sm:pt-3 pb-2 border-b border-gray-200 flex-shrink-0 space-y-2">
            {/* Search Bar */}
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search products..."
            />
            
            {/* Category Pills */}
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              mode="pills"
            />
          </div>
          {/* Scrollable Products Grid */}
          <div className="flex-1 overflow-y-auto px-2 sm:px-3 py-2 sm:py-3">
            {loading && (
              <div className="text-center p-6 text-gray-600 text-base sm:text-lg">Loading products...</div>
            )}
            {!loading && (
              <>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(130px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(140px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2 sm:gap-2.5">
                  {displayedProducts.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 sm:p-16">
                      <div className="text-6xl sm:text-7xl mb-4">📦</div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-2">No Products Yet</h3>
                      <p className="text-sm sm:text-base text-gray-500 mb-6 text-center max-w-md">
                        Get started by adding your first product to the inventory
                      </p>
                      <button
                        onClick={() => navigate('/add-product')}
                        className="px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg font-semibold hover:shadow-lg active:scale-95 transition-all flex items-center gap-2 text-sm sm:text-base"
                      >
                        <span className="text-xl">➕</span>
                        Add Your First Product
                      </button>
                    </div>
                  ) : (
                    displayedProducts.map(product => (
                      <ProductTile
                        key={product.id}
                        product={product}
                        onAddToCart={() => handleAddToCart(product)}
                        onEdit={handleEditProduct}
                        onDelete={handleDeleteProduct}
                        onViewDetails={handleViewDetails}
                        userRole={user?.role}
                      />
                    ))
                  )}
                </div>
                
                {/* Loading indicator and intersection observer target */}
                {hasMore && (
                  <div 
                    ref={loadingRef}
                    className="text-center py-4 text-gray-500 text-sm"
                  >
                    {isLoadingMore ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading more products...</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">
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
              </>
            )}
          </div>

          {/* Floating Action Button - Add Product */}
          <button
            onClick={() => navigate('/add-product')}
            className="absolute bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 w-14 h-14 sm:w-16 sm:h-16 bg-[#00C853] rounded-full shadow-lg hover:bg-[#00B548] hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center group border-2 border-white"
            title="Add Product"
            aria-label="Add Product"
          >
            <span className="text-3xl sm:text-4xl text-white font-bold">+</span>
            <span className="absolute -top-12 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none hidden sm:block">
              Add Product
            </span>
          </button>
        </div>

        {/* Desktop Cart - hidden on mobile/tablet */}
        <div className="hidden lg:flex flex-[0_0_30%] bg-white rounded-xl p-3 flex-col shadow-lg min-w-0 relative">
          {/* Store Selector for Desktop - Top Section */}
          <div className="mb-3 flex items-center justify-between">
            <StoreSelector className="flex-shrink-0" variant="light" />
          </div>
          
          {/* Menu Button for Desktop - Top Right Corner */}
          <div className="absolute top-2 right-2 z-10" ref={desktopMenuRef}>
            <button
              className="p-2 bg-gray-600 text-white border-none rounded-lg font-semibold cursor-pointer shadow-md transition-all hover:shadow-lg active:scale-95 min-w-10 min-h-10 flex items-center justify-center"
              onClick={() => {
                console.log('Desktop menu button clicked, current state:', showDesktopMenu);
                setShowDesktopMenu(!showDesktopMenu);
              }}
              title="Menu"
            >
              ☰
            </button>
            <MenuDropdown 
              isOpen={showDesktopMenu}
              onClose={() => setShowDesktopMenu(false)}
              logoutUser={logout}
              user={user}
            />
          </div>
          
          <Cart
            cart={cart}
            onRemove={handleRemoveFromCart}
            onUpdateQuantity={handleUpdateQuantity}
            totalPrice={totalPrice}
            onCheckout={handleCheckout}
          />
        </div>
      </div>

      {/* Mobile Cart Modal */}
      <Modal 
        isOpen={showCartModal} 
        onClose={() => setShowCartModal(false)}
        title="Your Cart"
      >
        <Cart
          cart={cart}
          onRemove={handleRemoveFromCart}
          onUpdateQuantity={handleUpdateQuantity}
          totalPrice={totalPrice}
          onCheckout={() => {
            setShowCartModal(false);
            handleCheckout();
          }}
        />
      </Modal>

      {/* Delete Confirmation Dialog */}
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

      {/* View Details Modal */}
      <Modal
        isOpen={!!viewDetailsProduct}
        onClose={() => setViewDetailsProduct(null)}
        title="Product Details"
      >
        {viewDetailsProduct && (
          <div className="flex-1 flex flex-col gap-4">
            <div className="text-center mb-4">
              {viewDetailsProduct.id ? (
                <ProgressiveImage
                  productId={viewDetailsProduct.id}
                  alt={viewDetailsProduct.name}
                  className="w-48 h-48 mx-auto object-cover rounded-xl border-2 border-gray-200"
                  fallbackEmoji="🛍️"
                  eager={true}
                />
              ) : (
                <div className="text-6xl sm:text-5xl">
                  🛍️
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

export default POSPage;


