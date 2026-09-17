import React, { useEffect, useState } from "react";
import useCart from "../hooks/useCart";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "../hooks/userContext";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLoaderData, useNavigate } from "react-router-dom";
import { getGuestId } from "../hooks/guest";
import {
  ShoppingBag,
  ArrowRight,
  Trash2,
  Ticket,
  BadgePercent,
  ShieldCheck,
  Truck,
  CircleDollarSign,
  RotateCcw,
  ArrowLeft,
} from "lucide-react";

const Cart = () => {
  const productDetailsData = useLoaderData();
  const navigate = useNavigate();

  const [cart, refetch] = useCart();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const userId = user?.id;
  const guestId = getGuestId();
  const identifier = userId || guestId;

  const [quantities, setQuantities] = useState({});
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  useEffect(() => {
    const savedCoupon = localStorage.getItem("cartCoupon");

    if (savedCoupon) {
      const parsed = JSON.parse(savedCoupon);

      setAppliedCoupon(parsed.appliedCoupon);
      setCouponDiscount(parsed.couponDiscount);
    }
  }, []);

  useEffect(() => {
    const initialQuantities = cart.reduce((acc, item) => {
      acc[item._id] = item.quantity || 1;
      return acc;
    }, {});
    setQuantities(initialQuantities);
  }, [cart]);

  const updateCartQuantity = async (itemId, newQuantity) => {
    try {
      const query = userId ? `userId=${userId}` : `guestId=${guestId}`;

      await axios.patch(
        `${import.meta.env.VITE_APP_SERVER_URL}api/cart/${itemId}?${query}`,
        { quantity: newQuantity },
      );

      queryClient.setQueryData(["cart", identifier], (oldCart = []) => {
        return oldCart.map((item) =>
          item._id === itemId ? { ...item, quantity: newQuantity } : item,
        );
      });

      toast.success("Quantity updated!", {
        position: "top-center",
        autoClose: 500,
      });
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Failed to update quantity.");
    }
  };

  const handleIncrease = async (itemId) => {
    const current = quantities[itemId] || 1;
    const next = current + 1;
    setQuantities((prev) => ({ ...prev, [itemId]: next }));
    await updateCartQuantity(itemId, next);
  };

  const handleDecrease = async (itemId) => {
    const current = quantities[itemId] || 1;
    const next = Math.max(current - 1, 1);
    setQuantities((prev) => ({ ...prev, [itemId]: next }));
    await updateCartQuantity(itemId, next);
  };

  const subTotal = cart.reduce((total, item) => {
    const price = item?.productId?.flashSale?.enabled
      ? Number(item.productId.flashSale.salePrice || 0)
      : Number(item.itemPrice || 0);

    return total + price * Number(item.quantity || 1);
  }, 0);

  const totalPrice = Math.max(0, subTotal - couponDiscount);

  const handleDelete = async (itemId) => {
    try {
      const query = userId ? `userId=${userId}` : `guestId=${guestId}`;

      await axios.delete(
        `${import.meta.env.VITE_APP_SERVER_URL}api/cart/${itemId}?${query}`,
      );

      toast.success("Item removed from cart", {
        position: "top-center",
        autoClose: 500,
      });

      queryClient.setQueryData(["cart", identifier], (oldCart = []) => {
        return oldCart.filter((item) => item._id !== itemId);
      });
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Error deleting item.");
      refetch();
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm("Are you sure you want to clear your entire cart?"))
      return;
    try {
      const query = userId ? `userId=${userId}` : `guestId=${guestId}`;
      // Assuming your backend supports clearing cart or loop delete
      for (const item of cart) {
        await axios.delete(
          `${import.meta.env.VITE_APP_SERVER_URL}api/cart/${item._id}?${query}`,
        );
      }
      queryClient.setQueryData(["cart", identifier], []);
      toast.success("Cart cleared completely!");
    } catch (err) {
      toast.error("Failed to clear cart.");
    }
  };

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();

    if (!code) {
      toast.error("Enter coupon code");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_SERVER_URL}api/cart/apply-coupon`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            subtotal: subTotal,
            items: cart.map((item) => ({
              productId: item.productId?._id,
              qty: item.quantity,
              price: item.itemPrice,
            })),
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      setAppliedCoupon(data.applied);
      setCouponDiscount(data.couponTotal);

      localStorage.setItem(
        "cartCoupon",
        JSON.stringify({
          appliedCoupon: data.applied,
          couponDiscount: data.couponTotal,
        }),
      );

      toast.success("Coupon applied!");
    } catch (err) {
      toast.error(err.message);
    }
  };
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    localStorage.removeItem("cartCoupon");

    toast.info("Coupon removed");
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50 font-sans px-4">
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/60 min-h-screen font-sans antialiased text-slate-800 pb-5 md:pb-8">
      <ToastContainer />

      {/* Top Utility Nav Bar as seen in cart 2.png */}
      <div className="bg-white border-b border-slate-100 py-5 px-4 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-6 h-6 text-indigo-600" />
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Shopping Cart{" "}
            <span className="text-indigo-600 text-sm font-bold ml-1">
              ({cart.length} Items)
            </span>
          </h1>
        </div>
    <button
  onClick={() => navigate("/")}
  className="hidden sm:flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all"
>
  <ArrowLeft className="w-3.5 h-3.5" /> Continue Shopping
</button>
      </div>

      {/* Main Layout Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-2 md:mt-6">
        {/* Banner Alert Top */}
     <div className="hidden sm:flex bg-indigo-50/50 border border-indigo-100/40 rounded-xl p-2 text-xs text-indigo-700 font-bold mb-6 items-center gap-2">
  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
  You're just one step away from your order!
</div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Side Component: Cart Product Lists Queue */}
          <div className="lg:col-span-8 space-y-3">
            {cart.map((item) => {
              const qty = quantities[item._id] || item.quantity || 1;
              const displayPrice = item?.productId?.flashSale?.enabled
                ? Number(item.productId.flashSale.salePrice || 0)
                : Number(item.itemPrice || 0);
              return (
                <div
                  key={item._id}
                  className="bg-white border border-slate-100 rounded-2xl p-4 md:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all relative group"
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    {/* Checkbox selector decorative */}
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                    />

                    {/* Product Image Box */}
                    <div className="w-24 h-24 shrink-0 bg-slate-50 rounded-xl border border-slate-100 p-1 flex items-center justify-center overflow-hidden">
                      <img
                        src={
                          item.productId?.productImage?.[0] ||
                          "/placeholder.png"
                        }
                        alt={item.productId?.productName}
                        className="max-w-full max-h-full object-contain mix-blend-multiply"
                      />
                    </div>

                    {/* Metadata Content Stack */}
                    <div className="space-y-1">
                      <h3 className="text-sm font-black text-slate-800 line-clamp-2 leading-snug max-w-md">
                        {item.productId?.productName}
                      </h3>

                      {/* Technical Attributes Badge Mapping */}
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        <span className="bg-emerald-50 text-emerald-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                          In Stock
                        </span>
                        {item.selectedSize && (
                          <span className="bg-indigo-50 text-indigo-600 text-[10px] px-2 py-0.5 rounded font-bold">
                            Size: {item.selectedSize}
                          </span>
                        )}
                        {item.selectedColor && (
                          <span className="bg-purple-50 text-purple-600 text-[10px] px-2 py-0.5 rounded font-bold capitalize">
                            Color: {item.selectedColor}
                          </span>
                        )}
                      </div>

                      {/* Display Unit Price underneath description */}
                      <p className="text-base font-black text-indigo-600 pt-1">
                        ৳{displayPrice}
                      </p>
                    </div>
                  </div>

                  {/* Right Blocks: Controls Layout aligned with picture layout */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4 sm:gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    {/* Explicit Inline Delete trash trigger */}
                    <button
                      onClick={() => handleDelete(item._id)}
                      className=" text-rose-500 p-1.5 bg-rose-50 rounded-full transition-colors sm:absolute sm:top-4 lg:top-1 sm:right-4"
                      title="Delete Item"
                    >
                      <Trash2 className="w-4 h-4 " />
                    </button>

                    {/* Quantity Adjustment Buttons */}
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden h-8 shadow-inner sm:mt-4">
                      <button
                        type="button"
                        onClick={() => handleDecrease(item._id)}
                        className="px-3 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 text-sm font-extrabold transition-all "
                      >
                        −
                      </button>
                      <span className="px-2 text-xs font-black text-slate-800 min-w-[24px] text-center">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleIncrease(item._id)}
                        className="px-3 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 text-sm font-extrabold transition-all"
                      >
                        +
                      </button>
                    </div>

                    {/* Multiplied Total cost indicator column box */}
                    <div className="text-right sm:mt-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Total
                      </p>
                      <p className="text-sm font-black text-slate-800">
                        ৳{displayPrice * qty}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Bottom Form Actions Grid: Voucher Promo and Clear Database Buttons */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
              {/* Voucher Promotion Input Box Container */}
              <div className="bg-white border border-slate-100 p-3 rounded-2xl flex items-center gap-2 w-full md:max-w-md shadow-sm">
                <div className="relative flex-1">
                  <Ticket className="w-4 h-4 text-slate-300 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 pl-9 pr-4 py-2 text-xs rounded-xl font-bold uppercase tracking-wider text-slate-700 placeholder:normal-case placeholder:font-medium focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
                <button
                  onClick={appliedCoupon ? removeCoupon : applyCoupon}
                  disabled={!appliedCoupon && !couponCode.trim()}
                  className={`px-5 py-2 text-xs font-black text-white rounded-xl shadow-sm transition-colors disabled:bg-indigo-300 ${
                    appliedCoupon
                      ? "bg-rose-500 hover:bg-rose-600"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {appliedCoupon ? "Remove" : "Apply"}
                </button>
              </div>

              {/* Clear Entire Cart Data Queue */}
              <button
                onClick={handleClearCart}
                className="flex items-center justify-center gap-2 px-5 py-3 border border-rose-100 hover:bg-rose-50 text-rose-600 font-bold text-xs rounded-xl transition-all shadow-sm w-full md:w-auto bg-white"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Cart
              </button>
            </div>
          </div>

          {/* Right Side Component: Sticky Order Pricing Breakdown Dashboard */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="w-2.5 h-4 bg-indigo-600 rounded-sm"></div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Order Summary
                </h3>
              </div>

              {/* Pricing Breakdowns Itemised Details */}
              <div className="space-y-3 text-xs font-bold text-slate-500">
                <div className="flex justify-between">
                  <span>Subtotal ({cart.length} Items)</span>
                  <span className="text-slate-800 font-extrabold">
                    ৳{subTotal}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Shipping Charge</span>
                  <span className="text-emerald-600 font-black text-xs bg-emerald-50 px-2 py-0.5 rounded">
                    ৳0
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount ({appliedCoupon?.code})</span>
                    <span className="font-black">- ৳{couponDiscount}</span>
                  </div>
                )}
              </div>

              {/* Total Payable Value Field Node */}
              <div className="flex items-baseline justify-between border-t border-slate-100 pt-4">
                <span className="text-sm font-black text-slate-800">
                  Total Amount
                </span>
                <span className="text-3xl font-black text-indigo-600 tracking-tight">
                  ৳{totalPrice}
                </span>
              </div>

              {/* Dynamic Routing Submit Actions Framework */}
              <div className="pt-2">
                <Link
                  to="/cart-checkout"
                  state={{
                    appliedCoupon,
                    couponDiscount,
                  }}
                >
                  <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3.5 px-2 rounded-xl text-xs shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 tracking-wide uppercase">
                    Proceed to Checkout • ৳{totalPrice}{" "}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>

              {/* Secondary Trust Attributes Embedded */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-2.5 text-[10px] font-bold text-slate-400 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 100%
                  Secure Checkout
                </div>
                <div className="flex items-center gap-1.5">
                  <CircleDollarSign className="w-3.5 h-3.5 text-indigo-500" />{" "}
                  Cash on Delivery
                </div>
                <div className="flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-purple-500" /> Easy
                  Returns
                </div>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-indigo-500" /> Fast
                  Delivery
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};

export default Cart;