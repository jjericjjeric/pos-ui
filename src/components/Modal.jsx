import './Modal.css';
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
    <div className={`modal-overlay ${closing ? 'closing' : ''}`} onClick={handleOverlayClick}>
      <div className={`modal-container ${closing ? 'closing' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <h3 id="modal-title">{title}</h3>
          <button className="modal-close" aria-label="Close" onClick={requestClose}>×</button>
        </div>
        <div className="modal-content">
          {children}
        </div>
        {actions && (
          <div className="modal-actions">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
