# Migration Guide: Context API → Zustand

## Why Zustand?

**Problem with Context Providers:**
- Race conditions (InventoryProvider loaded products before StoreProvider set currentStoreId)
- Complex provider nesting and ordering dependencies
- Difficult to debug state flow
- Re-renders cascade through provider tree

**Zustand Benefits:**
- ✅ Single source of truth
- ✅ No provider hell
- ✅ Selective subscriptions (better performance)
- ✅ Guaranteed initialization order
- ✅ DevTools support
- ✅ Middleware support (persist, immer, etc.)

---

## Quick Reference

### OLD (Context API)
```jsx
import { useInventory } from '../context/useInventory';
import { useStore } from '../context/useStore';
import { useCart } from '../context/useCart';

const MyComponent = () => {
  const { products, loading, addProduct } = useInventory();
  const { currentStore, switchStore } = useStore();
  const { cart, addToCart } = useCart();
  
  // ...
};
```

### NEW (Zustand)
```jsx
import useAppStore from '../store/useAppStore';

const MyComponent = () => {
  // Subscribe to specific state (selective)
  const products = useAppStore((state) => state.products);
  const loading = useAppStore((state) => state.productsLoading);
  const addProduct = useAppStore((state) => state.addProduct);
  
  const currentStore = useAppStore((state) => state.currentStore);
  const switchStore = useAppStore((state) => state.switchStore);
  
  const cart = useAppStore((state) => state.cart);
  const addToCart = useAppStore((state) => state.addToCart);
  
  // Or subscribe to multiple values at once
  const { products, currentStore, cart } = useAppStore((state) => ({
    products: state.products,
    currentStore: state.currentStore,
    cart: state.cart,
  }));
  
  // ...
};
```

---

## State Mapping

### Authentication
| Old (useInventory) | New (useAppStore) |
|-------------------|-------------------|
| `isAuthenticated` | `isAuthenticated` |
| `user` | `user` |
| `loginUser()` | `login()` |
| `logoutUser()` | `logout()` |

### Store Management
| Old (useStore) | New (useAppStore) |
|----------------|-------------------|
| `currentStore` | `currentStore` |
| `userStores` | `userStores` |
| `loading` | `storesLoading` |
| `switchStore()` | `switchStore()` |

### Products
| Old (useInventory) | New (useAppStore) |
|--------------------|-------------------|
| `products` | `products` |
| `loading` | `productsLoading` |
| `error` | `productsError` |
| `addProduct()` | `addProduct()` |
| `updateProduct()` | `updateProduct()` |
| `deleteProduct()` | `deleteProduct()` |
| `refreshProducts()` | `refreshProducts()` |

### Cart
| Old (useCart) | New (useAppStore) |
|---------------|-------------------|
| `cart` | `cart` |
| `addToCart()` | `addToCart()` |
| `removeFromCart()` | `removeFromCart()` |
| `updateQuantity()` | `updateCartQuantity()` |
| `clearCart()` | `clearCart()` |
| `getTotalPrice()` | Compute locally: `cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)` |
| `getTotalItems()` | Compute locally: `cart.reduce((sum, item) => sum + item.quantity, 0)` |

---

## Migration Steps

### 1. Update Imports
```diff
- import { useInventory } from '../context/useInventory';
- import { useStore } from '../context/useStore';
- import { useCart } from '../context/useCart';
+ import useAppStore from '../store/useAppStore';
```

### 2. Update State Subscriptions
```diff
- const { products, loading } = useInventory();
+ const products = useAppStore((state) => state.products);
+ const loading = useAppStore((state) => state.productsLoading);
```

**Pro Tip:** Use selective subscriptions for better performance!
```jsx
// ❌ BAD: Component re-renders on ANY state change
const state = useAppStore();

// ✅ GOOD: Component only re-renders when products change
const products = useAppStore((state) => state.products);
```

### 3. Update Action Calls
```diff
- await loginUser(username, password);
+ await login(username, password);

- await switchStore(storeId);
+ await switchStore(storeId);
```

### 4. Remove Context Providers (Already done in App.jsx)
The old providers have been removed:
- ~~`<InventoryProvider>`~~
- ~~`<StoreProvider>`~~
- ~~`<CartProvider>`~~

Now using single initialization in App.jsx:
```jsx
const initialize = useAppStore((state) => state.initialize);

useEffect(() => {
  initialize();
}, [initialize]);
```

---

## Example: Migrating POSPage

### Before (Context)
```jsx
import { useInventory } from '../context/useInventory';
import { useStore } from '../context/useStore';
import { useCart } from '../context/useCart';

const POSPage = () => {
  const { products, loading, user, deleteProduct } = useInventory();
  const { currentStore } = useStore();
  const { cart, addToCart, removeFromCart, getTotalPrice } = useCart();
  
  // ...
};
```

### After (Zustand)
```jsx
import useAppStore from '../store/useAppStore';

const POSPage = () => {
  const products = useAppStore((state) => state.products);
  const loading = useAppStore((state) => state.productsLoading);
  const user = useAppStore((state) => state.user);
  const deleteProduct = useAppStore((state) => state.deleteProduct);
  
  const currentStore = useAppStore((state) => state.currentStore);
  
  const cart = useAppStore((state) => state.cart);
  const addToCart = useAppStore((state) => state.addToCart);
  const removeFromCart = useAppStore((state) => state.removeFromCart);
  
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // ...
};
```

---

## Testing Multi-Store Isolation

Now with Zustand, the initialization flow is **guaranteed**:

1. ✅ App mounts → `initialize()` called
2. ✅ Check if authenticated → Load user data
3. ✅ Load user's stores → Set currentStore → Save to localStorage
4. ✅ Load products with `?store_id=X` parameter

**No more race conditions!** Products will ALWAYS be loaded with the correct store_id.

---

## Files to Migrate

- ✅ App.jsx (Done)
- ✅ LoginPage.jsx (Done)
- ⏳ POSPage.jsx
- ⏳ PaymentPage.jsx
- ⏳ AddProductPage.jsx
- ⏳ ProductsManagementPage.jsx
- ⏳ RegisterPage.jsx

---

## Debugging

### View Current State
```jsx
// In any component
const logState = () => {
  console.log('Current State:', useAppStore.getState());
};
```

### Watch State Changes
```jsx
useEffect(() => {
  const unsubscribe = useAppStore.subscribe(
    (state) => console.log('State changed:', state)
  );
  return unsubscribe;
}, []);
```

---

## Performance Tips

### 1. Selective Subscriptions
```jsx
// ❌ BAD: Re-renders on any state change
const { products, cart, user } = useAppStore();

// ✅ GOOD: Only re-renders when products change
const products = useAppStore((state) => state.products);
```

### 2. Shallow Equality
```jsx
import { shallow } from 'zustand/shallow';

const { products, cart } = useAppStore(
  (state) => ({ products: state.products, cart: state.cart }),
  shallow
);
```

### 3. Memoize Selectors
```jsx
const selectProducts = (state) => state.products;
const products = useAppStore(selectProducts);
```

---

## Questions?

Check the official Zustand docs: https://github.com/pmndrs/zustand
