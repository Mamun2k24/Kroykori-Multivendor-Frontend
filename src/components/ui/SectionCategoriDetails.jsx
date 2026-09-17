import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { HiOutlineShoppingCart } from "react-icons/hi";
import { FaStar } from "react-icons/fa";
import { FiChevronRight } from "react-icons/fi"; // স্লাইডার অ্যারোর জন্য

// 🌟 নতুন হুক এবং ইউটিলিটি ইমপোর্ট
import useFlashSaleStatus from "../../hooks/useFlashSaleStatus";
import { getProductPricing } from "../../utils/pricing";

/* --- tiny helpers ------------------------------------------------------- */
const useClickOutside = (ref, onClose) => {
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, onClose]);
};

// 🌟 ফিক্সড: formatMoney ফাংশনটি এখানে ডিফাইন করে দেওয়া হলো
const formatMoney = (n) => Number(n || 0).toLocaleString();

const SORT_LABELS = {
  best: "Best Selling",
  az: "Alphabetically, A–Z",
  za: "Alphabetically, Z–A",
  priceLow: "Price, low to high",
  priceHigh: "Price, high to low",
  dateNew: "Date, new to old",
  dateOld: "Date, old to new",
};

const sortProducts = (arr, how) => {
  const a = [...arr];
  switch (how) {
    case "best":
      return a.sort((x, y) => (y.sales || 0) - (x.sales || 0));
    case "az":
      return a.sort((x, y) => (x.productName || "").localeCompare(y.productName || ""));
    case "za":
      return a.sort((x, y) => (y.productName || "").localeCompare(x.productName || ""));
    case "priceLow":
      return a.sort((x, y) => (x.price || 0) - (y.price || 0));
    case "priceHigh":
      return a.sort((x, y) => (y.price || 0) - (x.price || 0));
    case "dateNew":
      return a.sort((x, y) => new Date(y.createdAt || 0) - new Date(x.createdAt || 0));
    case "dateOld":
      return a.sort((x, y) => new Date(x.createdAt || 0) - new Date(y.createdAt || 0));
    default:
      return a;
  }
};

/* --- 🌟 ১. ইমেজ (image_298fbe.png) অনুযায়ী মডার্ন সাবক্যাটাগরি স্লাইডিং বার 🌟 --- */
function SubcategoryTabs({ parentCategory, activeSubSlug = "" }) {
  if (!parentCategory) return null;

  const subcategories = parentCategory?.subcategories || [];
  const parentSlug = parentCategory?.slug || "";
  const scrollRef = useRef(null);

  if (!subcategories.length) return null;

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  return (
    <div className="mb-8 relative group">
      {/* স্লাইডিং মেইন কন্টেইনার */}
      <div 
        ref={scrollRef}
        className="flex items-center gap-4 overflow-x-auto pb-4 pt-1 snap-x scrollbar-none"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* All Products Tab Card */}
        <Link
          to={`/category/${parentSlug}`}
          className={`flex flex-col items-center justify-between min-w-[130px] sm:min-w-[150px] max-w-[160px] h-36 bg-white border rounded-2xl p-3 transition-all duration-300 snap-start shrink-0 ${
            !activeSubSlug 
              ? "border-orange-500 shadow-md ring-1 ring-orange-500/20 bg-orange-50/10" 
              : "border-slate-100 shadow-sm hover:shadow-md"
          }`}
        >
          <div className="w-full flex-1 flex items-center justify-center bg-slate-50 rounded-xl mb-2 text-slate-700">
            {/* মডার্ন গ্রিড আইকন উইজেট */}
            <svg className="w-6 h-6 stroke-[2.3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <div className="text-center leading-none w-full">
            <p className="text-[13px] font-black text-slate-800 tracking-tight">All</p>
            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">All Products</span>
          </div>
        </Link>

        {/* Dynamic Subcategories Mapping */}
        {subcategories.map((sub) => (
          <Link
            key={sub._id}
            to={`/category/${parentSlug}/${sub.slug}`}
            className={`flex flex-col items-center justify-between min-w-[130px] sm:min-w-[150px] max-w-[160px] h-36 bg-white border rounded-2xl p-3 transition-all duration-300 snap-start shrink-0 ${
              activeSubSlug === sub.slug
                ? "border-orange-500 shadow-md ring-1 ring-orange-500/20 bg-orange-50/10"
                : "border-slate-100 shadow-sm hover:shadow-md"
            }`}
          >
            <div className="w-full flex-1 bg-slate-50/60 rounded-xl mb-2 overflow-hidden flex items-center justify-center">
              <img
                src={sub.image}
                alt={sub.name}
                className="max-h-full max-w-full object-contain transition duration-300 group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/150?text=Sub";
                }}
              />
            </div>

            <div className="text-center leading-none w-full">
              <p className="text-[13px] font-black text-slate-800 tracking-tight truncate px-0.5">{sub.name}</p>
              <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Explore Items</span>
            </div>
          </Link>
        ))}
      </div>

      {/* ইমেজের মতো ডানপাশের মডার্ন রাউন্ডেড নেভিগেশন অ্যারো বাটন */}
      <button 
        onClick={scrollRight}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-4 w-9 h-9 rounded-full bg-white text-slate-800 flex items-center justify-center shadow-lg border border-slate-100 hover:bg-slate-50 transition opacity-0 group-hover:opacity-100 z-10"
        title="Scroll Right"
      >
        <FiChevronRight className="w-5 h-5 stroke-[2.5]" />
      </button>
    </div>
  );
}

/* --- Main Details Component ---------------------------------------------- */
export default function SectionCategoriDetails() {
  const { slug, subSlug } = useParams();
  const { campaignActive } = useFlashSaleStatus();

  const [openPrice, setOpenPrice] = useState(false);
  const [openSort, setOpenSort] = useState(false);

  const priceRef = useRef(null);
  const sortRef = useRef(null);

  useClickOutside(priceRef, () => setOpenPrice(false));
  useClickOutside(sortRef, () => setOpenSort(false));

  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(0);
  const [sortBy, setSortBy] = useState("dateNew");

  const baseUrl = import.meta.env.VITE_APP_SERVER_URL;

  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}api/categories`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load categories");
      return res.json();
    },
  });

  const activeCategory = useMemo(() => {
    return Array.isArray(categories) ? categories.find((cat) => cat.slug === slug) : null;
  }, [categories, slug]);

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ["productsByCategory", slug, subSlug],
    queryFn: async () => {
      const url = subSlug
        ? `${baseUrl}api/categories/${encodeURIComponent(slug || "")}/${encodeURIComponent(subSlug || "")}`
        : `${baseUrl}api/categories/${encodeURIComponent(slug || "")}`;

      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load products");
      return res.json();
    },
    enabled: !!slug,
  });

  const { minP, maxP } = useMemo(() => {
    const prices = [];
    for (const p of products) {
      const price = Number(p.price || 0);
      if (!Number.isNaN(price)) prices.push(price);
    }
    return { minP: prices.length ? Math.min(...prices) : 0, maxP: prices.length ? Math.max(...prices) : 0 };
  }, [products]);

  useEffect(() => {
    if (products.length) {
      setPriceMin(minP);
      setPriceMax(maxP);
    } else {
      setPriceMin(0);
      setPriceMax(0);
    }
  }, [products, minP, maxP]);

  const filtered = useMemo(() => {
    const inPrice = (p) => {
      const val = Number(p.price || 0);
      return val >= priceMin && val <= priceMax;
    };
    return sortProducts(products.filter((p) => inPrice(p)), sortBy);
  }, [products, priceMin, priceMax, sortBy]);

  if (isLoading || categoriesLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-10 text-center text-slate-400 font-medium">
        Loading Category Pipeline...
      </section>
    );
  }

  if (error || categoriesError) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-10 text-rose-500 font-bold">
        Pipeline Data Connection Error.
      </section>
    );
  }

  return (
    <section className="bg-white">
      <div className="max-w-full xl:px-8 mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight uppercase">
            {decodeURIComponent(slug || "Category")}
            {subSlug ? ` / ${decodeURIComponent(subSlug)}` : ""}
          </h1>
        </div>

        <SubcategoryTabs parentCategory={activeCategory} activeSubSlug={subSlug || ""} />

        {/* Filters Top Ribbon */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="relative" ref={priceRef}>
              <button
                onClick={() => {
                  setOpenPrice((v) => !v);
                  setOpenSort(false);
                }}
                className="h-9 px-4 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-600 outline-none uppercase tracking-wide hover:bg-slate-50 transition"
              >
                Price <span className="ml-1 text-[10px]">▼</span>
              </button>

              {openPrice && (
                <div className="absolute z-30 mt-2 w-80 max-w-[90vw] bg-white border border-slate-100 rounded-2xl shadow-xl p-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={Math.floor(priceMin)}
                      onChange={(e) => setPriceMin(Math.min(Number(e.target.value || 0), priceMax))}
                      className="w-28 h-9 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                    />
                    <span className="px-1 text-slate-400 font-bold">–</span>
                    <input
                      type="number"
                      value={Math.ceil(priceMax)}
                      onChange={(e) => setPriceMax(Math.max(Number(e.target.value || 0), priceMin))}
                      className="w-28 h-9 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                    />
                  </div>

                  <div className="mt-4 px-1">
                    <div className="relative h-5">
                      <input
                        type="range"
                        min={minP}
                        max={maxP}
                        value={priceMin}
                        onChange={(e) => setPriceMin(Math.min(Number(e.target.value), priceMax))}
                        className="absolute inset-0 w-full pointer-events-auto accent-sky-500"
                      />
                      <input
                        type="range"
                        min={minP}
                        max={maxP}
                        value={priceMax}
                        onChange={(e) => setPriceMax(Math.max(Number(e.target.value), priceMin))}
                        className="absolute inset-0 w-full pointer-events-auto accent-sky-500"
                      />
                    </div>
                    <div className="mt-2 flex justify-between text-[11px] text-slate-400 font-bold">
                      <span>৳ {Math.floor(priceMin).toLocaleString()}</span>
                      <span>৳ {Math.ceil(priceMax).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-50 flex gap-3">
                    <button
                      onClick={() => { setPriceMin(minP); setPriceMax(maxP); }}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600 transition"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setOpenPrice(false)}
                      className="ml-auto px-4 h-8 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="relative" ref={sortRef}>
            <button
              onClick={() => {
                setOpenSort((v) => !v);
                setOpenPrice(false);
              }}
              className="h-9 px-4 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-600 outline-none uppercase tracking-wide hover:bg-slate-50 transition"
            >
              {SORT_LABELS[sortBy]} <span className="ml-1 text-[10px]">▼</span>
            </button>

            {openSort && (
              <div className="absolute right-0 z-30 mt-2 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl py-1.5 overflow-hidden">
                {Object.entries(SORT_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => { setSortBy(key); setOpenSort(false); }}
                    className={`w-full text-left px-4 py-2 text-xs font-bold transition hover:bg-slate-50 ${
                      sortBy === key ? "text-sky-500 bg-sky-50/40" : "text-slate-600"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="text-xs text-slate-400 font-bold mt-4 mb-4 tracking-wide">
          Showing <span className="text-slate-800 font-black">{filtered.length}</span> items
        </div>

        {/* ================== 🌟 পণ্যের গ্রিড লেআউট (POPULAR PRODUCT STYLE) 🌟 ================== */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-5">
          {filtered.map((product, idx) => {
            
            const { price, regularPrice, discount, flashActive } = getProductPricing(
              product,
              campaignActive
            );

            const stockNumber = Number(product?.stock || 0);
            const isOutOfStock = product?.status === "out_of_stock" || stockNumber === 0;

            const firstImage = Array.isArray(product.productImage) && product.productImage.length > 0
              ? product.productImage[0]
              : product.productImage || product.image || "";

            let badgeText = "";
            let badgeCls = "";

            if (isOutOfStock) {
              badgeText = "OUT OF STOCK";
              badgeCls = "bg-rose-500/90 text-white";
            } else if (flashActive && discount > 0) {
              badgeText = `${discount}% OFF`;
              badgeCls = "bg-red-500 text-white font-black";
            } else if (idx % 4 === 0) {
              badgeText = "NEW";
              badgeCls = "bg-sky-400 text-white font-black";
            }

            return (
              <div
                key={product._id}
                className="bg-white border border-slate-100 rounded-3xl p-3 flex flex-col justify-between relative group/card overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {/* রাউন্ডেড ফ্ল্যাট ব্যাজ */}
                {badgeText && (
                  <div className={`absolute top-3 right-3 z-20 text-[9px] md:text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm uppercase tracking-wider ${badgeCls}`}>
                    {badgeText}
                  </div>
                )}

                {/* ইমেজ কন্টেইনার এরিয়া */}
                <Link
                  to={`/product-details/${product._id}`}
                  className="block relative overflow-hidden rounded-2xl bg-slate-50/40 p-2 group"
                >
                  <div className="relative h-36 sm:h-44 md:h-48 flex items-center justify-center overflow-hidden">
                    <img
                      src={firstImage}
                      alt={product.productName || product.name}
                      loading="lazy"
                      className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                    />
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-2xl">
                        <span className="text-white text-[10px] font-black bg-rose-600 px-2.5 py-1 rounded-md">SOLD OUT</span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* কন্টেন্ট ডেসক্রিপশন এরিয়া */}
                <div className="pt-3 flex flex-col flex-1 justify-between">
                  <div className="space-y-1">
                    <Link to={`/product-details/${product._id}`} className="block">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 min-h-[32px] sm:min-h-[40px] leading-snug hover:text-sky-500 transition-colors">
                        {product.productName || product.name}
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

                  {/* প্রাইস বার এবং রাউন্ডেড কার্ড বাটন */}
                  <div className="mt-2.5 flex items-center justify-between gap-2 pt-1">
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-x-1.5">
                      <span className="text-sm sm:text-base font-black text-rose-500">
                        ৳{formatMoney(price)}
                      </span>
                      {regularPrice && regularPrice > price && (
                        <span className="text-[10px] sm:text-xs text-slate-300 line-through font-medium">
                          ৳{formatMoney(regularPrice)}
                        </span>
                      )}
                    </div>

                    {/* শপিং ব্যাগ বাটন */}
                    <Link to={`/product-details/${product._id}`} className="shrink-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md shadow-sky-100 transition-all ${
                          isOutOfStock
                            ? "bg-slate-100 text-slate-400 shadow-none cursor-not-allowed"
                            : "bg-sky-500 hover:bg-sky-600 text-white"
                        }`}
                      >
                        <HiOutlineShoppingCart className="text-sm stroke-[2.5]" />
                      </div>
                    </Link>
                  </div>

                  {/* লো স্টক নোটিশ স্ট্রিপ বার */}
                  {!isOutOfStock && stockNumber > 0 && stockNumber < 20 && (
                    <div className="mt-2">
                      <div className="text-[9px] text-orange-500 font-bold mb-0.5">Only {stockNumber} units left!</div>
                      <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-red-500 h-1 rounded-full"
                          style={{ width: `${(stockNumber / 20) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!filtered.length && (
          <div className="py-20 text-center text-slate-400 font-semibold text-sm">
            No products found under this query.
          </div>
        )}
      </div>
    </section>
  );
}