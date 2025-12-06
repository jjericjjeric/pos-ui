const Cart = ({ cart, onRemove, onUpdateQuantity, totalPrice, onCheckout }) => {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <h2 className="m-0 mb-1.5 sm:mb-2 text-gray-800 text-base sm:text-lg font-bold border-b border-gray-300 pb-1 flex-shrink-0">Cart ({cart.length})</h2>
      
      <div className="flex-1 overflow-y-auto mb-2 pr-1 min-h-0 -mr-1">
        {cart.length === 0 ? (
          <p className="text-center text-gray-400 p-4 italic text-sm">No items</p>
        ) : (
          cart.map(item => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-md p-2 mb-1.5 hover:border-gray-300 transition-colors">
              <div className="flex justify-between items-start gap-2 mb-1">
                <span className="font-medium text-gray-900 text-sm leading-tight flex-1 line-clamp-2">{item.name}</span>
                <button
                  className="w-5 h-5 flex-shrink-0 border border-gray-300 bg-white text-gray-500 rounded text-lg leading-none cursor-pointer flex items-center justify-center p-0 transition-colors hover:bg-red-50 hover:border-red-400 hover:text-red-600"
                  onClick={() => onRemove(item.id)}
                  aria-label="Remove"
                >
                  ×
                </button>
              </div>
              
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    className="w-6 h-6 border border-gray-300 bg-white text-gray-600 rounded text-sm font-semibold cursor-pointer flex items-center justify-center p-0 transition-colors hover:bg-gray-100 active:bg-gray-200"
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  >
                    -
                  </button>
                  <span className="min-w-[28px] text-center font-semibold text-gray-900 text-sm">{item.quantity}</span>
                  <button
                    className="w-6 h-6 border border-gray-300 bg-white text-gray-600 rounded text-sm font-semibold cursor-pointer flex items-center justify-center p-0 transition-colors hover:bg-gray-100 active:bg-gray-200"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">₱{item.price.toFixed(2)} ea</div>
                  <div className="font-bold text-gray-900 text-sm">₱{(item.price * item.quantity).toFixed(2)}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-gray-300 pt-2 mt-auto flex-shrink-0">
        <div className="flex justify-between items-center mb-2.5 px-1">
          <span className="text-sm font-medium text-gray-600">Subtotal</span>
          <span className="text-xl font-bold text-gray-900">₱{totalPrice.toFixed(2)}</span>
        </div>
        <button
          className="w-full px-4 py-3 bg-[#00C853] text-white border-none rounded-lg text-base font-bold cursor-pointer transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-[#00B248] active:enabled:scale-[0.98] disabled:transform-none"
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


