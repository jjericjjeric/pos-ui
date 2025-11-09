import Modal from './Modal';

/**
 * ConfirmDialog Component - Mobile-First Design
 * Confirmation dialog with product name display and accessible controls
 * Large touch targets for mobile usability
 */
const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action', 
  message, 
  productName,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger' // 'danger' or 'warning'
}) => {
  const handleConfirm = () => {
    onConfirm && onConfirm();
    onClose && onClose();
  };

  // Mobile-first: Larger, more visible buttons
  const confirmButtonClass = variant === 'danger'
    ? 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white min-h-[48px] sm:min-h-[44px]'
    : 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white min-h-[48px] sm:min-h-[44px]';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
    >
      <div className="flex-1 flex flex-col gap-4">
        {/* Message with mobile-optimized text size */}
        <div className="text-gray-700 text-base sm:text-sm">
          {message}
          {productName && (
            <div className="mt-4 p-3 sm:p-3 bg-gray-100 rounded-lg border-l-4 border-red-500">
              <span className="font-semibold text-gray-800 text-base sm:text-sm break-words">
                {productName}
              </span>
            </div>
          )}
        </div>
        
        {/* Mobile-first: Stack buttons vertically on very small screens */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end mt-auto pt-4">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 sm:px-4 sm:py-2 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-colors min-h-[48px] sm:min-h-[44px]"
            aria-label="Cancel action"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`w-full sm:w-auto px-6 py-3 sm:px-4 sm:py-2 rounded-lg font-semibold transition-colors ${confirmButtonClass}`}
            aria-label={`Confirm ${variant === 'danger' ? 'deletion' : 'action'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
