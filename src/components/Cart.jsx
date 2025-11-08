const Cart = ({ cart, onRemove, onUpdateQuantity, totalPrice, onCheckout }) => {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <h2 className="m-0 mb-2 sm:mb-3 md:mb-3 text-gray-800 text-responsive-xl border-b-2 border-[#667eea] pb-1.5 sm:pb-2 flex-shrink-0">Order Summary</h2>
      
      <div className="flex-1 overflow-y-auto mb-2 sm:mb-3 pr-2 min-h-0 -mr-2">
        {cart.length === 0 ? (
          <p className="text-center text-gray-400 p-4 sm:p-6 md:p-8 italic text-responsive-sm">No items in cart</p>
        ) : (
          cart.map(item => (
            <div key={item.id} className="bg-gray-50 rounded-lg p-2 sm:p-2.5 md:p-3 mb-1.5 sm:mb-2 border-l-4 border-[#667eea]">
              <div className="flex justify-between items-start mb-1 sm:mb-1.5 gap-1">
                <span className="font-semibold text-gray-800 text-responsive-sm leading-tight flex-1">{item.name}</span>
                <span className="text-[#667eea] font-semibold text-responsive-xs whitespace-nowrap">₱{item.price.toFixed(2)}</span>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-1.5 mb-1 sm:mb-1.5">
                <button
                  className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 border-2 border-[#667eea] bg-white text-[#667eea] rounded-md text-responsive-base font-semibold cursor-pointer flex items-center justify-center p-0 transition-all hover:bg-[#667eea] hover:text-white"
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                >
                  -
                </button>
                <span className="min-w-[24px] sm:min-w-[28px] text-center font-semibold text-gray-800 text-responsive-sm">{item.quantity}</span>
                <button
                  className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 border-2 border-[#667eea] bg-white text-[#667eea] rounded-md text-responsive-base font-semibold cursor-pointer flex items-center justify-center p-0 transition-all hover:bg-[#667eea] hover:text-white"
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                >
                  +
                </button>
                <button
                  className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 border-2 border-red-500 bg-white text-red-500 rounded-md text-responsive-lg font-semibold cursor-pointer flex items-center justify-center p-0 ml-auto transition-all hover:bg-red-500 hover:text-white"
                  onClick={() => onRemove(item.id)}
                >
                  ×
                </button>
              </div>
              
              <div className="text-right font-bold text-gray-800 text-responsive-xs">
                Total: ₱{(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t-2 border-gray-200 pt-2 sm:pt-3 md:pt-4 mt-auto flex-shrink-0">
        <div className="text-responsive-lg mb-2 sm:mb-3 md:mb-4 text-center p-2 sm:p-2.5 md:p-3 bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white rounded-lg font-bold">
          Total: ₱{totalPrice.toFixed(2)}
        </div>
        <button
          className="w-full px-4 py-2.5 sm:py-3 md:py-3.5 bg-gradient-to-br from-orange-500 to-red-600 text-white border-none rounded-xl text-responsive-base font-extrabold cursor-pointer transition-all shadow-[0_8px_28px_rgba(255,87,34,0.45)] tracking-wide relative overflow-hidden disabled:opacity-45 disabled:cursor-not-allowed disabled:shadow-none hover:enabled:-translate-y-0.5 hover:enabled:shadow-[0_12px_32px_rgba(255,87,34,0.55)] active:enabled:translate-y-0 active:enabled:shadow-[0_6px_18px_rgba(255,87,34,0.4)]"
          onClick={onCheckout}
          disabled={cart.length === 0}
        >
          Checkout
        </button>
      </div>
    </div>
  );
};

export default Cart;


