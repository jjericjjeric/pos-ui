import { useState, useRef, useEffect } from 'react';

/**
 * ProductTile Component - Mobile-First Design
 * Displays product with optional action menu for management
 * Large touch targets and optimized for mobile interactions
 */
const ProductTile = ({ product, onAddToCart, onEdit, onDelete, onViewDetails, userRole }) => {
  const isOutOfStock = product.stock === 0;
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState('right');
  const [isPressed, setIsPressed] = useState(false);
  const menuRef = useRef(null);

  // Always show menu if callbacks are provided (for flexibility)
  const canManage = (onEdit || onDelete || onViewDetails);

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
    
    // Determine menu position based on click position
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const distanceFromRight = viewportWidth - rect.right;
      const distanceFromLeft = rect.left;
      
      // If close to right edge (less than 200px), position menu to the left
      // If close to left edge (less than 200px), position menu to the right
      if (distanceFromRight < 200) {
        setMenuPosition('left');
      } else if (distanceFromLeft < 200) {
        setMenuPosition('right');
      } else {
        setMenuPosition('right'); // Default to right
      }
    }
    
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

  const handleTileClick = () => {
    if (!isOutOfStock) {
      setIsPressed(true);
      setTimeout(() => setIsPressed(false), 200);
      onAddToCart();
    }
  };

  return (
    <div 
      className={`bg-white rounded-xl p-4 md:p-3.5 sm:p-3 cursor-pointer transition-all duration-300 flex flex-col items-center text-center relative shadow-md ${
        isOutOfStock 
          ? 'opacity-60 cursor-not-allowed bg-gray-100' 
          : 'hover:-translate-y-1 hover:shadow-xl hover:ring-2 hover:ring-primary/30'
      } ${isPressed ? 'scale-95 shadow-sm' : ''}`}
      onClick={handleTileClick}
    >
      {/* Category Badge */}
      {product.category && (
        <div className="absolute top-2 left-2 bg-gradient-to-r from-primary to-primary-dark text-white text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase z-[5] shadow-sm">
          {product.category}
        </div>
      )}

      {/* Action Menu Button - Only show if user can manage (mobile-first: larger touch target) */}
      {canManage && (
        <div className="absolute top-2 right-2 z-20" ref={menuRef}>
          <button
            onClick={handleMenuClick}
            className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-full shadow-sm transition-all hover:shadow-md text-gray-600 hover:text-gray-800"
            aria-label="Product actions menu"
            aria-expanded={showMenu}
            aria-haspopup="true"
          >
            <span className="text-xl sm:text-lg font-bold leading-none">⋮</span>
          </button>
          
          {/* Dropdown Menu - Mobile optimized with dynamic positioning */}
          {showMenu && (
            <div 
              data-dropdown
              className={`absolute mt-2 w-48 sm:w-44 bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden z-[100] ${
                menuPosition === 'left' 
                  ? 'right-0 origin-top-right' 
                  : 'left-0 origin-top-left'
              }`}
            >
              <button
                onClick={handleEdit}
                className="w-full text-left px-4 py-3 sm:px-3 sm:py-2.5 hover:bg-blue-50 active:bg-blue-100 transition-colors text-gray-700 border-none bg-transparent cursor-pointer text-base sm:text-sm flex items-center gap-2 font-medium"
                aria-label="Edit product"
              >
                <span className="text-lg sm:text-base">✏️</span> Edit Product
              </button>
              <div className="border-t border-gray-100"></div>
              <button
                onClick={handleDelete}
                className="w-full text-left px-4 py-3 sm:px-3 sm:py-2.5 hover:bg-red-50 active:bg-red-100 transition-colors text-red-600 border-none bg-transparent cursor-pointer text-base sm:text-sm flex items-center gap-2 font-medium"
                aria-label="Delete product"
              >
                <span className="text-lg sm:text-base">🗑️</span> Delete Product
              </button>
              <div className="border-t border-gray-100"></div>
              <button
                onClick={handleViewDetails}
                className="w-full text-left px-4 py-3 sm:px-3 sm:py-2.5 hover:bg-gray-50 active:bg-gray-100 transition-colors text-gray-700 border-none bg-transparent cursor-pointer text-base sm:text-sm flex items-center gap-2 font-medium"
                aria-label="View product details"
              >
                <span className="text-lg sm:text-base">👁️</span> View Details
              </button>
            </div>
          )}
        </div>
      )}

      <div className="text-5xl md:text-4xl sm:text-3xl mb-3 sm:mb-2 mt-4">
        {product.image?.startsWith('data:image') || product.image?.startsWith('http') ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-24 sm:h-20 object-cover rounded-lg"
          />
        ) : (
          <span>{product.image || '🛍️'}</span>
        )}
      </div>
      <div className="w-full space-y-1">
        <h3 className="text-base md:text-sm sm:text-xs font-bold text-gray-800 line-clamp-2">{product.name}</h3>
        <p className="text-xl md:text-lg sm:text-base font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">₱{product.price.toFixed(2)}</p>
        <div className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
          product.stock === 0 ? 'bg-red-100 text-red-700' :
          product.stock < 10 ? 'bg-yellow-100 text-yellow-700' :
          'bg-green-100 text-green-700'
        }`}>
          Stock: {product.stock}
        </div>
      </div>
      {isOutOfStock && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
          <div className="bg-white px-4 py-2 rounded-lg shadow-lg">
            <p className="font-bold text-gray-800 text-sm">Out of Stock</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductTile;


