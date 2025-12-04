import { useState, useEffect, useRef } from 'react';
import { useImageCache } from '../hooks/useImageCache';
import { getToken } from '../services/api';

/**
 * ProgressiveImage Component
 * 
 * Features:
 * - Lazy loads images using Intersection Observer
 * - Caches images in localStorage (7-day expiry)
 * - Shows loading skeleton while fetching
 * - Falls back to emoji if image fails to load
 * - Automatically retries failed loads (max 2 times)
 * 
 * @param {Object} props
 * @param {number} props.productId - Product ID to load image for
 * @param {string} props.alt - Alt text for image
 * @param {string} props.className - CSS classes for the image element
 * @param {string} props.fallbackEmoji - Emoji to show on error (default: 📦)
 * @param {boolean} props.eager - Load immediately without Intersection Observer
 */
const ProgressiveImage = ({ 
  productId, 
  alt = 'Product', 
  className = '', 
  fallbackEmoji = '📦',
  eager = false
}) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [cacheBuster, setCacheBuster] = useState(Date.now());
  const MAX_RETRIES = 2; // Maximum number of retry attempts
  
  const imgRef = useRef(null);
  const observerRef = useRef(null);
  const retryCountRef = useRef(0); // Use ref to track retries across async calls
  
  const { getCachedImage, setCachedImage } = useImageCache();

  // Get base URL from VITE_API_BASE_URL and remove /api suffix
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
  const apiUrl = apiBaseUrl.replace(/\/api$/, ''); // Remove trailing /api
  
  console.log(`[ProgressiveImage] Product ${productId}: apiUrl = ${apiUrl}`);

  /**
   * Fetch image from API with cache-busting support
   */
  const fetchImage = async () => {
    try {
      setIsLoading(true);
      setHasError(false);

      // Get auth token for Authorization header
      const token = getToken();
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Add cache-busting query parameter to bypass HTTP cache
      const url = `${apiUrl}/api/products/${productId}/image?_t=${cacheBuster}`;
      const response = await fetch(url, {
        cache: 'no-cache', // Ensure fresh fetch from server
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const data = await response.json();
      
      // Check if image exists and is not empty
      if (data.image && data.image.trim() !== '') {
        // Cache the image
        setCachedImage(productId, data.image);
        setImageSrc(data.image);
        setIsLoading(false);
      } else {
        // No image or empty image - show fallback, don't throw error
        setHasError(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error(`Error loading image for product ${productId}:`, error);
      
      // Retry up to MAX_RETRIES times with exponential backoff
      if (retryCountRef.current < MAX_RETRIES) {
        const backoffDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 5000); // Max 5 seconds
        retryCountRef.current += 1;
        setRetryCount(retryCountRef.current);
        console.log(`Retrying image load for product ${productId} (attempt ${retryCountRef.current}/${MAX_RETRIES}) in ${backoffDelay}ms`);
        setTimeout(() => fetchImage(), backoffDelay);
      } else {
        console.error(`Max retries (${MAX_RETRIES}) reached for product ${productId} image`);
        setHasError(true);
        setIsLoading(false);
      }
    }
  };

  /**
   * Load image (check cache first, then fetch)
   */
  const loadImage = async () => {
    // Check cache first
    const cachedImage = getCachedImage(productId);
    
    if (cachedImage) {
      setImageSrc(cachedImage);
      setIsLoading(false);
      return;
    }

    // Not in cache, fetch from API
    await fetchImage();
  };

  /**
   * Setup Intersection Observer for lazy loading
   */
  useEffect(() => {
    if (eager) {
      // Load immediately
      loadImage();
      return;
    }

    // Setup Intersection Observer
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage();
            // Stop observing after loading
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before element is visible
        threshold: 0.01
      }
    );

    observer.observe(imgRef.current);
    observerRef.current = observer;

    return () => {
      if (observerRef.current && imgRef.current) {
        observerRef.current.unobserve(imgRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, eager, cacheBuster]);

  /**
   * Listen for image invalidation events
   */
  useEffect(() => {
    const handleInvalidation = (event) => {
      if (event.detail.productId === productId) {
        // Update cache buster to force re-fetch
        setCacheBuster(Date.now());
        // Reset state
        setImageSrc(null);
        setIsLoading(true);
        setHasError(false);
        setRetryCount(0);
        retryCountRef.current = 0; // Reset retry counter
        // Re-load image
        loadImage();
      }
    };

    window.addEventListener('imageInvalidated', handleInvalidation);

    return () => {
      window.removeEventListener('imageInvalidated', handleInvalidation);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  /**
   * Cleanup observer on unmount
   */
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Render loading skeleton
  if (isLoading && !imageSrc) {
    return (
      <div 
        ref={imgRef}
        className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}
        aria-label="Loading image"
      >
        <svg 
          className="w-10 h-10 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
          />
        </svg>
      </div>
    );
  }

  // Render error state with emoji fallback
  if (hasError || (!imageSrc && !isLoading)) {
    return (
      <div 
        ref={imgRef}
        className={`bg-gray-100 flex items-center justify-center ${className}`}
        aria-label={`${alt} - Image not available`}
      >
        <span className="text-6xl" role="img" aria-label="Product placeholder">
          {fallbackEmoji}
        </span>
      </div>
    );
  }

  // Check if imageSrc is a valid image URL (data:image or http/https)
  const isValidImageUrl = imageSrc && (
    imageSrc.startsWith('data:image') || 
    imageSrc.startsWith('http://') || 
    imageSrc.startsWith('https://')
  );

  // If not a valid image URL, show fallback emoji
  if (!isValidImageUrl && imageSrc) {
    return (
      <div 
        ref={imgRef}
        className={`bg-gray-100 flex items-center justify-center ${className}`}
        aria-label={alt}
      >
        <span className="text-6xl" role="img" aria-label="Product placeholder">
          {fallbackEmoji}
        </span>
      </div>
    );
  }

  // Render image
  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={className}
      onError={() => {
        console.error(`Failed to render image for product ${productId}`);
        setHasError(true);
      }}
      loading="lazy" // Browser-level lazy loading as backup
    />
  );
};

export default ProgressiveImage;
