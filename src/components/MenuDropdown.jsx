import { useNavigate } from 'react-router-dom';

const MenuDropdown = ({ isOpen, onClose, logoutUser }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/');
    onClose();
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
        <button
          className="w-full text-left px-3 sm:px-4 py-2.5 hover:bg-red-50 transition-colors text-red-600 border-none bg-transparent cursor-pointer text-sm font-semibold"
          onClick={handleLogout}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

export default MenuDropdown;
