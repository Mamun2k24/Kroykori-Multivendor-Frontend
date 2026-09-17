import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Link } from "react-router-dom";
import { getRecentlyViewed, clearRecentlyViewed } from "../utils/recentlyViewed";

const fmtBDT = (n) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

export default function RecentlyViewed({ title = "Recently Viewed" }) {
  const [items, setItems] = useState(() => getRecentlyViewed());
  const trackRef = useRef(null);

  const canShow = items?.length > 0;

  useEffect(() => {
    const sync = () => setItems(getRecentlyViewed());
    window.addEventListener("recentlyViewedUpdated", sync);
    window.addEventListener("storage", sync); // other tabs
    return () => {
      window.removeEventListener("recentlyViewedUpdated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const scrollByCard = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    // scroll by container width (nice UX)
    const amount = Math.max(280, el.clientWidth * 0.8);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  const list = useMemo(() => items || [], [items]);

  if (!canShow) return null;

  return (
 <section className="my-3 rounded-lg border border-gray-100 bg-gradient-to-br from-white to-indigo-50/40 shadow-sm">
    <div className="flex items-center justify-between px-5 sm:px-7 py-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">Your recently explored products</p>
      </div>

      <button
        onClick={() => {
          clearRecentlyViewed();
          setItems([]);
        }}
        className="rounded-full bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition"
      >
        Clear
      </button>
    </div>

    <div className="relative px-2 pb-6">
      <button
        onClick={() => scrollByCard(-1)}
        className="absolute left-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-gray-100 bg-white/90 shadow-lg backdrop-blur hover:bg-indigo-600 hover:text-white transition"
        aria-label="Scroll left"
      >
        <FiChevronLeft size={22} />
      </button>

      <div
        ref={trackRef}
        className="flex gap-5 overflow-x-auto scroll-smooth px-14 py-3 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {list.map((p) => {
          const img = p?.productImage;
          const to = `/product-details/${p._id}`;

          return (
            <Link
              to={to}
              key={p._id}
              className="group w-[190px] shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              title={p?.productName}
            >
              <div className="relative h-36 bg-gray-50">
                {img ? (
                  <img
                    src={img}
                    alt={p.productName}
                    className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-xs text-gray-400">
                    No image
                  </div>
                )}

                <span className="absolute left-3 top-3 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  Viewed
                </span>
              </div>

              <div className="p-4">
                <p className="min-h-[40px] text-sm font-semibold leading-5 text-gray-900 line-clamp-2 group-hover:text-indigo-600">
                  {p?.productName || "Unnamed"}
                </p>

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-base font-extrabold text-indigo-600">
                    {fmtBDT(p?.price || 0)}
                  </p>

                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600">
                    View
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <button
        onClick={() => scrollByCard(1)}
        className="absolute right-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-gray-100 bg-white/90 shadow-lg backdrop-blur hover:bg-indigo-600 hover:text-white transition"
        aria-label="Scroll right"
      >
        <FiChevronRight size={22} />
      </button>
    </div>
  </section>
  );
}
