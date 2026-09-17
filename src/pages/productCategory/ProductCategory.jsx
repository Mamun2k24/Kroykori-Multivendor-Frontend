import React, { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Loader from "../../Spinner/Loader";

const FALLBACK_IMAGE = "https://via.placeholder.com/300x300?text=Category";

const toAbsoluteUrl = (baseUrl, path) => {
  if (!path) return "";
  const s = String(path);
  if (s.startsWith("http://") || s.startsWith("https://")) {
    return s;
  }
  const baseClean = String(baseUrl || "").replace(/\/$/, "");
  return s.startsWith("/") ? `${baseClean}${s}` : `${baseClean}/${s}`;
};

const ProductCategory = () => {
  const BASE = import.meta.env.VITE_APP_SERVER_URL;
  const scrollRef = useRef(null);

  const {
    data: categories = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch(`${BASE}api/categories`);
      if (!res.ok) {
        throw new Error("Failed to load categories");
      }
      return res.json();
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  // Carousel Scroll Handling
  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      
      let scrollAmount;
      if (clientWidth < 768) {
        const itemWidth = (clientWidth - 32) / 3.3;
        scrollAmount = itemWidth * 3;
      } else {
        scrollAmount = clientWidth * 0.8; 
      }
      
      scrollRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (isLoading) return <Loader />;

  if (error) {
    return (
      <div className="py-10 text-center text-red-500 font-medium">
        Error loading categories
      </div>
    );
  }

  return (
    <section className="py-6 bg-white overflow-hidden font-quicksand">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Heading Section */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4.5 h-4.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg md:text-2xl font-bold text-slate-900 tracking-tight">
                Shop By Category
              </h2>
              <p className="text-[11px] md:text-sm text-gray-500 mt-0.5">
                Browse popular categories
              </p>
            </div>
          </div>

          {/* See All Button */}
          <Link
            to="/categories"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-xs md:text-sm font-semibold text-indigo-600 rounded-full transition-all duration-200"
          >
            See All
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>

        {/* --- ক্যারোসেল এবং অ্যারো বাটনের জন্য মেইন রিলেটিভ র‍্যাপার --- */}
        <div className="relative w-full flex items-center group/carousel">
          
          {/* Left Arrow (সরাসরি ইমেজের ভার্টিক্যাল সেন্টার বরাবর এলাইন্ড) */}
          <button
            onClick={() => handleScroll("left")}
            className="absolute left-1 z-10 w-8 h-8 md:w-10 md:h-10 bg-white/95 backdrop-blur-sm border border-slate-200 text-slate-700 rounded-full flex items-center justify-center shadow-md active:scale-95 hover:bg-indigo-600 hover:text-white transition-all duration-200"
            style={{ top: 'calc(56px - 16px)' }} /* ডেক্সটপ ও মোবাইলের ইমেজের সঠিক সেন্টারিং ফিক্স */
            aria-label="Scroll Left"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>

          {/* Right Arrow (সরাসরি ইমেজের ভার্টিক্যাল সেন্টার বরাবর এলাইন্ড) */}
          <button
            onClick={() => handleScroll("right")}
            className="absolute right-1 z-10 w-8 h-8 md:w-10 md:h-10 bg-white/95 backdrop-blur-sm border border-slate-200 text-slate-700 rounded-full flex items-center justify-center shadow-md active:scale-95 hover:bg-indigo-600 hover:text-white transition-all duration-200"
            style={{ top: 'calc(56px - 16px)' }} /* ডেক্সটপ ও মোবাইলের ইমেজের সঠিক সেন্টারিং ফিক্স */
            aria-label="Scroll Right"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          {/* Carousel Container */}
          <div
            ref={scrollRef}
            className="
              flex
              gap-3
              md:gap-5
              overflow-x-auto
              scrollbar-hide
              snap-x
              snap-mandatory
              scroll-smooth
              py-2
              px-2
              w-full
            "
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categories.map((cat, idx) => {
              const to = `/category/${encodeURIComponent(cat?.slug || cat?.name)}`;
              const imgSrc = toAbsoluteUrl(BASE, cat?.image);

              return (
                <Link
                  key={cat?._id || idx}
                  to={to}
                  className="
                    group
                    text-center
                    flex-shrink-0
                    w-[calc((100vw-56px)/3)] 
                    md:w-[120px]
                    snap-start
                    focus:outline-none
                    flex
                    flex-col
                    items-center
                  "
                >
                  {/* Image Wrapper */}
                  <div
                    className="
                      w-20
                      h-20
                      md:w-28
                      md:h-28
                      rounded-full
                      overflow-hidden
                      bg-slate-50
                      flex
                      items-center
                      justify-center
                      p-0.5
                      md:p-1
                      border-2
                      border-slate-100
                      transition-all
                      duration-300
                      group-hover:border-indigo-500
                      group-hover:shadow-xl
                      group-hover:scale-105
                    "
                  >
                    <img
                      src={imgSrc || FALLBACK_IMAGE}
                      alt={cat?.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full rounded-full object-cover bg-white"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                  </div>

                  {/* Category Name */}
                  <h3
                    className="
                      mt-2.5
                      text-[11px]
                      md:text-sm
                      font-semibold
                      text-slate-700
                      group-hover:text-indigo-600
                      transition-colors
                      duration-200
                      line-clamp-2
                      px-0.5
                      h-9
                      overflow-hidden
                    "
                  >
                    {cat?.name}
                  </h3>
                </Link>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
};

export default ProductCategory;