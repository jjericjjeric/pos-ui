import { useState, useRef, useEffect } from 'react';
import ProgressiveImage from './ProgressiveImage';

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
      className={`bg-white rounded-lg p-2 cursor-pointer transition-all duration-200 flex flex-col items-center text-center relative border ${
        isOutOfStock 
          ? 'opacity-60 cursor-not-allowed bg-gray-50 border-gray-200' 
          : 'border-gray-200 hover:border-[#00C853] hover:shadow-sm'
      } ${isPressed ? 'scale-95' : ''}`}
      onClick={handleTileClick}
    >
      {/* Category Badge */}
      {product.category && (
        <div className="absolute top-1.5 left-1.5 bg-white border border-gray-200 text-gray-600 text-[10px] px-1.5 py-0.5 rounded font-medium uppercase z-[5]">
          {product.category}
        </div>
      )}

      {/* Action Menu Button - Only show if user can manage (mobile-first: larger touch target) */}
      {canManage && (
        <div className="absolute top-1.5 right-1.5 z-20" ref={menuRef}>
          <button
            onClick={handleMenuClick}
            className="w-6 h-6 flex items-center justify-center bg-white hover:bg-gray-50 active:bg-gray-100 rounded border border-gray-200 transition-colors text-gray-500 hover:text-gray-700"
            aria-label="Product actions menu"
            aria-expanded={showMenu}
            aria-haspopup="true"
          >
            <span className="text-sm font-bold leading-none">⋮</span>
          </button>
          
          {/* Dropdown Menu - Mobile optimized with dynamic positioning */}
          {showMenu && (
            <div 
              data-dropdown
              className={`absolute mt-1 w-40 sm:w-36 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-[100] ${
                menuPosition === 'left' 
                  ? 'right-0 origin-top-right' 
                  : 'left-0 origin-top-left'
              }`}
            >
              <button
                onClick={handleViewDetails}
                className="w-full text-left px-3 py-2 sm:px-2.5 sm:py-1.5 hover:bg-gray-50 active:bg-gray-100 transition-colors text-gray-700 border-none bg-transparent cursor-pointer text-sm flex items-center gap-1.5 font-medium"
                aria-label="View product details"
              >
                <span className="text-base sm:text-sm">👁️</span> Details
              </button>
              <div className="border-t border-gray-100"></div>
              <button
                onClick={handleEdit}
                className="w-full text-left px-3 py-2 sm:px-2.5 sm:py-1.5 hover:bg-gray-50 active:bg-gray-100 transition-colors text-gray-700 border-none bg-transparent cursor-pointer text-sm flex items-center gap-1.5 font-medium"
                aria-label="Edit product"
              >
                <span className="text-base sm:text-sm">✏️</span> Edit
              </button>
              <div className="border-t border-gray-100"></div>
              <button
                onClick={handleDelete}
                className="w-full text-left px-3 py-2 sm:px-2.5 sm:py-1.5 hover:bg-red-50 active:bg-red-100 transition-colors text-red-600 border-none bg-transparent cursor-pointer text-sm flex items-center gap-1.5 font-medium"
                aria-label="Delete product"
              >
                <span className="text-base sm:text-sm">🗑️</span> Delete
              </button>
            </div>
          )}
        </div>
      )}

      <div className="text-4xl md:text-3xl sm:text-2xl mb-1.5 mt-2">
        {product.id ? (
          <ProgressiveImage
            productId={product.id}
            alt={product.name}
            className="w-full h-16 object-cover rounded"
            fallbackEmoji="🛍️"
          />
        ) : (
          <span>🛍️</span>
        )}
      </div>
      <div className="w-full space-y-0.5">
        <h3 className="text-xs font-semibold text-gray-800 line-clamp-2">{product.name}</h3>
        <p className="text-sm font-bold text-gray-900">₱{product.price.toFixed(2)}</p>
        
        {/* Stock Badge - Enhanced with visual indicators */}
        <div className="flex items-center gap-1">
          {product.stock < 10 && product.stock > 0 && (
            <span className="text-xs animate-pulse" title="Low stock">⚠️</span>
          )}
          <div className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
            product.stock === 0 ? 'bg-red-50 text-red-700 border border-red-200' :
            product.stock < 10 ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
            'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {product.stock}
          </div>
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


