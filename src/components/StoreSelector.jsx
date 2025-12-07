import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import useAppStore from '../store/useAppStore';
import { useClickOutside } from '../hooks/useClickOutside';

const StoreSelector = ({ className = '', variant = 'dark' }) => {
  const navigate = useNavigate();
  const currentStore = useAppStore((state) => state.currentStore);
  const userStores = useAppStore((state) => state.userStores);
  const switchStore = useAppStore((state) => state.switchStore);
  const updateStore = useAppStore((state) => state.updateStore);
  const loading = useAppStore((state) => state.storesLoading);
  const [isOpen, setIsOpen] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState(null);
  const [editName, setEditName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const dropdownRef = useRef(null);

  useClickOutside(dropdownRef, () => {
    setIsOpen(false);
    setEditingStoreId(null);
  });

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

  const handleEditClick = (store, e) => {
    e.stopPropagation();
    setEditingStoreId(store.id);
    setEditName(store.name);
  };

  const handleSaveEdit = async (storeId, e) => {
    e.stopPropagation();
    
    if (!editName.trim()) {
      alert('Store name cannot be empty');
      return;
    }

    if (editName.trim() === userStores.find(s => s.id === storeId)?.name) {
      setEditingStoreId(null);
      return;
    }

    try {
      setIsUpdating(true);
      await updateStore(storeId, { name: editName.trim() });
      setEditingStoreId(null);
      setIsUpdating(false);
    } catch (error) {
      console.error('Failed to update store name:', error);
      alert('Failed to update store name. Please try again.');
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditingStoreId(null);
    setEditName('');
  };

  if (!currentStore || userStores.length === 0) {
    return null;
  }

  // Styling based on variant (dark for purple bg, light for white bg)
  const bgClass = variant === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-primary/10 hover:bg-primary/20 border border-primary/30';
  const textClass = variant === 'dark' ? 'text-white' : 'text-gray-800';
  const subTextClass = variant === 'dark' ? 'text-white/70' : 'text-gray-600';

  // Show dropdown button even with single store (for editing capability)
  const showAsButton = true; // Always show as button for consistency

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => {
          console.log('StoreSelector clicked, current isOpen:', isOpen, 'stores:', userStores.length);
          setIsOpen(!isOpen);
        }}
        disabled={loading}
        className={`flex items-center gap-2 px-3 py-2 ${bgClass} rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95`}
        type="button"
      >
        <span className="text-sm md:text-base">🏪</span>
        <span className={`text-sm md:text-base font-medium ${textClass} truncate`}>
          {currentStore.name}
        </span>
        <span className={`${textClass} text-sm ml-1`}>▼</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-[9999] max-h-[calc(100vh-120px)] overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-500 uppercase px-2 py-1 mb-1">
              Your Stores ({userStores.length})
            </div>
            {userStores.map((store) => (
              <div
                key={store.id}
                className={`rounded-md mb-1 ${
                  store.id === currentStore.id
                    ? 'bg-primary/10'
                    : ''
                }`}
              >
                {editingStoreId === store.id ? (
                  // Edit mode
                  <div className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(store.id, e);
                        if (e.key === 'Escape') handleCancelEdit(e);
                      }}
                      className="w-full px-2 py-1 border border-primary rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      autoFocus
                      disabled={isUpdating}
                    />
                    <div className="flex gap-1 mt-2">
                      <button
                        onClick={(e) => handleSaveEdit(store.id, e)}
                        disabled={isUpdating}
                        className="flex-1 px-2 py-1 bg-[#00C853] text-white rounded text-xs hover:bg-[#00B548] disabled:opacity-50 border border-[#00C853]"
                      >
                        {isUpdating ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={isUpdating}
                        className="flex-1 px-2 py-1 bg-white text-gray-700 rounded text-xs hover:bg-gray-50 disabled:opacity-50 border border-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="flex items-center justify-between group">
                    <button
                      onClick={() => handleStoreChange(store.id)}
                      className={`flex-1 text-left px-3 py-2 hover:bg-gray-100 transition-colors rounded-md ${
                        store.id === currentStore.id
                          ? 'text-primary font-semibold'
                          : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 mr-2">
                          <div className="font-medium">{store.name}</div>
                          {store.address && (
                            <div className="text-xs text-gray-500 truncate">
                              {store.address}
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            Role: <span className="font-medium">{store.role ? store.role.charAt(0).toUpperCase() + store.role.slice(1) : 'Unknown'}</span>
                          </div>
                        </div>
                        {store.id === currentStore.id && (
                          <span className="text-primary">✓</span>
                        )}
                      </div>
                    </button>
                    {/* Edit button - show only for Owner/Admin */}
                    {(store.role === 'owner' || store.role === 'admin') && (
                      <button
                        onClick={(e) => handleEditClick(store, e)}
                        className="px-2 py-1 text-gray-400 hover:text-primary hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Rename store"
                      >
                        ✏️
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {/* Create New Store Button */}
            <div className="border-t border-gray-200 pt-2 mt-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/create-store');
                }}
                className="w-full px-3 py-2.5 bg-[#00C853] text-white rounded-md font-medium hover:bg-[#00B548] transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <span className="text-lg">+</span>
                <span>Create New Store</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

StoreSelector.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf(['dark', 'light']),
};

export default StoreSelector;
