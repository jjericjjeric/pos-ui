import { useEffect } from 'react';

/**
 * useClickOutside Hook
 * 
 * Detects clicks outside a referenced element and triggers a callback
 * Useful for closing dropdowns, menus, and modals
 * 
 * @param {React.RefObject} ref - Ref to the element to detect outside clicks
 * @param {Function} handler - Callback function to execute on outside click
 * @param {boolean} enabled - Whether the listener is active (default: true)
 * 
 * @example
 * const menuRef = useRef(null);
 * useClickOutside(menuRef, () => setShowMenu(false), showMenu);
 * 
 * return (
 *   <div ref={menuRef}>
 *     <button onClick={() => setShowMenu(true)}>Menu</button>
 *     {showMenu && <div>Menu content</div>}
 *   </div>
 * );
 */
export const useClickOutside = (ref, handler, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        handler(event);
      }
    };

    // Use mousedown instead of click for better UX
    // (prevents clicks that started inside from closing)
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, handler, enabled]);
};
