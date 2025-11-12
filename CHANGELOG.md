# Changelog - POS Frontend (pos-ui)

All notable changes to the POS frontend application.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Planned
- Transaction history page UI
- Store settings page
- Staff management page UI
- Dark mode support
- PWA offline mode

---

## [2.0.0] - 2025-11-13

### Added
- **Multi-Store Support**
  - StoreContext with store management state
  - StoreSelector component (dropdown for switching)
  - Store switching with JWT refresh
  - Automatic `store_id` injection in all API calls
  - localStorage persistence for current store

- **Enhanced Product Management**
  - Products Management Page (`/products`)
  - Search functionality (Ctrl+F shortcut)
  - Category filter dropdown
  - Sort by Name/Price/Stock/Category (ASC/DESC)
  - Table view (desktop) and Grid view (mobile/tablet) toggle
  - Bulk selection with checkboxes
  - Bulk delete operation
  - Individual actions menu (View/Edit/Delete)
  - Keyboard shortcuts: Ctrl+F, Alt+E, Delete

- **Custom Hooks**
  - `useToast()` - Toast notification management
  - `useClickOutside()` - Dropdown/menu click detection
  - `useFormValidation()` - Form state and validation
  - `useImageCache()` - Image caching with lazy loading
  - `useImageCompression()` - Client-side image optimization
  - `useLazyLoad()` - Intersection Observer for lazy loading
  - `useStore()` - Store context hook

- **Reusable Components**
  - SearchBar - Search input with clear button
  - CategoryFilter - Pills or dropdown mode
  - FormField - Input with label and error display
  - Toast/ToastContainer - 4 notification types
  - ConfirmDialog - Confirmation dialogs
  - EditProductModal - Product editing modal
  - MenuDropdown - Action menus for products
  - ProgressiveImage - Lazy-loaded images
  - StoreSelector - Store switching dropdown

- **UX Enhancements**
  - Toast notification system (success/error/info/warning)
  - Auto-dismiss with progress bar
  - Undo functionality (5-second window after delete)
  - Confirmation dialogs for destructive actions
  - Product name display in confirmations
  - Optimistic UI updates
  - Loading and error states
  - Empty state handling
  - Mobile-first responsive design (320px to 1920px)
  - Large touch targets (44×44px minimum on mobile)

- **Image Optimization**
  - Separate image endpoint integration
  - 7-day browser caching
  - Progressive image loading
  - Client-side compression (target: <200KB)
  - Lazy loading with Intersection Observer
  - Placeholder while loading

### Changed
- **[BREAKING]** Updated React from 19.1.1 to 18.3.1 LTS
- **[BREAKING]** Updated React Router from 7.9.5 to 6.27.0
- **[BREAKING]** All API calls now include `store_id` parameter
- Updated @types/react to 18.3.12
- Updated @types/react-dom to 18.3.1
- Login flow now handles multiple stores
- POS page includes StoreSelector
- Products management page includes StoreSelector
- Add/Edit product pages include StoreSelector
- API service wrapper auto-injects `store_id`
- Product images loaded on-demand (separate endpoint)
- Product list excludes heavy image data

### Fixed
- **Code Duplication** - Eliminated ~249 lines via DRY principles
- Mobile responsiveness issues
- Touch target sizes (now 44×44px minimum)
- Image payload size (80-90% reduction)
- Cache invalidation for product images
- Form validation error clearing on input change
- Dropdown menu positioning on mobile
- Category filter overflow on small screens

### Performance
- Reduced initial API payload by 80-90%
- Image lazy loading for offscreen content
- Browser caching for product images
- Client-side image compression
- Optimized re-renders with proper dependency arrays
- Debounced search inputs

### Security
- Input validation on all forms
- XSS protection via sanitization
- CORS compliance with backend

---

## [1.5.0] - 2025-01-10

### Phase 1: Image Optimization

### Added
- `useImageCache` hook for caching product images
- `useImageCompression` hook for client-side optimization
- `useLazyLoad` hook with Intersection Observer
- ProgressiveImage component for lazy loading
- Image compression utilities (target: <200KB)
- Caching layer for images (7-day TTL)

### Changed
- Product images now loaded via `/products/:id/image`
- Product list API excludes image data
- Images compressed before upload (client-side)
- Lazy loading for images below the fold

### Performance
- 80-90% faster product list loading
- Reduced memory usage (lazy loading)
- Browser cache prevents re-downloads
- Compressed images save bandwidth

---

## [1.0.0] - 2024-12-01

### Initial Release

### Added
- User authentication UI (mobile + PIN)
- Guest mode login
- POS page with product grid
- Shopping cart functionality
- Product management (add/edit/delete)
- Product categories
- Product search
- Image upload (base64)
- Basic role-based UI (admin/cashier)
- Responsive design
- TailwindCSS styling
- React Router navigation
- Context API state management

### Features
- Add products to cart
- Remove products from cart
- Update cart quantities
- Clear cart
- Process sales/checkout
- View product details
- Filter by category
- Search products by name
- Upload product images

---

## Version History

| Version | Date | Focus |
|---------|------|-------|
| 2.0.0 | 2025-11-13 | Multi-store, UX enhancements, optimization |
| 1.5.0 | 2025-01-10 | Image optimization |
| 1.0.0 | 2024-12-01 | Initial release |

---

## Refactoring Log

### 2025-11-10: DRY Principles Applied

**Eliminated Duplicate Code:**
- Toast management logic (40 lines saved)
- Click-outside detection (36 lines saved)
- Form validation logic (50 lines saved)
- Search bar UI (30 lines saved)
- Category filter UI (18 lines saved)
- Form input fields (75 lines saved)

**Total:** ~249 lines of duplicate code removed

**Created:**
- 3 custom hooks (useToast, useClickOutside, useFormValidation)
- 3 reusable components (SearchBar, CategoryFilter, FormField)

---

## Component Library

### Custom Hooks
- ✅ useToast
- ✅ useClickOutside
- ✅ useFormValidation
- ✅ useImageCache
- ✅ useImageCompression
- ✅ useLazyLoad
- ✅ useStore
- 📋 useDebounce (planned)
- 📋 useLocalStorage (planned)
- 📋 useMediaQuery (planned)

### Reusable Components
- ✅ SearchBar
- ✅ CategoryFilter
- ✅ FormField
- ✅ Modal
- ✅ Toast/ToastContainer
- ✅ ConfirmDialog
- ✅ StoreSelector
- ✅ ProgressiveImage
- ✅ MenuDropdown
- ✅ ProductTile
- ✅ Cart
- 📋 Button (planned)
- 📋 Card (planned)
- 📋 Dropdown (planned)

---

## Breaking Changes

### 2.0.0
- **React version change** - Must update to 18.3.1
- **React Router version** - Must update to 6.27.0
- **API calls** - All requests now require `store_id` parameter
- **localStorage** - New key: `currentStoreId`
- **Login response** - Now includes stores array

### Migration from 1.x to 2.0
```bash
# Update dependencies
npm install react@18.3.1 react-dom@18.3.1 react-router-dom@6.27.0

# Clear localStorage
localStorage.clear();

# Re-login to get new JWT with store context
```

---

## Dependencies

### Production
- react: ^18.3.1
- react-dom: ^18.3.1
- react-router-dom: ^6.27.0
- tailwindcss: ^3.4.16

### Development
- vite: ^6.0.3
- @vitejs/plugin-react: ^4.3.4
- eslint: ^9.17.0
- @types/react: ^18.3.12
- @types/react-dom: ^18.3.1

---

## UI/UX Milestones

### Completed ✅
- Google Material Design principles
- Mobile-first responsive design
- Touch-friendly interface (44×44px targets)
- Toast notification system
- Keyboard shortcuts
- Confirmation dialogs
- Optimistic UI updates
- Loading states
- Error states
- Empty states
- Progressive image loading
- Multi-store UI

### In Progress 🚧
- Accessibility improvements (WCAG AA)
- Transaction history page

### Planned 📋
- Dark mode
- PWA features
- Offline support
- Advanced filtering
- Export functionality

---

## Known Issues

### Current
- None reported

### Resolved
- ✅ Fixed: Mobile menu overflow
- ✅ Fixed: Touch targets too small
- ✅ Fixed: Image payload too large
- ✅ Fixed: Store selector not showing on some pages
- ✅ Fixed: Confirmation dialog mobile layout

---

## Contributors

- John Jeric Nocentes (@jjericjjeric)

---

## Links

- [Main Changelog](../CHANGELOG.md)
- [Backend Changelog](../pos-api/CHANGELOG.md)
- [Technical Specification](../TECHNICAL_SPECIFICATION.md)
- [Feature Status](../docs/FEATURE_STATUS.md)

---

**Last Updated:** November 13, 2025
