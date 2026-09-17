// src/components/OrderSummaryPanel.jsx
import React from "react";
import { 
  Ticket, 
  BadgePercent, 
  ShieldCheck, 
  Truck, 
  CircleDollarSign, 
  RotateCcw,
  ShoppingBag,
  Trash2,
  PhoneCall,
  MessageSquare,
  Mail,
  Lock,
  ArrowRight
} from "lucide-react";

const OrderSummaryPanel = ({
  items,
  shippingLabel,
  shippingAfterDiscount,
  selectedDistrict,
  couponDiscount,
  appliedCoupon,
  totalPrice,
  subTotal,
  handleIncrease,
  handleDecrease,
  handleDelete,
  submitting // 🌟 প্যারেন্ট থেকে রিসিভড সঠিক সাবমিটিং স্টেট
}) => {
  return (
    <div className="space-y-6">
      
      {/* Order Summary & Dynamic Product View Box */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-base font-black text-slate-900 tracking-tight">Order Summary</h3>
          <span className="bg-indigo-50 text-indigo-600 font-black text-[11px] px-2.5 py-1 rounded-md">
            {items.length} Item{items.length > 1 ? "s" : ""}
          </span>
        </div>

        {/* Product Card Queue Container */}
        <div className="space-y-4">
          {items.map((item, index) => {
            return (
              <div key={item._id || index} className="flex gap-4 bg-slate-50/60 p-4 rounded-2xl border border-slate-100 relative group">
                <div className="relative shrink-0">
                  <img 
                    src={item.productImage || "https://via.placeholder.com/100"} 
                    alt={item.productName}
                    className="w-20 h-20 object-cover rounded-xl border border-slate-200 bg-white"
                  />
                  <span className="absolute top-2 left-2 bg-indigo-600 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-md shadow-sm tracking-wide">
                    Best Seller
                  </span>
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h4 className="text-[13px] font-black text-slate-800 line-clamp-1">{item.productName || "Premium Product"}</h4>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {item.selectedSize && <span className="text-[10px] bg-white border border-slate-100 px-2 py-0.5 rounded-md font-bold text-slate-400">Size: {item.selectedSize}</span>}
                      {item.selectedColor && <span className="text-[10px] bg-white border border-slate-100 px-2 py-0.5 rounded-md font-bold text-slate-400">Color: {item.selectedColor}</span>}
                    </div>
                  </div>

                  {/* Quantity Control Buttons and Total Price Container */}
                  <div className="flex items-center justify-between mt-2 pt-1">
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden h-7">
                      <button
                        type="button"
                        onClick={() => handleDecrease(item._id || item.productId)}
                        className="px-2.5 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 text-sm font-black transition-colors border-r"
                      >
                        −
                      </button>
                      <span className="px-3 text-xs font-black text-slate-700 min-w-[24px] text-center">
                        {item.quantity || 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleIncrease(item._id || item.productId)}
                        className="px-2.5 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 text-sm font-black transition-colors border-l"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-sm font-black text-slate-800 mb-4">
                      TK {(Number(item.price || 0) * (item.quantity || 1)).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Floating Trash Control */}
                <button
                  type="button"
                  onClick={handleDelete}
                  className="absolute bottom-4 right-4 text-slate-400 hover:text-rose-500 flex items-center gap-1 text-[11px] font-bold transition-colors "
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            );
          })}
        </div>

        {/* Subtotal Stack Architecture */}
        <div className="space-y-3 text-xs font-bold text-slate-500 border-t border-b border-slate-100 py-4">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="text-slate-800 font-extrabold text-sm">TK {subTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Charge ({shippingLabel})</span>
            <span className="text-slate-800 font-extrabold text-sm">TK {shippingAfterDiscount.toLocaleString()}</span>
          </div>
          {couponDiscount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount ({appliedCoupon?.code})</span>
              <span className="font-extrabold text-sm">- TK {couponDiscount.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Total Price Node Layout */}
        <div className="flex items-baseline justify-between pt-1">
          <span className="text-sm font-black text-slate-800">Total Amount</span>
          <span className="text-3xl font-black text-indigo-600 tracking-tight">TK {totalPrice.toLocaleString()}</span>
        </div>

        {/* Dynamic Green Coupon Reward Ribbon Bar */}
        {appliedCoupon && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-2.5 text-emerald-700 text-xs font-semibold">
            <BadgePercent className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>You saved <b>TK {couponDiscount.toLocaleString()}</b> with coupon code <b>"{appliedCoupon.code}"</b></span>
          </div>
        )}

        {/* Trust Core Micro Badges Stack */}
        <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-400 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Secure Checkout</div>
          <div className="flex items-center gap-2"><CircleDollarSign className="w-3.5 h-3.5 text-indigo-500" /> Cash on Delivery</div>
          <div className="flex items-center gap-2"><Truck className="w-3.5 h-3.5 text-indigo-500" /> Fast Delivery</div>
          <div className="flex items-center gap-2"><RotateCcw className="w-3.5 h-3.5 text-purple-500" /> Easy Returns</div>
        </div>

        {/* Interactive Submit Order Framework Button */}
        <div className="space-y-2.5 pt-2">
          {/* 🌟 CRITICAL FIX: form="checkout-form" অ্যাট্রিবিউট সেট করা হলো */}
          <button
            type="submit"
            form="checkout-form"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-black py-4 px-6 rounded-xl text-sm shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 tracking-wide disabled:cursor-not-allowed"
          >
            {submitting ? "Placing Order..." : `Place Order • TK ${totalPrice.toLocaleString()}`} <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1.5 font-medium">
            <Lock className="w-3 h-3" /> By placing this order, you agree to our <span className="underline cursor-pointer font-bold hover:text-slate-600">Terms & Conditions</span>
          </p>
        </div>
      </div>

      {/* 24/7 Multi-Channel Contact Customer Support Box matching bottom layout */}
      <div className="hidden md:block bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h4 className="text-sm font-black text-slate-900">Need Help?</h4>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Our specialized support infrastructure is active to serve you anytime</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <a href="tel:01635129195" className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 p-3 rounded-xl hover:bg-indigo-50/30 transition-colors group">
            <PhoneCall className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-[10px] text-slate-400 font-medium">01635-129195</p>
              <p className="text-[11px] font-bold text-slate-700">Call Us</p>
            </div>
          </a>

          <a href="https://wa.me/8801635129195" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 p-3 rounded-xl hover:bg-emerald-50/30 transition-colors group">
            <MessageSquare className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-[10px] text-slate-400 font-medium">WhatsApp</p>
              <p className="text-[11px] font-bold text-slate-700">Chat Now</p>
            </div>
          </a>

          <a href="mailto:support@Kroykori.com" className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 p-3 rounded-xl hover:bg-amber-50/30 transition-colors group">
            <Mail className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-[10px] text-slate-400 font-medium">support@Kroykori.com</p>
              <p className="text-[11px] font-bold text-slate-700">Send Email</p>
            </div>
          </a>
        </div>
      </div>

    </div>
  );
};

export default OrderSummaryPanel;