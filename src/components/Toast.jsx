import { useEffect, useState } from 'react';

/**
 * Toast Component - Mobile-First Design
 * Shows notifications with auto-dismiss and optional undo action
 * Optimized for touch interactions on mobile devices
 */
const Toast = ({ message, type = 'success', duration = 3000, onClose, onUndo, undoLabel = 'Undo' }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (duration && duration > 0) {
      // Progress bar animation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (duration / 50));
          return newProgress > 0 ? newProgress : 0;
        });
      }, 50);

      // Auto-close timer
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => {
        clearInterval(progressInterval);
        clearTimeout(timer);
      };
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose && onClose();
    }, 300);
  };

  const handleUndo = () => {
    onUndo && onUndo();
    handleClose();
  };

  const bgColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-orange-500',
  };

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };

  return (
    <div
      className={`fixed bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:bottom-6 z-[9999] max-w-md ${
        isExiting ? 'animate-toast-out' : 'animate-toast-in'
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className={`${bgColors[type]} text-white rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.3)] overflow-hidden`}>
        {/* Mobile-first: Larger touch targets */}
        <div className="flex items-center gap-2 sm:gap-3 px-3 py-3 sm:px-4 sm:py-3">
          <span className="text-xl sm:text-2xl font-bold flex-shrink-0" aria-hidden="true">
            {icons[type]}
          </span>
          <span className="flex-1 text-sm sm:text-sm font-medium break-words">
            {message}
          </span>
          {onUndo && (
            <button
              onClick={handleUndo}
              className="px-3 py-1.5 sm:px-3 sm:py-1 bg-white/20 hover:bg-white/30 active:bg-white/40 rounded text-xs font-semibold transition-colors min-h-[44px] sm:min-h-[36px] flex items-center"
              aria-label={undoLabel}
            >
              {undoLabel}
            </button>
          )}
          <button
            onClick={handleClose}
            className="text-2xl sm:text-xl leading-none hover:opacity-80 active:opacity-60 transition-opacity p-2 -m-2 min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
        {/* Progress bar */}
        {duration && duration > 0 && (
          <div className="h-1 bg-black/20">
            <div
              className="h-full bg-white/40 transition-all duration-50 ease-linear"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * ToastContainer - Manages multiple toast notifications
 * Stacks toasts vertically for better mobile experience
 */
export const ToastContainer = ({ toasts, removeToast }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:bottom-6 z-[9999] flex flex-col gap-2 sm:gap-3 max-w-md pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
            onUndo={toast.onUndo}
            undoLabel={toast.undoLabel}
          />
        </div>
      ))}
    </div>
  );
};

export default Toast;
