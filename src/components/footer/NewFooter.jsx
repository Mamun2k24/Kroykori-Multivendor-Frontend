import React, { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import useGeneralSettings from "../../hooks/useGeneralSettings"; // 🌟 আপনার নতুন হুকটি ইমপোর্ট করা হলো
import bkash from "../../assets/bkash.jfif";
import nagod from "../../assets/nagod.jfif";
import cod from "../../assets/cod.jfif";
import {
  FiPhone,
  FiMapPin,
  FiMail,
  FiClock,
  FiChevronUp,
  FiChevronDown,
} from "react-icons/fi";
import { RiFacebookFill, RiYoutubeFill, RiInstagramFill } from "react-icons/ri";
import { FaWhatsapp } from "react-icons/fa6";

export default function NewFooter() {
  // 🌟 নতুন হুক থেকে ডেটা তুলে আনা হচ্ছে
  const { data: settings, isLoading } = useGeneralSettings();

  // Accordion state for mobile view
  const [openSections, setOpenSections] = useState({
    quickLinks: false,
    categories: false,
    support: false,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // 🌟 হুকের নতুন ডেটা স্ট্রাকচার অনুযায়ী ম্যাপিং
  const company = "Kroykori";
  const phoneDisplay = settings?.phone || "01635-129195";
  const phoneTel = String(settings?.phone || "01635129195").replace(/\s/g, "");
  const email = settings?.email || "support@Kroykori.com";
  const address = settings?.address || "Gulshan Badda Link Road, Dhaka, Bangladesh";
  const descriptionText = settings?.description || "Kroykori brings you trusted products, great deals, and a smooth online shopping experience — with fast support and easy ordering across Bangladesh.";
  const openHours = settings?.openTime || "Sat-Thu (9.00AM - 10.00PM)";

  // 🌟 হোয়াটসঅ্যাপ লিঙ্কের সঠিক ফরম্যাটিং
  const waNumberOnly = String(settings?.whatsappUrl || "8801635129195").replace(/[^\d]/g, "");
  const whatsappLink = waNumberOnly ? `https://wa.me/${waNumberOnly}` : "#";

  // 🌟 ডাইনামিক লোগো পাথ (Dashboard থেকে আসা ImgBB লিংক অথবা লোকাল ফলব্যাক লোগো)
  const logoSrc = settings?.logoUrl || logo;

  const CONTACT = {
    company,
    tagline: "Online Shop • Trusted Products • Fast Delivery",
    address,
    phoneDisplay,
    phoneTel,
    email,
    hours: openHours,
  };

  const SOCIALS = {
    facebookPage: settings?.facebookUrl || "https://web.facebook.com/Kroykoribd",
    youtube: settings?.youtubeUrl || "#",
    instagram: settings?.instagramUrl || "https://www.instagram.com/Kroykoribd",
    whatsapp: whatsappLink,
  };

  // সেটিংস লোড হওয়ার সময় ফুটার ব্ল্যাংক বা ছোট একটা প্লেসহোল্ডার দেখাতে পারেন
  if (isLoading) {
    return <div className="bg-[#0B1341] h-20 w-full animate-pulse" />;
  }

  return (
    /* 🎨 ব্যাকগ্রাউন্ড কালার ডার্ক নেভি ব্লু (#0B1341) এবং টেক্সট সাদা */
    <footer className="bg-[#0B1341] text-white font-sans tracking-wide md:pt-10 pt-10 pb-6 relative border-t border-white/5">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        
        {/* ================== MAIN GRID LAYOUT ================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 pb-12 border-b border-white/10">      
          
          {/* Col 1: Brand Logo & Communication Details (4 Columns) */}
          <div className="lg:col-span-4 space-y-5">
            <Link to="/" className="inline-block">
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt={`${CONTACT.company} logo`}
                  className="h-11 w-full object-contain object-left rounded"
                  onError={(e) => (e.currentTarget.src = logo)}
                />
              ) : (
                <span className="text-2xl font-black text-white">{CONTACT.company}</span>
              )}
            </Link>
            
            {/* ডাইনামিক ওয়েবসাইট ডেসক্রিপশন */}
            <p className="text-xs md:text-sm font-medium leading-relaxed max-w-sm text-slate-300">
              {descriptionText}
            </p>
            
            {/* Contact Details */}
            <div className="space-y-3.5 pt-2 text-xs md:text-sm font-medium text-slate-200">
              <div className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center group-hover:bg-sky-500 transition-all duration-300 shrink-0 shadow-sm">
                  <FiPhone className="w-3.5 h-3.5" />
                </div>
                <a href={`tel:${CONTACT.phoneTel}`} className="hover:text-sky-400 transition-colors">
                  {CONTACT.phoneDisplay}
                </a>
              </div>

              <div className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center group-hover:bg-sky-500 transition-all duration-300 shrink-0 shadow-sm">
                  <FiMapPin className="w-3.5 h-3.5" />
                </div>
                <span className="hover:text-sky-400 transition-colors">{CONTACT.address}</span>
              </div>

              <div className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center group-hover:bg-sky-500 transition-all duration-300 shrink-0 shadow-sm">
                  <FiMail className="w-3.5 h-3.5" />
                </div>
                <a href={`mailto:${CONTACT.email}`} className="hover:text-sky-400 transition-colors">
                  {CONTACT.email}
                </a>
              </div>

              <div className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center group-hover:bg-sky-500 transition-all duration-300 shrink-0 shadow-sm">
                  <FiClock className="w-3.5 h-3.5" />
                </div>
                <span className="text-slate-300">{CONTACT.hours}</span>
              </div>
            </div>
          </div>

          {/* Col 2: Quick Links (Accordion on Mobile) */}
          <div className="lg:col-span-2 border-b border-white/10 lg:border-none pb-4 lg:pb-0">
            <button 
              type="button"
              onClick={() => toggleSection('quickLinks')}
              className="flex items-center justify-between w-full text-left lg:pointer-events-none focus:outline-none"
            >
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Quick Links</h4>
                <div className="w-8 h-0.5 bg-sky-500 mt-1.5 rounded-full hidden lg:block" />
              </div>
              <FiChevronDown className={`w-5 h-5 text-slate-400 lg:hidden transition-transform duration-300 ${openSections.quickLinks ? "rotate-180 text-sky-400" : ""}`} />
            </button>
            
            <ul className={`space-y-2.5 text-xs md:text-sm font-semibold text-slate-300 mt-4 lg:block ${openSections.quickLinks ? "block" : "hidden"}`}>
              <li><Link to="/" className="hover:text-sky-400 hover:pl-1 transition-all duration-300">Home</Link></li>
              <li><Link to="/shop" className="hover:text-sky-400 hover:pl-1 transition-all duration-300">Shop</Link></li>
              <li><Link to="/categories" className="hover:text-sky-400 hover:pl-1 transition-all duration-300">Categories</Link></li>
              <li><Link to="/offers" className="hover:text-sky-400 hover:pl-1 transition-all duration-300">Offers</Link></li>
              <li><Link to="/about" className="hover:text-sky-400 hover:pl-1 transition-all duration-300">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-sky-400 hover:pl-1 transition-all duration-300">Contact</Link></li>
            </ul>
          </div>

          {/* Col 3: Browse Category (Accordion on Mobile) */}
          <div className="lg:col-span-2 border-b border-white/10 lg:border-none pb-4 lg:pb-0">
            <button 
              type="button"
              onClick={() => toggleSection('categories')}
              className="flex items-center justify-between w-full text-left lg:pointer-events-none focus:outline-none"
            >
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Browse Category</h4>
                <div className="w-8 h-0.5 bg-sky-500 mt-1.5 rounded-full hidden lg:block" />
              </div>
              <FiChevronDown className={`w-5 h-5 text-slate-400 lg:hidden transition-transform duration-300 ${openSections.categories ? "rotate-180 text-sky-400" : ""}`} />
            </button>
            
            <ul className={`space-y-2.5 text-xs md:text-sm font-semibold text-slate-300 mt-4 lg:block ${openSections.categories ? "block" : "hidden"}`}>
              <li><Link to="/categories" className="hover:text-sky-400 hover:pl-1 transition-all duration-300">Accessories</Link></li>
              <li><Link to="/categories" className="hover:text-sky-400 hover:pl-1 transition-all duration-300">Home & Garden</Link></li>
              <li><Link to="/categories" className="hover:text-sky-400 hover:pl-1 transition-all duration-300">Electronics</Link></li>
              <li><Link to="/categories" className="hover:text-sky-400 hover:pl-1 transition-all duration-300">Health & Beauty</Link></li>
              <li><Link to="/categories" className="hover:text-sky-400 hover:pl-1 transition-all duration-300">Grocery & Market</Link></li>
              <li><Link to="/categories" className="hover:text-sky-400 hover:pl-1 transition-all duration-300">Babies & Moms</Link></li>
            </ul>
          </div>

          {/* Col 4: Support Center (Accordion on Mobile) */}
          <div className="lg:col-span-2 border-b border-white/10 lg:border-none pb-4 lg:pb-0">
            <button 
              type="button"
              onClick={() => toggleSection('support')}
              className="flex items-center justify-between w-full text-left lg:pointer-events-none focus:outline-none"
            >
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Support Center</h4>
                <div className="w-8 h-0.5 bg-sky-500 mt-1.5 rounded-full hidden lg:block" />
              </div>
              <FiChevronDown className={`w-5 h-5 text-slate-400 lg:hidden transition-transform duration-300 ${openSections.support ? "rotate-180 text-sky-400" : ""}`} />
            </button>
            
            <ul className={`space-y-2.5 text-xs md:text-sm font-semibold text-slate-300 mt-4 lg:block ${openSections.support ? "block" : "hidden"}`}>
              <li><Link to="/faq" className="hover:text-sky-400 hover:pl-1 transition-all duration-300">FAQ's</Link></li>
              <li><Link to="/how-to-buy" className="hover:text-sky-400 hover:pl-1 transition-all duration-300">How To Buy</Link></li>
              <li><Link to="/support" className="hover:text-sky-400 hover:pl-1 transition-all duration-300">Support Center</Link></li>
              <li><Link to="/track-order" className="hover:text-sky-400 hover:pl-1 transition-all duration-300">Track Your Order</Link></li>
              <li><Link to="/return-policy" className="hover:text-sky-400 hover:pl-1 transition-all duration-300">Returns Policy</Link></li>
              <li><Link to="/sitemap" className="hover:text-sky-400 hover:pl-1 transition-all duration-300">Sitemap</Link></li>
            </ul>
          </div>

          {/* Col 5: Mobile App Downloads & Payments */}
          <div className="lg:col-span-2 space-y-5 pt-4 lg:pt-0">
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Get Mobile App</h4>
                <div className="w-8 h-0.5 bg-sky-500 mt-1.5 rounded-full" />
              </div>
              <p className="text-xs text-slate-300 font-medium leading-normal">
                {company} App is now available on App Store & Google Play.
              </p>
              
              <div className="hidden lg:grid grid-cols-2 lg:grid-cols-1 gap-2 pt-1 ">
                <a href="#google-play" className="flex items-center gap-2 bg-black border border-white/10 rounded-xl px-3 py-1.5 hover:bg-slate-900 transition-all shadow-md">
                  <img src="https://live.themewild.com/mocart/assets/img/icon/playstore.png" alt="Google Play" className="w-4 h-4 object-contain" onError={(e) => e.currentTarget.style.display='none'} />
                  <div className="text-left leading-none">
                    <span className="text-[9px] block text-slate-400 font-medium">Get It On</span>
                    <span className="text-xs font-bold text-white tracking-wide">Google Play</span>
                  </div>
                </a>
                <a href="#app-store" className="flex items-center gap-2 bg-black border border-white/10 rounded-xl px-3 py-1.5 hover:bg-slate-900 transition-all shadow-md">
                  <img src="https://live.themewild.com/mocart/assets/img/icon/appstore.png" alt="App Store" className="w-4 h-4 object-contain" onError={(e) => e.currentTarget.style.display='none'} />
                  <div className="text-left leading-none">
                    <span className="text-[9px] block text-slate-400 font-medium">Get It On</span>
                    <span className="text-xs font-bold text-white tracking-wide">App Store</span>
                  </div>
                </a>
              </div>
            </div>

            {/* Payment Gateways */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">We Accept:</span>
              <div className="flex flex-wrap gap-1.5 max-w-[180px]">
                <div className="bg-white px-1.5 py-0.5 rounded border border-gray-200 flex items-center justify-center shadow-sm"><img src={bkash} alt="bKash" className="h-4 w-auto object-contain" /></div>
                <div className="bg-white px-1.5 py-0.5 rounded border border-gray-200 flex items-center justify-center shadow-sm"><img src={nagod} alt="Nagad" className="h-4 w-auto object-contain" /></div>
                <div className="bg-white px-1.5 py-0.5 rounded border border-gray-200 flex items-center justify-center shadow-sm"><img src={cod} alt="COD" className="h-4 w-auto object-contain" /></div>
              </div>
            </div>
          </div>
        </div>

        {/* ================== BOTTOM RIGHTS & SOCIALS ================== */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-300">
          <p>© Copyright 2026 <span className="text-white font-bold">{CONTACT.company}</span>. All Rights Reserved.</p>
          
          <div className="flex items-center gap-4">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Follow Us:</span>
            {/* ডাইনামিক সোশ্যাল মিডিয়া লিঙ্কস */}
            <div className="flex items-center gap-2">
              <a href={SOCIALS.facebookPage} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-sky-500 flex items-center justify-center transition-all shadow-sm"><RiFacebookFill className="w-3.5 h-3.5" /></a>
              <a href={SOCIALS.instagram} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-pink-500 flex items-center justify-center transition-all shadow-sm"><RiInstagramFill className="w-3.5 h-3.5" /></a>
              <a href={SOCIALS.whatsapp} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-emerald-500 flex items-center justify-center transition-all shadow-sm"><FaWhatsapp className="w-3.5 h-3.5" /></a>
              <a href={SOCIALS.youtube} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-red-600 flex items-center justify-center transition-all shadow-sm"><RiYoutubeFill className="w-3.5 h-3.5" /></a>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Scroll to Top */}
      {/* <button 
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed right-4 bottom-4 w-9 h-9 bg-sky-500 hover:bg-sky-600 text-white rounded-full flex items-center justify-center shadow-lg hover:-translate-y-0.5 transition-all focus:outline-none z-50"
        title="Scroll to top"
      >
        <FiChevronUp className="w-4 h-4 stroke-[3]" />
      </button> */}
    </footer>
  );
}