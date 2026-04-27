import { useState, useEffect } from 'react';
import { getStoreUsers, addStoreUser, removeStoreUser, searchUserByEmail } from '../services/api';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from './Toast';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';

const UserManagementSection = ({ storeId, currentUserRole }) => {
  const { toasts, addToast, removeToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, user: null });

  // Form state for adding users
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [newUserRole, setNewUserRole] = useState('staff');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if current user can manage users (owner or admin)
  const canManageUsers = currentUserRole === 'owner' || currentUserRole === 'admin';

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, [storeId]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getStoreUsers(storeId);
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      addToast('Failed to load store users', 'error');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchEmail = async (e) => {
    e.preventDefault();
    
    if (!searchEmail.trim()) {
      addToast('Please enter an email address', 'error');
      return;
    }

    setIsSearching(true);
    setSearchResult(null);

    try {
      const result = await searchUserByEmail(searchEmail.trim());
      setSearchResult(result);
      
      // Check if user is already in the store
      const existingUser = users.find(u => u.id === result.id);
      if (existingUser) {
        if (existingUser.role === 'owner') {
          addToast(`${result.email} is the store owner. Cannot modify owner role.`, 'error');
          setSearchResult(null);
          return;
        }
        addToast(`${result.email} is already in this store as ${existingUser.role}. You can update their role.`, 'info');
      }
    } catch (error) {
      console.error('Error searching user:', error);
      if (error.message.includes('not found')) {
        addToast('No user found with that email address', 'error');
      } else {
        addToast(error.message || 'Failed to search user', 'error');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!searchResult) {
      addToast('Please search for a user first', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      await addStoreUser(storeId, searchResult.id, newUserRole);
      addToast('User added successfully', 'success');
      
      // Reset form and close modal
      setSearchEmail('');
      setSearchResult(null);
      setNewUserRole('staff');
      setShowAddModal(false);
      
      // Reload users list
      await loadUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      addToast(error.message || 'Failed to add user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveUser = (user) => {
    setDeleteDialog({ isOpen: true, user });
  };

  const confirmRemoveUser = async () => {
    if (!deleteDialog.user) return;

    try {
      await removeStoreUser(storeId, deleteDialog.user.id);
      addToast('User removed successfully', 'success');
      
      // Close dialog
      setDeleteDialog({ isOpen: false, user: null });
      
      // Reload users list
      await loadUsers();
    } catch (error) {
      console.error('Error removing user:', error);
      addToast(error.message || 'Failed to remove user', 'error');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'owner':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'admin':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'manager':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'staff':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case 'owner':
        return '👑';
      case 'admin':
        return '⚡';
      case 'manager':
        return '📊';
      case 'staff':
        return '👤';
      default:
        return '👤';
    }
  };

  if (!canManageUsers) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <h3 className="font-semibold text-yellow-800 mb-1">
              Access Restricted
            </h3>
            <p className="text-sm text-yellow-700">
              You need Owner or Admin role to manage store users.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Store Team</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#00C853] text-white rounded-lg font-semibold hover:bg-[#00B548] transition-all text-sm flex items-center gap-2"
        >
          <span>➕</span>
          <span>Add User</span>
        </button>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00C853]"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <span className="text-4xl mb-2 block">👥</span>
          <p className="text-gray-600">No users in this store yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <span className="text-3xl">{getRoleIcon(user.role)}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">
                    {user.username}
                  </h4>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border mt-1 ${getRoleBadgeColor(user.role)}`}>
                    {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                  </span>
                </div>
              </div>

              {/* Remove button - don't allow removing owner */}
              {user.role?.toLowerCase() !== 'owner' && (
                <button
                  onClick={() => handleRemoveUser(user)}
                  className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add User Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          if (!isSubmitting && !isSearching) {
            setShowAddModal(false);
            setSearchEmail('');
            setSearchResult(null);
          }
        }}
        title="Add User to Store"
      >
        <form onSubmit={searchResult ? handleAddUser : handleSearchEmail} className="space-y-4">
          {/* Search Step */}
          {!searchResult && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Search User by Email
                </label>
                <input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20"
                  disabled={isSearching}
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isSearching}
              >
                {isSearching ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <span>🔍</span>
                    <span>Search User</span>
                  </>
                )}
              </button>
            </>
          )}

          {/* Search Result & Role Selection */}
          {searchResult && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">✅</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{searchResult.email}</h4>
                    {searchResult.nickname && (
                      <p className="text-sm text-gray-600">Nickname: {searchResult.nickname}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">User ID: {searchResult.id}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchResult(null);
                      setSearchEmail('');
                    }}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                    disabled={isSubmitting}
                  >
                    Change
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Assign Role
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20"
                  disabled={isSubmitting}
                >
                  <option value="staff">Staff - Process sales only</option>
                  <option value="manager">Manager - Manage products & view reports</option>
                  <option value="admin">Admin - Manage users & all settings</option>
                  {currentUserRole === 'owner' && (
                    <option value="owner">Owner - Full access</option>
                  )}
                </select>
              </div>

              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 text-lg">ℹ️</span>
                  <div className="text-xs text-blue-700">
                    <p className="font-medium mb-1">Role Permissions:</p>
                    <ul className="space-y-0.5 ml-3 list-disc">
                      <li><strong>Staff:</strong> Process sales, view products</li>
                      <li><strong>Manager:</strong> + Manage inventory</li>
                      <li><strong>Admin:</strong> + Manage users, settings</li>
                      <li><strong>Owner:</strong> + Delete store, all permissions</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearchResult(null);
                    setSearchEmail('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                  disabled={isSubmitting}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#00C853] text-white rounded-lg font-semibold hover:bg-[#00B548] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </>
          )}
        </form>
      </Modal>

      {/* Remove User Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, user: null })}
        title="Remove User?"
        message={`Are you sure you want to remove ${deleteDialog.user?.username} from this store? They will lose access to all store data.`}
        confirmText="Remove User"
        cancelText="Cancel"
        onConfirm={confirmRemoveUser}
        variant="danger"
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default UserManagementSection;
