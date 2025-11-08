const ProductTile = ({ product, onAddToCart }) => {
  const isOutOfStock = product.stock === 0;

  return (
    <div 
      className={`bg-gradient-to-br from-gray-50 to-gray-300 rounded-xl p-4 md:p-3.5 sm:p-3 cursor-pointer transition-all duration-300 border-2 border-transparent flex flex-col items-center text-center relative overflow-hidden ${
        isOutOfStock 
          ? 'opacity-60 cursor-not-allowed bg-gradient-to-br from-gray-200 to-gray-400' 
          : 'hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] hover:border-[#667eea]'
      }`}
      onClick={() => !isOutOfStock && onAddToCart()}
    >
      {/* Category Badge */}
      {product.category && (
        <div className="absolute top-2 left-2 bg-[#667eea] text-white text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase">
          {product.category}
        </div>
      )}
      <div className="text-5xl md:text-4xl sm:text-3xl mb-2 sm:mb-1.5 mt-4">{product.image}</div>
      <div className="w-full">
        <h3 className="my-2 sm:my-1.5 text-base md:text-sm sm:text-xs font-semibold text-gray-800 break-words">{product.name}</h3>
        <p className="my-1 text-lg md:text-base sm:text-sm font-bold text-[#667eea]">₱{product.price.toFixed(2)}</p>
        <p className="mt-1 mb-0 text-sm md:text-xs sm:text-xs text-gray-600">Stock: {product.stock}</p>
      </div>
      {isOutOfStock && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-4 sm:px-3 py-2 sm:py-1.5 rounded-lg font-semibold text-sm sm:text-xs z-10">
          Out of Stock
        </div>
      )}
    </div>
  );
};

export default ProductTile;


