import './Cart.css';

const Cart = ({ cart, onRemove, onUpdateQuantity, totalPrice, onCheckout }) => {
  return (
    <div className="cart-container">
      <h2>Order Summary</h2>
      
      <div className="cart-items">
        {cart.length === 0 ? (
          <p className="empty-cart">No items in cart</p>
        ) : (
          cart.map(item => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-info">
                <span className="cart-item-name">{item.name}</span>
                <span className="cart-item-price">₱{item.price.toFixed(2)}</span>
              </div>
              
              <div className="cart-item-controls">
                <button
                  className="quantity-btn"
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                >
                  -
                </button>
                <span className="quantity">{item.quantity}</span>
                <button
                  className="quantity-btn"
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                >
                  +
                </button>
                <button
                  className="remove-btn"
                  onClick={() => onRemove(item.id)}
                >
                  ×
                </button>
              </div>
              
              <div className="cart-item-total">
                Total: ₱{(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="cart-footer">
        <div className="cart-total">
          <strong>Total: ₱{totalPrice.toFixed(2)}</strong>
        </div>
        <button
          className="checkout-btn"
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

