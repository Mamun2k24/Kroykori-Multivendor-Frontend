import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  FiAlertCircle,
  FiArrowRight,
  FiBox,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiPackage,
  FiRefreshCw,
  FiShoppingBag,
  FiStar,
  FiTruck,
  FiXCircle,
} from "react-icons/fi";

import { useUser } from "../../hooks/userContext";

const API_URL = String(
  import.meta.env.VITE_APP_SERVER_URL || "",
).replace(/\/+$/, "");

const formatMoney = (value) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "—";

  return new Intl.DateTimeFormat(
    "en-BD",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(value));
};

const statusClass = {
  pending:
    "bg-amber-50 text-amber-700 ring-amber-200",
  processing:
    "bg-blue-50 text-blue-700 ring-blue-200",
  shipped:
    "bg-violet-50 text-violet-700 ring-violet-200",
  delivered:
    "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cancelled:
    "bg-red-50 text-red-700 ring-red-200",
  paid:
    "bg-emerald-50 text-emerald-700 ring-emerald-200",
  unpaid:
    "bg-slate-100 text-slate-600 ring-slate-200",
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ring-1 ring-inset ${
      statusClass[status] ||
      "bg-slate-100 text-slate-600 ring-slate-200"
    }`}
  >
    {status || "unknown"}
  </span>
);

const StatCard = ({
  title,
  value,
  note,
  icon,
  iconClass,
}) => (
  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-slate-500">
          {title}
        </p>

        <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">
          {value}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {note}
        </p>
      </div>

      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        {icon}
      </div>
    </div>
  </article>
);

const MiniStat = ({
  label,
  value,
  icon,
  className,
}) => (
  <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
    <div
      className={`flex h-9 w-9 items-center justify-center rounded-lg ${className}`}
    >
      {icon}
    </div>

    <div>
      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className="text-lg font-bold text-slate-900">
        {value}
      </p>
    </div>
  </div>
);

const SectionCard = ({
  title,
  description,
  action,
  children,
}) => (
  <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
    <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
      <div>
        <h2 className="font-bold text-slate-900">
          {title}
        </h2>

        {description && (
          <p className="mt-0.5 text-xs text-slate-500">
            {description}
          </p>
        )}
      </div>

      {action}
    </header>

    <div className="p-5">{children}</div>
  </section>
);

const SellerDashboardHome = () => {
  const { user } = useUser();

  const [dashboard, setDashboard] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadDashboard = useCallback(
    async (signal) => {
      const token =
        localStorage.getItem("token");

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/shops/me/dashboard`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
            signal,
          },
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Failed to load dashboard",
          );
        }

        setDashboard(result);
      } catch (requestError) {
        if (
          requestError.name !==
          "AbortError"
        ) {
          console.error(
            "Seller dashboard error:",
            requestError,
          );

          setError(
            requestError.message,
          );
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const controller =
      new AbortController();

    loadDashboard(
      controller.signal,
    );

    return () => {
      controller.abort();
    };
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-36 rounded-2xl bg-slate-200" />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="h-32 rounded-2xl bg-slate-200"
                />
              ),
            )}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="h-72 rounded-2xl bg-slate-200" />
            <div className="h-72 rounded-2xl bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboard?.shop) {
    return (
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <FiAlertCircle className="mx-auto h-12 w-12 text-red-500" />

          <h2 className="mt-4 text-xl font-bold text-slate-900">
            Dashboard unavailable
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {error ||
              "Seller shop was not found."}
          </p>

          <button
            type="button"
            onClick={() =>
              loadDashboard()
            }
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-700"
          >
            <FiRefreshCw />
            Try again
          </button>
        </div>
      </div>
    );
  }

  const {
    shop,
    products = {},
    orders = {},
    sales = {},
    wallet = {},
    recentOrders = [],
  } = dashboard;

  return (
    <main className="space-y-6 p-4 md:p-6">
      {/* Welcome and shop summary */}

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950 p-6 text-white shadow-xl md:p-8">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-orange-500/25 blur-3xl" />

        <div className="absolute -bottom-20 left-20 h-52 w-52 rounded-full bg-amber-400/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/10">
              {shop.logo ? (
                <img
                  src={shop.logo}
                  alt={shop.shopName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <FiShoppingBag className="h-7 w-7 text-orange-300" />
              )}
            </div>

            <div>
              <p className="text-sm text-slate-300">
                Welcome back,{" "}
                {user?.name ||
                  "Seller"}
              </p>

              <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">
                {shop.shopName}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge
                  status={shop.status}
                />

                <span className="inline-flex items-center gap-1 text-xs text-amber-300">
                  <FiStar />
                  {Number(
                    shop.ratingAverage ||
                      0,
                  ).toFixed(1)}

                  <span className="text-slate-400">
                    ({shop.ratingCount || 0})
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to={`/shop/${shop.slug}`}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold hover:bg-white/15"
            >
              View Shop
              <FiArrowRight />
            </Link>

            <Link
              to="/dashboard/seller/products/add"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
            >
              <FiPackage />
              Add Product
            </Link>
          </div>
        </div>
      </section>

      {/* Main statistics */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Products"
          value={products.total || 0}
          note={`${products.pending || 0} awaiting approval`}
          icon={<FiPackage className="h-5 w-5" />}
          iconClass="bg-blue-50 text-blue-600"
        />

        <StatCard
          title="Total Orders"
          value={orders.total || 0}
          note={`${orders.pending || 0} pending orders`}
          icon={<FiShoppingBag className="h-5 w-5" />}
          iconClass="bg-amber-50 text-amber-600"
        />

        <StatCard
          title="Seller Revenue"
          value={formatMoney(
            sales.sellerRevenue,
          )}
          note={`Commission ${formatMoney(
            sales.commission,
          )}`}
          icon={<FiDollarSign className="h-5 w-5" />}
          iconClass="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          title="Available Balance"
          value={formatMoney(
            wallet.availableBalance,
          )}
          note={`${formatMoney(
            wallet.pendingBalance,
          )} pending`}
          icon={<FiCreditCard className="h-5 w-5" />}
          iconClass="bg-violet-50 text-violet-600"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {/* Product stats */}

        <SectionCard
          title="Product Overview"
          description="Current product and stock status"
          action={
            <Link
              to="/dashboard/seller/products"
              className="text-xs font-bold text-orange-600 hover:text-orange-700"
            >
              View products
            </Link>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <MiniStat
              label="Approved"
              value={
                products.approved || 0
              }
              icon={<FiCheckCircle />}
              className="bg-emerald-100 text-emerald-700"
            />

            <MiniStat
              label="Pending"
              value={
                products.pending || 0
              }
              icon={<FiClock />}
              className="bg-amber-100 text-amber-700"
            />

            <MiniStat
              label="Rejected"
              value={
                products.rejected || 0
              }
              icon={<FiXCircle />}
              className="bg-red-100 text-red-700"
            />

            <MiniStat
              label="Total Stock"
              value={
                products.totalStock || 0
              }
              icon={<FiBox />}
              className="bg-blue-100 text-blue-700"
            />
          </div>

          {products.outOfStock > 0 && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
              <FiAlertCircle />

              {products.outOfStock}{" "}
              product(s) are out of
              stock.
            </div>
          )}
        </SectionCard>

        {/* Order stats */}

        <SectionCard
          title="Order Overview"
          description="Orders assigned to your shop"
          action={
            <Link
              to="/dashboard/seller/orders"
              className="text-xs font-bold text-orange-600 hover:text-orange-700"
            >
              View orders
            </Link>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <MiniStat
              label="Pending"
              value={orders.pending || 0}
              icon={<FiClock />}
              className="bg-amber-100 text-amber-700"
            />

            <MiniStat
              label="Processing"
              value={
                orders.processing || 0
              }
              icon={<FiRefreshCw />}
              className="bg-blue-100 text-blue-700"
            />

            <MiniStat
              label="Shipped"
              value={orders.shipped || 0}
              icon={<FiTruck />}
              className="bg-violet-100 text-violet-700"
            />

            <MiniStat
              label="Delivered"
              value={
                orders.delivered || 0
              }
              icon={<FiCheckCircle />}
              className="bg-emerald-100 text-emerald-700"
            />
          </div>
        </SectionCard>
      </section>

      {/* Wallet */}

      <SectionCard
        title="Wallet Summary"
        description="Earnings and withdrawal information"
        action={
          <Link
            to="/dashboard/seller/wallet"
            className="inline-flex items-center gap-1 text-xs font-bold text-orange-600"
          >
            Open wallet
            <FiArrowRight />
          </Link>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            [
              "Pending Balance",
              wallet.pendingBalance,
            ],
            [
              "Available Balance",
              wallet.availableBalance,
            ],
            [
              "Total Earned",
              wallet.totalEarned,
            ],
            [
              "Total Withdrawn",
              wallet.totalWithdrawn,
            ],
            [
              "Pending Withdrawal",
              wallet.pendingWithdrawal,
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl bg-slate-50 p-4"
            >
              <p className="text-xs font-medium text-slate-500">
                {label}
              </p>

              <p className="mt-2 text-lg font-black text-slate-900">
                {formatMoney(value)}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Recent orders */}

      <SectionCard
        title="Recent Orders"
        description="Latest orders received by your shop"
        action={
          <Link
            to="/dashboard/seller/orders"
            className="inline-flex items-center gap-1 text-xs font-bold text-orange-600"
          >
            View all
            <FiArrowRight />
          </Link>
        }
      >
        {recentOrders.length === 0 ? (
          <div className="py-10 text-center">
            <FiShoppingBag className="mx-auto h-10 w-10 text-slate-300" />

            <p className="mt-3 text-sm font-semibold text-slate-600">
              No orders received yet
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-3">
                      Order
                    </th>

                    <th className="px-3 py-3">
                      Customer
                    </th>

                    <th className="px-3 py-3">
                      Items
                    </th>

                    <th className="px-3 py-3">
                      Total
                    </th>

                    <th className="px-3 py-3">
                      Status
                    </th>

                    <th className="px-3 py-3">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recentOrders.map(
                    (order) => (
                      <tr
                        key={
                          order.sellerOrderId
                        }
                        className="border-b border-slate-50 last:border-0"
                      >
                        <td className="px-3 py-4 font-bold text-slate-800">
                          #
                          {String(
                            order.parentOrderId,
                          ).slice(-8)}
                        </td>

                        <td className="px-3 py-4">
                          <p className="font-medium text-slate-700">
                            {order.customer
                              ?.name ||
                              "Guest Customer"}
                          </p>

                          <p className="text-xs text-slate-400">
                            {order.customer
                              ?.mobile || "—"}
                          </p>
                        </td>

                        <td className="px-3 py-4 text-slate-600">
                          {order.itemCount}
                        </td>

                        <td className="px-3 py-4 font-bold text-slate-800">
                          {formatMoney(
                            order.total,
                          )}
                        </td>

                        <td className="px-3 py-4">
                          <StatusBadge
                            status={
                              order.orderStatus
                            }
                          />
                        </td>

                        <td className="px-3 py-4 text-xs text-slate-500">
                          {formatDate(
                            order.createdAt,
                          )}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {recentOrders.map(
                (order) => (
                  <article
                    key={
                      order.sellerOrderId
                    }
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-800">
                          #
                          {String(
                            order.parentOrderId,
                          ).slice(-8)}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {order.customer
                            ?.name ||
                            "Guest Customer"}
                        </p>
                      </div>

                      <StatusBadge
                        status={
                          order.orderStatus
                        }
                      />
                    </div>

                    <div className="mt-4 flex items-end justify-between">
                      <div className="text-xs text-slate-500">
                        <p>
                          Items:{" "}
                          {order.itemCount}
                        </p>

                        <p>
                          {formatDate(
                            order.createdAt,
                          )}
                        </p>
                      </div>

                      <p className="font-black text-slate-900">
                        {formatMoney(
                          order.total,
                        )}
                      </p>
                    </div>
                  </article>
                ),
              )}
            </div>
          </>
        )}
      </SectionCard>
    </main>
  );
};

export default SellerDashboardHome;