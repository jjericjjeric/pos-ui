import { useNavigate, useLocation } from 'react-router-dom';
import useAppStore from '../store/useAppStore';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const cart = useAppStore((state) => state.cart);
  const user = useAppStore((state) => state.user);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Don't show bottom nav on login/register pages
  if (location.pathname === '/' || location.pathname === '/register') {
    return null;
  }

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: '🏠',
      path: '/pos',
      show: true
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: '📦',
      path: '/products-management',
      show: true // Show to all users
    },
    {
      id: 'history',
      label: 'History',
      icon: '📊',
      path: '/transaction-history',
      show: true // Show to all users
    }
  ];

  const activeItems = navItems.filter(item => item.show);

  const isActive = (path) => {
    if (path === '/pos') {
      return location.pathname === '/pos' || location.pathname === '/payment';
    }
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-screen-xl mx-auto">
        {activeItems.map((item) => {
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
                active 
                  ? 'text-[#00C853]' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-label={item.label}
            >
              <span className="text-2xl mb-0.5">{item.icon}</span>
              <span className={`text-[10px] font-medium ${active ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
              
              {/* Active indicator */}
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#00C853] rounded-b-full" />
              )}
              
              {/* Cart badge for Home */}
              {item.id === 'home' && cartItemCount > 0 && (
                <span className="absolute top-2 right-[calc(50%-16px)] bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center font-bold">
                  {cartItemCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
