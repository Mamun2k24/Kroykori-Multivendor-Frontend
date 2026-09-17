// src/components/Order.jsx

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Eye,
  Inbox,
  MapPin,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";

const API_BASE = (
  import.meta.env.VITE_APP_SERVER_URL || ""
).replace(/\/+$/, "");

const apiUrl = (path) =>
  `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

const resolveImage = (image) => {
  if (!image) return "";

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("data:")
  ) {
    return image;
  }

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

const getStatusStyle = (status) => {
  const value = String(status || "").toLowerCase();

  const styles = {
    pending:
      "border-amber-200 bg-amber-50 text-amber-700",
    confirmed:
      "border-cyan-200 bg-cyan-50 text-cyan-700",
    processing:
      "border-blue-200 bg-blue-50 text-blue-700",
    shipped:
      "border-indigo-200 bg-indigo-50 text-indigo-700",
    delivered:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    cancelled:
      "border-red-200 bg-red-50 text-red-700",
    refunded:
      "border-purple-200 bg-purple-50 text-purple-700",
    partially_refunded:
      "border-violet-200 bg-violet-50 text-violet-700",
    unpaid:
      "border-orange-200 bg-orange-50 text-orange-700",
    paid:
      "border-green-200 bg-green-50 text-green-700",
  };

  return (
    styles[value] ||
    "border-slate-200 bg-slate-50 text-slate-700"
  );
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${getStatusStyle(
      status,
    )}`}
  >
    {String(status || "unknown").replaceAll("_", " ")}
  </span>
);

const ProductItem = ({ item }) => {
  const productId =
    typeof item?.product === "object"
      ? item.product?._id
      : item?.product;

  const productName =
    item?.productName ||
    item?.product?.productName ||
    "Product";

  const image =
    item?.image ||
    item?.product?.productImage?.[0] ||
    item?.product?.productImage ||
    "";

  const lineTotal =
    item?.lineTotal ??
    Number(item?.price || item?.finalPrice || 0) *
      Number(item?.quantity || 1);

  return (
    <div className="flex gap-3 border-b border-slate-100 py-3 last:border-b-0">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        {image ? (
          <img
            src={resolveImage(image)}
            alt={productName}
            className="h-full w-full object-contain p-1"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <Package size={24} />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        {productId ? (
          <Link
            to={`/product-details/${productId}`}
            className="line-clamp-2 text-sm font-semibold text-slate-800 hover:text-orange-600"
          >
            {productName}
          </Link>
        ) : (
          <h4 className="line-clamp-2 text-sm font-semibold text-slate-800">
            {productName}
          </h4>
        )}

        {item?.sku && (
          <p className="mt-0.5 text-xs text-slate-400">
            SKU: {item.sku}
          </p>
        )}

        <div className="mt-1 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            Qty: {item?.quantity || 1}
          </span>

          {item?.selectedSize && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
              Size: {item.selectedSize}
            </span>
          )}

          {item?.selectedWeight && (
            <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-xs text-cyan-700">
              Weight: {item.selectedWeight}
            </span>
          )}

          {item?.selectedColor && (
            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs text-violet-700">
              Color: {item.selectedColor}
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-slate-900">
          {formatMoney(lineTotal)}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {formatMoney(
            item?.finalPrice || item?.price || 0,
          )}{" "}
          each
        </p>
      </div>
    </div>
  );
};

const SellerOrderCard = ({ sellerOrder }) => {
  const shopSlug =
    typeof sellerOrder?.shop === "object"
      ? sellerOrder.shop?.slug
      : null;

  const shopName =
    sellerOrder?.shopName ||
    sellerOrder?.shop?.shopName ||
    "Marketplace Shop";

  const items = sellerOrder?.items || [];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <div className="rounded-lg bg-orange-100 p-2 text-orange-600">
            <Store size={18} />
          </div>

          <div className="min-w-0">
            {shopSlug ? (
              <Link
                to={`/shop/${shopSlug}`}
                className="block truncate font-semibold text-slate-900 hover:text-orange-600"
              >
                {shopName}
              </Link>
            ) : (
              <h3 className="truncate font-semibold text-slate-900">
                {shopName}
              </h3>
            )}

            <p className="text-xs text-slate-500">
              {items.length} product
              {items.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            status={sellerOrder?.orderStatus}
          />

          <StatusBadge
            status={sellerOrder?.paymentStatus}
          />
        </div>
      </div>

      <div className="px-4">
        {items.map((item, index) => (
          <ProductItem
            key={
              item?._id ||
              `${sellerOrder?._id}-${index}`
            }
            item={item}
          />
        ))}
      </div>

      <div className="grid gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3 text-sm sm:grid-cols-3">
        <div>
          <span className="text-slate-500">
            Product total
          </span>
          <p className="font-semibold text-slate-800">
            {formatMoney(
              sellerOrder?.productTotalAfterDiscount ??
                sellerOrder?.subtotal,
            )}
          </p>
        </div>

        <div>
          <span className="text-slate-500">
            Shipping
          </span>
          <p className="font-semibold text-slate-800">
            {formatMoney(sellerOrder?.shippingCost)}
          </p>
        </div>

        <div className="sm:text-right">
          <span className="text-slate-500">
            Shop total
          </span>
          <p className="font-bold text-orange-600">
            {formatMoney(sellerOrder?.total)}
          </p>
        </div>
      </div>

      {(sellerOrder?.courierName ||
        sellerOrder?.trackingCode) && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-slate-100 px-4 py-3 text-xs text-slate-600">
          {sellerOrder?.courierName && (
            <span>
              Courier:{" "}
              <strong>
                {sellerOrder.courierName}
              </strong>
            </span>
          )}

          {sellerOrder?.trackingCode && (
            <span>
              Tracking:{" "}
              <strong>
                {sellerOrder.trackingCode}
              </strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

const OrderCard = ({ order }) => {
  const sellerOrders = Array.isArray(
    order?.sellerOrders,
  )
    ? order.sellerOrders
    : [];

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-bold text-slate-900">
                Order #
                {order?._id?.slice(-8).toUpperCase()}
              </h2>

              <StatusBadge
                status={order?.orderStatus}
              />

              <StatusBadge
                status={order?.paymentStatus}
              />
            </div>

            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={15} />
                {formatDate(order?.createdAt)}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <Truck size={15} />
                {order?.shippingOption === "inside"
                  ? "Inside Dhaka"
                  : order?.shippingOption ===
                      "outside"
                    ? "Outside Dhaka"
                    : order?.shippingOption || "Delivery"}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <CircleDollarSign size={15} />
                {order?.paymentMethod || "Payment"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 lg:flex-col lg:items-end">
            <div className="lg:text-right">
              <p className="text-xs text-slate-500">
                Grand total
              </p>
              <p className="text-xl font-bold text-orange-600">
                {formatMoney(order?.totalPrice)}
              </p>
            </div>

            <Link
              to={`/dashboard/order/${order._id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              <Eye size={16} />
              View details
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-4 bg-slate-50/50 p-4 sm:p-5">
        {sellerOrders.length > 0 ? (
          sellerOrders.map((sellerOrder, index) => (
            <SellerOrderCard
              key={
                sellerOrder?._id ||
                `${order._id}-${index}`
              }
              sellerOrder={sellerOrder}
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
            {(order?.products || []).map(
              (item, index) => (
                <ProductItem
                  key={
                    item?._id ||
                    `${order._id}-${index}`
                  }
                  item={item}
                />
              ),
            )}
          </div>
        )}
      </div>

      <div className="grid gap-3 border-t border-slate-200 px-4 py-4 text-sm sm:grid-cols-2 lg:grid-cols-4 sm:px-5">
        <div>
          <p className="text-slate-500">Subtotal</p>
          <p className="font-semibold text-slate-900">
            {formatMoney(order?.subtotal)}
          </p>
        </div>

        <div>
          <p className="text-slate-500">
            Total shipping
          </p>
          <p className="font-semibold text-slate-900">
            {formatMoney(order?.shippingCost)}
          </p>
        </div>

        <div>
          <p className="text-slate-500">
            Discount
          </p>
          <p className="font-semibold text-emerald-600">
            -{formatMoney(order?.discountAmount)}
          </p>
        </div>

        <div className="sm:text-right">
          <p className="text-slate-500">
            Total payable
          </p>
          <p className="text-lg font-bold text-slate-900">
            {formatMoney(order?.totalPrice)}
          </p>
        </div>
      </div>
    </article>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((item) => (
      <div
        key={item}
        className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
      >
        <div className="h-5 w-48 rounded bg-slate-200" />
        <div className="mt-3 h-4 w-72 rounded bg-slate-100" />
        <div className="mt-6 h-32 rounded-xl bg-slate-100" />
      </div>
    ))}
  </div>
);

const EmptyState = () => (
  <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center">
    <div className="rounded-full bg-orange-50 p-5 text-orange-500">
      <Inbox size={40} />
    </div>

    <h2 className="mt-4 text-xl font-bold text-slate-900">
      No orders found
    </h2>

    <p className="mt-1 max-w-md text-sm text-slate-500">
      আপনার এখনো কোনো order নেই অথবা selected
      filter-এর অধীনে কোনো order পাওয়া যায়নি।
    </p>

    <Link
      to="/"
      className="mt-5 inline-flex items-center gap-2 rounded-lg bg-orange-600 px-5 py-2.5 font-semibold text-white hover:bg-orange-700"
    >
      <ShoppingBag size={18} />
      Start shopping
    </Link>
  </div>
);

const Order = () => {
  const token = localStorage.getItem("token");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const {
    data: orders = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["my-orders"],
    enabled: Boolean(token),

    queryFn: async ({ signal }) => {
      const response = await fetch(
        apiUrl("/api/my/orders"),
        {
          signal,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Failed to load orders (${response.status})`,
        );
      }

      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.orders))
        return data.orders;
      if (Array.isArray(data?.items))
        return data.items;

      return [];
    },

    staleTime: 30_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    setPage(1);
  }, [search, status, sort, pageSize]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = orders.filter((order) => {
      const matchesStatus =
        status === "all" ||
        String(order?.orderStatus).toLowerCase() ===
          status ||
        order?.sellerOrders?.some(
          (sellerOrder) =>
            String(
              sellerOrder?.orderStatus,
            ).toLowerCase() === status,
        );

      if (!matchesStatus) return false;
      if (!query) return true;

      const orderId = String(
        order?._id || "",
      ).toLowerCase();

      const customerName = String(
        order?.customer?.name || "",
      ).toLowerCase();

      const shopNames = (
        order?.sellerOrders || []
      )
        .map(
          (sellerOrder) =>
            sellerOrder?.shopName ||
            sellerOrder?.shop?.shopName ||
            "",
        )
        .join(" ")
        .toLowerCase();

      const productNames = (
        order?.sellerOrders || []
      )
        .flatMap(
          (sellerOrder) =>
            sellerOrder?.items || [],
        )
        .map(
          (item) =>
            item?.productName ||
            item?.product?.productName ||
            "",
        )
        .join(" ")
        .toLowerCase();

      return (
        orderId.includes(query) ||
        customerName.includes(query) ||
        shopNames.includes(query) ||
        productNames.includes(query)
      );
    });

    return [...result].sort((a, b) => {
      if (sort === "oldest") {
        return (
          new Date(a.createdAt) -
          new Date(b.createdAt)
        );
      }

      if (sort === "price_high") {
        return (
          Number(b.totalPrice || 0) -
          Number(a.totalPrice || 0)
        );
      }

      if (sort === "price_low") {
        return (
          Number(a.totalPrice || 0) -
          Number(b.totalPrice || 0)
        );
      }

      return (
        new Date(b.createdAt) -
        new Date(a.createdAt)
      );
    });
  }, [orders, search, status, sort]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / pageSize),
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const currentOrders = filteredOrders.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  if (!token) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
        <h2 className="text-lg font-bold text-amber-800">
          Login required
        </h2>
        <p className="mt-1 text-sm text-amber-700">
          আপনার orders দেখতে প্রথমে login করুন।
        </p>
        <Link
          to="/login"
          className="mt-4 inline-flex rounded-lg bg-orange-600 px-5 py-2.5 font-semibold text-white"
        >
          Login
        </Link>
      </div>
    );
  }

  return (
    <section className="space-y-5 py-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              My Orders
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              আপনার সব shop-এর order এবং delivery
              status দেখুন।
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Order, shop বা product খুঁজুন"
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-orange-500 sm:w-72"
              />
            </label>

            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500"
            >
              <option value="all">All status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">
                Confirmed
              </option>
              <option value="processing">
                Processing
              </option>
              <option value="shipped">Shipped</option>
              <option value="delivered">
                Delivered
              </option>
              <option value="cancelled">
                Cancelled
              </option>
            </select>

            <select
              value={sort}
              onChange={(event) =>
                setSort(event.target.value)
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500"
            >
              <option value="newest">
                Newest first
              </option>
              <option value="oldest">
                Oldest first
              </option>
              <option value="price_high">
                Price high to low
              </option>
              <option value="price_low">
                Price low to high
              </option>
            </select>

            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={
                  isFetching ? "animate-spin" : ""
                }
              />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="font-bold text-red-700">
            Couldn’t load orders
          </h2>

          <p className="mt-1 text-sm text-red-600">
            {error.message}
          </p>

          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white"
          >
            Try again
          </button>
        </div>
      ) : currentOrders.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="space-y-5">
            {currentOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
              />
            ))}
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span>
                Showing{" "}
                {(page - 1) * pageSize + 1}–
                {Math.min(
                  page * pageSize,
                  filteredOrders.length,
                )}{" "}
                of {filteredOrders.length}
              </span>

              <select
                value={pageSize}
                onChange={(event) =>
                  setPageSize(
                    Number(event.target.value),
                  )
                }
                className="rounded-md border border-slate-300 px-2 py-1"
              >
                {[5, 10, 20].map((size) => (
                  <option
                    key={size}
                    value={size}
                  >
                    {size} / page
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  setPage((current) =>
                    Math.max(1, current - 1),
                  )
                }
                disabled={page === 1}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium disabled:opacity-40"
              >
                <ChevronLeft size={17} />
                Previous
              </button>

              <span className="px-2 text-sm text-slate-600">
                {page} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() =>
                  setPage((current) =>
                    Math.min(
                      totalPages,
                      current + 1,
                    ),
                  )
                }
                disabled={page === totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium disabled:opacity-40"
              >
                Next
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default Order;