import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FaStar, FaThLarge, FaList, FaTrashAlt, FaChevronRight, FaRegHeart } from "react-icons/fa";
import { HiOutlineShoppingCart } from "react-icons/hi";
import Loader from "../../Spinner/Loader";

const BASE_URL = import.meta.env.VITE_APP_SERVER_URL;
const FALLBACK_IMAGE = "https://via.placeholder.com/300x300?text=Product";

// Max price limit definition for slider calibration
const ABSOLUTE_MAX_PRICE = 20000;

// Helper functions
const formatMoney = (n) => Number(n || 0).toLocaleString();
const extractList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.categories)) return data.categories;
  if (Array.isArray(data?.brands)) return data.brands;
  return [];
};
const getProductImage = (product) => (Array.isArray(product?.productImage) ? product.productImage[0] : product?.productImage || FALLBACK_IMAGE);
const getCategoryName = (product) => product?.categoryName || "";
const getBrandName = (product) => product?.brand || "";
const getFinalPrice = (product) => product?.flashSale?.enabled ? Number(product?.flashSale?.salePrice || Number(product?.price || 0)) : Number(product?.price || 0);
const getRegularPrice = (product) => {
  const finalPrice = getFinalPrice(product);
  if (product?.flashSale?.enabled) return Number(product?.price || finalPrice);
  if (product?.regularPrice) return Number(product.regularPrice);
  if (product?.oldPrice) return Number(product.oldPrice);
  const discountPercent = Number(product?.discount || 0);
  return discountPercent > 0 ? Math.round(finalPrice / (1 - discountPercent / 100)) : 0;
};
const getDiscountPercent = (product) => {
  if (product?.flashSale?.enabled) return Number(product?.flashSale?.discountPercent || 0);
  if (Number(product?.discount || 0) > 0) return Number(product.discount);
  const finalPrice = getFinalPrice(product);
  const regularPrice = getRegularPrice(product);
  return regularPrice > finalPrice ? Math.round(((regularPrice - finalPrice) / regularPrice) * 100) : 0;
};

const AllProductsHeader = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [sort, setSort] = useState("popular");
  const [view, setView] = useState("grid");
  
  // States converted to numbers for Slider image_2b6795.png functionality
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(ABSOLUTE_MAX_PRICE);

  const { data: productsResponse = [], isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ["all-products"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}api/products/public?limit=100`);
      if (!res.ok) throw new Error("Failed to load products");
      return res.json();
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  const { data: categoriesResponse = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}api/categories`);
      if (!res.ok) throw new Error("Failed to load categories");
      return res.json();
    },
  });

  const { data: brandsResponse = [], isLoading: brandsLoading } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}api/brands`);
      if (!res.ok) throw new Error("Failed to load brands");
      return res.json();
    },
  });

  const products = useMemo(() => extractList(productsResponse), [productsResponse]);
  const categories = useMemo(() => [{ _id: "all", name: "All" }, ...extractList(categoriesResponse)], [categoriesResponse]);
  const brands = useMemo(() => [{ _id: "all", name: "All" }, ...extractList(brandsResponse).filter((brand) => brand?.isActive !== false)], [brandsResponse]);

  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (activeCategory !== "All") list = list.filter((product) => getCategoryName(product) === activeCategory);
    if (selectedBrand !== "All") list = list.filter((product) => getBrandName(product) === selectedBrand);
    
    // Dynamic numeric validation
    list = list.filter((product) => {
      const price = getFinalPrice(product);
      return price >= minPrice && price <= maxPrice;
    });

    list.sort((a, b) => {
      const aPrice = getFinalPrice(a), bPrice = getFinalPrice(b);
      if (sort === "low") return aPrice - bPrice;
      if (sort === "high") return bPrice - aPrice;
      if (sort === "latest") return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
      return 0;
    });
    return list;
  }, [products, activeCategory, selectedBrand, minPrice, maxPrice, sort]);

  const resetFilters = () => {
    setActiveCategory("All");
    setSelectedBrand("All");
    setMinPrice(0);
    setMaxPrice(ABSOLUTE_MAX_PRICE);
    setSort("popular");
  };

  // Slider progress track bar calculation
  const progressLeft = (minPrice / ABSOLUTE_MAX_PRICE) * 100;
  const progressRight = 100 - (maxPrice / ABSOLUTE_MAX_PRICE) * 100;

  if (productsLoading || categoriesLoading || brandsLoading) return <Loader />;
  if (productsError) return <div className="py-12 text-center font-semibold text-rose-500 bg-rose-50 border border-rose-100 rounded-2xl m-6">Failed to load products. Please try again.</div>;

  return (
    <section className="bg-slate-50/50 min-h-screen antialiased">
      <div className="mx-auto max-w-screen-2xl px-4 py-6 md:px-6 md:py-8">
        
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs md:text-sm text-slate-400">
          <Link to="/" className="hover:text-slate-800 transition">Home</Link>
          <FaChevronRight className="w-2.5 h-2.5 text-slate-300" />
          <span className="font-medium text-slate-800">Shop</span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          
          {/* Sidebar Filters */}
          <aside className="hidden lg:block space-y-6 sticky top-24 self-start">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <div className="mb-5 flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Filters</h3>
                <button type="button" onClick={resetFilters} className="text-xs font-semibold text-[#F77426] hover:underline transition">
                  Clear All
                </button>
              </div>

              {/* Categories */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Categories</h4>
                <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                  {categories.map((cat) => (
                    <button key={cat?._id || cat?.name} type="button" onClick={() => setActiveCategory(cat?.name)} className={`flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-sm transition-all ${activeCategory === cat?.name ? "font-semibold bg-[#F77426] text-white" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
                      {cat?.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range - Remodeled accurately to image_2b6795.png */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h4 className="mb-5 text-xs font-bold uppercase tracking-wider text-slate-400">Price Range</h4>
                <div className="relative pt-1 px-1">
                  
                  {/* Base Track */}
                  <div className="h-1.5 w-full bg-slate-100 rounded-full relative">
                    {/* Active Highlight Track matching image_2b6795.png */}
                    <div 
                      className="absolute h-full bg-blue-600 rounded-full"
                      style={{ left: `${progressLeft}%`, right: `${progressRight}%` }}
                    />
                  </div>

                  {/* Dual Native Thumb Inputs */}
                  <input 
                    type="range"
                    min="0"
                    max={ABSOLUTE_MAX_PRICE}
                    value={minPrice}
                    step="100"
                    onChange={(e) => {
                      const value = Math.min(Number(e.target.value), maxPrice - 500);
                      setMinPrice(value);
                    }}
                    className="absolute pointer-events-none appearance-none w-full bg-transparent top-0 left-0 h-2 accent-blue-600 cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:appearance-none" 
                  />
                  <input 
                    type="range"
                    min="0"
                    max={ABSOLUTE_MAX_PRICE}
                    value={maxPrice}
                    step="100"
                    onChange={(e) => {
                      const value = Math.max(Number(e.target.value), minPrice + 500);
                      setMaxPrice(value);
                    }}
                    className="absolute pointer-events-none appearance-none w-full bg-transparent top-0 left-0 h-2 accent-blue-600 cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:appearance-none" 
                  />

                  {/* Price Indicator Matrix */}
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mt-5">
                    <span>৳{formatMoney(minPrice)}</span>
                    <span>৳{formatMoney(maxPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Brands */}
              <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Brands</h4>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {brands.map((brand) => (
                    <label key={brand?._id || brand?.name} className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600 group">
                      <input type="radio" name="brand" checked={selectedBrand === brand?.name} onChange={() => setSelectedBrand(brand?.name)} className="w-4 h-4 accent-[#F77426] border-slate-300 transition" />
                      <span className="group-hover:text-slate-900 transition">{brand?.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main>
            {/* Header control block */}
            <div className="mb-6 rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900 md:text-2xl">All Products</h1>
                <p className="mt-0.5 text-xs md:text-sm text-slate-400">Discover amazing products at the best prices</p>
              </div>
              
              <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-[#F77426] transition cursor-pointer">
                  <option value="popular">Sort by: Popular</option>
                  <option value="latest">Sort by: Latest</option>
                  <option value="low">Price: Low to High</option>
                  <option value="high">Price: High to Low</option>
                </select>
                
                <div className="flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-50">
                  <button type="button" onClick={() => setView("grid")} className={`h-8 w-8 flex items-center justify-center rounded-lg transition ${view === "grid" ? "bg-white text-[#F77426] shadow-sm font-bold" : "text-slate-400 hover:text-slate-600"}`}><FaThLarge className="w-4 h-4"/></button>
                  <button type="button" onClick={() => setView("list")} className={`h-8 w-8 flex items-center justify-center rounded-lg transition ${view === "list" ? "bg-white text-[#F77426] shadow-sm font-bold" : "text-slate-400 hover:text-slate-600"}`}><FaList className="w-4 h-4"/></button>
                </div>
              </div>
            </div>

            {/* Horizontal Slider Component */}
            <div className="mb-5 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.slice(0, 8).map((cat) => (
                <button key={cat?._id || cat?.name} type="button" onClick={() => setActiveCategory(cat?.name)} className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold tracking-wide transition-all ${activeCategory === cat?.name ? "bg-[#F77426] text-white shadow-md shadow-[#F77426]/20" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                  {cat?.name}
                </button>
              ))}
            </div>

            {/* Total items info */}
            <p className="mb-4 text-xs font-medium text-slate-400">Showing 1–{filteredProducts.length} of {products.length} products</p>

            {/* Products Canvas */}
            {filteredProducts.length === 0 ? (
              <div className="rounded-2xl bg-white py-16 px-4 text-center border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                <div className="text-4xl mb-2">🛍️</div>
                <h3 className="text-lg font-bold text-slate-800">No products found</h3>
                <p className="text-xs text-slate-400 mt-1">Try tweaking your filters or price configuration.</p>
                <button type="button" onClick={resetFilters} className="mt-4 bg-[#F77426] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#e0631a] transition">Reset Filters</button>
              </div>
            ) : (
              <div className={view === "grid" ? "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4" : "space-y-4"}>
                {filteredProducts.map((product) => <ShopProductCard key={product._id} product={product} view={view} />)}
              </div>
            )}
          </main>
        </div>
      </div>
    </section>
  );
};

// ShopProductCard Component
const ShopProductCard = ({ product, view }) => {
  const price = getFinalPrice(product);
  const regularPrice = getRegularPrice(product);
  const discount = getDiscountPercent(product);
  const stockNumber = Number(product?.stock || 0);
  const isOutOfStock = product?.status === "out_of_stock" || stockNumber === 0;
  const imageSrc = getProductImage(product);

  const discountBadge = discount > 0 && !isOutOfStock && (
    <span className="absolute left-2 top-2 z-10 rounded-md bg-red-500 px-2 py-0.5 text-[9px] md:text-[10px] font-black uppercase text-white tracking-wider">
      -{discount}%
    </span>
  );

  const wishlistButton = (
    <button className="absolute right-2 top-2 z-10 w-7 h-7 md:w-8 md:h-8 bg-white/95 backdrop-blur-sm rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 hover:scale-105 active:scale-95 transition-all shadow-sm">
      <FaRegHeart className="w-3.5 h-3.5" />
    </button>
  );

  if (view === "list") {
    return (
      <div className="group flex flex-col sm:flex-row gap-4 p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition relative">
        <Link to={`/product-details/${product._id}`} className="shrink-0 mx-auto sm:mx-0">
          <div className="relative w-36 h-36 rounded-xl bg-slate-50 flex items-center justify-center p-3 border border-slate-100/60 overflow-hidden">
            {discountBadge}
            <img src={imageSrc} alt={product?.productName} loading="lazy" className="max-h-full max-w-full object-contain mix-blend-multiply transition duration-300 group-hover:scale-102" onError={(e) => {e.currentTarget.src = FALLBACK_IMAGE;}} />
            {isOutOfStock && <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-xs font-bold text-slate-400">Out of stock</div>}
          </div>
        </Link>
        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            <Link to={`/product-details/${product._id}`}>
              <h3 className="text-sm md:text-base font-bold text-slate-800 hover:text-[#F77426] transition line-clamp-2">{product?.productName}</h3>
            </Link>
            <div className="flex items-center gap-1 mt-1.5">
              {[...Array(5)].map((_, i) => <FaStar key={i} className="h-3 w-3 text-amber-400" />)}
              <span className="text-xs text-slate-400 ml-1">(120)</span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-50">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-slate-900">৳{formatMoney(price)}</span>
              {regularPrice > price && <span className="text-xs font-medium text-slate-300 line-through">৳{formatMoney(regularPrice)}</span>}
            </div>
            <Link to={`/product-details/${product._id}`} className={`h-9 px-5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${isOutOfStock ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-[#F77426] text-white hover:bg-[#e0631a] shadow-md shadow-[#F77426]/10"}`}><HiOutlineShoppingCart className="text-base"/> {isOutOfStock ? "Details" : "Add to Cart"}</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-2.5 md:p-3 shadow-[0_4px_20px_rgb(0,0,0,0.01)] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-full">
      
      <div className="relative aspect-square w-full rounded-xl bg-slate-50/70 flex items-center justify-center p-4 border border-slate-100/40 overflow-hidden shrink-0">
        {discountBadge}
        {wishlistButton}
        
        <Link to={`/product-details/${product._id}`} className="w-full h-full flex items-center justify-center">
          <img src={imageSrc} alt={product?.productName} loading="lazy" className="max-h-full max-w-full object-contain mix-blend-multiply transition duration-500 group-hover:scale-105" onError={(e) => {e.currentTarget.src = FALLBACK_IMAGE;}} />
        </Link>
        
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px] flex items-center justify-center text-xs font-bold text-slate-400">
            Out of Stock
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 pt-3">
        <Link to={`/product-details/${product._id}`} className="block mb-1">
          <h3 className="line-clamp-2 min-h-[36px] text-xs md:text-sm font-semibold leading-tight text-slate-800 hover:text-[#F77426] transition">
            {product?.productName}
          </h3>
        </Link>

        <div className="flex items-center gap-0.5 mb-2">
          {[...Array(5)].map((_, i) => <FaStar key={i} className="h-2.5 w-2.5 text-amber-400" />)}
          <span className="text-[10px] text-slate-400 font-medium ml-1">(120)</span>
        </div>

        <div className="mt-auto flex items-baseline gap-1.5 flex-wrap">
          <span className="text-sm md:text-base font-bold text-slate-900">
            ৳{formatMoney(price)}
          </span>
          {regularPrice > price && (
            <span className="text-[10px] md:text-xs font-medium text-slate-300 line-through">
              ৳{formatMoney(regularPrice)}
            </span>
          )}
        </div>

        {stockNumber > 0 && stockNumber < 20 && !isOutOfStock && (
          <p className="mt-1 text-[9px] font-bold text-orange-500">Only {stockNumber} left!</p>
        )}

        <div className="mt-3 md:mt-0 md:h-0 md:opacity-0 group-hover:md:h-10 group-hover:md:opacity-100 group-hover:md:mt-3 transition-all duration-300 overflow-hidden">
          <Link
            to={`/product-details/${product._id}`}
            className={`flex h-9 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 ${
              isOutOfStock
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-[#F77426] text-white hover:bg-[#e0631a] shadow-md shadow-[#F77426]/10 active:scale-[0.98]"
            }`}
          >
            <HiOutlineShoppingCart className="text-base" />
            {isOutOfStock ? "Details" : "Add to Cart"}
          </Link>
        </div>

      </div>
    </div>
  );
};

export default AllProductsHeader;