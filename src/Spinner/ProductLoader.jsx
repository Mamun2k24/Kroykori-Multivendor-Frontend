import React from "react";

const ProductLoader = () => {
  return (
    <div className="p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border p-3 animate-pulse"
          >
            <div className="w-full h-36 bg-gray-200 rounded-lg mb-3"></div>

            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>

            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>

            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductLoader;