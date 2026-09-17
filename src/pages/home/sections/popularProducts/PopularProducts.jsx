import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { FaStar } from "react-icons/fa";

import useLoading from "../../../../hooks/useLoading";
import ProductLoader from "../../../../Spinner/ProductLoader";
import useFlashSaleStatus from "../../../../hooks/useFlashSaleStatus";

const formatMoney = (n) => Number(n || 0).toLocaleString();

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 25 },
  },
  hover: {
    y: -6,
    boxShadow: "0px 12px 30px rgba(0, 0, 0, 0.06)",
    transition: { type: "spring", stiffness: 400, damping: 20 },
  },
  tap: { scale: 0.98 },
};

const imageVariants = {
  hover: {
    scale: 1.05,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

const PopularProduct = () => {
  const { campaignActive } = useFlashSaleStatus();
  const [visibleProducts, setVisibleProducts] = useState(20);

  const showMoreProducts = () => setVisibleProducts((prev) => prev + 30);

  const BASE = import.meta.env.VITE_APP_SERVER_URL;

  const {
    data: productsResponse = [],
    isLoading: queryLoading,
    error,
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await fetch(`${BASE}api/products/public?limit=48`);
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  const products = Array.isArray(productsResponse)
    ? productsResponse
    : productsResponse?.items || [];

  if (queryLoading) return <ProductLoader />;

  if (error) {
    return (
      <div className="py-10 text-center font-medium text-rose-500">
        Error loading products: {error.message}
      </div>
    );
  }

  return (
    <>
      <div className="bg-white pt-10 pb-6 font-quicksand">
        <div className="mx-auto flex max-w-7xl items-center justify-between border-b border-slate-100 px-4 pb-4">
          <div className="relative">
             <h2 className="text-lg md:text-2xl font-bold text-slate-900 tracking-tight">
                Popular Products
              </h2>
         
            <div className="absolute -bottom-[10px] left-0 h-1 w-28 rounded-full bg-gradient-to-r from-[#A10D0D] to-[#FFC107]" />
          </div>

          <Link
            to="/all-product"
            className="flex items-center gap-1 text-xs font-bold text-sky-500 transition hover:text-sky-600 md:text-sm"
          >
            View More <span>»</span>
          </Link>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-2 pb-16 pt-4 md:px-4 font-quicksand">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-5 lg:grid-cols-5 xl:grid-cols-5"
        >
          <AnimatePresence>
            {products.slice(0, visibleProducts).map((product, idx) => {
              const originalPrice = Number(product?.price || 0);

              const flashEnabled =
                campaignActive && product?.flashSale?.enabled;

              const price = flashEnabled
                ? Number(product?.flashSale?.salePrice || originalPrice)
                : originalPrice;

              const regularPrice = flashEnabled
                ? originalPrice
                : Number(product?.regularPrice || 0);

              const stockNumber = Number(product?.stock || 0);

              const discount = flashEnabled
                ? Number(product?.flashSale?.discountPercent || 0)
                : regularPrice > price
                  ? Math.round(((regularPrice - price) / regularPrice) * 100)
                  : 0;

              const isOutOfStock =
                product?.status === "out_of_stock" || stockNumber === 0;

              const imageSrc = Array.isArray(product?.productImage)
                ? product.productImage[0]
                : product?.productImage;

              let badgeText = "";
              let badgeCls = "";

              if (isOutOfStock) {
                badgeText = "OUT OF STOCK";
                badgeCls = "bg-rose-500 text-white";
              } else if (discount > 0) {
                badgeText = `${discount}% OFF`;
                badgeCls = "bg-red-500 text-white";
              } else if (idx % 4 === 0) {
                badgeText = "NEW";
                badgeCls = "bg-sky-400 text-white";
              } else if (idx % 3 === 0) {
                badgeText = "HOT";
                badgeCls = "bg-cyan-400 text-white";
              }

              return (
                <motion.div
                  key={product._id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={!isOutOfStock ? "hover" : undefined}
                  whileTap={!isOutOfStock ? "tap" : undefined}
                  className="group/card relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-100 bg-white p-3"
                >
                  {badgeText && (
                    <div
                      className={`absolute right-3 top-3 z-30 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-sm md:text-[10px] ${badgeCls}`}
                    >
                      {badgeText}
                    </div>
                  )}

                  <Link
                    to={`/product-details/${product._id}`}
                    className="group relative block overflow-hidden rounded-2xl bg-slate-50/40 p-2"
                  >
                    <div className="relative flex h-36 items-center justify-center overflow-hidden sm:h-44 md:h-48">
                      <motion.img
                        src={imageSrc}
                        alt={product.productName}
                        loading="lazy"
                        variants={imageVariants}
                        className="max-h-full max-w-full object-contain mix-blend-multiply"
                      />
                    </div>
                  </Link>

                  <div className="flex flex-1 flex-col justify-between pt-3">
                    <div className="space-y-1">
                      <Link to={`/product-details/${product._id}`}>
                        <h3 className="line-clamp-2 min-h-[32px] text-xs font-bold leading-snug text-slate-800 transition hover:text-sky-500 sm:min-h-[40px] sm:text-sm">
                          {product.productName}
                        </h3>
                      </Link>

                      {/* Eta niye ore kaj korbo */}
                      {/* <div className="flex items-center gap-0.5 py-1 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <FaStar key={i} className="h-3 w-3 fill-current" />
                        ))}
                      </div> */}
                    </div>

                    <div className="mt-2.5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-black text-rose-500 sm:text-base">
                          ৳{formatMoney(price)}
                        </span>

                        {regularPrice > price && (
                          <span className="text-[10px] font-medium text-slate-300 line-through sm:text-xs">
                            ৳{formatMoney(regularPrice)}
                          </span>
                        )}
                      </div>

                      {!isOutOfStock && stockNumber > 0 && stockNumber < 20 && (
                        <div className="mt-2">
                          <div className="mb-0.5 text-[9px] font-bold text-orange-500">
                            Only {stockNumber} units left!
                          </div>
                          <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500"
                              style={{
                                width: `${Math.min(
                                  (stockNumber / 20) * 100,
                                  100,
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <Link
                        to={
                          isOutOfStock
                            ? `/product-details/${product._id}`
                            : `/product-details/${product._id}`
                        }
                        className={`mt-3 flex h-9 w-full items-center justify-center rounded-full text-xs font-black transition-all ${
                          isOutOfStock
                            ? "bg-slate-100 text-slate-400"
                            : "bg-[#F77426] text-white shadow-md shadow-orange-100 hover:bg-[#e0631a] hover:shadow-lg"
                        }`}
                      >
                        {isOutOfStock ? "View Details" : "Add to Cart"}
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {visibleProducts < products.length && (
          <div className="mt-12 text-center">
            <button
              onClick={showMoreProducts}
              className="rounded-full bg-gradient-to-r from-[#F77426] to-[#e0631a] px-8 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-orange-100 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Load More Items
            </button>
          </div>
        )}
      </section>
    </>
  );
};

export default PopularProduct;
