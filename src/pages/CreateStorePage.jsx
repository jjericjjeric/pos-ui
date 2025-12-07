import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import FormField from '../components/FormField';
import { useFormValidation } from '../hooks/useFormValidation';

const CreateStorePage = () => {
  const navigate = useNavigate();
  const createStore = useAppStore((state) => state.createStore);
  const user = useAppStore((state) => state.user);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdStore, setCreatedStore] = useState(null);

  const validationRules = (values) => {
    const errors = {};
    
    if (!values.name || values.name.trim().length < 2) {
      errors.name = 'Store name must be at least 2 characters';
    }
    
    if (values.name && values.name.trim().length > 100) {
      errors.name = 'Store name must not exceed 100 characters';
    }
    
    if (values.description && values.description.trim().length > 500) {
      errors.description = 'Description must not exceed 500 characters';
    }
    
    return errors;
  };

  const {
    values: formData,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate: validateForm,
    resetForm
  } = useFormValidation(
    {
      name: '',
      description: '',
      location: ''
    },
    validationRules
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const storeData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        location: formData.location.trim() || undefined,
        is_active: true
      };

      const newStore = await createStore(storeData);
      
      setCreatedStore(newStore);
      setShowSuccessModal(true);
      resetForm();
    } catch (error) {
      console.error('Failed to create store:', error);
      alert(error.message || 'Failed to create store. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Go back to previous page, or POS page if no history
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/pos');
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    // After successful creation, go to POS page to use the new store
    navigate('/pos');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-2 sm:px-3 py-2.5 sm:py-3 border-b border-gray-200 z-50">
        <div className="flex items-center gap-2">
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-50 rounded-lg transition-colors min-w-11 min-h-11 flex items-center justify-center"
            aria-label="Go back"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
            🏪 Create New Store
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-2 sm:p-3 overflow-auto pb-20">
        <div className="max-w-2xl mx-auto h-full flex flex-col">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex-1 flex flex-col">
            {/* Info Banner */}
            <div className="bg-blue-50 border-b border-blue-200 p-3 sm:p-4">
              <div className="flex items-start gap-2">
                <span className="text-lg flex-shrink-0">ℹ️</span>
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Create a new store</p>
                  <p className="text-xs">You'll be automatically assigned as the Owner of this store. You can switch between your stores anytime using the Store Selector.</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-3 sm:p-4 md:p-5 space-y-3 sm:space-y-4 flex-1 flex flex-col overflow-y-auto">
              {/* Store Name */}
              <FormField
                label="Store Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.name}
                required
                placeholder="e.g., Downtown Branch, Main Store"
              />

              {/* Description */}
              <div className="space-y-1 sm:space-y-1.5">
                <label htmlFor="description" className="block text-xs sm:text-sm font-semibold text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Brief description of your store (optional)"
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20 resize-none"
                />
                {errors.description && touched.description && (
                  <p className="text-red-500 text-xs mt-1">{errors.description}</p>
                )}
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                  {formData.description.length}/500 characters
                </p>
              </div>

              {/* Location (Optional) */}
              <FormField
                label="Location (Optional)"
                name="location"
                value={formData.location}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.location}
                placeholder="e.g., 123 Main St, City"
              />

              {/* Action Buttons */}
              <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-3 mt-auto">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-gray-700 rounded-lg text-sm sm:text-base font-semibold transition-all hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 hover:border-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#00C853] text-white rounded-lg text-sm sm:text-base font-bold transition-all hover:bg-[#00B548] active:bg-[#009E42] disabled:opacity-50 disabled:cursor-not-allowed border border-[#00C853] flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      <span>Create Store</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Helper Text */}
          <div className="mt-2 sm:mt-3 text-center flex-shrink-0">
            <p className="text-xs sm:text-sm text-gray-600">
              Fields marked with <span className="text-red-500">*</span> are required
            </p>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && createdStore && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4"
          onClick={handleSuccessClose}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-[scale-in_0.3s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success Icon */}
            <div className="bg-[#00C853] p-8 text-center">
              <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
                <span className="text-5xl text-[#00C853]">✓</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Store Created!</h2>
              <p className="text-white/90 text-sm">
                Your new store has been successfully created
              </p>
            </div>

            {/* Store Details */}
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-center">
                <div className="text-4xl mb-3">🏪</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{createdStore.name}</h3>
                {createdStore.description && (
                  <p className="text-sm text-gray-600 mb-3">{createdStore.description}</p>
                )}
                {createdStore.location && (
                  <p className="text-xs text-gray-500">📍 {createdStore.location}</p>
                )}
                <div className="mt-3 flex items-center justify-center gap-2">
                  <span className="inline-block bg-[#667eea] text-white text-xs px-3 py-1 rounded-full font-semibold uppercase">
                    Owner
                  </span>
                  <span className="inline-block bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-semibold">
                    Active
                  </span>
                </div>
              </div>

              <div className="text-center text-sm text-gray-600">
                <p>You can now switch to this store from the Store Selector</p>
              </div>

              <button
                onClick={handleSuccessClose}
                className="w-full px-6 py-3.5 bg-[#00C853] text-white rounded-lg text-base font-bold transition-all hover:bg-[#00B548] active:bg-[#009E42] border border-[#00C853]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateStorePage;
