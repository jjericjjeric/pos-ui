import { useState, useEffect, useRef } from 'react';
import Modal from '../components/Modal';
import { useNavigate, useLocation } from 'react-router-dom';
import { useInventory } from '../context/useInventory';

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
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2] p-8 md:p-6 sm:p-4">
      <div className="bg-white rounded-2xl p-8 md:p-7 sm:p-6 max-w-[600px] w-full shadow-[0_10px_40px_rgba(0,0,0,0.2)] max-h-[90vh] sm:max-h-[95vh] overflow-y-auto">
        <h1 className="m-0 mb-6 md:mb-4 sm:mb-4 text-gray-800 text-3xl md:text-2xl sm:text-xl text-center border-b-[3px] border-[#667eea] pb-3">Payment</h1>
        
        <div className="mb-8 md:mb-6 sm:mb-6">
          <h2 className="m-0 mb-4 md:mb-3 sm:mb-3 text-gray-800 text-xl md:text-lg sm:text-base">Order Summary</h2>
          <div ref={orderItemsRef} className="max-h-[300px] md:max-h-[200px] sm:max-h-[180px] overflow-y-auto mb-4 border border-gray-200 rounded-lg p-2">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center p-3 sm:p-2.5 border-b border-gray-100 last:border-b-0">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-gray-800 md:text-sm sm:text-sm">{item.name}</span>
                  <span className="text-sm md:text-xs sm:text-xs text-gray-600">x{item.quantity}</span>
                </div>
                <span className="font-bold text-[#667eea] text-lg md:text-base sm:text-base">
                  ₱{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          
          <div className="text-right text-2xl md:text-xl sm:text-lg text-gray-800 p-4 md:p-3 sm:p-3 bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white rounded-lg font-bold">
            Total: ₱{totalPrice.toFixed(2)}
          </div>
        </div>

        <div className="mb-8 md:mb-6 sm:mb-6">
          <div className="mb-6 md:mb-5 sm:mb-5">
            <label htmlFor="amountPaid" className="block mb-2 font-semibold text-gray-800 text-lg md:text-base sm:text-base">Amount Paid:</label>
            <input
              id="amountPaid"
              type="number"
              step="0.01"
              min="0"
              value={amountPaid}
              onChange={handleAmountChange}
              placeholder="0.00"
              className={`w-full px-3 py-3 md:py-2.5 sm:py-2.5 text-xl md:text-lg sm:text-base border-2 ${error ? 'border-red-500' : 'border-gray-200'} rounded-lg transition-colors focus:outline-none focus:border-[#667eea]`}
            />
            {error && <span className="block text-red-500 text-sm mt-2">{error}</span>}
          </div>
        </div>

        <div className="flex gap-4 md:gap-3 sm:gap-3 sm:flex-col">
          <button className="flex-1 px-4 py-4 md:py-3.5 sm:py-3.5 text-lg md:text-base sm:text-base font-semibold border-none rounded-lg cursor-pointer transition-all bg-gray-200 text-gray-800 hover:bg-gray-300 hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(0,0,0,0.2)]" onClick={handleCancel}>
            Cancel
          </button>
          <button
            className="flex-1 px-4 py-4 md:py-3.5 sm:py-3.5 text-lg md:text-base sm:text-base font-semibold border-none rounded-lg cursor-pointer transition-all bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white shadow-[0_4px_15px_rgba(102,126,234,0.4)] hover:enabled:-translate-y-0.5 hover:enabled:shadow-[0_6px_20px_rgba(102,126,234,0.6)] disabled:opacity-50 disabled:cursor-not-allowed active:enabled:translate-y-0"
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
            className="px-4 py-2.5 sm:py-2 sm:px-3.5 border-none rounded-lg cursor-pointer font-semibold bg-gray-200 text-gray-800 sm:text-sm"
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
      <div className="flex justify-center mb-4">
        <div className="w-18 h-18 md:w-16 md:h-16 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-green-500 to-green-400 relative shadow-[0_8px_24px_rgba(0,200,83,0.35)] animate-pop-in">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[2.4rem] md:text-[2.2rem] sm:text-[2rem] text-white animate-fade-in-check">✓</div>
        </div>
      </div>
      <p className="text-center sm:text-sm">Transaction successful.</p>
      <p className="sm:text-sm"><strong>Change:</strong> ₱{finalChange.toFixed(2)}</p>
    </Modal>
    </>
  );
};

export default PaymentPage;
