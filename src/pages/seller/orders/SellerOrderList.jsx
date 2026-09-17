import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiLoader,
  FiPackage,
  FiRefreshCw,
  FiShoppingBag,
} from "react-icons/fi";
import { Link } from "react-router-dom";

const API_URL = String(
  import.meta.env.VITE_APP_SERVER_URL || "",
).replace(/\/+$/, "");

const money = (value) =>
  `৳${Number(value || 0).toLocaleString(
    "en-BD",
  )}`;

const formatDate = (value) => {
  if (!value) return "N/A";

  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }).format(new Date(value));
};

const statusStyles = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-violet-100 text-violet-700",
  delivered:
    "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const paymentStyles = {
  paid: "bg-emerald-100 text-emerald-700",
  unpaid: "bg-slate-100 text-slate-600",
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${
      statusStyles[status] ||
      "bg-slate-100 text-slate-600"
    }`}
  >
    {status || "unknown"}
  </span>
);

const PaymentBadge = ({ status }) => (
  <span
    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${
      paymentStyles[status] ||
      "bg-slate-100 text-slate-600"
    }`}
  >
    {status || "unpaid"}
  </span>
);

const SellerOrderList = () => {
  const [orders, setOrders] = useState([]);

  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] =
    useState(1);

  const [loading, setLoading] =
    useState(true);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError(
        "Seller authentication token পাওয়া যায়নি।",
      );
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (status) {
      params.set("status", status);
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/seller/orders?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        },
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Orders load করা যায়নি।",
        );
      }

      setOrders(
        Array.isArray(data?.items)
          ? data.items
          : [],
      );

      setTotal(Number(data?.total || 0));

      setTotalPages(
        Math.max(
          Number(data?.totalPages || 1),
          1,
        ),
      );
    } catch (err) {
      setOrders([]);
      setError(
        err.message ||
          "Orders load করতে সমস্যা হয়েছে।",
      );
    } finally {
      setLoading(false);
    }
  }, [page, limit, status]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const changeStatus = (event) => {
    setStatus(event.target.value);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      {/* Header */}

      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Seller Orders
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            আপনার shop-এর orders ও delivery
            status পরিচালনা করুন।
          </p>
        </div>

        <button
          type="button"
          onClick={loadOrders}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <FiRefreshCw
            className={
              loading ? "animate-spin" : ""
            }
          />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <FiAlertCircle className="mt-0.5 shrink-0 text-lg" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold text-slate-900">
              Order List
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Total {total} orders
            </p>
          </div>

          <select
            value={status}
            onChange={changeStatus}
            className="min-w-52 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
          >
            <option value="">
              All order statuses
            </option>
            <option value="pending">
              Pending
            </option>
            <option value="processing">
              Processing
            </option>
            <option value="shipped">
              Shipped
            </option>
            <option value="delivered">
              Delivered
            </option>
            <option value="cancelled">
              Cancelled
            </option>
          </select>
        </div>
      </section>

      {/* Orders */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-80 items-center justify-center">
            <div className="text-center">
              <FiLoader className="mx-auto animate-spin text-4xl text-orange-500" />

              <p className="mt-3 text-sm text-slate-500">
                Orders loading...
              </p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center px-5 text-center">
            <FiShoppingBag className="text-5xl text-slate-300" />

            <h3 className="mt-4 font-bold text-slate-800">
              No orders found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              এই status-এর কোনো seller order
              পাওয়া যায়নি।
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1100px]">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">
                      Order
                    </th>
                    <th className="px-5 py-4">
                      Customer
                    </th>
                    <th className="px-5 py-4">
                      Items
                    </th>
                    <th className="px-5 py-4">
                      Amount
                    </th>
                    <th className="px-5 py-4">
                      Status
                    </th>
                    <th className="px-5 py-4">
                      Payment
                    </th>
                    <th className="px-5 py-4">
                      Date
                    </th>
                    <th className="px-5 py-4 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr
                      key={order.sellerOrderId}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          #
                          {String(
                            order.parentOrderId,
                          ).slice(-8)}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {order.shopName ||
                            "Seller Shop"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {order.customer?.name ||
                            "Guest Customer"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {order.customer?.mobile ||
                            order.customer?.email ||
                            "N/A"}
                        </p>

                        <p className="mt-1 max-w-52 truncate text-xs text-slate-400">
                          {order.district ||
                            order.address ||
                            ""}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <FiPackage />

                          {Array.isArray(
                            order.items,
                          )
                            ? order.items.reduce(
                                (
                                  totalItems,
                                  item,
                                ) =>
                                  totalItems +
                                  Number(
                                    item.quantity ||
                                      0,
                                  ),
                                0,
                              )
                            : 0}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-800">
                          {money(order.total)}
                        </p>

                        {Number(
                          order.sellerEarning,
                        ) > 0 && (
                          <p className="mt-1 text-xs text-emerald-600">
                            Earning:{" "}
                            {money(
                              order.sellerEarning,
                            )}
                          </p>
                        )}

                        {Number(
                          order.commissionAmount,
                        ) > 0 && (
                          <p className="mt-1 text-xs text-slate-400">
                            Commission:{" "}
                            {money(
                              order.commissionAmount,
                            )}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge
                          status={
                            order.orderStatus
                          }
                        />
                      </td>

                      <td className="px-5 py-4">
                        <PaymentBadge
                          status={
                            order.paymentStatus
                          }
                        />
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {formatDate(
                          order.orderCreatedAt,
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end">
                          <Link
                            to={`/dashboard/seller/orders/${order.parentOrderId}/${order.sellerOrderId}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                          >
                            <FiEye />
                            Details
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}

            <div className="space-y-4 p-4 lg:hidden">
              {orders.map((order) => (
                <article
                  key={order.sellerOrderId}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-800">
                        #
                        {String(
                          order.parentOrderId,
                        ).slice(-8)}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(
                          order.orderCreatedAt,
                        )}
                      </p>
                    </div>

                    <StatusBadge
                      status={order.orderStatus}
                    />
                  </div>

                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="font-semibold text-slate-800">
                      {order.customer?.name ||
                        "Guest Customer"}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {order.customer?.mobile ||
                        order.customer?.email ||
                        "N/A"}
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
                    <div>
                      <p className="text-xs text-slate-500">
                        Order total
                      </p>

                      <p className="mt-1 font-bold text-slate-800">
                        {money(order.total)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Payment
                      </p>

                      <div className="mt-1">
                        <PaymentBadge
                          status={
                            order.paymentStatus
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/dashboard/seller/orders/${order.parentOrderId}/${order.sellerOrderId}`}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white"
                  >
                    <FiEye />
                    View Order
                  </Link>
                </article>
              ))}
            </div>

            {/* Pagination */}

            <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row">
              <p className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() =>
                    setPage(
                      (previous) =>
                        previous - 1,
                    )
                  }
                  className="rounded-lg border border-slate-200 p-2.5 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiChevronLeft />
                </button>

                <span className="min-w-10 rounded-lg bg-orange-500 px-3 py-2 text-center text-sm font-bold text-white">
                  {page}
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage(
                      (previous) =>
                        previous + 1,
                    )
                  }
                  className="rounded-lg border border-slate-200 p-2.5 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default SellerOrderList;