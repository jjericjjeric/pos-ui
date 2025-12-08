import { useState, useEffect, useRef, useMemo } from 'react';
import Modal from '../components/Modal';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';

const PaymentPage = () => {
  const navigate = useNavigate();
  
  // Zustand store selectors
  const cart = useAppStore((state) => state.cart);
  const products = useAppStore((state) => state.products);
  const loadProducts = useAppStore((state) => state.loadProducts);
  const clearCart = useAppStore((state) => state.clearCart);
  const createTransaction = useAppStore((state) => state.createTransaction);
  const currentStore = useAppStore((state) => state.currentStore);
  
  const orderItemsRef = useRef(null);

  const [amountPaid, setAmountPaid] = useState('');
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [finalChange, setFinalChange] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const autoCloseTimer = useRef(null);

  // Calculate total price (memoized)
  const totalPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);
  
  const change = amountPaid ? parseFloat(amountPaid) - totalPrice : 0;

  // Removed auto-redirect on empty cart to allow cart persistence

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
      // Prepare transaction data
      const transactionItems = cart.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
      }));

      const transactionData = {
        items: transactionItems,
        total_amount: totalPrice,
        amount_paid: paid,
        payment_method: 'cash',
        notes: '',
      };

      // Create transaction (this will also update inventory on the backend)
      await createTransaction(transactionData);

      // Reload products to get fresh data with updated stock
      await loadProducts();

      // Clear cart after successful purchase
      clearCart();

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
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-2 sm:p-3 md:p-4">
      <div className="bg-white rounded-lg p-4 sm:p-5 md:p-6 max-w-[600px] w-full border border-gray-200 max-h-[95vh] overflow-y-auto">
        <h1 className="m-0 mb-3 sm:mb-4 text-gray-800 text-xl sm:text-2xl font-bold">Payment</h1>
        
        <div className="mb-4 sm:mb-5">
          <h2 className="m-0 mb-2 text-gray-800 text-base sm:text-lg font-semibold">Order Summary</h2>
          <div ref={orderItemsRef} className="max-h-[250px] sm:max-h-[220px] overflow-y-auto mb-3 pr-2 -mr-2">
            {cart.length === 0 ? (
              <p className="text-center text-gray-400 p-4 sm:p-6 md:p-8 italic text-sm sm:text-base">No items in cart</p>
            ) : (
              cart.map(item => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-2 mb-1.5">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-gray-800 text-sm leading-tight flex-1 line-clamp-1">{item.name}</span>
                    <span className="text-gray-600 text-xs whitespace-nowrap ml-2">₱{item.price.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Qty: {item.quantity}</span>
                    <span className="font-bold text-gray-900">₱{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700 text-base sm:text-lg">Total Amount to Pay</span>
              <span className="text-2xl sm:text-3xl font-bold text-[#00C853]">₱{totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mb-4 sm:mb-5">
          <div className="mb-3 sm:mb-4">
            <label htmlFor="amountPaid" className="mb-2 font-bold text-gray-800 text-base sm:text-lg flex items-center gap-2">
              <span className="text-xl">💵</span>
              Amount Paid:
            </label>
            <input
              id="amountPaid"
              type="number"
              step="0.01"
              min="0"
              value={amountPaid}
              onChange={handleAmountChange}
              placeholder="0.00"
              className={`w-full px-3 py-3 text-lg sm:text-xl border ${error ? 'border-red-500' : 'border-gray-200'} rounded-lg transition-colors focus:outline-none focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20`}
              inputMode="decimal"
              autoFocus
            />
            {!amountPaid && !error && (
              <div className="mt-2 text-sm text-gray-500 flex items-center gap-1">
                <span>👆</span>
                <span>Please enter the amount received from customer</span>
              </div>
            )}
            {error && <span className="block text-red-500 text-sm mt-2 font-semibold">{error}</span>}
          </div>
          
          {amountPaid && change >= 0 && (
            <div className="p-3 bg-white border border-green-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700 text-sm sm:text-base">Change</span>
                <span className="font-bold text-[#00C853] text-lg sm:text-xl">₱{change.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 flex-col sm:flex-row">
          <button 
            className="w-full sm:flex-1 px-4 py-3 text-base font-semibold border border-gray-200 rounded-lg cursor-pointer transition-all bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100" 
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className="w-full sm:flex-1 px-4 py-3 text-base font-bold rounded-lg cursor-pointer transition-all bg-[#00C853] text-white hover:enabled:bg-[#00B548] disabled:opacity-50 disabled:cursor-not-allowed active:enabled:bg-[#009E42]"
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
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#00C853] relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[3rem] sm:text-[3.5rem] text-white font-bold">✓</div>
          </div>
        </div>

        {/* Success Message */}
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">Payment Complete!</h2>
        <p className="text-sm sm:text-base text-gray-500 mb-8 sm:mb-10">Transaction successful</p>

        {/* Change Amount - Center of Attention */}
        <div className="w-full max-w-sm mb-8 sm:mb-10">
          <div className="bg-white rounded-lg p-6 sm:p-8 border border-green-200">
            <div className="text-center">
              <p className="text-sm sm:text-base font-medium text-gray-600 mb-2">Your Change</p>
              <div className="flex items-center justify-center gap-1">
                <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#00C853]">
                  ₱{finalChange.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* New Sale Button */}
        <button
          className="w-full max-w-sm px-6 py-4 bg-[#00C853] text-white text-base font-semibold rounded-lg transition-all hover:bg-[#00B548] active:bg-[#009E42] cursor-pointer"
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
