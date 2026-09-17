import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiCheck,
  FiClock,
  FiMapPin,
  FiPackage,
  FiRefreshCcw,
  FiRotateCcw,
  FiSearch,
  FiTruck,
  FiXCircle,
} from "react-icons/fi";
import { Link, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const API_BASE = (import.meta.env.VITE_APP_SERVER_URL || "").replace(/\/+$/, "");
const apiUrl = (path) => `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

const formatMoney = (value) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }).format(new Date(value));
};

const statusColors = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  confirmed: "border-cyan-200 bg-cyan-50 text-cyan-700",
  processing: "border-blue-200 bg-blue-50 text-blue-700",
  shipped: "border-indigo-200 bg-indigo-50 text-indigo-700",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-red-200 bg-red-50 text-red-700",
  unpaid: "border-orange-200 bg-orange-50 text-orange-700",
  paid: "border-green-200 bg-green-50 text-green-700",
};

const StatusBadge = ({ status }) => {
  const value = String(status || "pending").toLowerCase();
  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${statusColors[value] || statusColors.pending}`}>
      {value.replaceAll("_", " ")}
    </span>
  );
};

const steps = [
  { key: "pending", label: "Placed" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

const OrderTimeline = ({ status }) => {
  const normalized = String(status || "pending").toLowerCase();
  if (normalized === "cancelled") {
    return <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700"><FiXCircle /> Order cancelled</div>;
  }
  const comparable = normalized === "confirmed" ? "processing" : normalized;
  const activeIndex = Math.max(steps.findIndex((step) => step.key === comparable), 0);

  return (
    <div className="grid grid-cols-4 py-2">
      {steps.map((step, index) => (
        <div key={step.key} className="relative flex flex-col items-center">
          {index > 0 && <span className={`absolute right-1/2 top-4 h-0.5 w-full ${index <= activeIndex ? "bg-indigo-500" : "bg-slate-200"}`} />}
          <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${index <= activeIndex ? "border-indigo-500 bg-indigo-500 text-white" : "border-slate-200 bg-white text-slate-400"} ${index === activeIndex ? "ring-4 ring-indigo-100" : ""}`}>
            {index < activeIndex ? <FiCheck /> : <FiClock />}
          </span>
          <span className={`mt-2 text-center text-[10px] font-semibold sm:text-xs ${index <= activeIndex ? "text-indigo-700" : "text-slate-400"}`}>{step.label}</span>
        </div>
      ))}
    </div>
  );
};

const readCredentials = (orderId) => {
  try {
    return JSON.parse(localStorage.getItem(`guestOrder:${orderId}`)) || null;
  } catch {
    return null;
  }
};

const GuestOrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [credentials, setCredentials] = useState(() => readCredentials(orderId));
  const [guestId, setGuestId] = useState(credentials?.guestId || "");
  const [guestAccessToken, setGuestAccessToken] = useState(credentials?.guestAccessToken || "");

  const guestHeaders = useMemo(
    () => ({ "x-guest-access-token": credentials?.guestAccessToken || "" }),
    [credentials],
  );

  const { data: order, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["guest-order", orderId, credentials?.guestId],
    enabled: Boolean(orderId && credentials?.guestId && credentials?.guestAccessToken),
    queryFn: async ({ signal }) => {
      const response = await fetch(
        apiUrl(`/api/guest/orders/${orderId}?guestId=${encodeURIComponent(credentials.guestId)}`),
        { signal, headers: guestHeaders },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "Failed to load guest order");
      return data?.order || data;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const saveCredentials = (event) => {
    event.preventDefault();
    const next = { guestId: guestId.trim(), guestAccessToken: guestAccessToken.trim() };
    if (!next.guestId || !next.guestAccessToken) return;
    localStorage.setItem(`guestOrder:${orderId}`, JSON.stringify(next));
    setCredentials(next);
  };

  const cancelMutation = useMutation({
    mutationFn: async (reason) => {
      const response = await fetch(apiUrl(`/api/guest/orders/${orderId}/cancel`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...guestHeaders },
        body: JSON.stringify({ guestId: credentials.guestId, reason }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "Failed to cancel order");
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["guest-order", orderId, credentials?.guestId], data?.order || data);
      Swal.fire("Order cancelled", data?.message || "Order cancelled successfully", "success");
    },
    onError: (mutationError) => Swal.fire("Cancellation failed", mutationError.message, "error"),
  });

  const returnMutation = useMutation({
    mutationFn: async ({ sellerOrderId, reason, details }) => {
      const response = await fetch(apiUrl(`/api/returns/guest/${orderId}/${sellerOrderId}`), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...guestHeaders },
        body: JSON.stringify({ guestId: credentials.guestId, reason, details, evidence: [] }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "Failed to submit return request");
      return data;
    },
    onSuccess: async (data) => {
      await refetch();
      Swal.fire("Return submitted", data?.message || "Return request submitted", "success");
    },
    onError: (mutationError) => Swal.fire("Return failed", mutationError.message, "error"),
  });

  const handleCancel = async () => {
    const result = await Swal.fire({
      title: "Cancel this order?",
      input: "textarea",
      inputLabel: "Cancellation reason",
      inputValidator: (value) => String(value || "").trim() ? undefined : "Reason is required",
      showCancelButton: true,
      confirmButtonText: "Cancel order",
      confirmButtonColor: "#dc2626",
    });
    if (result.isConfirmed) cancelMutation.mutate(String(result.value).trim());
  };

  const handleReturn = async (sellerOrder) => {
    const result = await Swal.fire({
      title: "Request return",
      html: `<select id="guest-return-reason" class="swal2-select" style="display:block;width:100%;margin:10px 0"><option value="">Select reason</option><option value="damaged">Damaged</option><option value="wrong_product">Wrong product</option><option value="defective">Defective</option><option value="size_issue">Size issue</option><option value="not_as_described">Not as described</option><option value="changed_mind">Changed mind</option><option value="other">Other</option></select><textarea id="guest-return-details" class="swal2-textarea" placeholder="Describe the problem (minimum 10 characters)" style="display:block;width:100%;margin:10px 0"></textarea>`,
      showCancelButton: true,
      confirmButtonText: "Submit request",
      preConfirm: () => {
        const reason = document.getElementById("guest-return-reason")?.value || "";
        const details = String(document.getElementById("guest-return-details")?.value || "").trim();
        if (!reason) return Swal.showValidationMessage("Select a reason");
        if (details.length < 10) return Swal.showValidationMessage("Details must contain at least 10 characters");
        return { reason, details };
      },
    });
    if (result.isConfirmed && result.value) returnMutation.mutate({ sellerOrderId: sellerOrder._id, ...result.value });
  };

  if (!credentials) {
    return (
      <main className="mx-auto max-w-xl py-10">
        <form onSubmit={saveCredentials} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-center"><FiSearch className="mx-auto text-indigo-600" size={32} /><h1 className="mt-3 text-2xl font-bold">Access guest order</h1><p className="mt-1 text-sm text-slate-500">Order confirmation থেকে Guest ID এবং access token দিন।</p></div>
          <label className="mt-6 block text-sm font-semibold">Guest ID<input value={guestId} onChange={(e) => setGuestId(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5" required /></label>
          <label className="mt-4 block text-sm font-semibold">Guest access token<input value={guestAccessToken} onChange={(e) => setGuestAccessToken(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5" required /></label>
          <button className="mt-5 w-full rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white">View order</button>
        </form>
      </main>
    );
  }

  if (isLoading) return <div className="flex min-h-72 items-center justify-center text-slate-500"><FiRefreshCcw className="mr-2 animate-spin" /> Loading order...</div>;

  if (error || !order?._id) {
    return <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center"><FiXCircle className="mx-auto text-red-600" size={30} /><h1 className="mt-3 text-xl font-bold text-red-700">Couldn’t load order</h1><p className="mt-2 text-sm text-red-600">{error?.message || "Order not found"}</p><button onClick={() => { localStorage.removeItem(`guestOrder:${orderId}`); setCredentials(null); }} className="mt-5 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white">Enter details again</button></div>;
  }

  const sellerOrders = Array.isArray(order.sellerOrders) ? order.sellerOrders : [];
  const canCancel = ["pending", "confirmed"].includes(String(order.orderStatus).toLowerCase());

  return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 py-6">
      <div className="flex items-center justify-between"><button onClick={() => navigate(-1)} className="flex items-center gap-2 font-semibold text-slate-600"><FiArrowLeft /> Back</button><button onClick={() => refetch()} disabled={isFetching} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold"><FiRefreshCcw className={isFetching ? "animate-spin" : ""} /> Refresh</button></div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-bold">Order #{order._id.slice(-8).toUpperCase()}</h1><StatusBadge status={order.orderStatus} /><StatusBadge status={order.paymentStatus} /></div><p className="mt-2 text-sm text-slate-500">{formatDate(order.createdAt)}</p></div>{canCancel && <button onClick={handleCancel} disabled={cancelMutation.isPending} className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700">Cancel order</button>}</div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {sellerOrders.map((sellerOrder) => (
            <section key={sellerOrder._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-3 border-b bg-slate-50 p-4"><div><p className="font-bold">{sellerOrder.shopName || "Platform Store"}</p><p className="text-xs text-slate-500">Shipment #{String(sellerOrder._id).slice(-8).toUpperCase()}</p></div><StatusBadge status={sellerOrder.orderStatus} /></div>
              <div className="p-4"><OrderTimeline status={sellerOrder.orderStatus} /></div>
              <div className="divide-y border-t px-4">{(sellerOrder.items || []).map((item) => <div key={item._id} className="flex items-center gap-3 py-4"><div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-50"><FiPackage /></div><div className="min-w-0 flex-1"><Link to={`/product-details/${item.product}`} className="font-semibold hover:text-orange-600">{item.productName}</Link><p className="text-xs text-slate-500">Qty: {item.quantity}</p></div><strong>{formatMoney(item.lineTotal)}</strong></div>)}</div>
              {(sellerOrder.courierName || sellerOrder.trackingCode) && <div className="grid gap-3 border-t bg-indigo-50 p-4 text-sm sm:grid-cols-2"><div><p className="text-xs text-slate-500">Courier</p><p className="font-bold">{sellerOrder.courierName || "—"}</p></div><div className="sm:text-right"><p className="text-xs text-slate-500">Tracking code</p><p className="font-mono font-bold text-indigo-700">{sellerOrder.trackingCode || "—"}</p></div></div>}
              {sellerOrder.orderStatus === "delivered" && (!sellerOrder.returnStatus || sellerOrder.returnStatus === "none") && <div className="flex justify-end border-t p-4"><button onClick={() => handleReturn(sellerOrder)} disabled={returnMutation.isPending} className="flex items-center gap-2 rounded-lg bg-orange-50 px-4 py-2 text-sm font-bold text-orange-700"><FiRotateCcw /> Request return</button></div>}
              {sellerOrder.returnStatus && sellerOrder.returnStatus !== "none" && <div className="border-t bg-emerald-50 p-3 text-sm font-semibold capitalize text-emerald-700">Return status: {sellerOrder.returnStatus}</div>}
            </section>
          ))}
        </div>

        <aside className="space-y-4"><section className="rounded-2xl border bg-white p-5"><h2 className="flex items-center gap-2 font-bold"><FiMapPin className="text-orange-600" /> Delivery address</h2><p className="mt-3 text-sm text-slate-600">{order.address}{order.district ? `, ${order.district}` : ""}</p></section><section className="rounded-2xl border bg-white p-5"><h2 className="font-bold">Payment summary</h2><div className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><span>Subtotal</span><strong>{formatMoney(order.subtotal)}</strong></div><div className="flex justify-between"><span>Shipping</span><strong>{formatMoney(order.shippingCost)}</strong></div><div className="flex justify-between border-t pt-3 text-base"><span className="font-bold">Grand total</span><strong className="text-orange-600">{formatMoney(order.totalPrice)}</strong></div></div></section><section className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-800"><div className="flex gap-2"><FiTruck className="mt-0.5 shrink-0" /><p>এই browser-এ guest access নিরাপদে রাখা হয়েছে। Browser data clear করলে token আবার প্রয়োজন হবে।</p></div></section></aside>
      </div>
    </main>
  );
};

export default GuestOrderDetails;