// components/Header/HeaderMobile.jsx
import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiMenu,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiChevronRight,
  FiShoppingCart,
  FiGrid,
  FiUser,
} from "react-icons/fi";

function HeaderMobile({
  logo,
  cart,
  user,
  categories = [],
  mobileMenue = [],
  handleLogout,
  searchTerm,
  setSearchTerm,
  productSearch,
  searchResults,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);

  // local state for search UX
  const [openResults, setOpenResults] = useState(false);
  const [typing, setTyping] = useState(false);
  const debRef = useRef(null);
  const nav = useNavigate();

  const baseBtn =
    "inline-flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const iconBtn =
    baseBtn +
    " w-10 h-10 bg-white/90 border border-gray-200 active:scale-[.98]";
  const cartCount = Array.isArray(cart) ? cart.length : 0;

  // সার্চ ফাংশনালিটি (যা আগে ছিল হুবহু তাই রাখা হয়েছে)
  const onType = (val) => {
    setSearchTerm(val);
    const q = val.trim();
    if (!q) {
      setTyping(false);
      setOpenResults(false);
      if (debRef.current) clearTimeout(debRef.current);
      return;
    }
    setTyping(true);
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => {
      setOpenResults(true);
      setTyping(false);
    }, 250);
  };

  const onCloseSearch = () => {
    setOpenResults(false);
    setTyping(false);
    if (debRef.current) clearTimeout(debRef.current);
  };

  const goToProduct = (id) => {
    onCloseSearch();
    setSearchTerm("");
    nav(`/product-details/${id}`);
  };

  const onSubmitSearch = (e) => {
    e?.preventDefault?.();
    const q = searchTerm.trim();
    if (!q) return;
    onCloseSearch();
    nav(`/search?q=${encodeURIComponent(q)}`);
  };

  const toggleCategory = (catName) => {
    setExpandedCategory(expandedCategory === catName ? null : catName);
  };

  return (
    // ফিক্স ১: প্যারেন্ট থেকে min-h-screen এবং ব্যাকগ্রাউন্ড কালার বাদ দেওয়া হয়েছে যেন পেজের কন্টেন্ট নষ্ট না হয়
    <div className="md:hidden block relative w-full bg-white">
      {/* Header Top Bar & Search */}
      <div className="relative bg-white shadow-sm border-b border-gray-100 z-50">
        <div className="flex justify-between items-center gap-2 w-full px-3.5 py-2">
          <button
            type="button"
            onClick={() => setIsMenuOpen((p) => !p)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className={iconBtn}
          >
            {isMenuOpen ? (
              <FiX className="text-gray-700 text-xl" />
            ) : (
              <FiMenu className="text-gray-700 text-xl" />
            )}
          </button>

          <Link
            to="/"
            aria-label="Go to home"
            className="flex items-center justify-center w-[140px] sm:w-[160px] -ml-1"
          >
            <img
              className="h-14 w-full object-contain"
              src={logo}
              alt="Logo"
              loading="eager"
            />
          </Link>

          <div className="flex items-center gap-1.5">
  {/* Profile */}
  <Link
    to={user ? "/dashboard/profile" : "/login"}
    aria-label={user ? "My Profile" : "Login"}
    title={user ? "My Profile" : "Login"}
    className={`${iconBtn} ${
      user
        ? "border-orange-200 bg-orange-50"
        : "hover:border-orange-200 hover:bg-orange-50"
    }`}
  >
    <FiUser
      className={`text-xl ${
        user ? "text-orange-600" : "text-gray-700"
      }`}
    />
  </Link>

  {/* Cart */}
  <Link
    to="/cart"
    aria-label="Cart"
    title="Cart"
    className={`${iconBtn} relative hover:border-orange-200 hover:bg-orange-50`}
  >
    <FiShoppingCart className="text-gray-700 text-xl" />

    {cartCount > 0 && (
      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-bold text-white">
        {cartCount > 99 ? "99+" : cartCount}
      </span>
    )}
  </Link>
</div>
        </div>

        {/* ইমেজের ডিজাইন অনুযায়ী কাস্টমাইজড সার্চ বার */}
        <div className="px-3 pb-3 relative">
          <form onSubmit={onSubmitSearch}>
            <div className="flex items-center w-full bg-[#F77426] p-1.5 rounded-md shadow-sm">
              <div className="flex-1 flex items-center bg-white rounded-l-md h-10 px-3">
                <input
                  type="text"
                  placeholder="Search for products..."
                  className="w-full text-[14px] bg-transparent outline-none text-gray-700 placeholder-gray-400"
                  value={searchTerm}
                  onChange={(e) => onType(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="bg-[#111111] hover:bg-black text-white h-10 px-4 rounded-r-md flex items-center justify-center transition-colors"
              >
                <FiSearch className="text-white text-lg" />
              </button>
            </div>
          </form>

          {/* সার্চ রেজাল্ট ড্রপডাউন */}
          {!typing && openResults && (
            <div className="absolute left-3 right-3 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-gray-100 max-h-80 overflow-y-auto">
              <MobileSearchResults
                results={searchResults}
                searchTerm={searchTerm}
                onSelect={goToProduct}
              />
            </div>
          )}
        </div>
      </div>

      {/* Premium Drawer Menu */}
      {/* ফিক্স ২: এখানে absolute overlay পজিশনিং করা হয়েছে, যা মেনু বন্ধ থাকলে উধাও হয়ে যাবে */}
      {isMenuOpen && (
        <div className="absolute left-0 right-0 top-full z-[60] bg-gray-50 shadow-xl border-t border-gray-100 p-4 max-h-[calc(100vh-140px)] overflow-y-auto pb-20">
          <div className="flex flex-col gap-2.5 max-w-md mx-auto">
            {categories.map((category) => {
              const isExpanded = expandedCategory === category.name;

              return (
                <div
                  key={category._id || category.name}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  {/* Parent Category Row */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.name)}
                    className={`w-full flex items-center justify-between px-4 py-4 transition-all ${
                      isExpanded
                        ? "bg-orange-50/60 text-orange-600 font-semibold"
                        : "text-gray-800 font-medium hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {category.image ? (
                        <img
                          className="h-6 w-6 object-contain"
                          src={category.image}
                          alt={category.name}
                        />
                      ) : (
                        <span className="h-6 w-6 rounded bg-gray-100 flex items-center justify-center text-xs">
                          📦
                        </span>
                      )}
                      <span className="text-[15px] tracking-wide">
                        {category.name}
                      </span>
                    </div>

                    {isExpanded ? (
                      <FiChevronUp className="text-lg text-orange-600" />
                    ) : (
                      <FiChevronDown className="text-lg text-gray-400" />
                    )}
                  </button>

                  {/* Subcategories Dropdown */}
                  {isExpanded && (
                    <div className="bg-white border-t border-orange-100/50 divide-y divide-gray-50">
                      {category.subcategories &&
                      category.subcategories.length > 0
                        ? category.subcategories.map((sub, sIdx) => (
                            <Link
                              key={sIdx}
                              to={`/category/${category.name}/${sub.name || sub}`}
                              onClick={() => setIsMenuOpen(false)}
                              className="flex items-center justify-between px-6 py-3.5 text-[14px] text-gray-600 hover:bg-gray-50/80 hover:text-orange-500 transition-colors"
                            >
                              <span className="font-light">
                                {sub.name || sub}
                              </span>
                              <FiChevronRight className="text-gray-300 text-xs" />
                            </Link>
                          ))
                        : [
                            "Clothing",
                            "Footwear",
                            "Accessories",
                            "Personal Care",
                          ].map((dummySub, dIdx) => (
                            <Link
                              key={dIdx}
                              to={`/category/${category.name}`}
                              onClick={() => setIsMenuOpen(false)}
                              className="flex items-center justify-between px-6 py-3.5 text-[14px] text-gray-600 hover:bg-gray-50/80 hover:text-orange-500 transition-colors"
                            >
                              <span className="font-light">{dummySub}</span>
                              <FiChevronRight className="text-gray-300 text-xs" />
                            </Link>
                          ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* View All Categories Button */}
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                nav("/categories");
              }}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-orange-50 border border-orange-100 rounded-xl py-3.5 text-[15px] font-semibold text-orange-600 active:scale-[0.99] transition-all"
            >
              <FiGrid className="text-lg" />
              <span>View All Categories</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// MobileSearchResults component (যা আগে ছিল হুবху তাই রাখা হয়েছে)
const MobileSearchResults = React.memo(function MobileSearchResults({
  results = [],
  searchTerm,
  onSelect,
}) {
  const items = Array.isArray(results) ? results.slice(0, 20) : [];
  if (!searchTerm?.trim()) return null;
  if (!items.length) {
    return (
      <div className="px-4 py-3 text-sm text-gray-500">No results found</div>
    );
  }

  return (
    <ul className="divide-y divide-gray-100 overflow-hidden">
      {items.map((p) => (
        <button
          key={p._id}
          type="button"
          onClick={() => onSelect(p._id)}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-left active:bg-gray-50"
        >
          <img
            src={
              Array.isArray(p.productImage)
                ? p.productImage[0] || "/placeholder.png"
                : p.productImage || "/placeholder.png"
            }
            alt={p.productName}
            className="w-11 h-11 rounded-lg object-cover border border-gray-100"
            loading="lazy"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-gray-800 truncate">
              {p.productName}
            </p>
            {p.price != null && (
              <p className="text-xs font-semibold text-orange-600 mt-0.5">
                ৳ {p.price}
              </p>
            )}
          </div>
        </button>
      ))}
    </ul>
  );
});

export default React.memo(HeaderMobile);
