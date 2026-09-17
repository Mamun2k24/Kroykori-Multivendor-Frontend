import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import ManualPaymentSelector from "../payment/ManualPaymentSelector";
import {
  User,
  Phone,
  MapPin,
  ChevronDown,
  Check,
  Truck,
  ShieldCheck,
  RotateCcw,
  CreditCard,
  ArrowLeft,
  ArrowRight,
  Ticket,
  Lock,
  BadgePercent,
  ShoppingBag,
  Award,
  CircleDollarSign,
  Trash2,
} from "lucide-react";

import useCart from "../../hooks/useCart";
import useCartActions from "../../context/useCartActions";
import { useUser } from "../../hooks/userContext";
import districts from "../../data/districts";
import { getGuestId } from "../../hooks/guest";
import useShippingSettings, {
  isCampaignActive,
} from "../../hooks/useShippingSettings";
import { trackPixel } from "../../utils/metaPixel";

const API_BASE = (
  import.meta.env.VITE_APP_SERVER_URL || "http://localhost:5000"
).replace(/\/$/, "");

const CartCheckout = () => {
  const checkoutRequestIdRef = useRef(
    globalThis.crypto?.randomUUID?.() ||
      `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [shippingDiscount, setShippingDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [manualPayment, setManualPayment] = useState({
    senderNumber: "",
    transactionId: "",
  });
  const {
    shipSettings,
    loading: shipLoading,
    error: shipError,
  } = useShippingSettings();
  const [selectedOption, setSelectedOption] = useState("inside");

  const navigate = useNavigate();
  const location = useLocation();
  const [cart] = useCart();
  const { user } = useUser();
  const guestId = getGuestId();

  const {
    quantities,
    handleIncrease,
    handleDecrease,
    handleDelete,
    clearCart,
    subTotal,
  } =
    useCartActions(cart);

  useEffect(() => {
    if (user) {
      setFullAddress(user.address || user.fullAddress || "");
    }
  }, [user]);

  useEffect(() => {
    if (!selectedDistrict) return;

    const opt =
      String(selectedDistrict).trim() === "Dhaka" ? "inside" : "outside";

    setSelectedOption(opt);
  }, [selectedDistrict]);

  const shippingBase = useMemo(() => {
    if (!selectedDistrict) return 0;
    const insideRate = Number(shipSettings?.insideDhakaRate);
    const outsideRate = Number(shipSettings?.outsideDhakaRate);
    if (!Number.isFinite(insideRate) || !Number.isFinite(outsideRate)) return 0;

    let base = selectedOption === "inside" ? insideRate : outsideRate;
    const freeDistricts = (shipSettings?.freeForDistricts || []).map(String);
    if (freeDistricts.includes(String(selectedDistrict))) return 0;

    const threshold = isCampaignActive(shipSettings?.campaign)
      ? Number(shipSettings?.campaign?.freeThreshold || 0)
      : Number(shipSettings?.freeThreshold || 0);

    if (threshold > 0 && subTotal >= threshold) return 0;
    return base;
  }, [shipSettings, selectedOption, selectedDistrict, subTotal]);

  const shippingAfterCoupon = Math.max(
    0,
    shippingBase - (shippingDiscount || 0),
  );
  const totalPrice = useMemo(
    () => Math.max(0, subTotal + shippingAfterCoupon - (couponDiscount || 0)),
    [subTotal, shippingAfterCoupon, couponDiscount],
  );

  useEffect(() => {
    if (location.state?.appliedCoupon) {
      setAppliedCoupon(location.state.appliedCoupon);
      setCouponDiscount(location.state.couponDiscount || 0);
      setCouponCode(location.state.appliedCoupon?.code || "");
      return;
    }

    const saved = localStorage.getItem("cartCoupon");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAppliedCoupon(parsed.appliedCoupon);
        setCouponDiscount(parsed.couponDiscount || 0);
        setCouponCode(parsed.appliedCoupon?.code || "");
      } catch {
        localStorage.removeItem("cartCoupon");
      }
    }
  }, [location.state]);

  const applyCoupon = async () => {
    const code = couponCode.trim();
    if (!code)
      return toast.info("Enter a coupon code", { position: "top-center" });
    if (!selectedDistrict)
      return toast.error("Please select a district first.", {
        position: "top-center",
      });

    try {
      setCouponLoading(true);
      const itemsPayload = cart.map((it) => ({
        productId: it.productId?._id,
        qty: quantities?.[it._id] ?? 1,
        price: it?.productId?.flashSale?.enabled
          ? Number(it.productId.flashSale.salePrice || 0)
          : Number(it.itemPrice || 0),
      }));

      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/cart/apply-coupon`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          code,
          subtotal: subTotal,
          shipping: shippingBase,
          items: itemsPayload,
          userId: user?.id || null,
          guestId: !user ? guestId : null,
          district: selectedDistrict,
          shippingOption: selectedOption,
        }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) || {};
        throw new Error(err.message || "Invalid coupon");
      }

      const data = await res.json();
      setAppliedCoupon(data.applied || data.coupon || { code });
      setCouponDiscount(Number(data.couponTotal ?? data.discountAmount ?? 0));
      setShippingDiscount(
        Number(data.shippingDiscount ?? data.shippingOff ?? 0),
      );
      toast.success(data.message || "Coupon applied!", {
        position: "top-center",
      });
    } catch (e) {
      setAppliedCoupon(null);
      setCouponDiscount(0);
      setShippingDiscount(0);
      toast.error(e.message || "Failed to apply coupon", {
        position: "top-center",
      });
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setShippingDiscount(0);
    setCouponCode("");
    toast.info("Coupon removed", { position: "top-center" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get("name");
    const mobile = formData.get("mobile");
    const email = formData.get("email");

    if (!selectedDistrict)
      return toast.error("Please select a district.", {
        position: "top-center",
      });
    if (!fullAddress)
      return toast.error("Please provide a full address.", {
        position: "top-center",
      });
    if (!cart.length)
      return toast.error("Your cart is empty.", { position: "top-center" });
    if (!mobile)
      return toast.error("Phone number is required.", {
        position: "top-center",
      });

    const isManualPayment = ["bKash", "Nagad"].includes(paymentMethod);
    const senderNumber = String(manualPayment.senderNumber || "").replace(
      /\s+/g,
      "",
    );
    const transactionId = String(manualPayment.transactionId || "")
      .trim()
      .toUpperCase();

    if (isManualPayment && !/^01[3-9]\d{8}$/.test(senderNumber)) {
      return toast.error("Please enter a valid sender mobile number.", {
        position: "top-center",
      });
    }

    if (isManualPayment && !/^[A-Z0-9]{8,30}$/.test(transactionId)) {
      return toast.error("Please enter a valid Transaction ID.", {
        position: "top-center",
      });
    }

    const token =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token");

    const isAuthenticated = Boolean(token);
    const checkoutGuestId = isAuthenticated
      ? null
      : guestId;

    const orderData = {
      checkoutRequestId: checkoutRequestIdRef.current,
      userId: isAuthenticated
        ? user?.id || user?._id || null
        : null,
      guestId: checkoutGuestId,
      cartItems: cart.map((item) => ({
        productId: item.productId?._id,
        quantity: quantities?.[item._id] ?? 1,
        price: item?.productId?.flashSale?.enabled
          ? Number(item.productId.flashSale.salePrice || 0)
          : Number(item.itemPrice || 0),
        selectedSize: item.selectedSize || null,
        selectedWeight: item.selectedWeight || null,
        selectedColor: item.selectedColor || null,
        selectedChest: item.selectedChest || null,
        selectedWaist: item.selectedWaist || null,
      })),
      district: selectedDistrict,
      shippingOption: selectedOption,
      paymentMethod,
      ...(isManualPayment
        ? {
            manualPayment: {
              senderNumber,
              transactionId,
            },
          }
        : {}),
      shippingCost: shippingAfterCoupon,
      totalCost: totalPrice,
      pricing: {
        subtotal: subTotal,
        couponDiscount,
        shippingBase,
        shippingDiscount,
        subtotalAfterDiscount: Math.max(0, subTotal - couponDiscount),
      },
      coupon: appliedCoupon
        ? { code: appliedCoupon.code, id: appliedCoupon._id || null }
        : null,
      customer: {
        name: name || user?.name || "Guest User",
        email: email || user?.email || "",
        mobile: mobile || user?.mobile || "",
      },
      address: fullAddress,
    };

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/api/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
        },
        body: JSON.stringify(orderData),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const createdOrder = data?.order || null;
        const createdGuestAccessToken =
          data?.guestAccessToken || "";
        trackPixel("Purchase", {
          value: Number(totalPrice) || 0,
          currency: "BDT",
          content_ids: cart.map((item) => item.productId?._id),
          content_type: "product",
          num_items: cart.reduce(
            (total, item) => total + (Number(quantities?.[item._id]) || 1),
            0,
          ),
        });
        localStorage.removeItem("cartCoupon");

        // Order তৈরি হওয়ার পরই cart clear হবে। Clear ব্যর্থ হলেও
        // তৈরি হওয়া order বাতিল হবে না; পরে cart refresh করা যাবে।
        try {
          await clearCart();
        } catch (clearError) {
          console.error("Cart clear failed after checkout:", clearError);
        }

        setAppliedCoupon(null);
        setCouponDiscount(0);
        setCouponCode("");
        toast.success("Order placed successfully!", { position: "top-center" });

        if (
          !isAuthenticated &&
          createdOrder?._id &&
          createdOrder?.guestId &&
          createdGuestAccessToken
        ) {
          const guestOrderData = {
            orderId: createdOrder._id,
            guestId: createdOrder.guestId,
            guestAccessToken:
              createdGuestAccessToken,
          };

          localStorage.setItem(
            `guestOrder:${createdOrder._id}`,
            JSON.stringify({
              guestId: createdOrder.guestId,
              guestAccessToken:
                createdGuestAccessToken,
            }),
          );

          localStorage.setItem(
            "lastGuestOrder",
            JSON.stringify(guestOrderData),
          );
        }

        navigate("/order-success", {
          state: {
            order: createdOrder,
            guestAccessToken:
              createdGuestAccessToken,
          },
        });
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Failed to place order. Please try again.", {
          position: "top-center",
        });
      }
    } catch (err) {
      toast.error("Network error. Please try again.", {
        position: "top-center",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 font-sans px-4">
        <div className="max-w-md w-full text-center bg-white rounded-3xl shadow-sm border border-slate-100 p-10">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-3xl mb-5">
            🛒
          </div>
          <h2 className="text-2xl font-bold text-slate-800">
            Your Cart is Empty
          </h2>
          <p className="mt-2 text-slate-500 text-sm">
            Looks like you haven't added any products to your cart yet.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={() => navigate("/")}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all text-sm"
            >
              Continue Shopping
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all text-sm"
            >
              Back Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/60 min-h-screen font-sans antialiased text-slate-800 pb-16">
      <ToastContainer />

      {/* Top Stepper Section */}
      <div className="bg-white border-b border-slate-100 py-6 px-4 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Cart
        </button>

        {/* Dynamic Stepper Bar */}
        <div className="flex items-center gap-3 md:gap-8 w-full max-w-xl justify-center">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
            <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs">
              <Check className="w-3.5 h-3.5" />
            </span>
            <span className="hidden sm:inline">Cart</span>
          </div>
          <div className="h-0.5 w-12 bg-indigo-600"></div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
              2
            </span>
            <span>Shipping</span>
          </div>
          <div className="h-0.5 w-12 bg-slate-200"></div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs">
              3
            </span>
            <span className="hidden sm:inline">Payment</span>
          </div>
          <div className="h-0.5 w-12 bg-slate-200"></div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs">
              4
            </span>
            <span className="hidden sm:inline">Complete</span>
          </div>
        </div>

        <div className="hidden lg:block text-slate-400 text-xs">
          Secure Checkout Powered
        </div>
      </div>

      {shipLoading && (
        <div className="bg-indigo-600 text-white text-xs text-center py-2 animate-pulse">
          Loading dynamic shipping rates…
        </div>
      )}
      {shipError && (
        <div className="bg-rose-600 text-white text-xs text-center py-2">
          {shipError}
        </div>
      )}

      {/* Main Two-Column Container Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          {/* Left Column: Form & Method Details */}
          <div className="lg:col-span-7 space-y-6">
            {/* Shipping Info Card */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3.5 mb-6">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Shipping Details
                  </h3>
                  <p className="text-xs text-slate-400">
                    Fill in your exact communication details to safely get your order
                  </p>
                </div>
              </div>

              {/* Form Input Elements */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 text-slate-300 w-4 h-4" />
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full bg-slate-50/40 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
                      placeholder="e.g. Mamun Khan"
                      defaultValue={user?.name || ""}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 text-slate-300 w-4 h-4" />
                    <input
                      type="tel"
                      name="mobile"
                      required
                      pattern="[0-9]{11}"
                      className="w-full bg-slate-50/40 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
                      placeholder="Your 11-digit mobile number"
                      defaultValue={user?.mobile || ""}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
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
                      className="w-full bg-slate-50/40 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
                      placeholder="House, Road, Area names..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Select District
                  </label>
                  <div className="relative">
                    <select
                      value={selectedDistrict}
                      required
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      className="w-full bg-slate-50/40 border border-slate-200 rounded-xl px-4 py-3.5 text-sm appearance-none focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium text-slate-700"
                    >
                      <option value="">Choose your city or district</option>
                      {districts.map((d) => (
                        <option key={d.name} value={d.name}>
                          {d.name} ({d.nameBn})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-4 text-slate-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Block */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Select Payment Method
                  </h3>
                  <p className="text-xs text-slate-400">
                    Choose your preferred payment infrastructure option
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

              {/* Autocalculated Base Summary Area */}
              <div className="mt-4 bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between text-xs font-medium">
                <div>
                  <p className="text-slate-400">Shipping Mode (Auto Detect)</p>
                  <p className="text-slate-700 font-bold mt-0.5">
                    {selectedDistrict
                      ? selectedOption === "inside"
                        ? "Inside Dhaka City"
                        : "Outside Dhaka Suburbs"
                      : "Awaiting district input..."}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400">Estimated Delivery Charge</p>
                  <p className="text-indigo-600 font-black text-sm mt-0.5">
                    ৳ {shippingAfterCoupon}
                  </p>
                </div>
              </div>
            </div>

            {/* Micro Coupon Block */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <label className="text-xs font-bold text-slate-500 block mb-2 uppercase tracking-wider">
                Have a promotional coupon?
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Ticket className="absolute left-3 top-3 text-slate-300 w-4 h-4" />
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code (e.g. MM10)"
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all font-medium uppercase tracking-wider"
                  />
                </div>
                {appliedCoupon ? (
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-xs transition-colors"
                  >
                    {couponLoading ? "Checking…" : "Apply"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900">
                  Order Summary
                </h3>
                <span className="bg-indigo-50 text-indigo-600 font-bold text-[11px] px-2.5 py-1 rounded-md">
                  {cart.length} Item{cart.length > 1 ? "s" : ""}
                </span>
              </div>

              {/* Dynamic Scrollable Product Layout */}
              <div className="max-h-80 overflow-y-auto space-y-4 pr-1">
                {cart.map((item) => {
                  const qty = quantities?.[item._id] ?? 1;
                  const effectivePrice = item?.productId?.flashSale?.enabled
                    ? Number(item.productId.flashSale.salePrice || 0)
                    : Number(item.itemPrice || 0);
                  return (
                    <div
                      key={item._id}
                      className="flex gap-3 bg-slate-50/60 p-3 rounded-2xl border border-slate-100 relative group"
                    >
                      <img
                        src={
                          item?.productId?.productImage?.[0] ||
                          item?.productId?.productImage ||
                          "https://via.placeholder.com/100"
                        }
                        alt={item?.productId?.productName}
                        className="w-16 h-16 object-cover rounded-xl border border-slate-200 bg-white"
                      />

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h4 className="text-[13px] font-bold text-slate-800 line-clamp-1">
                            {item?.productId?.productName}
                          </h4>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item?.selectedSize && (
                              <span className="text-[10px] bg-white border px-1.5 py-0.5 rounded text-slate-500 font-medium">
                                Size: {item.selectedSize}
                              </span>
                            )}
                            {item?.selectedColor && (
                              <span className="text-[10px] bg-white border px-1.5 py-0.5 rounded text-slate-500 font-medium">
                                {item.selectedColor}
                              </span>
                            )}
                            {item?.selectedWeight && (
                              <span className="text-[10px] bg-white border px-1.5 py-0.5 rounded text-slate-500 font-medium">
                                {item.selectedWeight}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden h-7">
                            <button
                              type="button"
                              onClick={() =>
                                qty <= 1
                                  ? handleDelete(item._id)
                                  : handleDecrease(item._id)
                              }
                              className="px-2 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 text-sm font-bold transition-colors border-r"
                            >
                              −
                            </button>
                            <span className="px-3 text-xs font-bold text-slate-700 min-w-[28px] text-center">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleIncrease(item._id)}
                              className="px-2 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 text-sm font-bold transition-colors border-l"
                            >
                              +
                            </button>
                          </div>

                          <span className="text-sm font-black text-indigo-600">
                            ৳ {effectivePrice * qty}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(item._id)}
                        className="absolute -top-2 -right-2 bg-white border border-rose-100 text-rose-500 p-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove Item"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Subtotal Calculations Stack */}
              <div className="space-y-2.5 text-xs border-t border-b border-slate-100 py-4 font-medium text-slate-500">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-slate-800 font-bold">৳ {subTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  <span className="text-slate-800 font-bold">
                    ৳ {shippingAfterCoupon}
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount ({appliedCoupon?.code || "Coupon"})</span>
                    <span>- ৳ {couponDiscount}</span>
                  </div>
                )}
              </div>

              {/* Grand Total Amount display */}
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-sm font-bold text-slate-800">
                  Total Amount
                </span>
                <span className="text-3xl font-black text-indigo-600 tracking-tight">
                  ৳ {totalPrice}
                </span>
              </div>

              {appliedCoupon && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-2.5 text-emerald-700 text-xs font-medium">
                  <BadgePercent className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    You saved <b>৳{couponDiscount}</b> with coupon code{" "}
                    <b>"{appliedCoupon.code}"</b>
                  </span>
                </div>
              )}

              {/* Secondary Trust Badges Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-500 bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />{" "}
                  Secure Checkout
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-indigo-500" /> Fast Delivery
                </div>
                <div className="flex items-center gap-2">
                  <CircleDollarSign className="w-3.5 h-3.5 text-amber-500" />{" "}
                  Cash on Delivery
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-3.5 h-3.5 text-purple-500" /> Easy Returns
                </div>
              </div>

              {/* Actions Order submission button */}
              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3.5 px-6 rounded-xl text-sm shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 tracking-wide"
                >
                  {submitting
                    ? "Placing Order..."
                    : `Place Order • ৳ ${totalPrice}`}{" "}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1.5">
                  <Lock className="w-3 h-3" /> By placing this order, you agree to our{" "}
                  <span className="underline cursor-pointer font-medium hover:text-slate-600">
                    Terms & Conditions
                  </span>
                </p>
              </div>
            </div>

            {/* Footer Features layout */}
            {/* <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] text-slate-400 font-medium py-2">
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-500" /> 100% Authentic
              </div>
              <div className="flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-indigo-500" /> Best Price Guarantee
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-500" /> 10k+ Happy Customers
              </div>
            </div> */}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CartCheckout;