import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { HiOutlineShoppingCart } from "react-icons/hi";
import { FaStar } from "react-icons/fa";

import ProductLoader from "../../../Spinner/Loader"; // আপনার পাথ অনুযায়ী লোডার

const formatMoney = (n) => Number(n || 0).toLocaleString();

// PopularProduct থেকে হুবহু অ্যানিমেশন কনফিগারেশন ইমপোর্ট বা ডিফাইন করা হলো
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 25,
    },
  },
  hover: {
    y: -6,
    boxShadow: "0px 12px 30px rgba(0, 0, 0, 0.06)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 20,
    },
  },
  tap: {
    scale: 0.98,
  },
};

const imageVariants = {
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

const RelatedProduct = ({ categoryName, excludeId }) => {
  const BASE = import.meta.env.VITE_APP_SERVER_URL;

  const {
    data: productsResponse = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["relatedProducts", categoryName, excludeId],
    queryFn: async () => {
      const url = excludeId
        ? `${BASE}api/products/related/${categoryName}?excludeId=${excludeId}`
        : `${BASE}api/products/related/${categoryName}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <ProductLoader />;

  if (error) {
    return (
      <div className="text-center py-10 text-rose-500 font-medium">
        Error loading related products: {error.message}
      </div>
    );
  }

  // ডেটা স্ট্রাকচার সেফটি হ্যান্ডলিং
  const products = Array.isArray(productsResponse)
    ? productsResponse
    : productsResponse?.items || [];

  // সর্বোচ্চ ৫টি রিলেটেড প্রোডাক্ট দেখানো হবে
  const relatedProducts = products.slice(0, 5);

  if (relatedProducts.length === 0) return null;

  return (
    <div className="">
      {/* ================== SECTION TITLE (PopularProduct Style) ================== */}
      <div className="bg-white pb-6">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="relative">
            <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              Related Products
            </h2>
            <div className="absolute -bottom-[18px] left-0 h-1 w-16 bg-sky-400 rounded-full" />
          </div>
        </div>
      </div>

      {/* ================== PRODUCT GRID INFRASTRUCTURE ================== */}
      <section className="max-w-7xl mx-auto px-2 md:px-4 pb-16 pt-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3 md:gap-5"
        >
          <AnimatePresence>
            {relatedProducts.map((product, idx) => {
              // ফাংশনালিটি অ্যান্ড প্রাইস ক্যালকুলেশন লজিক (PopularProduct এর অনুরূপ)
              const originalPrice = Number(product?.price || 0);
              const price = product?.flashSale?.enabled
                ? Number(product?.flashSale?.salePrice || originalPrice)
                : originalPrice;

              const regularPrice = product?.flashSale?.enabled
                ? originalPrice
                : Number(product?.regularPrice || 0);
              const stockNumber = Number(product?.stock || 0);

              const discount = product?.flashSale?.enabled
                ? Number(product?.flashSale?.discountPercent || 0)
                : regularPrice > price
                  ? Math.round(((regularPrice - price) / regularPrice) * 100)
                  : 0;

              const isOutOfStock =
                product?.status === "out_of_stock" ||
                Number(product?.stock) === 0;

              const imageSrc = Array.isArray(product?.productImage)
                ? product.productImage[0]
                : product?.productImage || product?.image;

              // ডাইনামিক ব্যাজ সেটআপ
              let badgeText = "";
              let badgeCls = "";

              if (isOutOfStock) {
                badgeText = "OUT OF STOCK";
                badgeCls = "bg-rose-500/90 text-white";
              } else if (discount > 0) {
                badgeText = `${discount}% OFF`;
                badgeCls = "bg-red-500 text-white font-black";
              } else if (idx % 4 === 0) {
                badgeText = "NEW";
                badgeCls = "bg-sky-400 text-white font-black";
              } else if (idx % 3 === 0) {
                badgeText = "HOT";
                badgeCls = "bg-cyan-400 text-white font-black";
              }

              return (
                <motion.div
                  key={product._id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={!isOutOfStock ? "hover" : undefined}
                  whileTap={!isOutOfStock ? "tap" : undefined}
                  custom={idx}
                  className="bg-white border border-slate-100 rounded-3xl p-3 flex flex-col justify-between relative group/card overflow-hidden"
                >
                  {/* ডাইনামিক ফ্ল্যাট ব্যাজ */}
                  {badgeText && (
                    <div
                      className={`absolute top-3 right-3 z-30 text-[9px] md:text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm uppercase tracking-wider ${badgeCls}`}
                    >
                      {badgeText}
                    </div>
                  )}

                  {/* প্রোডাক্ট ইমেজ এরিয়া */}
                  <Link
                    to={`/product-details/${product._id}`}
                    className="block relative overflow-hidden rounded-2xl bg-slate-50/40 p-2 group"
                  >
                    <div className="relative h-36 sm:h-44 md:h-48 flex items-center justify-center overflow-hidden">
                      <motion.img
                        src={imageSrc}
                        alt={product.productName}
                        loading="lazy"
                        variants={imageVariants}
                        className="max-h-full max-w-full object-contain mix-blend-multiply"
                      />

                    </div>
                  </Link>

                  {/* প্রোডাক্ট মেটা কন্টেন্ট সেকশন */}
                  <div className="pt-3 flex flex-col flex-1 justify-between">
                    <div className="space-y-1">
                      <Link
                        to={`/product-details/${product._id}`}
                        className="block"
                      >
                        <h3 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 min-h-[32px] sm:min-h-[40px] leading-snug hover:text-sky-500 transition-colors">
                          {product.productName}
                        </h3>
                      </Link>

                      {/* ৫-স্টার রেটিং বার কম্পোনেন্ট */}
                      <div className="flex items-center gap-0.5 text-amber-400 py-1">
                        <FaStar className="w-3 h-3 fill-current" />
                        <FaStar className="w-3 h-3 fill-current" />
                        <FaStar className="w-3 h-3 fill-current" />
                        <FaStar className="w-3 h-3 fill-current" />
                        <FaStar className="w-3 h-3 fill-current" />
                      </div>
                    </div>

                    {/* প্রাইস এবং অ্যাকশন বাতন সেকশন */}
                    <div className="mt-2.5 flex items-center justify-between gap-2 pt-1">
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-x-1.5">
                        <span className="text-sm sm:text-base font-black text-rose-500">
                          ৳{formatMoney(price)}
                        </span>
                        {regularPrice > price && (
                          <span className="text-[10px] sm:text-xs text-slate-300 line-through font-medium">
                            ৳{formatMoney(regularPrice)}
                          </span>
                        )}
                      </div>

                      {/* স্কাই ব্লু রাউন্ডেড শপিং ব্যাগ বাটন */}
                      <Link
                        to={`/product-details/${product._id}`}
                        className="shrink-0"
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md shadow-sky-100 transition-all ${
                            isOutOfStock
                              ? "bg-slate-100 text-slate-400 shadow-none cursor-not-allowed"
                              : "bg-sky-500 hover:bg-sky-600 text-white"
                          }`}
                          title="View Details"
                        >
                          <HiOutlineShoppingCart className="text-sm stroke-[2.5]" />
                        </div>
                      </Link>
                    </div>

                    {/* স্টক লিমিট নোটিশ স্ট্রিপ */}
                    {!isOutOfStock && stockNumber > 0 && stockNumber < 20 && (
                      <div className="mt-2">
                        <div className="text-[9px] text-orange-500 font-bold mb-0.5">
                          Only {stockNumber} units left!
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-orange-500 to-red-500 h-1 rounded-full"
                            style={{ width: `${(stockNumber / 20) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </section>
    </div>
  );
};

export default RelatedProduct;