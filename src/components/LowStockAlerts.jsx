import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import Modal from './Modal';

/**
 * LowStockAlerts Component
 * Detailed modal showing all low stock and out of stock products
 * Inspired by inventory management systems like Shopify, Square, and Lightspeed
 * 
 * Features:
 * - Separate sections for critical (out of stock) and warnings (low stock)
 * - Quick actions: Edit, Restock, View Details
 * - Sort by stock level (lowest first)
 * - Mobile-optimized card layout
 * - Smooth animations and transitions
 */
const LowStockAlerts = ({ isOpen, onClose, threshold = 10 }) => {
  const navigate = useNavigate();
  const products = useAppStore((state) => state.products);
  const [sortBy, setSortBy] = useState('stock'); // 'stock' | 'name'

  // Filter and categorize products
  const outOfStockProducts = products
    .filter(p => p.stock === 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  const lowStockProducts = products
    .filter(p => p.stock > 0 && p.stock <= threshold)
    .sort((a, b) => {
      if (sortBy === 'stock') {
        return a.stock - b.stock; // Lowest stock first
      }
      return a.name.localeCompare(b.name);
    });

  const totalAlerts = outOfStockProducts.length + lowStockProducts.length;

  const handleEditProduct = (product) => {
    onClose();
    navigate(`/add-product/${product.id}`);
  };

  const handleViewProduct = (product) => {
    onClose();
    // Could navigate to product details page if exists
    console.log('View product:', product);
  };

  const handleRestock = (product) => {
    onClose();
    navigate(`/add-product/${product.id}`, { state: { focusStock: true } });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-3xl">
      <div className="p-0">
        {/* Header - Sticky */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 sm:px-6 z-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                Inventory Alerts
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {totalAlerts} {totalAlerts === 1 ? 'product needs' : 'products need'} attention
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              aria-label="Close alerts"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <button
              onClick={() => setSortBy('stock')}
              className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                sortBy === 'stock'
                  ? 'bg-[#00C853] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Stock Level
            </button>
            <button
              onClick={() => setSortBy('name')}
              className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                sortBy === 'name'
                  ? 'bg-[#00C853] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Name
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="max-h-[60vh] sm:max-h-[70vh] overflow-y-auto px-4 py-4 sm:px-6">
          {totalAlerts === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">All Good!</h3>
              <p className="text-gray-600">No low stock alerts at this time.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Critical: Out of Stock Section */}
              {outOfStockProducts.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-1 w-1 rounded-full bg-red-600 animate-pulse"></div>
                    <h3 className="text-base sm:text-lg font-bold text-red-900">
                      Out of Stock ({outOfStockProducts.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {outOfStockProducts.map((product) => (
                      <ProductAlertCard
                        key={product.id}
                        product={product}
                        severity="critical"
                        onEdit={handleEditProduct}
                        onRestock={handleRestock}
                        onView={handleViewProduct}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Warning: Low Stock Section */}
              {lowStockProducts.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-1 w-1 rounded-full bg-amber-500"></div>
                    <h3 className="text-base sm:text-lg font-bold text-amber-900">
                      Low Stock ({lowStockProducts.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {lowStockProducts.map((product) => (
                      <ProductAlertCard
                        key={product.id}
                        product={product}
                        severity="warning"
                        threshold={threshold}
                        onEdit={handleEditProduct}
                        onRestock={handleRestock}
                        onView={handleViewProduct}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Sticky */}
        {totalAlerts > 0 && (
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 py-3 sm:px-6">
            <button
              onClick={() => {
                onClose();
                navigate('/products-management');
              }}
              className="w-full bg-[#00C853] hover:bg-[#00B34A] text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm sm:text-base"
            >
              Go to Inventory Management
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

/**
 * ProductAlertCard - Individual product alert item
 */
const ProductAlertCard = ({ product, severity, threshold, onEdit, onRestock, onView }) => {
  const isCritical = severity === 'critical';
  const stockPercentage = threshold ? Math.min((product.stock / threshold) * 100, 100) : 0;

  return (
    <div
      className={`rounded-lg p-3 sm:p-4 transition-all duration-200 hover:shadow-md ${
        isCritical
          ? 'bg-red-50 border-2 border-red-200 hover:border-red-300'
          : 'bg-amber-50 border-2 border-amber-200 hover:border-amber-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-1">
              {product.name}
            </h4>
            {product.category && (
              <span className="text-xs px-2 py-0.5 bg-white border border-gray-200 rounded text-gray-600 flex-shrink-0">
                {product.category}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Stock Badge */}
            <div className={`flex items-center gap-1.5 ${isCritical ? 'text-red-700' : 'text-amber-700'}`}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
              </svg>
              <span className="font-bold text-sm">
                {product.stock} {product.stock === 1 ? 'unit' : 'units'} left
              </span>
            </div>

            {/* Price */}
            <span className="text-sm text-gray-600">₱{product.price.toFixed(2)}</span>
          </div>

          {/* Progress Bar - Only for low stock (not out of stock) */}
          {!isCritical && (
            <div className="mt-2 bg-white rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  stockPercentage <= 25
                    ? 'bg-red-500'
                    : stockPercentage <= 50
                    ? 'bg-amber-500'
                    : 'bg-yellow-500'
                }`}
                style={{ width: `${stockPercentage}%` }}
              />
            </div>
          )}
        </div>

        {/* Actions - Mobile optimized */}
        <div className="flex flex-col sm:flex-row gap-1.5 flex-shrink-0">
          <button
            onClick={() => onRestock(product)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              isCritical
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
            aria-label={`Restock ${product.name}`}
          >
            Restock
          </button>
          <button
            onClick={() => onEdit(product)}
            className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
            aria-label={`Edit ${product.name}`}
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
};

export default LowStockAlerts;
