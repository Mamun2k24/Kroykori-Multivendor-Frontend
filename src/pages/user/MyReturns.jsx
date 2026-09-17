import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Clock3,
  LoaderCircle,
  Package,
  RefreshCw,
  RotateCcw,
  Search,
  Store,
  WalletCards,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

const API_BASE = (import.meta.env.VITE_APP_SERVER_URL || "").replace(
  /\/+$/,
  "",
);

const apiUrl = (path) =>
  `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

const resolveImage = (image) => {
  if (!image) return "";
  if (/^(https?:|data:)/i.test(image)) return image;
  return apiUrl(image);
};

const formatMoney = (value) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("en-BD", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Dhaka",
    }).format(new Date(value));
  } catch {
    return "—";
  }
};

const statusClasses = {
  requested: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-cyan-200 bg-cyan-50 text-cyan-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
  returning: "border-blue-200 bg-blue-50 text-blue-700",
  received: "border-indigo-200 bg-indigo-50 text-indigo-700",
  refunded: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-slate-200 bg-slate-50 text-slate-600",
};

const StatusBadge = ({ status }) => {
  const value = String(status || "requested").toLowerCase();

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${
        statusClasses[value] || statusClasses.requested
      }`}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
};

const returnSteps = [
  { key: "requested", label: "Requested" },
  { key: "approved", label: "Approved" },
  { key: "returning", label: "Returning" },
  { key: "received", label: "Received" },
  { key: "refunded", label: "Refunded" },
];

const ReturnTimeline = ({ status }) => {
  const normalized = String(status || "requested").toLowerCase();

  if (["rejected", "cancelled"].includes(normalized)) {
    return (
      <div
        className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold ${
          normalized === "rejected"
            ? "border-red-100 bg-red-50 text-red-700"
            : "border-slate-200 bg-slate-50 text-slate-600"
        }`}
      >
        <XCircle size={17} />
        Return request {normalized}
      </div>
    );
  }

  const activeIndex = Math.max(
    returnSteps.findIndex((step) => step.key === normalized),
    0,
  );

  return (
    <div className="overflow-x-auto pb-1">
      <div className="grid min-w-[480px] grid-cols-5">
        {returnSteps.map((step, index) => {
          const completed = index <= activeIndex;
          const current = index === activeIndex;

          return (
            <div key={step.key} className="relative flex flex-col items-center">
              {index > 0 && (
                <span
                  className={`absolute right-1/2 top-4 h-0.5 w-full ${
                    index <= activeIndex ? "bg-emerald-500" : "bg-slate-200"
                  }`}
                />
              )}

              <span
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                  completed
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-200 bg-white text-slate-400"
                } ${current ? "ring-4 ring-emerald-100" : ""}`}
              >
                {index < activeIndex ? <Check size={15} /> : <Clock3 size={14} />}
              </span>

              <span
                className={`mt-2 text-center text-xs font-semibold ${
                  completed ? "text-emerald-700" : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ReturnCard = ({ item }) => {
  const shop = typeof item?.shop === "object" ? item.shop : null;
  const products = Array.isArray(item?.items) ? item.items : [];
  const isRejected = item?.status === "rejected";

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="rounded-xl bg-orange-100 p-2.5 text-orange-600">
            <Store size={19} />
          </span>
          <div className="min-w-0">
            {shop?.slug ? (
              <Link
                to={`/shop/${shop.slug}`}
                className="block truncate font-bold text-slate-900 hover:text-orange-600"
              >
                {shop.shopName || "Marketplace shop"}
              </Link>
            ) : (
              <p className="truncate font-bold text-slate-900">
                {shop?.shopName || "Platform Store"}
              </p>
            )}
            <p className="mt-0.5 text-xs text-slate-500">
              Return #{String(item?._id || "").slice(-8).toUpperCase()} · {formatDate(item?.createdAt)}
            </p>
          </div>
        </div>
        <StatusBadge status={item?.status} />
      </header>

      <div className="space-y-4 p-4 sm:p-5">
        <ReturnTimeline status={item?.status} />

        <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
          {products.map((product, index) => {
            const image = product?.image || product?.productImage || "";

            return (
              <div
                key={`${product?.product || "product"}-${index}`}
                className="flex items-center gap-3 p-3"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  {image ? (
                    <img
                      src={resolveImage(image)}
                      alt={product?.productName || "Returned product"}
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    <Package size={22} className="text-slate-300" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">
                    {product?.productName || "Returned product"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Qty: {product?.quantity || 1} · Refund: {formatMoney(product?.lineRefundAmount)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs text-slate-500">Reason</p>
            <p className="mt-1 font-semibold capitalize text-slate-800">
              {String(item?.reason || "—").replaceAll("_", " ")}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Product refund</p>
            <p className="mt-1 font-semibold text-slate-800">
              {formatMoney(item?.productRefundAmount)}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs text-slate-500">Total refund</p>
            <p className="mt-1 text-base font-bold text-emerald-600">
              {formatMoney(item?.totalRefundAmount)}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <p className="text-slate-500">Customer details</p>
          <p className="whitespace-pre-wrap text-slate-700">{item?.details || "—"}</p>
        </div>

        {item?.adminNote && (
          <div
            className={`rounded-xl border p-3 text-sm ${
              isRejected
                ? "border-red-100 bg-red-50 text-red-700"
                : "border-blue-100 bg-blue-50 text-blue-700"
            }`}
          >
            <p className="font-bold">Admin note</p>
            <p className="mt-1">{item.adminNote}</p>
          </div>
        )}

        <div className="flex justify-end border-t border-slate-100 pt-4">
          <Link
            to={`/dashboard/order/${item?.order}`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-orange-300 hover:text-orange-600"
          >
            View order <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
};

const MyReturns = () => {
  const token = localStorage.getItem("token");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const {
    data: items = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["my-returns"],
    enabled: Boolean(token),
    queryFn: async ({ signal }) => {
      const response = await fetch(apiUrl("/api/returns/my"), {
        signal,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load return requests");
      }

      return Array.isArray(data) ? data : data?.items || [];
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const filteredItems = items.filter((item) => {
    const matchesStatus = status === "all" || item?.status === status;
    const keyword = search.trim().toLowerCase();

    if (!keyword) return matchesStatus;

    const searchable = [
      item?._id,
      item?.order,
      item?.shop?.shopName,
      item?.reason,
      ...(item?.items || []).map((product) => product?.productName),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return matchesStatus && searchable.includes(keyword);
  });

  const totalRefund = items
    .filter((item) => item?.status === "refunded")
    .reduce((sum, item) => sum + Number(item?.totalRefundAmount || 0), 0);

  if (!token) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <AlertCircle className="mx-auto text-amber-600" />
        <h1 className="mt-3 text-xl font-bold text-amber-800">Login required</h1>
        <Link
          to="/login"
          className="mt-5 inline-flex rounded-lg bg-orange-600 px-5 py-2.5 font-semibold text-white"
        >
          Login
        </Link>
      </div>
    );
  }

  return (
    <main className="space-y-5 py-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <RotateCcw className="text-orange-600" /> My Returns
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              আপনার return request এবং refund status দেখুন।
            </p>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Total requests</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{items.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">In progress</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">
            {items.filter((item) => !["rejected", "cancelled", "refunded"].includes(item?.status)).length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="flex items-center gap-1.5 text-sm text-slate-500">
            <WalletCards size={15} /> Refunded
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {formatMoney(totalRefund)}
          </p>
        </div>
      </section>

      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_210px]">
        <label className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Return, order, shop বা product খুঁজুন"
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 outline-none focus:border-orange-400"
          />
        </label>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-orange-400"
        >
          <option value="all">All statuses</option>
          {Object.keys(statusClasses).map((value) => (
            <option key={value} value={value} className="capitalize">
              {value.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </section>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center text-slate-500">
          <LoaderCircle className="mr-2 animate-spin" /> Loading returns...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
          <AlertCircle className="mx-auto" />
          <p className="mt-2 font-semibold">{error.message}</p>
        </div>
      ) : filteredItems.length ? (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <ReturnCard key={item._id} item={item} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <RotateCcw className="mx-auto text-slate-300" size={38} />
          <h2 className="mt-3 font-bold text-slate-800">No return requests found</h2>
          <p className="mt-1 text-sm text-slate-500">
            আপনার filter অনুযায়ী কোনো return request পাওয়া যায়নি।
          </p>
        </div>
      )}
    </main>
  );
};

export default MyReturns;