import { useState } from 'react';
import useAppStore from '../store/useAppStore';

const DISMISS_KEY = 'lowStockBannerDismissedDate';

/** Returns today's date as a YYYY-MM-DD string in local time. */
const todayString = () => new Date().toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD

/**
 * LowStockBanner Component
 * Attention-grabbing banner inspired by Shopify, Square, and Toast POS
 * Shows critical inventory alerts at the top of pages
 *
 * Design Principles:
 * - High contrast colors (amber/orange) for urgency
 * - Animated pulse for critical items (stock = 0)
 * - Quick-glance count with expandable details
 * - Dismissible for the rest of the current day; reappears the next day
 * - Mobile-first responsive design
 */
const LowStockBanner = ({ onViewDetails }) => {
  const products = useAppStore((state) => state.products);
  const lowStockThreshold = useAppStore((state) => state.appSettings.lowStockThreshold || 10);

  /**
   * Initialise dismissed state by checking localStorage.
   * If the stored date matches today, the banner was already dismissed today.
   */
  const [isDismissed, setIsDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === todayString(),
  );

  // Calculate low stock products using dynamic threshold
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= lowStockThreshold);
  const outOfStockProducts = products.filter(p => p.stock === 0);
  const totalAlerts = lowStockProducts.length + outOfStockProducts.length;

  // Don't show if no alerts or dismissed
  if (totalAlerts === 0 || isDismissed) return null;

  const handleViewDetails = () => {
    onViewDetails?.();
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    localStorage.setItem(DISMISS_KEY, todayString());
    setIsDismissed(true);
  };

  return (
    <div className="relative">
      {/* Critical Out of Stock Alert - Pulsing Red Banner */}
      {outOfStockProducts.length > 0 && (
        <div 
          className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 sm:px-6 sm:py-3.5 cursor-pointer hover:from-red-700 hover:to-red-800 transition-all duration-200 animate-pulse"
          onClick={handleViewDetails}
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              {/* Icon - Larger on mobile for visibility */}
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm sm:text-base">
                  {outOfStockProducts.length} {outOfStockProducts.length === 1 ? 'product' : 'products'} out of stock
                </p>
                <p className="text-xs sm:text-sm text-red-100 mt-0.5 line-clamp-1">
                  {outOfStockProducts.slice(0, 2).map(p => p.name).join(', ')}
                  {outOfStockProducts.length > 2 && ` +${outOfStockProducts.length - 2} more`}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleViewDetails}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap backdrop-blur-sm"
                aria-label="View out of stock products"
              >
                View All
              </button>
              <button
                onClick={handleDismiss}
                className="text-white/80 hover:text-white p-1 transition-colors flex-shrink-0"
                aria-label="Dismiss alert"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Warning - Amber Banner */}
      {lowStockProducts.length > 0 && (
        <div 
          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 sm:px-6 sm:py-3.5 cursor-pointer hover:from-amber-600 hover:to-orange-600 transition-all duration-200"
          onClick={handleViewDetails}
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              {/* Icon */}
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm sm:text-base">
                  {lowStockProducts.length} {lowStockProducts.length === 1 ? 'product' : 'products'} running low on stock
                </p>
                <p className="text-xs sm:text-sm text-amber-100 mt-0.5 line-clamp-1">
                  Restock soon to avoid stockouts
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleViewDetails}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap backdrop-blur-sm"
                aria-label="View low stock products"
              >
                Review
              </button>
              <button
                onClick={handleDismiss}
                className="text-white/80 hover:text-white p-1 transition-colors flex-shrink-0"
                aria-label="Dismiss alert"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LowStockBanner;
