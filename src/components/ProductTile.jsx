import './ProductTile.css';

const ProductTile = ({ product, onAddToCart }) => {
  const isOutOfStock = product.stock === 0;

  return (
    <div 
      className={`product-tile ${isOutOfStock ? 'out-of-stock' : ''}`}
      onClick={() => !isOutOfStock && onAddToCart()}
    >
      <div className="product-image">{product.image}</div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-price">₱{product.price.toFixed(2)}</p>
        <p className="product-stock">Stock: {product.stock}</p>
      </div>
      {isOutOfStock && (
        <div className="out-of-stock-overlay">Out of Stock</div>
      )}
    </div>
  );
};

export default ProductTile;

