// src/components/PaymentDetailsForm.jsx
import React from "react";
import ManualPaymentSelector from "../pages/payment/ManualPaymentSelector";
import {
  User,
  Phone,
  MapPin,
  ChevronDown,
  CreditCard,
  Truck,
  Ticket,
  BadgePercent,
} from "lucide-react";

const PaymentDetailsForm = ({
  user,
  couponCode,
  setCouponCode,
  appliedCoupon,
  couponDiscount,
  couponLoading,
  applyCoupon,
  removeCoupon,
  fullAddress,
  setFullAddress,
  districts,
  selectedDistrict,
  setSelectedDistrict,
  shippingAfterDiscount,
  paymentMethod,
  setPaymentMethod,
  manualPayment,
  setManualPayment,
  totalPrice,
  handleSubmit,
}) => {
  return (
    /* 🌟 ফর্মে একটি সুনির্দিষ্ট id="checkout-form" অ্যাসাইন করা হলো */
    <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
      {/* ১. Shipping Details Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Shipping Details
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Please provide your valid delivery destination address
            </p>
          </div>
        </div>

        {/* Form Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 text-slate-300 w-4 h-4" />
              <input
                type="text"
                name="name"
                required
                className="w-full bg-slate-50/40 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium text-slate-700 placeholder:text-slate-300"
                placeholder="e.g. Mamun Khan"
                defaultValue={user?.name || ""}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3.5 text-slate-300 w-4 h-4" />
              <input
                type="tel"
                name="mobile"
                required
                pattern="[0-9]{11}"
                className="w-full bg-slate-50/40 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium text-slate-700 placeholder:text-slate-300"
                placeholder="01XXXXXXXXX"
                defaultValue={user?.mobile || ""}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Full Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3.5 text-slate-300 w-4 h-4" />
              <input
                type="text"
                name="address"
                required
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                className="w-full bg-slate-50/40 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium text-slate-700 placeholder:text-slate-300"
                placeholder="e.g. Khilkhet, Dhaka"
              />
            </div>
          </div>

          <div className="relative">
            <select
              value={selectedDistrict}
              required
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full bg-slate-50/40 border border-slate-200 rounded-xl px-4 py-3.5 pr-12 text-sm appearance-none focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-semibold text-slate-700"
            >
              <option value="">Choose a district</option>
              {districts.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name} City
                </option>
              ))}
            </select>

            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

  

      {/* ৩. Payment Method Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Payment Method
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Choose your preferred structural payment gateway
            </p>
          </div>
        </div>

        <ManualPaymentSelector
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          manualPayment={manualPayment}
          setManualPayment={setManualPayment}
          totalAmount={totalPrice}
        />

        {/* Shipping Cost Dynamic Info Box */}
        <div className="border border-slate-100 rounded-xl p-4 flex items-center justify-between text-xs font-bold text-slate-500 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-indigo-500" />
            <span>Shipping Charge (Auto Detected)</span>
          </div>
          <span className="text-indigo-600 text-sm font-black">
            TK {shippingAfterDiscount}
          </span>
        </div>
      </div>

          {/* ২. Promotional Coupon Code Section */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Have a promotional coupon?
          </label>
          {appliedCoupon && (
            <span className="bg-emerald-50 text-emerald-600 font-extrabold text-[10px] px-2 py-0.5 rounded-md border border-emerald-100 uppercase tracking-wide">
              Active
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Ticket className="absolute left-3.5 top-3.5 text-slate-300 w-4 h-4" />
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Enter coupon code (e.g. WELCOME20)"
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-all font-bold uppercase tracking-wider text-slate-700 placeholder:normal-case placeholder:font-normal"
            />
          </div>
          {appliedCoupon ? (
            <button
              type="button"
              onClick={removeCoupon}
              className="px-5 py-3 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors shrink-0"
            >
              Remove
            </button>
          ) : (
            <button
              type="button"
              onClick={applyCoupon}
              disabled={couponLoading || !couponCode.trim()}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-xs transition-colors shrink-0 shadow-sm"
            >
              {couponLoading ? "Applying…" : "Apply"}
            </button>
          )}
        </div>

        {appliedCoupon && (
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3.5 flex items-center gap-2.5 text-emerald-700 text-xs font-semibold">
            <BadgePercent className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              🎉 Coupon <b>"{appliedCoupon.code}"</b> successfully activated!
              Saved <b>TK {couponDiscount}</b>
            </span>
          </div>
        )}
      </div>
    </form>
  );
};

export default PaymentDetailsForm;