import React, {
  useState,
  useEffect,
  useMemo,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { Zap, ChevronRight, ShoppingCart, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import useFlashSaleStatus from "../../hooks/useFlashSaleStatus";
import { getProductPricing } from "../../utils/pricing";

const API_BASE = (
  import.meta.env.VITE_APP_SERVER_URL || ""
).replace(/\/+$/, "");

const apiUrl = (path) =>
  `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

const resolveImage = (image) => {
  if (!image) return "/placeholder.png";

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("data:")
  ) {
    return image;
  }

  return apiUrl(image);
};

const fmtBDT = (n) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

export default function FlashSalePurple() {
  const { campaignActive, settings: flashSettings } = useFlashSaleStatus();

  const isCampaignActive = useMemo(() => {
    if (!flashSettings) {
      return Boolean(campaignActive);
    }

    const status = String(
      flashSettings.status || ""
    ).toLowerCase();

    const startTime = flashSettings.startDate
      ? new Date(flashSettings.startDate).getTime()
      : null;

    const endTime = flashSettings.endDate
      ? new Date(flashSettings.endDate).getTime()
      : null;

    const now = Date.now();

    const started =
      !startTime ||
      Number.isNaN(startTime) ||
      now >= startTime;

    const notEnded =
      !endTime ||
      Number.isNaN(endTime) ||
      now < endTime;

    return (
      status === "active" &&
      started &&
      notEnded
    );
  }, [campaignActive, flashSettings]);

  const {
    data: products = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["publicFlashSaleProducts"],
    queryFn: async () => {
      const res = await fetch(
        apiUrl("/api/products/public/flash-sale"),
        {
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.message ||
            `Failed to fetch products (${res.status})`
        );
      }

      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.items)) {
        return data.items;
      }
      if (Array.isArray(data?.products)) {
        return data.products;
      }

      return [];
    },

    enabled: isCampaignActive,

    staleTime: 0,
    gcTime: 1000 * 60 * 2,

    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,

    refetchInterval: isCampaignActive
      ? 5000
      : false,
  });

  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!flashSettings?.endDate) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const end = new Date(flashSettings.endDate).getTime();
      const distance = end - now;

      if (distance <= 0) {
        setCountdown({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });

        clearInterval(interval);
        return;
      }

      setCountdown({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        ),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [flashSettings?.endDate]);

  const padZero = (num) => String(num).padStart(2, "0");

  if (isLoading) {
    return (
      <div className="text-center py-10 text-slate-400 font-semibold">
        Synchronizing Flash Deals...
      </div>
    );
  }

  if (
    !isCampaignActive ||
    error ||
    products.length === 0
  ) {
    return null;
  }

  return (
    <div className="max-w-[1400px] mx-auto px-2 sm:px-4 md:px-6 py-6 font-sans">
      <div className="bg-gradient-to-r from-[#2e0854] via-[#4c1d95] to-[#2e0854] rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 shadow-xl relative overflow-hidden mb-6">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 sm:gap-4 relative z-10">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-400 text-[#2e0854] rounded-xl flex items-center justify-center shadow-lg shadow-amber-400/20 animate-bounce shrink-0">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-current stroke-[1.5]" />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
              Flash Sale
            </h2>
            <p className="text-[11px] sm:text-xs text-indigo-200 font-medium tracking-wide mt-0.5">
              Exclusive deals. Limited time only!
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 bg-black/20 backdrop-blur-md px-5 py-2 rounded-2xl border border-white/10 shadow-inner self-center sm:self-auto">
          <span className="text-[9px] sm:text-[10px] text-indigo-200 font-bold uppercase tracking-widest">
            Ends In
          </span>

          <div className="flex items-center gap-1.5 sm:gap-2 text-white font-mono font-black text-base sm:text-lg md:text-xl">
            <div className="flex flex-col items-center">
              <span className="bg-white text-slate-900 px-2 py-1 rounded-lg shadow-md min-w-[36px] text-center">
                {padZero(countdown.days)}
              </span>
              <span className="text-[9px] font-sans font-bold text-indigo-300 mt-1 uppercase">
                Days
              </span>
            </div>

            <span className="text-amber-400 animate-pulse -mt-4">:</span>

            <div className="flex flex-col items-center">
              <span className="bg-white text-slate-900 px-2 py-1 rounded-lg shadow-md min-w-[36px] text-center">
                {padZero(countdown.hours)}
              </span>
              <span className="text-[9px] font-sans font-bold text-indigo-300 mt-1 uppercase">
                Hours
              </span>
            </div>

            <span className="text-amber-400 animate-pulse -mt-4">:</span>

            <div className="flex flex-col items-center">
              <span className="bg-white text-slate-900 px-2 py-1 rounded-lg shadow-md min-w-[36px] text-center">
                {padZero(countdown.minutes)}
              </span>
              <span className="text-[9px] font-sans font-bold text-indigo-300 mt-1 uppercase">
                Mins
              </span>
            </div>

            <span className="text-amber-400 animate-pulse -mt-4">:</span>

            <div className="flex flex-col items-center">
              <span className="bg-white text-slate-900 px-2 py-1 rounded-lg shadow-md min-w-[36px] text-center">
                {padZero(countdown.seconds)}
              </span>
              <span className="text-[9px] font-sans font-bold text-indigo-300 mt-1 uppercase">
                Secs
              </span>
            </div>
          </div>
        </div>

        <Link
          to="/flash-sale"
          className="bg-white text-[#4c1d95] hover:bg-amber-400 hover:text-[#2e0854] px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md transition-all duration-300 group shrink-0 relative z-10 w-full md:w-auto"
        >
          View All Deals
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform stroke-[2.5]" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">
        {products.map((product) => {
          const hasImage =
            product?.productImage && product.productImage.length > 0;

          const imgUrl = hasImage
            ? Array.isArray(product.productImage)
              ? product.productImage[0]
              : product.productImage
            : "/placeholder.png";

          const { price, regularPrice, discount, flashActive } =
            getProductPricing(
              product,
              isCampaignActive
            );

          const stock = Number(product?.stock || 0);
          const isStockOut = stock <= 0;

          const soldPercent = !isStockOut
            ? Math.max(15, Math.min(85, 100 - Math.round((stock / 40) * 100)))
            : 100;

          return (
            <div
              key={product._id}
              className="bg-white border border-slate-100 rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative"
            >
              {flashActive && discount > 0 && !isStockOut && (
                <span className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 bg-rose-500 text-white font-black text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg shadow-md shadow-rose-100 z-10 tracking-wide">
                  -{discount}%
                </span>
              )}

              <button className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 p-1.5 sm:p-2 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg sm:rounded-xl border border-slate-100 transition-colors z-10 shadow-sm group/heart">
                <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover/heart:fill-rose-500 transition-all" />
              </button>

              <Link
                to={`/product-details/${product._id}`}
                className="w-full h-32 sm:h-44 bg-slate-50/50 rounded-xl sm:rounded-2xl flex items-center justify-center p-2 sm:p-4 overflow-hidden relative mb-2 sm:mb-4"
              >
                <img
                  src={resolveImage(imgUrl)}
                  alt={product.productName}
                  className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105 mix-blend-multiply"
                  loading="lazy"
                />
              </Link>

              <div className="space-y-1">
                <Link to={`/product-details/${product._id}`} className="block">
                  <h4 className="text-xs sm:text-sm font-black text-slate-800 tracking-tight truncate hover:text-[#4c1d95] transition-colors">
                    {product.productName}
                  </h4>
                </Link>

                <p className="text-[10px] sm:text-xs text-slate-400 font-bold tracking-wide truncate">
                  {product?.brand || "Premium Brand"}
                </p>

                <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 pt-0.5">
                  <span className="text-sm sm:text-base font-black text-rose-600">
                    {fmtBDT(price)}
                  </span>

                  {regularPrice && !isStockOut && (
                    <span className="text-[10px] sm:text-xs font-semibold text-slate-300 line-through">
                      {fmtBDT(regularPrice)}
                    </span>
                  )}
                </div>

                <div className="pt-1.5 space-y-1">
                  <div className="w-full h-1.5 sm:h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200/40">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        isStockOut
                          ? "bg-rose-500"
                          : "bg-gradient-to-r from-purple-600 to-rose-500"
                      }`}
                      style={{ width: `${isStockOut ? 100 : soldPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[8px] sm:text-[10px] font-black tracking-wide">
                    <span className="text-slate-400 uppercase">
                      {isStockOut ? "100%" : `${soldPercent}%`} Sold
                    </span>

                    <span
                      className={`uppercase font-extrabold ${
                        isStockOut
                          ? "text-rose-600 font-black animate-pulse"
                          : "text-orange-500"
                      }`}
                    >
                      {isStockOut ? "STOCK OUT" : `ONLY ${stock} LEFT`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 sm:pt-4">
                <Link
                  to={isStockOut ? "#" : `/product-details/${product._id}`}
                  className="block"
                >
                  <button
                    disabled={isStockOut}
                    className="w-full bg-[#4c1d95] hover:bg-amber-400 text-white hover:text-[#2e0854] disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed font-black py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl text-[10px] sm:text-xs shadow-lg shadow-purple-50 transition-all duration-300 flex items-center justify-center gap-1.5 tracking-wider uppercase"
                  >
                    <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
                    {isStockOut ? "STOCK OUT" : "Buy Now"}
                  </button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}