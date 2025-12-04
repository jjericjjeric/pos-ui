import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import { useFormValidation } from '../hooks/useFormValidation';
import { useToast } from '../hooks/useToast';
import FormField from '../components/FormField';

const StoreSettingsPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  // Zustand store selectors
  const currentStore = useAppStore((state) => state.currentStore);
  const user = useAppStore((state) => state.user);
  const updateStore = useAppStore((state) => state.updateStore);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Get current store's role (role is directly on the store object)
  const currentStoreRole = currentStore?.role || null;
  
  // Check if user can edit (Owner or Admin only)
  // Note: Backend returns lowercase roles: "owner", "admin", "manager", "staff"
  const canEdit = currentStoreRole === 'owner' || currentStoreRole === 'admin';
  
  // Form validation
  const {
    values: formData,
    errors,
    handleChange,
    handleBlur,
    validate,
    setFormValues
  } = useFormValidation(
    {
      name: '',
      description: '',
      isActive: true
    },
    (values) => {
      const newErrors = {};
      
      if (!values.name.trim()) {
        newErrors.name = 'Store name is required';
      } else if (values.name.length < 2) {
        newErrors.name = 'Store name must be at least 2 characters';
      } else if (values.name.length > 100) {
        newErrors.name = 'Store name must not exceed 100 characters';
      }
      
      if (values.description && values.description.length > 500) {
        newErrors.description = 'Description must not exceed 500 characters';
      }
      
      return newErrors;
    }
  );

  // Load current store data into form
  useEffect(() => {
    if (currentStore) {
      setFormValues({
        name: currentStore.name || '',
        description: currentStore.description || '',
        isActive: currentStore.is_active !== false // Default to true if undefined
      });
    }
  }, [currentStore, setFormValues]);

  // Redirect if no current store
  useEffect(() => {
    if (!currentStore) {
      addToast('Please select a store first', 'error');
      navigate('/pos');
    }
  }, [currentStore, navigate, addToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!canEdit) {
      addToast('You do not have permission to edit this store', 'error');
      return;
    }
    
    if (!validate()) {
      return;
    }
    
    setIsSubmitting(true);
    setSaveSuccess(false);
    
    try {
      await updateStore(currentStore.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        is_active: formData.isActive
      });
      
      setSaveSuccess(true);
      addToast('Store settings updated successfully', 'success');
      
      // Reset success indicator after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating store:', error);
      addToast(error.message || 'Failed to update store settings', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1); // Go back to previous page
  };

  if (!currentStore) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex flex-col">
      {/* Compact Header */}
      <div className="bg-white/95 px-2 sm:px-3 py-1.5 sm:py-2 shadow-md z-50">
        <div className="flex items-center gap-2">
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-all active:bg-gray-200 min-w-11 min-h-11 flex items-center justify-center"
            aria-label="Go back"
          >
            <span className="text-xl sm:text-2xl text-gray-700">←</span>
          </button>
          <h1 className="m-0 text-sm sm:text-base md:text-lg font-bold text-gray-800 flex-1">
            Store Settings
          </h1>
          <div className="w-11"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-2 sm:p-3 overflow-auto">
        <div className="max-w-2xl mx-auto h-full flex flex-col">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden flex-1 flex flex-col">
            {/* Store Info Header */}
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                    {currentStore.name}
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                      currentStore.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {currentStore.is_active ? '✓ Active' : 'Inactive'}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-800">
                      {currentStoreRole ? currentStoreRole.charAt(0).toUpperCase() + currentStoreRole.slice(1) : 'Staff'}
                    </span>
                  </div>
                </div>
                <div className="text-3xl sm:text-4xl">🏪</div>
              </div>
              
              {!canEdit && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl sm:text-2xl">⚠️</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-yellow-900 mb-1 text-sm sm:text-base">
                        Read-Only Access
                      </h3>
                      <p className="text-xs sm:text-sm text-yellow-800">
                        You need Owner or Admin role to modify store settings. 
                        Contact the store owner to request permission changes.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Settings Form */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6 flex-1 flex flex-col overflow-y-auto">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                Store Information
              </h3>
              
              {/* Store Name */}
              <FormField
                label="Store Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.name}
                placeholder="e.g., My Awesome Store"
                required
                disabled={!canEdit}
                icon="🏪"
              />

              {/* Description */}
              <div>
                <label htmlFor="description" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <span>📝</span>
                  <span>Description</span>
                  <span className="text-gray-400 font-normal text-xs">
                    (Optional)
                  </span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={!canEdit}
                  placeholder="Brief description of your store..."
                  rows={4}
                  maxLength={500}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none text-sm sm:text-base ${
                    errors.description 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300 bg-white'
                  } ${
                    !canEdit ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.description ? (
                    <p className="text-xs sm:text-sm text-red-600">{errors.description}</p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      {formData.description.length}/500 characters
                    </p>
                  )}
                </div>
              </div>

              {/* Active Status Toggle */}
              <div className="border-t pt-4 sm:pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                      <span>⚡</span>
                      <span>Store Status</span>
                    </label>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {formData.isActive 
                        ? 'Store is currently active and visible to staff' 
                        : 'Store is currently inactive and hidden from operations'
                      }
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      if (canEdit) {
                        handleChange({
                          target: {
                            name: 'isActive',
                            value: !formData.isActive
                          }
                        });
                      }
                    }}
                    disabled={!canEdit}
                    className={`relative inline-flex h-7 w-12 sm:h-8 sm:w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                      formData.isActive 
                        ? 'bg-green-500' 
                        : 'bg-gray-300'
                    } ${
                      !canEdit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    role="switch"
                    aria-checked={formData.isActive}
                  >
                    <span
                      className={`inline-block h-5 w-5 sm:h-6 sm:w-6 transform rounded-full bg-white transition-transform ${
                        formData.isActive ? 'translate-x-6 sm:translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Spacer to push buttons to bottom */}
              <div className="flex-1"></div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 sm:pt-6 border-t">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-all text-sm sm:text-base"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting || !canEdit}
                  className={`flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-all text-sm sm:text-base relative overflow-hidden ${
                    isSubmitting || !canEdit
                      ? 'bg-gray-400 cursor-not-allowed'
                      : saveSuccess
                      ? 'bg-green-500'
                      : 'bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg active:scale-95'
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </span>
                  ) : saveSuccess ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                      Saved!
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>

            {/* Store ID (for reference) */}
            <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Store ID</h3>
              <p className="text-xs font-mono bg-white px-3 py-2 rounded border border-gray-200 break-all">
                {currentStore.id}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Use this ID for API integration and technical support
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreSettingsPage;
