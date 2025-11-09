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
  const [isProcessing, setIsProcessing] = useState(false);
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

    setIsProcessing(true);

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
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    navigate('/pos');
  };

  return (
    <>
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2] p-2 sm:p-3 md:p-4">
      <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 max-w-[600px] w-full shadow-xl max-h-[95vh] overflow-y-auto">
        <h1 className="m-0 mb-3 sm:mb-4 text-gray-800 text-xl sm:text-2xl text-center border-b-2 border-[#667eea] pb-2">Payment</h1>
        
        <div className="mb-4 sm:mb-5">
          <h2 className="m-0 mb-2 text-gray-800 text-base sm:text-lg border-b-2 border-[#667eea] pb-1.5">Order Summary</h2>
          <div ref={orderItemsRef} className="max-h-[250px] sm:max-h-[220px] overflow-y-auto mb-3 pr-2 -mr-2">
            {cart.length === 0 ? (
              <p className="text-center text-gray-400 p-4 sm:p-6 md:p-8 italic text-sm sm:text-base">No items in cart</p>
            ) : (
              cart.map(item => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-2 sm:p-2.5 md:p-3 mb-1.5 sm:mb-2 border-l-4 border-[#667eea]">
                  <div className="flex justify-between items-start mb-1 sm:mb-1.5 gap-1">
                    <span className="font-semibold text-gray-800 text-sm sm:text-base leading-tight flex-1">{item.name}</span>
                    <span className="text-[#667eea] font-semibold text-xs sm:text-sm whitespace-nowrap">₱{item.price.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 sm:gap-1.5 mb-1 sm:mb-1.5">
                    <span className="min-w-[60px] sm:min-w-[70px] text-sm text-gray-600">Qty: {item.quantity}</span>
                  </div>
                  
                  <div className="text-right font-bold text-gray-800 text-xs sm:text-sm">
                    Total: ₱{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="text-center text-lg sm:text-xl mb-3 sm:mb-4 p-2 sm:p-2.5 md:p-3 bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white rounded-lg font-bold">
            Total: ₱{totalPrice.toFixed(2)}
          </div>
        </div>

        <div className="mb-4 sm:mb-5">
          <div className="mb-3 sm:mb-4">
            <label htmlFor="amountPaid" className="block mb-2 font-semibold text-gray-800 text-sm sm:text-base">Amount Paid:</label>
            <input
              id="amountPaid"
              type="number"
              step="0.01"
              min="0"
              value={amountPaid}
              onChange={handleAmountChange}
              placeholder="0.00"
              className={`w-full px-3 py-3 text-lg sm:text-xl border-2 ${error ? 'border-red-500' : 'border-gray-200'} rounded-lg transition-colors focus:outline-none focus:border-[#667eea]`}
              inputMode="decimal"
            />
            {error && <span className="block text-red-500 text-sm mt-2">{error}</span>}
          </div>
          
          {amountPaid && change >= 0 && (
            <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700 text-sm sm:text-base">Change:</span>
                <span className="font-bold text-green-600 text-lg sm:text-xl">₱{change.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 sm:gap-4 flex-col sm:flex-row">
          <button 
            className="w-full sm:flex-1 px-4 py-3 sm:py-3.5 text-base sm:text-lg font-semibold border-none rounded-xl cursor-pointer transition-all bg-gray-200 text-gray-800 hover:bg-gray-300 hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(0,0,0,0.2)] active:translate-y-0" 
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className="w-full sm:flex-1 px-4 py-3 sm:py-3.5 text-base sm:text-lg font-extrabold border-none rounded-xl cursor-pointer transition-all bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-[0_8px_28px_rgba(255,87,34,0.45)] tracking-wide hover:enabled:-translate-y-0.5 hover:enabled:shadow-[0_12px_32px_rgba(255,87,34,0.55)] disabled:opacity-45 disabled:cursor-not-allowed disabled:shadow-none active:enabled:translate-y-0 active:enabled:shadow-[0_6px_18px_rgba(255,87,34,0.4)]"
            onClick={handleCompletePurchase}
            disabled={!amountPaid || change < 0 || isProcessing}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Complete Purchase'
            )}
          </button>
        </div>
      </div>
    </div>

    <Modal
      isOpen={showModal}
      title=""
      onClose={() => {
        setShowModal(false);
        navigate('/pos');
      }}
      actions={null}
    >
      <div className="flex flex-col items-center justify-center py-4 sm:py-6 md:py-8">
        {/* Success Icon */}
        <div className="mb-6 sm:mb-8">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-green-500 to-green-600 relative shadow-[0_12px_40px_rgba(34,197,94,0.3)] animate-pop-in">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[3rem] sm:text-[3.5rem] text-white font-bold animate-fade-in-check">✓</div>
          </div>
        </div>

        {/* Success Message */}
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">Payment Complete!</h2>
        <p className="text-sm sm:text-base text-gray-500 mb-8 sm:mb-10">Transaction successful</p>

        {/* Change Amount - Center of Attention */}
        <div className="w-full max-w-sm mb-8 sm:mb-10">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 sm:p-8 shadow-[0_4px_20px_rgba(34,197,94,0.15)] border-2 border-green-200">
            <div className="text-center">
              <p className="text-sm sm:text-base font-medium text-gray-600 mb-2 uppercase tracking-wide">Your Change</p>
              <div className="flex items-center justify-center gap-1">
                <span className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-br from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  ₱{finalChange.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* New Sale Button - Beautified */}
        <button
          className="w-full max-w-sm px-6 py-4 sm:py-5 bg-gradient-to-r from-primary to-primary-dark text-white text-base sm:text-lg font-semibold rounded-xl shadow-[0_8px_24px_rgba(102,126,234,0.35)] transition-all hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(102,126,234,0.45)] active:translate-y-0 active:shadow-[0_6px_20px_rgba(102,126,234,0.3)] border-none cursor-pointer"
          onClick={() => {
            setShowModal(false);
            navigate('/pos');
          }}
        >
          <span className="flex items-center justify-center gap-2">
            <span className="text-xl sm:text-2xl">🛒</span>
            <span>New Sale</span>
          </span>
        </button>

        {/* Auto-close notice */}
        <p className="text-xs sm:text-sm text-gray-400 mt-6 text-center">
          This will automatically close in 30 seconds
        </p>
      </div>
    </Modal>
    </>
  );
};

export default PaymentPage;
