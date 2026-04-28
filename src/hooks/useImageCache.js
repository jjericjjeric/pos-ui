import { useCallback } from 'react';
import { IMAGE_CACHE_VERSION } from '../version';

/**
 * Custom hook for caching product images in localStorage
 * Implements LRU (Least Recently Used) cache with size limits
 * 
 * Cache Strategy:
 * - 7-day expiration
 * - Max 100 images cached
 * - Auto-cleanup of old/unused images
 * - Handles localStorage quota exceeded
 * - Version automatically synced from package.json
 */

const IMAGE_CACHE_KEY = 'pos_image_cache';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const MAX_CACHE_SIZE = 100; // Maximum number of images to cache
const CACHE_STORAGE_KEY = `${IMAGE_CACHE_KEY}_${IMAGE_CACHE_VERSION}`;

export const useImageCache = () => {
  /**
   * Get cache object from localStorage
   * @returns {Object} Cache object or empty object
   */
  const getCache = useCallback(() => {
    try {
      const cache = localStorage.getItem(CACHE_STORAGE_KEY);
      return cache ? JSON.parse(cache) : {};
    } catch (error) {
      console.warn('Failed to read image cache:', error);
      // If cache is corrupted, clear it
      localStorage.removeItem(CACHE_STORAGE_KEY);
      return {};
    }
  }, []);

  /**
   * Save cache object to localStorage
   * @param {Object} cache - Cache object to save
   */
  const saveCache = useCallback((cache) => {
    try {
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cache));
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, clearing old cache entries');
        // Clear half of the cache
        const entries = Object.entries(cache)
          .sort((a, b) => b[1].lastAccessed - a[1].lastAccessed)
          .slice(0, Math.floor(MAX_CACHE_SIZE / 2));
        const newCache = Object.fromEntries(entries);
        try {
          localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(newCache));
        } catch (retryError) {
          console.error('Failed to save cache even after cleanup:', retryError);
          localStorage.removeItem(CACHE_STORAGE_KEY);
        }
      } else {
        console.error('Failed to save image cache:', error);
      }
    }
  }, []);

  /**
   * Get cached image for a product
   * @param {number} productId - Product ID
   * @returns {string|null} Cached image data or null
   */
  const getCachedImage = useCallback((productId) => {
    try {
      const cache = getCache();
      const cached = cache[productId];

      if (!cached) {
        return null;
      }

      // Check if cache has expired
      const now = Date.now();
      if (now - cached.timestamp > CACHE_EXPIRY) {
        // Remove expired entry
        delete cache[productId];
        saveCache(cache);
        return null;
      }

      // Update last accessed time for LRU
      cached.lastAccessed = now;
      cache[productId] = cached;
      saveCache(cache);

      return cached.image;
    } catch (error) {
      console.warn('Error getting cached image:', error);
      return null;
    }
  }, [getCache, saveCache]);

  /**
   * Invalidate cached image and trigger re-fetch
   * This forces ProgressiveImage components to fetch fresh data
   * @param {number} productId - Product ID
   */
  const invalidateImage = useCallback((productId) => {
    try {
      const cache = getCache();
      delete cache[productId];
      saveCache(cache);
      
      // Dispatch custom event to notify ProgressiveImage components
      window.dispatchEvent(new CustomEvent('imageInvalidated', { 
        detail: { productId } 
      }));
    } catch (error) {
      console.warn('Error invalidating cached image:', error);
    }
  }, [getCache, saveCache]);

  /**
   * Cache an image for a product
   * @param {number} productId - Product ID
   * @param {string} imageData - Base64 image data
   */
  const setCachedImage = useCallback((productId, imageData) => {
    try {
      const cache = getCache();
      const now = Date.now();

      // Add new entry
      cache[productId] = {
        image: imageData,
        timestamp: now,
        lastAccessed: now,
        size: imageData.length
      };

      // Implement LRU eviction if cache is too large
      const entries = Object.entries(cache);
      if (entries.length > MAX_CACHE_SIZE) {
        // Sort by last accessed (oldest first)
        entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
        // Remove oldest entries
        const entriesToKeep = entries.slice(-(MAX_CACHE_SIZE - 1));
        const newCache = Object.fromEntries(entriesToKeep);
        // Add the new entry
        newCache[productId] = cache[productId];
        saveCache(newCache);
      } else {
        saveCache(cache);
      }
    } catch (error) {
      console.warn('Error caching image:', error);
    }
  }, [getCache, saveCache]);

  /**
   * Remove a specific image from cache
   * @param {number} productId - Product ID
   */
  const removeCachedImage = useCallback((productId) => {
    try {
      const cache = getCache();
      delete cache[productId];
      saveCache(cache);
    } catch (error) {
      console.warn('Error removing cached image:', error);
    }
  }, [getCache, saveCache]);

  /**
   * Clear entire image cache
   */
  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(CACHE_STORAGE_KEY);
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  }, []);

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  const getCacheStats = useCallback(() => {
    try {
      const cache = getCache();
      const entries = Object.values(cache);
      const totalSize = entries.reduce((sum, entry) => sum + (entry.size || 0), 0);
      const now = Date.now();
      const validEntries = entries.filter(entry => now - entry.timestamp < CACHE_EXPIRY);

      return {
        totalEntries: entries.length,
        validEntries: validEntries.length,
        totalSize: totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
      };
    } catch (error) {
      console.warn('Error getting cache stats:', error);
      return {
        totalEntries: 0,
        validEntries: 0,
        totalSize: 0,
        totalSizeMB: 0
      };
    }
  }, [getCache]);

  /**
   * Clean up expired entries from cache
   */
  const cleanupCache = useCallback(() => {
    try {
      const cache = getCache();
      const now = Date.now();
      const validEntries = Object.entries(cache).filter(
        ([, entry]) => now - entry.timestamp < CACHE_EXPIRY
      );
      const newCache = Object.fromEntries(validEntries);
      saveCache(newCache);
      return validEntries.length;
    } catch (error) {
      console.warn('Error cleaning up cache:', error);
      return 0;
    }
  }, [getCache, saveCache]);

  return {
    getCachedImage,
    setCachedImage,
    removeCachedImage,
    invalidateImage,
    clearCache,
    getCacheStats,
    cleanupCache
  };
};
