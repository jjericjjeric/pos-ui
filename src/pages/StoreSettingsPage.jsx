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
  const userStores = useAppStore((state) => state.userStores);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get current store's role
  const currentStoreRole = currentStore 
    ? userStores.find(s => s.id === currentStore.id)?.role 
    : null;
  
  // Check if user can edit (Owner or Admin only)
  const canEdit = currentStoreRole === 'Owner' || currentStoreRole === 'Admin';
  
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
    
    try {
      await updateStore(currentStore.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        is_active: formData.isActive
      });
      
      addToast('Store settings updated successfully', 'success');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm shadow-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back</span>
          </button>
          
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Store Settings
          </h1>
          
          <div className="w-16"></div> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Store Info Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {currentStore.name}
              </h2>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  currentStore.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {currentStore.is_active ? '✓ Active' : 'Inactive'}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {currentStoreRole || 'Staff'}
                </span>
              </div>
            </div>
            <div className="text-4xl">🏪</div>
          </div>
          
          {!canEdit && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-1">
                    Read-Only Access
                  </h3>
                  <p className="text-sm text-yellow-800">
                    You need Owner or Admin role to modify store settings. 
                    Contact the store owner to request permission changes.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Store Information
          </h3>
          
          <div className="space-y-6">
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
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
                  errors.description 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 bg-white'
                } ${
                  !canEdit ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.description ? (
                  <p className="text-sm text-red-600">{errors.description}</p>
                ) : (
                  <p className="text-xs text-gray-500">
                    {formData.description.length}/500 characters
                  </p>
                )}
              </div>
            </div>

            {/* Active Status Toggle */}
            <div className="border-t pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                    <span>⚡</span>
                    <span>Store Status</span>
                  </label>
                  <p className="text-sm text-gray-600">
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
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
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
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      formData.isActive ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-all"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting || !canEdit}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-all ${
                isSubmitting || !canEdit
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-95 shadow-lg hover:shadow-xl'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>

        {/* Store ID (for reference) */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Store ID</h3>
          <p className="text-xs text-gray-500 font-mono bg-gray-50 px-3 py-2 rounded border border-gray-200">
            {currentStore.id}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Use this ID for API integration and technical support
          </p>
        </div>
      </main>
    </div>
  );
};

export default StoreSettingsPage;
