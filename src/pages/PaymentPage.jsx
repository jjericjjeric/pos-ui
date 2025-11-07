import { useState, useEffect, useRef } from 'react';
import Modal from '../components/Modal';
import { useNavigate, useLocation } from 'react-router-dom';
import { useInventory } from '../context/useInventory';
import './PaymentPage.css';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { updateInventoryAfterPurchase } = useInventory();
  const cart = location.state?.cart || [];
  const orderItemsRef = useRef(null);

  const [amountPaid, setAmountPaid] = useState('');
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [finalChange, setFinalChange] = useState(0);
  const autoCloseTimer = useRef(null);

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const change = amountPaid ? parseFloat(amountPaid) - totalPrice : 0;

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/pos');
    }
  }, [cart, navigate]);

  // Auto scroll order summary to bottom on mount and when cart updates
  useEffect(() => {
    const el = orderItemsRef.current;
    if (el) {
      // Use requestAnimationFrame to ensure DOM is painted
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, [cart]);

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || (!isNaN(value) && parseFloat(value) >= 0)) {
      setAmountPaid(value);
      setError('');
    }
  };

  const handleCompletePurchase = async () => {
    const paid = parseFloat(amountPaid);
    
    if (!amountPaid || isNaN(paid) || paid < totalPrice) {
      setError('Amount paid must be at least equal to total price');
      return;
    }

    try {
      // Update inventory via API
      await updateInventoryAfterPurchase(cart);

      // Set modal state with change and show
      setFinalChange(paid - totalPrice);
      setShowModal(true);
      // Auto-close after 30 seconds
      if (autoCloseTimer.current) {
        clearTimeout(autoCloseTimer.current);
      }
      autoCloseTimer.current = setTimeout(() => {
        setShowModal(false);
        navigate('/pos');
      }, 30000);
    } catch (error) {
      alert('Error completing purchase: ' + error.message);
    }
  };

  const handleCancel = () => {
    navigate('/pos');
  };

  return (
    <>
    <div className="payment-container">
      <div className="payment-content">
        <h1>Payment</h1>
        
        <div className="order-summary">
          <h2>Order Summary</h2>
          <div className="order-items" ref={orderItemsRef}>
            {cart.map(item => (
              <div key={item.id} className="order-item">
                <div className="order-item-details">
                  <span className="order-item-name">{item.name}</span>
                  <span className="order-item-quantity">x{item.quantity}</span>
                </div>
                <span className="order-item-price">
                  ₱{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          
          <div className="order-total">
            <strong>Total: ₱{totalPrice.toFixed(2)}</strong>
          </div>
        </div>

        <div className="payment-inputs">
          <div className="input-group">
            <label htmlFor="amountPaid">Amount Paid:</label>
            <input
              id="amountPaid"
              type="number"
              step="0.01"
              min="0"
              value={amountPaid}
              onChange={handleAmountChange}
              placeholder="0.00"
              className={error ? 'error' : ''}
            />
            {error && <span className="error-message">{error}</span>}
          </div>
        </div>

        <div className="payment-actions">
          <button className="cancel-btn" onClick={handleCancel}>
            Cancel
          </button>
          <button
            className="complete-btn"
            onClick={handleCompletePurchase}
            disabled={!amountPaid || change < 0}
          >
            Complete Purchase
          </button>
        </div>
      </div>
    </div>

    <Modal
      isOpen={showModal}
      title="Purchase Complete"
      onClose={() => {
        setShowModal(false);
        navigate('/pos');
      }}
      actions={(
        <>
          <button
            className="modal-btn secondary"
            onClick={() => {
              setShowModal(false);
              navigate('/pos');
            }}
          >
            New Sale
          </button>
        </>
      )}
    >
      <div className="success-icon-wrapper">
        <div className="success-icon" />
      </div>
      <p style={{ textAlign: 'center' }}>Transaction successful.</p>
      <p><strong>Change:</strong> ₱{finalChange.toFixed(2)}</p>
    </Modal>
    </>
  );
};

export default PaymentPage;

