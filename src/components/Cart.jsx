const Cart = ({ cart, onRemove, onUpdateQuantity, totalPrice, onCheckout }) => {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <h2 className="m-0 mb-4 md:mb-3 sm:mb-3 text-gray-800 text-2xl md:text-xl sm:text-lg border-b-2 border-[#667eea] pb-2">Order Summary</h2>
      
      <div className="flex-1 overflow-y-auto mb-4 pr-2 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-400 hover:scrollbar-thumb-gray-500">
        {cart.length === 0 ? (
          <p className="text-center text-gray-400 p-8 italic">No items in cart</p>
        ) : (
          cart.map(item => (
            <div key={item.id} className="bg-gray-50 rounded-lg p-4 md:p-3 sm:p-3 mb-3 sm:mb-2 border-l-4 border-[#667eea]">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-800 text-base md:text-sm sm:text-sm">{item.name}</span>
                <span className="text-[#667eea] font-semibold text-sm md:text-sm sm:text-xs">₱{item.price.toFixed(2)}</span>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-1.5 mb-2">
                <button
                  className="w-8 h-8 md:w-7 md:h-7 sm:w-6.5 sm:h-6.5 border-2 border-[#667eea] bg-white text-[#667eea] rounded-md text-xl md:text-base sm:text-sm font-semibold cursor-pointer flex items-center justify-center p-0 transition-all hover:bg-[#667eea] hover:text-white"
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                >
                  -
                </button>
                <span className="min-w-[30px] text-center font-semibold text-gray-800">{item.quantity}</span>
                <button
                  className="w-8 h-8 md:w-7 md:h-7 sm:w-6.5 sm:h-6.5 border-2 border-[#667eea] bg-white text-[#667eea] rounded-md text-xl md:text-base sm:text-sm font-semibold cursor-pointer flex items-center justify-center p-0 transition-all hover:bg-[#667eea] hover:text-white"
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                >
                  +
                </button>
                <button
                  className="w-8 h-8 md:w-7 md:h-7 sm:w-6.5 sm:h-6.5 border-2 border-red-500 bg-white text-red-500 rounded-md text-2xl md:text-xl sm:text-base font-semibold cursor-pointer flex items-center justify-center p-0 ml-auto transition-all hover:bg-red-500 hover:text-white"
                  onClick={() => onRemove(item.id)}
                >
                  ×
                </button>
              </div>
              
              <div className="text-right font-bold text-gray-800 text-sm">
                Total: ₱{(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t-2 border-gray-200 pt-4 mt-auto">
        <div className="text-xl md:text-lg sm:text-base text-gray-800 mb-4 text-center p-3 sm:p-2.5 bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white rounded-lg font-bold">
          Total: ₱{totalPrice.toFixed(2)}
        </div>
        <button
          className="w-full px-4 py-4 md:py-3.5 sm:py-3.5 bg-gradient-to-br from-orange-500 to-red-600 text-white border-none rounded-xl text-lg md:text-base sm:text-sm font-extrabold cursor-pointer transition-all shadow-[0_8px_28px_rgba(255,87,34,0.45)] tracking-wide relative overflow-hidden disabled:opacity-45 disabled:cursor-not-allowed disabled:shadow-none hover:enabled:-translate-y-0.5 hover:enabled:shadow-[0_12px_32px_rgba(255,87,34,0.55)] active:enabled:translate-y-0 active:enabled:shadow-[0_6px_18px_rgba(255,87,34,0.4)]"
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


