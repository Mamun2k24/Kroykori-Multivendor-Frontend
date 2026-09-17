import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiExternalLink,
  FiRefreshCw,
  FiSearch,
  FiTrendingUp,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

const SERVER_URL = (
  import.meta.env.VITE_APP_SERVER_URL ||
  "http://localhost:5000/"
).replace(/\/+$/, "");

const formatMoney = (value) =>
  `৳${Number(value || 0).toLocaleString()}`;

const statusStyles = {
  approved:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending:
    "border-amber-200 bg-amber-50 text-amber-700",
  suspended:
    "border-red-200 bg-red-50 text-red-700",
  rejected:
    "border-red-200 bg-red-50 text-red-700",
};

const AdminSellerPerformance = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] =
    useState({
      total: 0,
      totalPages: 1,
      limit: 20,
    });
  const [loading, setLoading] =
    useState(true);

  const token = localStorage.getItem("token");

  const loadPerformance =
    useCallback(async () => {
      try {
        setLoading(true);

        const query =
          new URLSearchParams({
            page: String(page),
            limit: "20",
          });

        const response = await fetch(
          `${SERVER_URL}/api/admin/marketplace/sellers?${query.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to load seller performance",
          );
        }

        setItems(data?.items || []);

        setPagination({
          total: data?.total || 0,
          totalPages:
            data?.totalPages || 1,
          limit: data?.limit || 20,
        });
      } catch (error) {
        toast.error(error.message);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, [page, token]);

  useEffect(() => {
    loadPerformance();
  }, [loadPerformance]);

  const filteredItems = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    if (!keyword) return items;

    return items.filter((item) => {
      const text = [
        item.sellerName,
        item.sellerEmail,
        item.shopName,
        item.shopSlug,
        item.shopStatus,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(keyword);
    });
  }, [items, search]);

  const pageTotals = useMemo(
    () =>
      filteredItems.reduce(
        (total, item) => ({
          orders:
            total.orders +
            Number(item.totalOrders || 0),

          sales:
            total.sales +
            Number(item.grossSales || 0),

          commission:
            total.commission +
            Number(item.commission || 0),

          earnings:
            total.earnings +
            Number(
              item.sellerEarnings || 0,
            ),
        }),
        {
          orders: 0,
          sales: 0,
          commission: 0,
          earnings: 0,
        },
      ),
    [filteredItems],
  );

  const successRate = (item) => {
    const total = Number(
      item.totalOrders || 0,
    );

    if (!total) return 0;

    return Math.round(
      (Number(
        item.deliveredOrders || 0,
      ) /
        total) *
        100,
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Seller Performance
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Compare seller orders, sales,
            commission and earnings.
          </p>
        </div>

        <button
          type="button"
          onClick={loadPerformance}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium"
        >
          <FiRefreshCw
            className={
              loading ? "animate-spin" : ""
            }
          />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Page orders
          </p>
          <p className="mt-2 text-2xl font-bold">
            {pageTotals.orders}
          </p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <p className="text-sm text-blue-600">
            Gross sales
          </p>
          <p className="mt-2 text-2xl font-bold text-blue-700">
            {formatMoney(
              pageTotals.sales,
            )}
          </p>
        </div>

        <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
          <p className="text-sm text-orange-600">
            Platform commission
          </p>
          <p className="mt-2 text-2xl font-bold text-orange-700">
            {formatMoney(
              pageTotals.commission,
            )}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm text-emerald-600">
            Seller earnings
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {formatMoney(
              pageTotals.earnings,
            )}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4">
          <div className="relative max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search seller or shop..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <FiRefreshCw className="animate-spin text-3xl text-orange-500" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center">
            <FiTrendingUp className="mb-3 text-5xl text-slate-300" />

            <p className="font-medium text-slate-700">
              No seller performance data
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">
                      Seller / Shop
                    </th>
                    <th className="px-5 py-3">
                      Orders
                    </th>
                    <th className="px-5 py-3">
                      Success
                    </th>
                    <th className="px-5 py-3">
                      Gross sales
                    </th>
                    <th className="px-5 py-3">
                      Commission
                    </th>
                    <th className="px-5 py-3">
                      Earnings
                    </th>
                    <th className="px-5 py-3">
                      Wallet
                    </th>
                    <th className="px-5 py-3 text-right">
                      Shop
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map(
                    (item) => (
                      <tr
                        key={`${item.sellerId}-${item.shopId}`}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-800">
                            {item.shopName ||
                              "Unknown shop"}
                          </p>

                          <p className="text-xs text-slate-500">
                            {item.sellerName ||
                              item.sellerEmail ||
                              "Unknown seller"}
                          </p>

                          <span
                            className={`mt-2 inline-block rounded-full border px-2 py-0.5 text-xs capitalize ${
                              statusStyles[
                                item.shopStatus
                              ] ||
                              statusStyles.pending
                            }`}
                          >
                            {item.shopStatus ||
                              "unknown"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm">
                          <p>
                            Total:{" "}
                            <strong>
                              {
                                item.totalOrders
                              }
                            </strong>
                          </p>

                          <p className="text-emerald-600">
                            Delivered:{" "}
                            {
                              item.deliveredOrders
                            }
                          </p>

                          <p className="text-red-500">
                            Cancelled:{" "}
                            {
                              item.cancelledOrders
                            }
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <div className="w-24">
                            <div className="mb-1 flex justify-between text-xs">
                              <span>
                                Delivery
                              </span>
                              <span>
                                {successRate(
                                  item,
                                )}
                                %
                              </span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{
                                  width: `${successRate(
                                    item,
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 font-semibold">
                          {formatMoney(
                            item.grossSales,
                          )}
                        </td>

                        <td className="px-5 py-4 font-semibold text-orange-600">
                          {formatMoney(
                            item.commission,
                          )}
                        </td>

                        <td className="px-5 py-4 font-semibold text-emerald-600">
                          {formatMoney(
                            item.sellerEarnings,
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm">
                          <p>
                            Available:{" "}
                            {formatMoney(
                              item.availableBalance,
                            )}
                          </p>

                          <p className="text-xs text-slate-500">
                            Pending:{" "}
                            {formatMoney(
                              item.pendingBalance,
                            )}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-right">
                          {item.shopSlug && (
                            <Link
                              to={`/shop/${item.shopSlug}`}
                              target="_blank"
                              className="inline-flex rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                            >
                              <FiExternalLink />
                            </Link>
                          )}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 p-4 xl:hidden">
              {filteredItems.map((item) => (
                <div
                  key={`${item.sellerId}-${item.shopId}`}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {item.shopName}
                      </h3>

                      <p className="text-sm text-slate-500">
                        {item.sellerName ||
                          item.sellerEmail}
                      </p>
                    </div>

                    <span className="rounded-full border px-2 py-1 text-xs capitalize">
                      {item.shopStatus}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">
                        Orders
                      </p>
                      <p className="font-semibold">
                        {item.totalOrders}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Delivery rate
                      </p>
                      <p className="font-semibold">
                        {successRate(item)}%
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Sales
                      </p>
                      <p className="font-semibold">
                        {formatMoney(
                          item.grossSales,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Commission
                      </p>
                      <p className="font-semibold text-orange-600">
                        {formatMoney(
                          item.commission,
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Total {pagination.total} sellers
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() =>
                setPage((current) =>
                  Math.max(
                    current - 1,
                    1,
                  ),
                )
              }
              className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
            >
              <FiChevronLeft />
            </button>

            <span className="px-3 text-sm">
              Page {page} of{" "}
              {pagination.totalPages}
            </span>

            <button
              disabled={
                page >=
                pagination.totalPages
              }
              onClick={() =>
                setPage(
                  (current) =>
                    current + 1,
                )
              }
              className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSellerPerformance;