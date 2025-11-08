import { useEffect, useRef, useState } from 'react';

// Supports enter and exit animations. Keeps mounted during exit.
const Modal = ({ isOpen, title, children, actions, onClose }) => {
  const [render, setRender] = useState(isOpen);
  const [closing, setClosing] = useState(false);
  const closeTimeoutRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setRender(true);
      setClosing(false);
    } else if (!isOpen && render) {
      // trigger closing animation
      setClosing(true);
      closeTimeoutRef.current = setTimeout(() => {
        setRender(false);
        setClosing(false);
      }, 180); // match CSS exit duration
    }
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, [isOpen, render]);

  const requestClose = () => {
    onClose && onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      requestClose();
    }
  };

  if (!render) return null;

  return (
    <div className={`fixed inset-0 bg-black/45 flex items-center justify-center z-[1000] p-4 sm:p-2 ${closing ? 'animate-[fadeOverlayOut_180ms_ease-in_forwards]' : ''}`} onClick={handleOverlayClick}>
      <div className={`bg-white rounded-[14px] w-full max-w-[480px] md:max-w-[90%] sm:max-w-[95%] h-[80vh] max-h-[700px] sm:h-[85vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden ${closing ? 'animate-modal-out' : 'animate-modal-in'}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="flex items-center justify-between px-5 sm:px-4 py-4 sm:py-3.5 border-b border-gray-200 flex-shrink-0">
          <h3 id="modal-title" className="m-0 text-xl md:text-lg sm:text-base text-gray-800">{title}</h3>
          <button className="border-none bg-transparent text-2xl md:text-xl sm:text-xl leading-none cursor-pointer text-gray-500 hover:text-gray-700" aria-label="Close" onClick={requestClose}>×</button>
        </div>
        <div className="px-5 sm:px-4 py-5 sm:py-4 text-gray-700 sm:text-sm flex-1 min-h-0 flex flex-col overflow-hidden">
          {children}
        </div>
        {actions && (
          <div className="flex justify-end gap-3 sm:gap-2 px-5 sm:px-4 pb-5 sm:pb-4 pt-4 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
