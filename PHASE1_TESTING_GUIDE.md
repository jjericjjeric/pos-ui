# Phase 1 Testing Guide

## Quick Start Testing

### Prerequisites
- Backend server running: `cd pos-api && go run main.go`
- Frontend server running: `cd pos-ui && npm run dev`
- Browser DevTools open (F12)

## Test Scenarios

### 1. Initial Load Performance Test

**Objective**: Verify payload size reduction

**Steps**:
1. Clear browser cache and localStorage:
   ```javascript
   // In browser console
   localStorage.clear();
   ```

2. Open Network tab in DevTools
3. Navigate to POS page
4. Find the `/api/products` request
5. Check response size

**Expected Results**:
- ✅ `/api/products` response should be small (~10-50KB for 10 products)
- ✅ Response should NOT contain base64 image data
- ✅ Products should display with loading skeletons initially

**Before vs After**:
- Before: ~500KB (with images)
- After: ~50KB (without images)

### 2. Progressive Image Loading Test

**Objective**: Verify images load lazily as you scroll

**Steps**:
1. Open Network tab → Filter by "image"
2. Clear existing requests
3. Navigate to POS page
4. Observe the Network tab
5. Scroll down slowly

**Expected Results**:
- ✅ Images load only as they become visible
- ✅ Loading skeleton shows while fetching
- ✅ Each image makes ONE request to `/api/products/:id/image`
- ✅ No requests for offscreen images

### 3. Cache Verification Test

**Objective**: Verify browser and localStorage caching

**Steps**:
1. First Visit:
   - Navigate to POS page
   - Wait for all images to load
   - Check localStorage:
     ```javascript
     // In browser console
     const cache = JSON.parse(localStorage.getItem('pos_image_cache_v1') || '{}');
     console.log('Cached images:', Object.keys(cache).length);
     ```

2. Second Visit:
   - Refresh the page (F5)
   - Watch Network tab
   - Check for "(disk cache)" or "304 Not Modified"

**Expected Results**:
- ✅ First visit: Images stored in localStorage
- ✅ Second visit: Images load instantly from cache
- ✅ Network shows cache hits (no actual requests)
- ✅ localStorage contains entries with timestamps

**Cache Structure**:
```javascript
{
  "123": {
    "image": "data:image/jpeg;base64,...",
    "timestamp": 1704931200000,
    "lastAccessed": 1704931200000,
    "size": 87432
  }
}
```

### 4. Cache Expiry Test

**Objective**: Verify 7-day cache expiration

**Steps**:
1. Load images and populate cache
2. Manually expire cache:
   ```javascript
   // In browser console
   const cache = JSON.parse(localStorage.getItem('pos_image_cache_v1') || '{}');
   const oldTimestamp = Date.now() - (8 * 24 * 60 * 60 * 1000); // 8 days ago
   Object.keys(cache).forEach(key => {
     cache[key].timestamp = oldTimestamp;
   });
   localStorage.setItem('pos_image_cache_v1', JSON.stringify(cache));
   ```

3. Refresh page

**Expected Results**:
- ✅ Expired images re-fetched from server
- ✅ New timestamps assigned
- ✅ No errors in console

### 5. LRU Eviction Test

**Objective**: Verify cache size limit (100 images)

**Steps**:
1. Check current cache size:
   ```javascript
   const cache = JSON.parse(localStorage.getItem('pos_image_cache_v1') || '{}');
   console.log('Cache size:', Object.keys(cache).length);
   ```

2. If you have < 100 products:
   - Manually add entries to test eviction
   - Or reduce MAX_CACHE_SIZE in useImageCache.js for testing

**Expected Results**:
- ✅ Oldest accessed images evicted when limit reached
- ✅ No quota exceeded errors
- ✅ Recently viewed images retained

### 6. Error Handling Test

**Objective**: Verify graceful degradation

**Steps**:
1. Test with network offline:
   - DevTools → Network → Offline
   - Navigate to POS page

2. Test with missing images:
   - Try to load product with no image

3. Test with localStorage disabled:
   - Browser settings → Disable localStorage
   - Refresh page

**Expected Results**:
- ✅ Offline: Cached images still display, new images show fallback emoji
- ✅ Missing images: Fallback emoji (🛍️) displays
- ✅ No localStorage: App works, just no caching (images load each time)
- ✅ No console errors (warnings okay)

### 7. Mobile Performance Test

**Objective**: Verify mobile optimization

**Steps**:
1. DevTools → Toggle device toolbar (mobile view)
2. Network → Throttle to "Fast 3G"
3. Navigate to POS page
4. Scroll through products

**Expected Results**:
- ✅ Initial page loads quickly (no images)
- ✅ Loading skeletons smooth
- ✅ Images load progressively
- ✅ No layout shifts
- ✅ Responsive design intact

### 8. Product Details Modal Test

**Objective**: Verify eager loading in modal

**Steps**:
1. Navigate to POS page
2. Click three-dot menu on any product
3. Click "View Details"

**Expected Results**:
- ✅ Modal opens immediately
- ✅ Image loads eagerly (not lazy)
- ✅ Loading skeleton if not cached
- ✅ Instant display if cached

### 9. Cache Statistics Test

**Objective**: Monitor cache health

**Steps**:
Run in browser console:
```javascript
// Get cache statistics
const cache = JSON.parse(localStorage.getItem('pos_image_cache_v1') || '{}');
const entries = Object.values(cache);
const totalSize = entries.reduce((sum, entry) => sum + (entry.size || 0), 0);
const now = Date.now();
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000;
const validEntries = entries.filter(entry => now - entry.timestamp < CACHE_EXPIRY);

console.log('Cache Statistics:');
console.log('- Total entries:', entries.length);
console.log('- Valid entries:', validEntries.length);
console.log('- Expired entries:', entries.length - validEntries.length);
console.log('- Total size:', (totalSize / (1024 * 1024)).toFixed(2), 'MB');
console.log('- Average image size:', (totalSize / entries.length / 1024).toFixed(2), 'KB');
```

**Expected Results**:
- ✅ Total size < 10MB (localStorage limit)
- ✅ Valid entries match displayed products
- ✅ Average image size ~50-150KB

### 10. Backend Cache Headers Test

**Objective**: Verify HTTP caching

**Steps**:
1. Network tab → Find `/api/products/:id/image` request
2. Check Response Headers

**Expected Results**:
```
Cache-Control: public, max-age=604800
Content-Type: application/json
```

- ✅ max-age = 604800 (7 days in seconds)
- ✅ public (allows browser and proxy caching)

## Performance Benchmarks

### Before Phase 1
| Metric | Value |
|--------|-------|
| Initial payload (10 products) | ~500KB |
| Time to interactive | ~3s |
| Product list query time | ~200ms |
| Cache hit rate | 0% |

### After Phase 1 (Expected)
| Metric | Value | Improvement |
|--------|-------|-------------|
| Initial payload (10 products) | ~50KB | 90% smaller |
| Time to interactive | ~0.5s | 6x faster |
| Product list query time | ~50ms | 4x faster |
| Cache hit rate (return visits) | ~95% | New feature |

## Automated Testing Script

Run this in browser console for automated checks:

```javascript
// Phase 1 Automated Test Suite
(async function testPhase1() {
  console.log('🧪 Phase 1 Test Suite Starting...\n');
  
  // Test 1: Check localStorage cache
  const cacheKey = 'pos_image_cache_v1';
  const cache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
  console.log('✓ Test 1: Cache Structure');
  console.log('  - Cached images:', Object.keys(cache).length);
  
  // Test 2: Validate cache entries
  let validCount = 0;
  const now = Date.now();
  const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000;
  
  Object.entries(cache).forEach(([id, entry]) => {
    if (entry.image && entry.timestamp && entry.lastAccessed && entry.size) {
      if (now - entry.timestamp < CACHE_EXPIRY) {
        validCount++;
      }
    }
  });
  
  console.log('✓ Test 2: Cache Validation');
  console.log('  - Valid entries:', validCount);
  console.log('  - Total entries:', Object.keys(cache).length);
  
  // Test 3: Calculate total cache size
  const totalSize = Object.values(cache).reduce((sum, entry) => sum + (entry.size || 0), 0);
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  
  console.log('✓ Test 3: Cache Size');
  console.log('  - Total size:', totalSizeMB, 'MB');
  console.log('  - Under limit:', totalSizeMB < 10 ? 'Yes ✓' : 'No ✗');
  
  // Test 4: Check product list API
  try {
    const response = await fetch('http://localhost:8080/api/products');
    const products = await response.json();
    const hasImages = products.some(p => p.image);
    
    console.log('✓ Test 4: Product List API');
    console.log('  - Products loaded:', products.length);
    console.log('  - Contains images:', hasImages ? 'Yes ✗' : 'No ✓');
    console.log('  - Response size:', (JSON.stringify(products).length / 1024).toFixed(2), 'KB');
  } catch (error) {
    console.log('✗ Test 4: Product List API Failed');
    console.log('  - Error:', error.message);
  }
  
  // Test 5: Check image endpoint
  try {
    const response = await fetch('http://localhost:8080/api/products/1/image');
    const data = await response.json();
    const cacheControl = response.headers.get('Cache-Control');
    
    console.log('✓ Test 5: Image Endpoint');
    console.log('  - Image loaded:', data.image ? 'Yes ✓' : 'No ✗');
    console.log('  - Cache-Control:', cacheControl);
    console.log('  - Has 7-day cache:', cacheControl?.includes('604800') ? 'Yes ✓' : 'No ✗');
  } catch (error) {
    console.log('✗ Test 5: Image Endpoint Failed');
    console.log('  - Error:', error.message);
  }
  
  console.log('\n✅ Test Suite Complete');
})();
```

## Troubleshooting

### Images not displaying
1. Check browser console for errors
2. Verify backend is running: `curl http://localhost:8080/api/products/1/image`
3. Check localStorage isn't full
4. Clear cache and try again

### Cache not persisting
1. Check localStorage is enabled in browser
2. Verify not in incognito mode
3. Check quota hasn't been exceeded

### Performance not improved
1. Verify `/api/products` doesn't return images (check Network tab)
2. Check cache is being populated (inspect localStorage)
3. Disable browser extensions that might interfere

### Images loading slowly
1. Check network throttling isn't enabled
2. Verify backend cache headers present
3. Check for network/firewall issues

## Success Criteria

Phase 1 is successful if:

- ✅ Initial payload reduced by >80%
- ✅ Images load progressively
- ✅ localStorage cache working
- ✅ HTTP cache headers present
- ✅ No console errors
- ✅ Fallback handling works
- ✅ Mobile performance improved
- ✅ Cache eviction works correctly
- ✅ Second visits load instantly

## Next Steps

After all tests pass:
1. ✅ Mark Phase 1 as complete
2. ✅ Monitor production metrics
3. ✅ Gather user feedback
4. ⏳ Proceed to Phase 2 (Database Split)
