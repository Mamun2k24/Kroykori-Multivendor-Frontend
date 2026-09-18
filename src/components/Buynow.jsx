// src/pages/Buynow.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../hooks/userContext";
import districts from "../data/districts";
import { getGuestId } from "../hooks/guest";
import OrderSummaryPanel from "../components/OrderSummaryPanel";
import PaymentDetailsForm from "../components/PaymentDetailsForm";
import useShippingSettings, {
  isCampaignActive,
} from "../hooks/useShippingSettings";
import { trackPixel } from "../utils/metaPixel";

import {
  Zap,
  ShieldCheck,
  Truck,
  CircleDollarSign,
  RotateCcw,
  Award,
  ShoppingBag,
} from "lucide-react";

const API_BASE = (
  import.meta.env.VITE_APP_SERVER_URL || "http://localhost:5000"
).replace(/\/$/, "");

const Buynow = () => {
  const checkoutRequestIdRef = useRef(
    globalThis.crypto?.randomUUID?.() ||
      `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();

  const [buynowItems, setBuynowItems] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [manualPayment, setManualPayment] = useState({
    senderNumber: "",
    transactionId: "",
  });

  // coupon states
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [shippingDiscount, setShippingDiscount] = useState(0);
  const [showGuestNotice, setShowGuestNotice] = useState(true);

  // shipping settings from hook (admin controlled)
  const {
    shipSettings,
    loading: shipLoading,
    error: shipError,
  } = useShippingSettings();

  // Load product from navigation state
  useEffect(() => {
    const pd = location.state?.productDetails;
    if (pd) setBuynowItems([pd]);
    else console.error("No product details provided!");
  }, [location.state?.productDetails]);

  // load saved address
  useEffect(() => {
    if (user) {
      const savedAddress = user.address || user.fullAddress || "";
      setFullAddress(savedAddress);
    }
  }, [user]);

  // Dynamic quantity controls for single product buy now flow
  const handleIncrease = (id) => {
    setBuynowItems((prev) =>
      prev.map((item) =>
        item._id === id || item.productId === id
          ? { ...item, quantity: (Number(item.quantity) || 1) + 1 }
          : item,
      ),
    );
  };

  const handleDecrease = (id) => {
    setBuynowItems((prev) =>
      prev.map((item) =>
        item._id === id || item.productId === id
          ? { ...item, quantity: Math.max(1, (Number(item.quantity) || 1) - 1) }
          : item,
      ),
    );
  };

  const handleDelete = () => {
    setBuynowItems([]);
    toast.info("Product removed from checkout.");
  };

  // subtotal (price * qty)
  const subTotal = useMemo(
    () =>
      buynowItems.reduce((t, it) => {
        const price = Number(it.price) || 0;
        const qty = Number(it.quantity) || 1;
        return t + price * qty;
      }, 0),
    [buynowItems],
  );

  // AUTO zone from district: Dhaka = inside, all others = outside
  const districtZone = useMemo(() => {
    if (!selectedDistrict) return null;
    return String(selectedDistrict).trim() === "Dhaka" ? "inside" : "outside";
  }, [selectedDistrict]);

  const shippingLabel = useMemo(() => {
    if (!selectedDistrict) return "Select district";
    return districtZone === "inside" ? "Inside Dhaka" : "Outside Dhaka";
  }, [selectedDistrict, districtZone]);

  // shipping computed ONLY from admin settings
  const shippingBase = useMemo(() => {
    if (!selectedDistrict) return 0;

    const insideRate = Number(shipSettings?.insideDhakaRate);
    const outsideRate = Number(shipSettings?.outsideDhakaRate);

    if (!Number.isFinite(insideRate) || !Number.isFinite(outsideRate)) return 0;

    const zone = districtZone;
    let base = zone === "inside" ? insideRate : outsideRate;

    const freeDistricts = (shipSettings?.freeForDistricts || []).map(String);
    if (freeDistricts.includes(String(selectedDistrict))) return 0;

    const threshold = isCampaignActive(shipSettings?.campaign)
      ? Number(shipSettings?.campaign?.freeThreshold || 0)
      : Number(shipSettings?.freeThreshold || 0);

    if (threshold > 0 && subTotal >= threshold) return 0;

    return base;
  }, [shipSettings, districtZone, selectedDistrict, subTotal]);

  const shippingAfterDiscount = Math.max(
    0,
    shippingBase - (shippingDiscount || 0),
  );
  const subtotalAfterDiscount = Math.max(0, subTotal - (couponDiscount || 0));
  const totalPrice = subtotalAfterDiscount + shippingAfterDiscount;

  const applyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) return toast.info("Enter a coupon code.");

    if (!selectedDistrict) {
      toast.error("Please select a district first.", {
        position: "top-center",
      });
      return;
    }

    setCouponLoading(true);
    try {
      const itemsPayload = buynowItems.map((it) => ({
        productId: it.productId,
        qty: Number(it.quantity) || 1,
        price: Number(it.price) || 0,
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
          district: selectedDistrict,
          shippingOption: districtZone === "inside" ? "inside" : "outside",
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

      toast.success(data.message || "Coupon applied!");
    } catch (e) {
      setAppliedCoupon(null);
      setCouponDiscount(0);
      setShippingDiscount(0);
      toast.error(e.message || "Failed to apply coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setShippingDiscount(0);
    setCouponCode("");
    toast.info("Coupon removed");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const name = formData.get("name");
    const email = formData.get("email");
    const mobile = formData.get("mobile");

    if (!selectedDistrict) {
      toast.error("Please select a district.", { position: "top-center" });
      return;
    }

    if (!fullAddress) {
      toast.error("Please provide a full address.", { position: "top-center" });
      return;
    }

    if (!buynowItems.length) {
      toast.error("No product found.", { position: "top-center" });
      return;
    }

    if (!mobile) {
      toast.error("Phone number is required", { position: "top-center" });
      return;
    }

    const isManualPayment = ["bKash",].includes(paymentMethod);
    const senderNumber = String(manualPayment.senderNumber || "").replace(
      /\s+/g,
      "",
    );
    const transactionId = String(manualPayment.transactionId || "")
      .trim()
      .toUpperCase();

    if (isManualPayment && !/^01[3-9]\d{8}$/.test(senderNumber)) {
      toast.error("Please enter a valid sender mobile number.", {
        position: "top-center",
      });
      return;
    }

    if (isManualPayment && !/^[A-Z0-9]{8,30}$/.test(transactionId)) {
      toast.error("Please enter a valid Transaction ID.", {
        position: "top-center",
      });
      return;
    }

    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    const isAuthenticated = Boolean(token);
    const guestId = isAuthenticated ? null : getGuestId();

    const currentOrderType = buynowItems[0]?.orderType || "regular";

    const orderData = {
      checkoutRequestId: checkoutRequestIdRef.current,
      orderType: currentOrderType,
      // Logged-in customer backend-এর req.user থেকে resolve হবে।
      userId: isAuthenticated ? user?.id || user?._id || null : null,

      // Token না থাকলেই কেবল guest checkout হবে।
      guestId,
      cartItems: buynowItems.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
        selectedSize: item.selectedSize || null,
        selectedWeight: item.selectedWeight || null,
        selectedColor: item.selectedColor || null,
        selectedChest: item.selectedChest || null,
        selectedWaist: item.selectedWaist || null,
      })),
      district: selectedDistrict,
      shippingOption: districtZone === "inside" ? "inside" : "outside",
      paymentMethod,
      ...(isManualPayment
        ? {
            manualPayment: {
              senderNumber,
              transactionId,
            },
          }
        : {}),
      shippingCost: shippingAfterDiscount,
      totalCost: totalPrice,
      pricing: {
        subtotal: subTotal,
        couponDiscount,
        shippingBase,
        shippingDiscount,
        subtotalAfterDiscount,
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

      const response = await fetch(`${API_BASE}/api/order`, {
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

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        const createdOrder = data?.order || null;
        const createdGuestAccessToken = data?.guestAccessToken || "";

        trackPixel("Purchase", {
          value: Number(totalPrice) || 0,
          currency: "BDT",
          content_ids: buynowItems.map((item) => item.productId),
          content_type: "product",
          num_items: buynowItems.reduce(
            (total, item) => total + (Number(item.quantity) || 1),
            0,
          ),
        });

        toast.success("Order placed successfully!", { position: "top-center" });

        // Guest order tracking credentials browser-এ সংরক্ষণ করুন।
        if (
          !isAuthenticated &&
          createdOrder?._id &&
          createdOrder?.guestId &&
          createdGuestAccessToken
        ) {
          const guestOrderData = {
            orderId: createdOrder._id,
            guestId: createdOrder.guestId,
            guestAccessToken: createdGuestAccessToken,
          };

          localStorage.setItem(
            `guestOrder:${createdOrder._id}`,
            JSON.stringify({
              guestId: createdOrder.guestId,
              guestAccessToken: createdGuestAccessToken,
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
            guestAccessToken: createdGuestAccessToken,
          },
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(
          "There was an issue placing the order: " +
            (errorData.message || "Please try again."),
          { position: "top-center" },
        );
      }
    } catch (error) {
      toast.error("Network error. Please try again.", {
        position: "top-center",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!buynowItems.length) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50 font-sans p-6">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-2xl mb-4">
          🛒
        </div>
        <h3 className="text-xl font-bold text-slate-800">
          No checkout session active
        </h3>
        <button
          onClick={() => navigate("/")}
          className="mt-4 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all"
        >
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/50 min-h-screen font-sans antialiased text-slate-800 pb-16">
      <ToastContainer />
      {/* Express Checkout Main Header Area */}
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className=" px-4 md:px-3 py-0 md:py-3 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="hidden md:flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
              <Zap className="w-4 h-4 fill-indigo-600 stroke-[1.5]" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Express Checkout
              </h1>
              <p className="text-xs md:text-sm text-slate-400 font-medium mt-0.5">
                Complete your order safely and securely in less than 30 seconds
              </p>
            </div>
          </div>

          {/* Top Trust Features */}
          <div className="hidden lg:flex flex-wrap items-center gap-x-6 gap-y-3 border-t lg:border-t-0 pt-4 lg:pt-0 w-full lg:w-auto text-[11px] md:text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <CircleDollarSign className="w-4 h-4 text-emerald-500" /> Cash on
              Delivery
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-500" /> Fast Delivery
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-500" /> Secure
              Checkout
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-purple-500" /> Easy Return
            </div>
          </div>
        </div>

        {/* গেস্ট ইউজার অ্যালার্ট ব্যানার নোটিশ */}
        {!user && showGuestNotice && (
          <div className="bg-[#EDF5FF] border border-[#D0E4FF] rounded-2xl p-5 md:p-6 relative flex items-start gap-4 transition-all shadow-sm">
            <div className="w-12 h-12 bg-[#D3E7FF] text-[#1A73E8] rounded-full flex items-center justify-center shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>

            <div className="flex-1 space-y-3 pr-6">
              <div>
                <h4 className="text-base md:text-lg font-bold text-[#1E293B]">
                  আপনি গেস্ট হিসেবে অর্ডার করছেন
                </h4>
                <p className="text-xs md:text-sm text-[#64748B] font-medium mt-0.5">
                  লগইন করলে অর্ডার ট্র্যাক, সেভড অ্যাড্রেস ও এক্সক্লুসিভ অফার
                  পাবেন
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={() => navigate("/login")}
                  className="bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-blue-100 transition-all active:scale-95"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                  </svg>
                  লগইন করুন
                </button>
                <span className="text-xs md:text-sm text-[#64748B] font-medium">
                  অথবা গেস্ট হিসেবে চালিয়ে যান
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowGuestNotice(false)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#64748B] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/xl"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        )}
      </div>
      {/* Grid Content Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7">
            <PaymentDetailsForm
              user={user}
              couponCode={couponCode}
              setCouponCode={setCouponCode}
              appliedCoupon={appliedCoupon}
              couponDiscount={couponDiscount}
              shippingDiscount={shippingDiscount}
              couponLoading={couponLoading}
              applyCoupon={applyCoupon}
              removeCoupon={removeCoupon}
              fullAddress={fullAddress}
              setFullAddress={setFullAddress}
              districts={districts}
              selectedDistrict={selectedDistrict}
              setSelectedDistrict={(d) => {
                setSelectedDistrict(d);
                setAppliedCoupon(null);
                setCouponDiscount(0);
                setShippingDiscount(0);
              }}
              subTotal={subTotal}
              shippingBase={shippingBase}
              shippingAfterDiscount={shippingAfterDiscount}
              totalPrice={totalPrice}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              manualPayment={manualPayment}
              setManualPayment={setManualPayment}
              submitting={submitting}
              handleSubmit={handleSubmit}
            />
          </div>

          <div className="lg:col-span-5 lg:sticky lg:top-6">
            <OrderSummaryPanel
              items={buynowItems}
              shippingLabel={shippingLabel}
              shippingAfterDiscount={shippingAfterDiscount}
              selectedDistrict={selectedDistrict}
              couponDiscount={couponDiscount}
              appliedCoupon={appliedCoupon}
              totalPrice={totalPrice}
              subTotal={subTotal}
              handleIncrease={handleIncrease}
              handleDecrease={handleDecrease}
              handleDelete={handleDelete}
              submitting={submitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Buynow;