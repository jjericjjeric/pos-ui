import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAppStore from './store/useAppStore';
import POSPage from './pages/POSPage';
import PaymentPage from './pages/PaymentPage';
import AddProductPage from './pages/AddProductPage';
import ImportProductsPage from './pages/ImportProductsPage';
import ProductsManagementPage from './pages/ProductsManagementPage';
import StoreSettingsPage from './pages/StoreSettingsPage';
import CreateStorePage from './pages/CreateStorePage';
import AppSettingsPage from './pages/AppSettingsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import TransactionHistoryPage from './pages/TransactionHistoryPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BottomNav from './components/BottomNav';
import InstallPrompt from './components/InstallPrompt';

// Simple auth guard component
const RequireAuth = ({ children }) => {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  const initialize = useAppStore((state) => state.initialize);

  // Initialize app on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="overflow-x-hidden w-full">
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/pos" element={<RequireAuth><POSPage /></RequireAuth>} />
          <Route path="/payment" element={<RequireAuth><PaymentPage /></RequireAuth>} />
          <Route path="/add-product" element={<RequireAuth><AddProductPage /></RequireAuth>} />
          <Route path="/add-product/:id" element={<RequireAuth><AddProductPage /></RequireAuth>} />
          <Route path="/import-products" element={<RequireAuth><ImportProductsPage /></RequireAuth>} />
          <Route path="/products-management" element={<RequireAuth><ProductsManagementPage /></RequireAuth>} />
          <Route path="/store-settings" element={<RequireAuth><StoreSettingsPage /></RequireAuth>} />
          <Route path="/create-store" element={<RequireAuth><CreateStorePage /></RequireAuth>} />
          <Route path="/app-settings" element={<RequireAuth><AppSettingsPage /></RequireAuth>} />
          <Route path="/analytics" element={<RequireAuth><AnalyticsPage /></RequireAuth>} />
          <Route path="/transaction-history" element={<RequireAuth><TransactionHistoryPage /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <BottomNav />
        <InstallPrompt />
      </Router>
    </div>
  );
}

export default App;