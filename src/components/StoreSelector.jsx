import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useStore } from '../context/useStore';
import { useClickOutside } from '../hooks/useClickOutside';

const StoreSelector = ({ className = '' }) => {
  const { currentStore, userStores, switchStore, loading } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  const handleStoreChange = async (storeId) => {
    if (storeId === currentStore?.id) {
      setIsOpen(false);
      return;
    }

    try {
      await switchStore(storeId);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch store:', error);
      alert('Failed to switch store. Please try again.');
    }
  };

  if (!currentStore || userStores.length === 0) {
    return null;
  }

  // Only show selector if user has multiple stores
  if (userStores.length === 1) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg ${className}`}>
        <span className="text-sm md:text-base">🏪</span>
        <span className="text-sm md:text-base font-medium text-white truncate max-w-[150px] md:max-w-none">
          {currentStore.name}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors min-w-[180px] md:min-w-[200px]"
      >
        <span className="text-sm md:text-base">🏪</span>
        <div className="flex-1 text-left">
          <div className="text-xs text-white/70">Current Store</div>
          <div className="text-sm md:text-base font-medium text-white truncate">
            {currentStore.name}
          </div>
        </div>
        <span className="text-white text-sm">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-[9999] max-h-[400px] overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-500 uppercase px-2 py-1">
              Your Stores ({userStores.length})
            </div>
            {userStores.map((store) => (
              <button
                key={store.id}
                onClick={() => handleStoreChange(store.id)}
                className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors ${
                  store.id === currentStore.id
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{store.name}</div>
                    {store.address && (
                      <div className="text-xs text-gray-500 truncate">
                        {store.address}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      Role: <span className="font-medium">{store.role}</span>
                    </div>
                  </div>
                  {store.id === currentStore.id && (
                    <span className="text-primary ml-2">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

StoreSelector.propTypes = {
  className: PropTypes.string,
};

export default StoreSelector;
