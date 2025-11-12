import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { InventoryProvider } from './context/InventoryContext';
import { CartProvider } from './context/CartContext';
import { StoreProvider } from './context/StoreContext';
import POSPage from './pages/POSPage';
import PaymentPage from './pages/PaymentPage';
import AddProductPage from './pages/AddProductPage';
import ProductsManagementPage from './pages/ProductsManagementPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { useInventory } from './context/useInventory';

// Simple auth guard component
const RequireAuth = ({ children }) => {
  const { isAuthenticated } = useInventory();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <div className="overflow-x-hidden w-full">
      <InventoryProvider>
        <StoreProvider>
          <CartProvider>
            <Router>
              <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/pos" element={<RequireAuth><POSPage /></RequireAuth>} />
                <Route path="/payment" element={<RequireAuth><PaymentPage /></RequireAuth>} />
                <Route path="/add-product" element={<RequireAuth><AddProductPage /></RequireAuth>} />
                <Route path="/add-product/:id" element={<RequireAuth><AddProductPage /></RequireAuth>} />
                <Route path="/products-management" element={<RequireAuth><ProductsManagementPage /></RequireAuth>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </CartProvider>
        </StoreProvider>
      </InventoryProvider>
    </div>
  );
}

export default App;