import { useState, useRef } from 'react';

/**
 * useToast Hook
 * 
 * Manages toast notifications with auto-incrementing IDs
 * Provides add and remove functionality for toast messages
 * 
 * @returns {Object} Toast state and management functions
 * 
 * @example
 * const { toasts, addToast, removeToast } = useToast();
 * 
 * // Add a success toast
 * addToast('Product saved!', 'success');
 * 
 * // Add an error toast
 * addToast('Failed to save', 'error');
 * 
 * // Add a toast with undo action
 * addToast(
 *   'Product deleted',
 *   'success',
 *   5000,
 *   handleUndo,
 *   'Undo'
 * );
 */
export const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const toastIdCounter = useRef(0);

  /**
   * Add a new toast notification
   * @param {string} message - Toast message to display
   * @param {string} type - Toast type: 'success' | 'error' | 'info' | 'warning'
   * @param {number} duration - Auto-dismiss duration in milliseconds (default: 3000)
   * @param {Function} onUndo - Optional undo callback function
   * @param {string} undoLabel - Label for undo button (default: 'Undo')
   */
  const addToast = (message, type = 'success', duration = 3000, onUndo = null, undoLabel = 'Undo') => {
    const id = toastIdCounter.current++;
    setToasts(prev => [...prev, { id, message, type, duration, onUndo, undoLabel }]);
  };

  /**
   * Remove a toast by ID
   * @param {number} id - Toast ID to remove
   */
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  /**
   * Clear all toasts
   */
  const clearToasts = () => {
    setToasts([]);
  };

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts
  };
};
