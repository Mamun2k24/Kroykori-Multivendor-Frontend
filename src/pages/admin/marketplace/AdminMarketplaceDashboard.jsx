import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  FiCreditCard,
  FiDollarSign,
  FiPackage,
  FiRefreshCw,
  FiRepeat,
  FiShoppingBag,
  FiShoppingCart,
  FiUserCheck,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

const SERVER_URL = (
  import.meta.env.VITE_APP_SERVER_URL ||
  "http://localhost:5000/"
).replace(/\/+$/, "");

const formatMoney = (value) =>
  `৳${Number(value || 0).toLocaleString()}`;

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  to,
  color,
}) => (
  <Link
    to={to}
    className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500">
          {title}
        </p>

        <p className="mt-2 text-3xl font-bold text-slate-900">
          {value}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {subtitle}
        </p>
      </div>

      <div
        className={`rounded-xl p-3 text-xl ${color}`}
      >
        <Icon />
      </div>
    </div>
  </Link>
);

const AdminMarketplaceDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] =
    useState(true);

  const token = localStorage.getItem("token");

  const loadDashboard =
    useCallback(async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `${SERVER_URL}/api/admin/marketplace/dashboard`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message ||
              "Failed to load dashboard",
          );
        }

        setData(result);
      } catch (error) {
        toast.error(error.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    }, [token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <FiRefreshCw className="animate-spin text-4xl text-orange-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border bg-white p-10 text-center">
        Marketplace data unavailable.
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Marketplace Overview
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Multi-vendor business summary and
            pending actions.
          </p>
        </div>

        <button
          type="button"
          onClick={loadDashboard}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-4 py-2.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FiRefreshCw
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Pending sellers"
          value={data.applications?.pending || 0}
          subtitle={`${data.applications?.approved || 0} approved applications`}
          icon={FiUserCheck}
          to="/dashboard/admin/seller-applications"
          color="bg-blue-50 text-blue-600"
        />

        <StatCard
          title="Active shops"
          value={data.shops?.active || 0}
          subtitle={`${data.shops?.suspended || 0} suspended`}
          icon={FiShoppingBag}
          to="/dashboard/admin/shops"
          color="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          title="Pending products"
          value={data.products?.pending || 0}
          subtitle={`${data.products?.approved || 0} approved products`}
          icon={FiPackage}
          to="/dashboard/admin/seller-products"
          color="bg-amber-50 text-amber-600"
        />

        <StatCard
          title="Pending orders"
          value={data.orders?.pending || 0}
          subtitle={`${data.orders?.processing || 0} being processed`}
          icon={FiShoppingCart}
          to="/dashboard/admin/seller-orders"
          color="bg-violet-50 text-violet-600"
        />

        <StatCard
          title="Gross seller sales"
          value={formatMoney(
            data.finance?.grossSales,
          )}
          subtitle={`Commission ${formatMoney(
            data.finance?.platformCommission,
          )}`}
          icon={FiDollarSign}
          to="/dashboard/admin/seller-transactions"
          color="bg-cyan-50 text-cyan-600"
        />

        <StatCard
          title="Pending payouts"
          value={data.payouts?.pendingCount || 0}
          subtitle={formatMoney(
            data.payouts?.pendingAmount,
          )}
          icon={FiCreditCard}
          to="/dashboard/admin/payouts"
          color="bg-orange-50 text-orange-600"
        />

        <StatCard
          title="Return requests"
          value={data.returns?.requested || 0}
          subtitle={`${data.returns?.inProgress || 0} in progress`}
          icon={FiRepeat}
          to="/dashboard/admin/returns"
          color="bg-red-50 text-red-600"
        />

        <StatCard
          title="Seller wallet balance"
          value={formatMoney(
            data.wallets?.availableBalance,
          )}
          subtitle={`Pending ${formatMoney(
            data.wallets?.pendingBalance,
          )}`}
          icon={FiDollarSign}
          to="/dashboard/admin/seller-transactions"
          color="bg-emerald-50 text-emerald-600"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="border-b p-5">
            <h2 className="font-bold text-slate-900">
              Recent seller applications
            </h2>
          </div>

          <div className="divide-y">
            {data.recentApplications?.map(
              (item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between gap-3 p-4"
                >
                  <div>
                    <p className="font-medium text-slate-800">
                      {item.businessName}
                    </p>

                    <p className="text-xs text-slate-500">
                      {item.userId?.name ||
                        item.userId?.email ||
                        "Unknown applicant"}
                    </p>
                  </div>

                  <span className="rounded-full border px-2.5 py-1 text-xs capitalize">
                    {item.status}
                  </span>
                </div>
              ),
            )}

            {!data.recentApplications?.length && (
              <p className="p-6 text-center text-sm text-slate-500">
                No seller applications
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="border-b p-5">
            <h2 className="font-bold text-slate-900">
              Recent payouts
            </h2>
          </div>

          <div className="divide-y">
            {data.recentPayouts?.map(
              (item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between gap-3 p-4"
                >
                  <div>
                    <p className="font-medium text-slate-800">
                      {item.shop?.shopName ||
                        item.seller?.name ||
                        "Unknown seller"}
                    </p>

                    <p className="text-xs capitalize text-slate-500">
                      {item.status}
                    </p>
                  </div>

                  <p className="font-bold text-orange-600">
                    {formatMoney(
                      item.amount,
                    )}
                  </p>
                </div>
              ),
            )}

            {!data.recentPayouts?.length && (
              <p className="p-6 text-center text-sm text-slate-500">
                No payout requests
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMarketplaceDashboard;