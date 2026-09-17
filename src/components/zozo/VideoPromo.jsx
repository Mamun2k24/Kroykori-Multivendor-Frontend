import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play, X, ShieldCheck, Zap, Star } from "lucide-react";

// ইউটিউব রেগুলার লিংক থেকে এম্বেড লিংক জেনারেট করার হেল্পার ফাংশন
function getYouTubeEmbed(url) {
  if (!url) return "";
  const m1 = url.match(/v=([^&]+)/);
  const m2 = url.match(/youtu\.be\/([^?]+)/);
  const id = m1?.[1] || m2?.[1] || "";
  return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : "";
}

export default function VideoPromo() {
  const [isOpen, setIsOpen] = useState(false);
  const BASE = import.meta.env.VITE_APP_SERVER_URL;

  // --- API Connection: Fetch public active videos ---
  const { data: videosData, isLoading } = useQuery({
    queryKey: ["publicActiveVideos"],
    queryFn: async () => {
      const res = await fetch(`${BASE}api/videos`);
      if (!res.ok) throw new Error("Failed to load video promo assets");
      return res.json();
    },
    staleTime: 1000 * 60 * 10, // ১০ মিনিট ক্যাশ থাকবে
  });

  // সর্বশেষ আপলোড করা একটিভ ভিডিওটি সিলেক্ট করা হচ্ছে
  const activeVideo = useMemo(() => {
    const list = videosData?.items || [];
    return list.length > 0 ? list[0] : null;
  }, [videosData]);

  // ইউটিউব ইউআরএল কনভার্ট
  const videoEmbedUrl = useMemo(() => {
    return activeVideo?.youtubeUrl ? getYouTubeEmbed(activeVideo.youtubeUrl) : "";
  }, [activeVideo]);

  // ডেটা লোড হওয়ার সময় সুন্দর অ্যানিমেটেড স্কেলেটন লোডার
  if (isLoading) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-10">
        <div className="w-full h-[200px] md:h-[300px] rounded-3xl bg-slate-100 animate-pulse flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-slate-200" />
        </div>
      </div>
    );
  }

  // যদি ডাটাবেজে কোনো একটিভ ভিডিও না থাকে, তাহলে ব্যানারটি হাইড থাকবে
  if (!activeVideo) return null;

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-10 font-sans">
      
      {/* ================== MAIN VIDEO BANNER CONTAINER ================== */}
      <div className="relative w-full h-[200px] md:h-[300px] rounded-3xl overflow-hidden shadow-lg border border-slate-100 group">
        
        {/* ব্যাকগ্রাউন্ড প্রমোশনাল ইমেজ */}
        <img 
          src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80" 
          alt={activeVideo?.title || "Shopping Experience"} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
        />

        {/* ডার্ক গ্রেডিয়েন্ট ওভারলে ওভার ইমেজ */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/40 to-black/30 transition-opacity" />

        {/* টপ লেফট কর্নার ট্রাস্ট ব্যাজ */}
        <div className="absolute top-4 left-4 md:top-6 md:left-6 flex gap-2 z-10">
          <span className="bg-orange-600/90 backdrop-blur-md text-white text-[10px] md:text-xs font-black px-3 py-1 rounded-xl shadow-md flex items-center gap-1.5 tracking-wide uppercase">
            <Zap className="w-3.5 h-3.5 fill-current" /> Live Experience
          </span>
          <span className="bg-white/90 backdrop-blur-md text-slate-800 text-[10px] md:text-xs font-bold px-3 py-1 rounded-xl shadow-md flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Trusted
          </span>
        </div>

        {/* ================== CENTER INTERACTIVE PLAY TRIGGER ================== */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
          <button 
            type="button"
            onClick={() => {
              if (videoEmbedUrl) setIsOpen(true);
            }}
            className="w-16 h-16 md:w-20 md:h-20 bg-rose-500/90 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group/btn relative"
            aria-label="Play Promotional Video"
          >
            {/* রিপল অ্যানিমেশন ইফেক্ট */}
            <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-40 group-hover/btn:opacity-60" />
            <Play className="w-6 h-6 md:w-8 md:h-8 fill-current translate-x-0.5 relative z-10" />
          </button>
          
          <div className="text-center text-white space-y-1 px-4 drop-shadow-md max-w-2xl mx-auto">
            {/* 🌟 ডাটাবেজ থেকে ডাইনামিক টাইটেল */}
            <h3 className="text-lg md:text-2xl font-black tracking-tight line-clamp-1">
              {activeVideo?.title}
            </h3>
            {/* 🌟 ডাটাবেজ থেকে ডাইনামিক ডেসক্রিপশন */}
            <p className="text-xs md:text-sm font-medium text-slate-200 line-clamp-2">
              {activeVideo?.description || "Watch how we process, pack and safely deliver your absolute satisfaction."}
            </p>
          </div>
        </div>

        {/* বটম ইনফরমেশন স্ট্রিপ বার */}
        <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:right-6 md:left-6 flex items-center justify-between text-white z-10 bg-black/30 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/5 text-[11px] md:text-xs font-bold hidden sm:flex">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-400 fill-current" /> 
            4.9/5 Rated by Thousands of Verified Buyers
          </div>
          <a 
            href="https://youtube.com" 
            target="_blank" 
            rel="noreferrer" 
            className="underline cursor-pointer hover:text-orange-400 transition-colors"
          >
            Visit Our Youtube Channel
          </a>
        </div>

      </div>

      {/* ================== LIGHTWEIGHT MODERN LIGHTBOX / MODAL ================== */}
      {isOpen && videoEmbedUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* ব্যাকগ্রাউন্ড ব্লার ওভারলে */}
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* ভিডিও বক্স ফ্রেম */}
          <div className="relative bg-black aspect-video w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl border border-white/10 transform transition-all z-10 animate-in fade-in zoom-in-95 duration-200">
            
            {/* ক্লোজ কন্ট্রোল বাটন */}
            <button 
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black/90 text-white rounded-full transition-colors z-50 border border-white/10"
              title="Close Video"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Embed Video Iframe Layout */}
            <iframe
              src={videoEmbedUrl}
              title={activeVideo?.title || "Promo Video"}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

    </div>
  );
}