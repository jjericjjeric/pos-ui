import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Calculate optimal initial load based on screen size
 * @param {string} viewType - 'grid' or 'table' or 'pos'
 * @returns {number} Optimal number of items to load initially
 */
const calculateInitialLoad = (viewType = 'grid') => {
  if (typeof window === 'undefined') return 20;

  const screenHeight = window.innerHeight;
  const screenWidth = window.innerWidth;

  // Estimate item heights based on view type and screen size
  let itemHeight;
  let itemsPerRow;

  if (viewType === 'pos') {
    // POS grid - product tiles
    if (screenWidth < 640) { // mobile
      itemHeight = 180; // ~140px tile + gap
      itemsPerRow = Math.floor(screenWidth / 110); // min 110px per tile
    } else if (screenWidth < 768) { // tablet
      itemHeight = 180;
      itemsPerRow = Math.floor(screenWidth / 130);
    } else if (screenWidth < 1024) { // small desktop
      itemHeight = 190;
      itemsPerRow = Math.floor(screenWidth / 140);
    } else { // large desktop
      itemHeight = 200;
      itemsPerRow = Math.floor(screenWidth / 150);
    }
  } else if (viewType === 'table') {
    // Table view - each row is ~60px
    itemHeight = 60;
    itemsPerRow = 1;
  } else {
    // Grid view - card layout
    if (screenWidth < 640) { // mobile
      itemHeight = 280;
      itemsPerRow = 1;
    } else if (screenWidth < 1024) { // tablet
      itemHeight = 280;
      itemsPerRow = 2;
    } else { // desktop
      itemHeight = 280;
      itemsPerRow = 3;
    }
  }

  // Calculate how many rows fit on screen
  const availableHeight = screenHeight - 200; // subtract header, filters, etc
  const rowsOnScreen = Math.ceil(availableHeight / itemHeight);
  
  // Total items = rows * items per row, plus 1-2 extra rows as buffer
  const itemsOnScreen = rowsOnScreen * itemsPerRow;
  const bufferRows = 2;
  const totalItems = itemsOnScreen + (bufferRows * itemsPerRow);

  // Ensure minimum of 10, maximum of 50
  return Math.max(10, Math.min(50, totalItems));
};

/**
 * Custom hook for lazy loading items with infinite scroll
 * 
 * @param {Array} items - Full array of items to lazy load
 * @param {Object} options - Configuration options
 * @param {number} options.initialLoad - Number of items to load initially (auto-calculated if not provided)
 * @param {number} options.loadMore - Number of items to load on scroll (default: 10)
 * @param {number} options.threshold - Distance from bottom to trigger load in pixels (default: 200)
 * @param {string} options.viewType - Type of view: 'grid', 'table', or 'pos' (for auto-calculation)
 * @returns {Object} Hook utilities and state
 */
export const useLazyLoad = (items = [], options = {}) => {
  const {
    initialLoad: customInitialLoad,
    loadMore = 10,
    threshold = 200,
    viewType = 'grid'
  } = options;

  // Calculate initial load based on screen size if not provided
  const initialLoad = customInitialLoad || calculateInitialLoad(viewType);

  const [displayedItems, setDisplayedItems] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef(null);
  const loadingRef = useRef(null);
  const currentIndexRef = useRef(0);
  const itemsRef = useRef(items);
  const loadMoreRef = useRef(loadMore);
  const hasMoreRef = useRef(true);
  const isLoadingMoreRef = useRef(false);
  const prevItemsLengthRef = useRef(items.length);
  const prevItemsHashRef = useRef('');

  // Create a hash of the items to detect changes in content/order
  const itemsHash = items.length > 0 
    ? `${items.length}-${items.slice(0, 3).map(item => item?.id || '').join('-')}`
    : '0';

  // Keep refs in sync with state
  useEffect(() => {
    itemsRef.current = items;
    loadMoreRef.current = loadMore;
  }, [items, loadMore]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore;
  }, [isLoadingMore]);

  // Reset when items change (e.g., filter, search, sort, or initial load)
  // Use hash to detect changes in content/order without causing infinite loops
  useEffect(() => {
    // Skip if hash hasn't changed (same items in same order)
    if (prevItemsHashRef.current === itemsHash) {
      return;
    }
    
    prevItemsHashRef.current = itemsHash;
    prevItemsLengthRef.current = items.length;
    
    const itemsToLoad = Math.min(initialLoad, items.length);
    setDisplayedItems(items.slice(0, itemsToLoad));
    currentIndexRef.current = itemsToLoad;
    setHasMore(itemsToLoad < items.length);
    setIsLoadingMore(false);
  }, [itemsHash, initialLoad, items]); // Depend on hash to detect changes

  // Load more items - use refs to avoid stale closures
  const loadMoreItems = useCallback(() => {
    // Check refs for latest values
    if (isLoadingMoreRef.current || !hasMoreRef.current) return;

    setIsLoadingMore(true);

    // Simulate async loading with small delay for smooth UX
    setTimeout(() => {
      const currentIndex = currentIndexRef.current;
      const currentItems = itemsRef.current;
      const currentLoadMore = loadMoreRef.current;
      const nextIndex = Math.min(currentIndex + currentLoadMore, currentItems.length);
      const newItems = currentItems.slice(currentIndex, nextIndex);

      setDisplayedItems(prev => [...prev, ...newItems]);
      currentIndexRef.current = nextIndex;
      setHasMore(nextIndex < currentItems.length);
      setIsLoadingMore(false);
    }, 100);
  }, []); // Empty deps - all values from refs, function never recreates

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const currentLoadingRef = loadingRef.current;
    
    if (!currentLoadingRef) return;

    const observerOptions = {
      root: null,
      rootMargin: `${threshold}px`,
      threshold: 0.1
    };

    observerRef.current = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting) {
        loadMoreItems();
      }
    }, observerOptions);

    observerRef.current.observe(currentLoadingRef);

    return () => {
      if (observerRef.current && currentLoadingRef) {
        observerRef.current.unobserve(currentLoadingRef);
      }
    };
  }, [loadMoreItems, threshold]);

  // Manual load more (for button click)
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      loadMoreItems();
    }
  };

  // Reset to initial state
  const reset = () => {
    const itemsToLoad = Math.min(initialLoad, items.length);
    setDisplayedItems(items.slice(0, itemsToLoad));
    currentIndexRef.current = itemsToLoad;
    setHasMore(itemsToLoad < items.length);
    setIsLoadingMore(false);
  };

  return {
    displayedItems,
    hasMore,
    isLoadingMore,
    loadingRef,
    handleLoadMore,
    reset,
    totalCount: items.length,
    displayedCount: displayedItems.length,
    calculatedInitialLoad: initialLoad
  };
};
