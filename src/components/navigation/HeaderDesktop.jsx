// components/navigation/HeaderDesktop.jsx
import React, { useEffect, useRef, useState, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiSearch, FiUser, FiChevronDown, FiChevronRight } from "react-icons/fi";
import { HiOutlineMenuAlt2 as MenuIcon } from "react-icons/hi";
import { RiCustomerService2Line } from "react-icons/ri";
import { ShoppingCart, Grid } from "lucide-react";
import settingsApi, {
  fetchPublicSettings,
  fetchPublicHeaderSettings,
} from "../../hooks/settingsApi.jsx";

const HeaderDesktop = ({
  logo,
  searchTerm,
  setSearchTerm,
  productSearch,
  searchResults = [],
  cart,
  user,
  categories = [],
}) => {
  const navigate = useNavigate();
  const boxRef = useRef(null);
  const catRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [siteLogo, setSiteLogo] = useState("");
  const [siteBrand, setSiteBrand] = useState("Kroykori");
  const [headerConfig, setHeaderConfig] = useState(null);
  const [catOpen, setCatOpen] = useState(false);
  
  // মাউস কোন ক্যাটাগরির উপর আছে তা ট্র্যাক করার স্টেট (সাব-ক্যাটাগরি দেখানোর জন্য)
  const [activeHoverCat, setActiveHoverCat] = useState(null);

  /* ========== 1) Logo + Brand name load ========== */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetchPublicSettings();
        const data = res?.data || {};
        if (!alive) return;
        setSiteLogo(data.logoUrl || "");
        setSiteBrand(data.brandName || "Kroykori");
      } catch {}
    })();
    return () => (alive = false);
  }, []);

  /* ========== 2) Header settings load ========== */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetchPublicHeaderSettings();
        const data = res?.data || {};
        if (!alive) return;
        setHeaderConfig(data);
      } catch (e) {
        console.error("header settings load failed:", e);
      }
    })();
    return () => (alive = false);
  }, []);

  /* ========== 3) Search debounce ========== */
  useEffect(() => {
    const q = searchTerm?.trim();
    if (!q) {
      setOpen(false);
      return;
    }
    const t = setTimeout(() => {
      productSearch(q);
      setOpen(true);
    }, 250);
    return () => clearTimeout(t);
  }, [searchTerm, productSearch]);

  /* ========== 4) Click outside closes dropdowns ========== */
  useEffect(() => {
    const onDocClick = (e) => {
      if (!boxRef.current?.contains(e.target)) setOpen(false);
      if (!catRef.current?.contains(e.target)) {
        setCatOpen(false);
        setActiveHoverCat(null);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    const q = searchTerm.trim();
    if (!q) return;
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      <header className="hidden md:block font-sans bg-[#ffffff] border-b border-slate-100">
        
        {/* ================== FIRST ROW (Logo, Search, Support, Cart) ================== */}
        <div className="mx-auto w-full max-w-[1400px] px-6 h-[72px] flex items-center justify-between gap-8">
          
          {/* LEFT: Brand Logo */}
          <Link to="/" className="flex items-center shrink-0">
            {logo ? (
              <img className="h-16 w-auto object-contain" src={logo} alt={siteBrand} />
            ) : (
              <span className="text-xl font-black text-slate-800 tracking-tight">{siteBrand}</span>
            )}
          </Link>

          {/* CENTER: Search Input Infrastructure (অপরিবর্তিত) */}
          <div className="flex-1 max-w-[650px]">
            <div ref={boxRef} className="relative w-full">
              <form
                onSubmit={onSubmit}
                className="flex items-center w-full rounded-xl bg-slate-50 border border-slate-200/80 overflow-hidden transition-all focus-within:border-[#F77426] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#F77426]/10"
              >
                <input
                  type="text"
                  className="h-[42px] w-full px-5 bg-transparent text-xs font-medium text-slate-700 outline-none placeholder:text-slate-400"
                  placeholder="Search for items, products, customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => searchTerm && setOpen(true)}
                  aria-label="Search items"
                />
                <button
                  type="submit"
                  className="h-[42px] w-[50px] grid place-items-center bg-[#F77426] text-white hover:opacity-90 transition-opacity"
                  aria-label="Submit Search"
                >
                  <FiSearch className="h-4 w-4 stroke-[2.5]" />
                </button>
              </form>

              {/* Autocomplete Suggestions Stack */}
              {open && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white shadow-xl rounded-xl z-50 max-h-[320px] overflow-y-auto border border-slate-100 p-1">
                  {searchResults.length === 0 ? (
                    <div className="px-4 py-3 text-xs font-medium text-slate-400 text-center">
                      No results found matching your query
                    </div>
                  ) : (
                    searchResults.map((product) => (
                      <Link
                        key={product._id}
                        to={`/product-details/${product._id}`}
                        onClick={() => {
                          setSearchTerm("");
                          setOpen(false);
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-lg transition border-b last:border-b-0 border-slate-50"
                      >
                        <img
                          loading="lazy"
                          src={product.productImage?.[0] || "/placeholder.png"}
                          alt={product.productName}
                          className="w-9 h-9 rounded-lg object-cover border border-slate-100"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {product.productName}
                          </p>
                          {product.price != null && (
                            <p className="text-[11px] text-[#F77426] font-extrabold mt-0.5">
                              ৳ {product.price}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Support & Cart (অপরিবর্তিত) */}
          <div className="flex items-center gap-6 shrink-0">
            <Link
              to="/support"
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#F77426] flex items-center justify-center shadow-sm shadow-amber-100/50">
                <RiCustomerService2Line className="h-5 w-5" />
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">24/7 Support</p>
                <p className="text-xs font-black text-slate-800">Support Center</p>
              </div>
            </Link>

            <Link to="/cart" className="relative group">
              <div className="w-10 h-10 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded-xl flex items-center justify-center relative transition-colors">
                <ShoppingCart className="text-slate-700" size={18} />
                <span className="absolute -top-1.5 -right-1.5 bg-[#F77426] text-white text-[10px] font-black w-5 h-5 rounded-md flex items-center justify-center shadow-sm">
                  {cart?.length ?? 0}
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* ================== SECOND ROW (Premium Category Strip) ================== */}
        <div className="bg-white border-t border-slate-100">
          <div className="mx-auto w-full max-w-[1400px] px-6 h-[54px] flex items-center justify-between">
            
            <div className="flex items-center gap-8 text-xs font-bold text-slate-600">
              
              {/* Browse Categories dropdown menu trigger setup */}
              <div ref={catRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setCatOpen((v) => !v);
                    setActiveHoverCat(null);
                  }}
                  className="bg-[#F77426] text-white h-[38px] px-4 rounded-md font-bold flex items-center gap-2 hover:opacity-95 shadow-md shadow-orange-100 transition-all text-xs"
                >
                  <MenuIcon className="w-4 h-4 stroke-[2.5]" />
                  <span>All Categories</span>
                  <FiChevronDown className={`w-3.5 h-3.5 transform transition-transform ${catOpen ? "rotate-180" : ""}`} />
                </button>

                {/* ─── PREMIUM DESKTOP DROPDOWN LAYER (image_209361.png ম্যাচিং করা) ─── */}
                {catOpen && (
                  <div className="absolute left-0 z-50 mt-2 bg-white border border-gray-100/80 rounded-2xl shadow-2xl flex min-w-[300px] max-w-[700px] overflow-hidden">
                    
                    {/* Left Column: Parent Categories List */}
                    <div className="w-[280px] p-2 bg-white flex flex-col gap-1 border-r border-gray-50 max-h-[480px] overflow-y-auto">
                      {(categories?.length ? categories : []).map((c, index) => {
                        const catId = c._id || c.slug || c.name || index;
                        const isHovered = activeHoverCat?._id === c._id || activeHoverCat?.name === c.name;
                        
                        return (
                          <div
                            key={catId}
                            onMouseEnter={() => setActiveHoverCat(c)}
                            className={`group flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all ${
                              isHovered 
                                ? "bg-orange-50 text-[#F77426]" 
                                : "text-gray-700 hover:bg-gray-50/80"
                            }`}
                          >
                            <Link
                              to={`/category/${c.slug || c._id || c.name}`}
                              className="flex items-center gap-3 flex-1"
                              onClick={() => setCatOpen(false)}
                            >
                              {c.image ? (
                                <img className="h-5 w-5 object-contain" src={c.image} alt={c.name} />
                              ) : (
                                <span className="h-5 w-5 rounded bg-gray-100 flex items-center justify-center text-[10px]">📦</span>
                              )}
                              <span className="text-[13px] font-medium tracking-wide">{c.name || "Category"}</span>
                            </Link>
                            <FiChevronRight className={`text-xs ${isHovered ? "text-[#F77426]" : "text-gray-300"}`} />
                          </div>
                        );
                      })}

                      {/* View All Categories Button at Bottom */}
                      <div className="p-1 mt-1 border-t border-gray-50">
                        <button 
                          onClick={() => {
                            setCatOpen(false);
                            navigate("/all-categories");
                          }}
                          className="w-full flex items-center justify-center gap-2 bg-orange-50 border border-orange-100/50 rounded-xl py-2.5 text-xs font-bold text-[#F77426] hover:bg-orange-100/40 transition-all"
                        >
                          <Grid size={14} />
                          <span>View All Categories</span>
                        </button>
                      </div>
                    </div>

                    {/* Right Column: Flyout Subcategories (মাউস হোভার করলে ডানপাশে ওপেন হবে) */}
                    {activeHoverCat && activeHoverCat.subcategories && activeHoverCat.subcategories.length > 0 && (
                      <div className="w-[320px] p-5 bg-gray-50/50 max-h-[480px] overflow-y-auto animate-fadeIn">
                        <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-3 border-b border-gray-200/60 pb-1.5">
                          {activeHoverCat.name} Subcategories
                        </h4>
                        <div className="grid grid-cols-1 gap-1">
                          {activeHoverCat.subcategories.map((sub, sidx) => (
                            <Link
                              key={sub._id || sub.slug || sub.name || sidx}
                              to={`/subcategory/${sub.slug || sub._id || sub.name}`}
                              onClick={() => {
                                setCatOpen(false);
                                setActiveHoverCat(null);
                              }}
                              className="flex items-center justify-between px-2.5 py-2 text-[13px] text-gray-600 hover:text-[#F77426] hover:bg-white rounded-lg transition-all font-normal"
                            >
                              <span>{sub.name || sub}</span>
                              <FiChevronRight className="text-gray-300 text-[10px] opacity-0 group-hover:opacity-100" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>

              {/* Standard Nav Links (অপরিবর্তিত) */}
              <div className="flex items-center gap-6">
                <Link to="/" className="text-[#F77426] hover:opacity-80 transition font-black">Home</Link>
                
                <div className="relative group py-4">
                  <div className="hover:text-[#F77426] flex items-center gap-0.5 cursor-pointer transition">
                    <span>Shop</span>
                    <FiChevronDown className="w-3 h-3" />
                  </div>

                  <div className="absolute left-0 w-[600px] transition duration-200 z-50 opacity-0 hidden group-hover:block group-hover:opacity-100 top-full mt-0 pt-1">
                    <div className="bg-white shadow-xl rounded-2xl p-5 border border-slate-100 grid grid-cols-3 gap-4">
                      {Array.from({ length: 3 }).map((_, colIndex) => (
                        <div key={colIndex} className="space-y-3">
                          {(categories?.length ? categories : [])
                            .slice(colIndex * 4, colIndex * 4 + 4)
                            .map((cat, idx) => (
                              <div key={cat._id || cat.slug || cat.name || idx}>
                                <Link
                                  to={`/category/${cat.slug || cat._id || cat.name}`}
                                  className="block text-xs font-black text-indigo-900 hover:text-[#F77426] mb-1"
                                >
                                  {cat.name || "Category"}
                                </Link>
                                <div className="space-y-1 pl-1">
                                  {cat.subcategories?.slice(0, 3).map((sub, sidx) => (
                                    <Link
                                      key={sub._id || sub.slug || sub.name || sidx}
                                      to={`/subcategory/${sub.slug || sub._id || sub.name}`}
                                      className="block text-[11px] font-medium text-slate-400 hover:text-slate-700 transition"
                                    >
                                      {sub.name}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Link to="/about" className="hover:text-[#F77426] transition">About Us</Link>
                <Link to="/contact" className="hover:text-[#F77426] transition">Contact</Link>
              </div>

            </div>

            {/* Right Side: Account Actions Box (অপরিবর্তিত) */}
            <div className="text-xs font-bold text-slate-500">
              <Link 
                to={user ? "/dashboard/profile" : "/login"} 
                className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors"
              >
                <FiUser className="w-4 h-4 text-slate-400" />
                <span>{user ? user.name || "My Account" : "Login / Register"}</span>
              </Link>
            </div>

          </div>
        </div>

      </header>
    </>
  );
};

export default memo(HeaderDesktop);