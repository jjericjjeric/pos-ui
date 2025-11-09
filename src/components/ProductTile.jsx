import { useState, useRef, useEffect } from 'react';

/**
 * ProductTile Component - Mobile-First Design
 * Displays product with optional action menu for management
 * Large touch targets and optimized for mobile interactions
 */
const ProductTile = ({ product, onAddToCart, onEdit, onDelete, onViewDetails, userRole }) => {
  const isOutOfStock = product.stock === 0;
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Check if user has permission to edit/delete (not a cashier)
  const canManage = userRole && userRole !== 'cashier';

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    onEdit && onEdit(product);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    onDelete && onDelete(product);
  };

  const handleViewDetails = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    onViewDetails && onViewDetails(product);
  };

  return (
    <div 
      className={`bg-gradient-to-br from-gray-50 to-gray-300 rounded-xl p-4 md:p-3.5 sm:p-3 cursor-pointer transition-all duration-300 border-2 border-transparent flex flex-col items-center text-center relative overflow-hidden ${
        isOutOfStock 
          ? 'opacity-60 cursor-not-allowed bg-gradient-to-br from-gray-200 to-gray-400' 
          : 'hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] hover:border-primary'
      }`}
      onClick={() => !isOutOfStock && onAddToCart()}
    >
      {/* Category Badge */}
      {product.category && (
        <div className="absolute top-2 left-2 bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase">
          {product.category}
        </div>
      )}

      {/* Action Menu Button - Only show if user can manage (mobile-first: larger touch target) */}
      {canManage && (
        <div className="absolute top-2 right-2 z-10" ref={menuRef}>
          <button
            onClick={handleMenuClick}
            className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center bg-white/90 hover:bg-white active:bg-gray-100 rounded-full shadow-md transition-all hover:shadow-lg text-gray-700 hover:text-gray-900"
            aria-label="Product actions menu"
            aria-expanded={showMenu}
            aria-haspopup="true"
          >
            <span className="text-xl sm:text-lg font-bold leading-none">⋮</span>
          </button>
          
          {/* Dropdown Menu - Mobile optimized */}
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 sm:w-44 bg-white rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-gray-200 overflow-hidden z-20">
              <button
                onClick={handleEdit}
                className="w-full text-left px-4 py-3 sm:px-3 sm:py-2.5 hover:bg-blue-50 active:bg-blue-100 transition-colors text-gray-700 border-none bg-transparent cursor-pointer text-base sm:text-sm flex items-center gap-2"
                aria-label="Edit product"
              >
                <span className="text-lg sm:text-base">✏️</span> Edit Product
              </button>
              <button
                onClick={handleDelete}
                className="w-full text-left px-4 py-3 sm:px-3 sm:py-2.5 hover:bg-red-50 active:bg-red-100 transition-colors text-red-600 border-none bg-transparent cursor-pointer text-base sm:text-sm flex items-center gap-2"
                aria-label="Delete product"
              >
                <span className="text-lg sm:text-base">🗑️</span> Delete Product
              </button>
              <button
                onClick={handleViewDetails}
                className="w-full text-left px-4 py-3 sm:px-3 sm:py-2.5 hover:bg-gray-50 active:bg-gray-100 transition-colors text-gray-700 border-none bg-transparent cursor-pointer text-base sm:text-sm flex items-center gap-2"
                aria-label="View product details"
              >
                <span className="text-lg sm:text-base">👁️</span> View Details
              </button>
            </div>
          )}
        </div>
      )}

      <div className="text-5xl md:text-4xl sm:text-3xl mb-2 sm:mb-1.5 mt-4">{product.image}</div>
      <div className="w-full">
        <h3 className="my-2 sm:my-1.5 text-base md:text-sm sm:text-xs font-semibold text-gray-800 break-words">{product.name}</h3>
        <p className="my-1 text-lg md:text-base sm:text-sm font-bold text-primary">₱{product.price.toFixed(2)}</p>
        <p className="mt-1 mb-0 text-sm md:text-xs sm:text-xs text-gray-600">Stock: {product.stock}</p>
      </div>
      {isOutOfStock && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-4 sm:px-3 py-2 sm:py-1.5 rounded-lg font-semibold text-sm sm:text-xs z-10">
          Out of Stock
        </div>
      )}
    </div>
  );
};

export default ProductTile;


