import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { InventoryProvider } from './context/InventoryContext';
import POSPage from './pages/POSPage';
import PaymentPage from './pages/PaymentPage';
import AddProductPage from './pages/AddProductPage';
import './App.css';

function App() {
  return (
    <InventoryProvider>
      <Router>
        <Routes>
          <Route path="/" element={<POSPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/add-product" element={<AddProductPage />} />
        </Routes>
      </Router>
    </InventoryProvider>
  );
}

export default App;
