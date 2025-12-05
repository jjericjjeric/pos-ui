import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from './ConfirmDialog';

const MenuDropdown = ({ isOpen, onClose, logoutUser, user }) => {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!isOpen) return null;

  const isGuest = user?.role === 'GUEST';

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  const handleLogoutClick = () => {
    if (isGuest) {
      setShowLogoutConfirm(true);
    } else {
      handleLogout();
    }
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/');
    onClose();
    setShowLogoutConfirm(false);
  };

  return (
    <div 
      className="absolute right-0 mt-2 w-44 sm:w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-[9999]"
      onMouseDown={(e) => e.stopPropagation()}
      style={{ position: 'absolute' }}
    >
      <div className="py-2">
        <div className="px-3 sm:px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase">Inventory</div>
        <button
          className="w-full text-left px-3 sm:px-4 py-2.5 hover:bg-gray-100 transition-colors text-gray-700 border-none bg-transparent cursor-pointer text-sm"
          onClick={() => handleNavigation('/add-product')}
        >
          ➕ Add Product
        </button>
        <button
          className="w-full text-left px-3 sm:px-4 py-2.5 hover:bg-gray-100 transition-colors text-gray-700 border-none bg-transparent cursor-pointer text-sm"
          onClick={() => handleNavigation('/products-management')}
        >
          📋 Manage All Products
        </button>
        <div className="border-t border-gray-200 my-1"></div>
        <div className="px-3 sm:px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase">Store</div>
        <button
          className="w-full text-left px-3 sm:px-4 py-2.5 hover:bg-gray-100 transition-colors text-gray-700 border-none bg-transparent cursor-pointer text-sm"
          onClick={() => handleNavigation('/store-settings')}
        >
          ⚙️ Store Settings
        </button>
        <div className="border-t border-gray-200 my-1"></div>
        <button
          className="w-full text-left px-3 sm:px-4 py-2.5 hover:bg-red-50 transition-colors text-red-600 border-none bg-transparent cursor-pointer text-sm font-semibold"
          onClick={handleLogoutClick}
        >
          🚪 Logout
        </button>
      </div>

      {showLogoutConfirm && (
        <ConfirmDialog
          isOpen={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          title="Logout as Guest?"
          message="All your guest data including products and transactions will be permanently deleted. This action cannot be undone."
          confirmText="Logout & Delete Data"
          cancelText="Cancel"
          onConfirm={handleLogout}
          variant="danger"
        />
      )}
    </div>
  );
};

export default MenuDropdown;
