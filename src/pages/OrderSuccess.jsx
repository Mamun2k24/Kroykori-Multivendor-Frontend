import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Check, 
  Copy, 
  Calendar, 
  CreditCard, 
  DollarSign, 
  Truck, 
  MapPin, 
  ShoppingBag, 
  MessageSquare, 
  PhoneCall,
  Bell
} from "lucide-react";

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  // Checkout page থেকে order এবং guest access token নেওয়া হবে।
  // data object-এর মধ্যে পাঠালেও এটি support করবে।
  const order =
    location.state?.order ||
    location.state?.data?.order ||
    null;

  const guestAccessToken =
    location.state?.guestAccessToken ||
    location.state?.data?.guestAccessToken ||
    "";

  /*
   * Guest order credentials browser-এ রাখা হচ্ছে।
   * ফলে success page refresh হলেও Track Your Order কাজ করবে।
   */
  useEffect(() => {
    if (
      !order?._id ||
      order?.user ||
      !order?.guestId ||
      !guestAccessToken
    ) {
      return;
    }

    const guestOrderData = {
      orderId: order._id,
      guestId: order.guestId,
      guestAccessToken,
    };

    localStorage.setItem(
      `guestOrder:${order._id}`,
      JSON.stringify({
        guestId: order.guestId,
        guestAccessToken,
      }),
    );

    localStorage.setItem(
      "lastGuestOrder",
      JSON.stringify(guestOrderData),
    );
  }, [order?._id, order?.user, order?.guestId, guestAccessToken]);

  const handleTrackOrder = () => {
    // বর্তমানে দেখানো order guest order হলে
    if (!order?.user && order?._id) {
      navigate(`/guest-order/${order._id}`);
      return;
    }

    // Logged-in customer order
    if (order?.user && order?._id) {
      navigate(`/dashboard/order/${order._id}`);
      return;
    }

    // Success page refresh হলে সর্বশেষ guest order recover করা হবে
    try {
      const lastGuestOrder = JSON.parse(
        localStorage.getItem("lastGuestOrder"),
      );

      if (lastGuestOrder?.orderId) {
        navigate(
          `/guest-order/${lastGuestOrder.orderId}`,
        );
        return;
      }
    } catch {
      // Invalid local data হলে সাধারণ order history page দেখাবে।
    }

    navigate("/dashboard/order");
  };

  // 🌟 ১. অর্ডার আইডি লজিক: ২৪ ডিজিটের রিয়েল আইডি থেকে শেষ ৫ ডিজিট কেটে শর্ট ট্যাগ জেনারেট
  const fullOrderId = order?._id || "643aa19b2af39ed0b540d9ff";
  const orderId = fullOrderId.length > 10 
    ? fullOrderId.substring(fullOrderId.length - 5).toUpperCase() 
    : fullOrderId;

  // 🌟 ২. শতভাগ ডাইনামিক ডেটা ম্যাপিং (ব্যাকএন্ড রেসপন্স অবজেক্ট অনুসারে)
  const orderDate = order?.createdAt 
    ? new Date(order.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
      }) 
    : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  
  const paymentMethod = order?.paymentMethod || "Cash on Delivery";
  
  // 🌟 ৩. ডাইনামিক প্রাইসিং ম্যাপিং (ইউজার যে মূল্যে অর্ডার করেছে সেটি দেখাবে)
  const subtotal = Number(order?.pricing?.subtotal || order?.subtotal || 0);
  const discount = Number(order?.pricing?.couponDiscount || order?.couponDiscount || order?.discount || 0);
  const shippingFee = Number(order?.pricing?.shippingBase || order?.shippingCost || order?.shippingFee || 0);
  const totalAmount = Number(order?.totalCost || order?.totalPrice || order?.totalAmount || (subtotal - discount + shippingFee));

  // 🌟 ৪. কাস্টমার ইনফরমেশন ডাইনামিক নোড
  const customerName = order?.customer?.name || order?.shippingAddress?.name || "Guest User";
  const customerPhone = order?.customer?.mobile || order?.customer?.phone || order?.shippingAddress?.phone || "017XXXXXXXX";
  const customerAddress = order?.address || order?.shippingAddress?.address || "Provided Address";

  // ক্লিপবোর্ডে সম্পূর্ণ অরিজিনাল ডাটাবেজ আইডি কপি করার ফাংশন
  const handleCopy = () => {
    navigator.clipboard.writeText(fullOrderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F4F9F6] px-4 py-8 md:py-12 flex justify-center items-center font-sans antialiased text-slate-800">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden p-5 md:p-10">
        
        {/* ================== TOP HEADER HERO ================== */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center border-b border-dashed border-slate-200 pb-8">
          <div className="md:col-span-7 space-y-4 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              100% Secure Shopping
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Thank You! <br />
              <span className="text-emerald-600">Your Order is Confirmed.</span>
            </h1>
            <p className="text-slate-500 text-sm md:text-base max-w-md font-medium leading-relaxed">
              We've received your order and it's being processed. <br />
              আমাদের প্রতিনিধি দ্রুত আপনার সাথে যোগাযোগ করবে।
            </p>
            
            {/* ডাইনামিক শর্ট অর্ডার আইডি ব্যাজ */}
            <div className="flex items-center justify-center md:justify-start gap-2 pt-2">
              <div className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700">
                <span className="text-slate-400 font-medium mr-1">Order ID:</span> #{orderId}
              </div>
              <button 
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition active:scale-95 bg-white"
                title="Copy Full Order ID"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {/* Banner Graphic Illustration */}
          <div className="md:col-span-5 flex justify-center">
            <div className="relative w-48 h-48 bg-gradient-to-tr from-emerald-100 to-green-50 rounded-full flex items-center justify-center shadow-inner">
              <div className="absolute -top-2 -right-2 bg-white p-3 rounded-2xl shadow-md rotate-12">
                <ShoppingBag className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="w-28 h-28 bg-emerald-600 rounded-3xl shadow-lg shadow-emerald-700/20 flex items-center justify-center transform -rotate-6">
                <Check className="w-16 h-16 text-white stroke-[4]" />
              </div>
            </div>
          </div>
        </div>

        {/* ================== METRICS GRID CARD ================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-8">
          <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 flex gap-3 items-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0"><Calendar className="w-5 h-5" /></div>
            <div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Order Date</p>
              <p className="text-xs md:text-sm font-bold text-slate-800 mt-0.5">{orderDate}</p>
            </div>
          </div>
          
          <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 flex gap-3 items-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0"><CreditCard className="w-5 h-5" /></div>
            <div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Payment Method</p>
              <p className="text-xs md:text-sm font-bold text-slate-800 mt-0.5">{paymentMethod}</p>
            </div>
          </div>

          <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 flex gap-3 items-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0"><DollarSign className="w-5 h-5" /></div>
            <div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Total Amount</p>
              <p className="text-sm md:text-base font-black text-emerald-600 mt-0.5">৳ {totalAmount.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 flex gap-3 items-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0"><Truck className="w-5 h-5" /></div>
            <div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Estimated Delivery</p>
              <p className="text-xs md:text-sm font-bold text-slate-800 mt-0.5">24 - 48 Hours</p>
            </div>
          </div>
        </div>

        {/* ================== TRACKING STEPPER ================== */}
        <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-6 mb-8">
          <div className="relative flex flex-col md:flex-row justify-between items-center gap-6 md:gap-2">
            
            {/* Background Line Connector */}
            <div className="absolute hidden md:block top-5 left-[10%] right-[10%] h-0.5 bg-slate-200 z-0">
              <div className="h-full bg-emerald-500 w-[33%] transition-all duration-500"></div>
            </div>

            {/* Step 1 */}
            <div className="flex md:flex-col items-center gap-4 md:gap-2 relative z-10 w-full md:w-auto">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-4 ring-emerald-100 shadow-md">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <div className="text-left md:text-center">
                <p className="text-xs font-bold text-emerald-600">Order Confirmed</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{orderDate}</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex md:flex-col items-center gap-4 md:gap-2 relative z-10 w-full md:w-auto">
              <div className="w-10 h-10 rounded-full bg-white text-slate-400 border-2 border-slate-200 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="text-left md:text-center">
                <p className="text-xs font-bold text-slate-500">Processing</p>
                <p className="text-[10px] text-amber-500 font-bold mt-0.5">Pending</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex md:flex-col items-center gap-4 md:gap-2 relative z-10 w-full md:w-auto">
              <div className="w-10 h-10 rounded-full bg-white text-slate-400 border-2 border-slate-200 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <div className="text-left md:text-center">
                <p className="text-xs font-bold text-slate-500">Shipped</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Pending</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex md:flex-col items-center gap-4 md:gap-2 relative z-10 w-full md:w-auto">
              <div className="w-10 h-10 rounded-full bg-white text-slate-400 border-2 border-slate-200 flex items-center justify-center">
                <Check className="w-4 h-4" />
              </div>
              <div className="text-left md:text-center">
                <p className="text-xs font-bold text-slate-500">Delivered</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Pending</p>
              </div>
            </div>

          </div>
        </div>

        {/* ================== DETAILED BREAKDOWN GRID ================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Delivery Information */}
          <div className="border border-slate-100 rounded-2xl p-5 md:p-6 space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" /> Delivery Information
            </h3>
            <div className="text-xs md:text-sm space-y-2.5 font-medium text-slate-600 leading-relaxed">
              <p><strong className="text-slate-900 font-bold">Name:</strong> {customerName}</p>
              <p><strong className="text-slate-900 font-bold">Phone:</strong> {customerPhone}</p>
              <p><strong className="text-slate-900 font-bold">Address:</strong> {customerAddress}</p>
            </div>
            <button type="button" className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100/70 px-4 py-2 rounded-xl transition">
              View Map Location
            </button>
          </div>

          {/* Pricing Invoice Summary Block */}
          <div className="border border-slate-100 rounded-2xl p-5 md:p-6 space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" /> Order Summary
            </h3>
            <div className="space-y-3 text-xs md:text-sm font-semibold text-slate-500">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-slate-800">৳ {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                {/* কুপন থাকলে সেটির কোডসহ ডাইনামিক ডিসকাউন্ট রেন্ডারিং */}
                <span>Discount {order?.coupon?.code ? `(${order.coupon.code})` : ""}</span>
                <span>-৳ {discount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span>Shipping Fee</span>
                <span className="text-slate-800">৳ {shippingFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm md:text-base font-black pt-1 text-slate-900">
                <span>Total Amount</span>
                <span className="text-emerald-600">৳ {totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Alert Banner */}
        <div className="mt-6 bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 flex items-center gap-2.5 text-emerald-800 text-xs font-medium">
          <Bell className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>You'll receive an SMS and email update when your order is shipped. অনুগ্রহ করে ফোন সচল রাখুন।</span>
        </div>

        {/* ================== PRIMARY ACTION BUTTONS ================== */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleTrackOrder}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white px-6 py-3.5 font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/10 transition active:scale-[0.99]"
          >
            Track Your Order
          </button>
          <Link
            to="/shop"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-slate-700 px-6 py-3.5 font-bold hover:bg-slate-50 transition active:scale-[0.99]"
          >
            Continue Shopping
          </Link>
        </div>

        {/* Footer Support Contact Nodes */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-400">
          <p>Need Help? Our customer service team is 24/7 available.</p>
          <div className="flex items-center gap-2">
            <a 
              href="https://wa.me/8801635129195" 
              target="_blank" 
              rel="noreferrer" 
              className="inline-flex items-center gap-1 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 px-3 py-2 rounded-xl transition"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Chat on WhatsApp
            </a>
            <a 
              href="tel:+8801635129195" 
              className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-2 rounded-xl transition"
            >
              <PhoneCall className="w-3.5 h-3.5" /> +880 01714457750
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

const FileText = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
);

export default OrderSuccess;