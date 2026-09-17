import React from "react";

const ProductSelector = ({ products, selectedProduct, setSelectedProduct }) => {
  return (
    <div>
      <label className="font-semibold">Select Product</label>

      <select
        value={selectedProduct}
        onChange={(e) => setSelectedProduct(e.target.value)}
        className="
border
w-full
p-3
rounded-lg
mt-2
"
      >
        <option value="">Choose Product</option>

        {products?.map((product) => (
          <option key={product._id} value={product._id}>
            {product.productName}- ৳{product.price}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ProductSelector;
