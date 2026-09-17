import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FiEdit2,
  FiExternalLink,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiShoppingBag,
  FiSlash,
  FiX,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

const SERVER_URL = (
  import.meta.env.VITE_APP_SERVER_URL ||
  "http://localhost:5000/"
).replace(/\/+$/, "");

const apiUrl = (path) =>
  `${SERVER_URL}/api${path}`;

const getImageUrl = (url) => {
  if (!url) return "";

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${SERVER_URL}${
    url.startsWith("/") ? "" : "/"
  }${url}`;
};

const statusStyles = {
  approved:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending:
    "border-amber-200 bg-amber-50 text-amber-700",
  rejected:
    "border-red-200 bg-red-50 text-red-700",
  suspended:
    "border-slate-300 bg-slate-100 text-slate-700",
};

const AdminShops = () => {
  const [shops, setShops] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] =
    useState(true);
  const [processingId, setProcessingId] =
    useState(null);

  const [commissionShop, setCommissionShop] =
    useState(null);

  const [commissionRate, setCommissionRate] =
    useState("");

  const token = localStorage.getItem("token");

  const loadShops = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(
        apiUrl("/admin/shops"),
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
            "Failed to load shops",
        );
      }

      setShops(
        Array.isArray(data)
          ? data
          : data?.items ||
              data?.shops ||
              [],
      );
    } catch (error) {
      toast.error(error.message);
      setShops([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadShops();
  }, [loadShops]);

  const filteredShops = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    return shops.filter((shop) => {
      const matchesStatus =
        !status || shop.status === status;

      const searchableText = [
        shop.shopName,
        shop.slug,
        shop.contactEmail,
        shop.contactPhone,
        shop.owner?.name,
        shop.owner?.email,
        shop.owner?.mobile,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !keyword ||
        searchableText.includes(keyword);

      return matchesStatus && matchesSearch;
    });
  }, [shops, search, status]);

  const updateShopStatus = async (
    shop,
    action,
  ) => {
    const actionLabel =
      action === "suspend"
        ? "suspend"
        : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionLabel} ${shop.shopName}?`,
    );

    if (!confirmed) return;

    try {
      setProcessingId(shop._id);

      const response = await fetch(
        apiUrl(
          `/admin/shops/${shop._id}/${action}`,
        ),
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Failed to ${actionLabel} shop`,
        );
      }

      toast.success(
        data?.message ||
          `Shop ${actionLabel}d successfully`,
      );

      await loadShops();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const openCommissionModal = (shop) => {
    setCommissionShop(shop);
    setCommissionRate(
      String(shop.commissionRate ?? 10),
    );
  };

  const updateCommission = async () => {
    const rate = Number(commissionRate);

    if (
      !Number.isFinite(rate) ||
      rate < 0 ||
      rate > 100
    ) {
      toast.error(
        "Commission must be between 0 and 100",
      );
      return;
    }

    try {
      setProcessingId(commissionShop._id);

      const response = await fetch(
        apiUrl(
          `/admin/shops/${commissionShop._id}/commission`,
        ),
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            commissionRate: rate,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to update commission",
        );
      }

      toast.success(
        data?.message ||
          "Commission updated successfully",
      );

      setCommissionShop(null);
      setCommissionRate("");

      await loadShops();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const totals = useMemo(
    () => ({
      all: shops.length,

      approved: shops.filter(
        (shop) =>
          shop.status === "approved" &&
          shop.isActive,
      ).length,

      suspended: shops.filter(
        (shop) =>
          shop.status === "suspended" ||
          !shop.isActive,
      ).length,
    }),
    [shops],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Shops Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage marketplace shops,
            commission and account status.
          </p>
        </div>

        <button
          type="button"
          onClick={loadShops}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <FiRefreshCw
            className={
              loading ? "animate-spin" : ""
            }
          />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Total shops
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {totals.all}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm text-emerald-600">
            Active shops
          </p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">
            {totals.approved}
          </p>
        </div>

        <div className="rounded-xl border border-slate-300 bg-slate-100 p-5">
          <p className="text-sm text-slate-600">
            Suspended shops
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-800">
            {totals.suspended}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 lg:flex-row">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search shop, seller, email..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-orange-500"
          >
            <option value="">
              All statuses
            </option>
            <option value="approved">
              Approved
            </option>
            <option value="pending">
              Pending
            </option>
            <option value="suspended">
              Suspended
            </option>
            <option value="rejected">
              Rejected
            </option>
          </select>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <FiRefreshCw className="animate-spin text-3xl text-orange-500" />
          </div>
        ) : filteredShops.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center text-center">
            <FiShoppingBag className="mb-3 text-5xl text-slate-300" />

            <h3 className="font-semibold text-slate-700">
              No shops found
            </h3>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">
                      Shop
                    </th>
                    <th className="px-5 py-3">
                      Seller
                    </th>
                    <th className="px-5 py-3">
                      Contact
                    </th>
                    <th className="px-5 py-3">
                      Commission
                    </th>
                    <th className="px-5 py-3">
                      Balance
                    </th>
                    <th className="px-5 py-3">
                      Status
                    </th>
                    <th className="px-5 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredShops.map((shop) => (
                    <tr
                      key={shop._id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {shop.logo ? (
                            <img
                              src={getImageUrl(
                                shop.logo,
                              )}
                              alt={shop.shopName}
                              className="h-11 w-11 rounded-lg border object-cover"
                            />
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                              <FiShoppingBag />
                            </div>
                          )}

                          <div>
                            <p className="font-medium text-slate-800">
                              {shop.shopName}
                            </p>

                            <p className="text-xs text-slate-500">
                              {shop.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-slate-700">
                          {shop.owner?.name ||
                            "Unknown"}
                        </p>

                        <p className="text-xs text-slate-500">
                          {shop.owner?.email ||
                            shop.owner?.mobile ||
                            "—"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        <p>
                          {shop.contactEmail ||
                            "—"}
                        </p>
                        <p>
                          {shop.contactPhone ||
                            "—"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-800">
                          {shop.commissionRate ??
                            0}
                          %
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm">
                        <p className="text-slate-700">
                          Available: ৳
                          {Number(
                            shop.availableBalance ||
                              0,
                          ).toLocaleString()}
                        </p>

                        <p className="text-xs text-slate-500">
                          Pending: ৳
                          {Number(
                            shop.pendingBalance ||
                              0,
                          ).toLocaleString()}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                            statusStyles[
                              shop.status
                            ] ||
                            statusStyles.pending
                          }`}
                        >
                          {shop.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {shop.slug && (
                            <Link
                              to={`/shop/${shop.slug}`}
                              target="_blank"
                              title="View public shop"
                              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                            >
                              <FiExternalLink />
                            </Link>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              openCommissionModal(
                                shop,
                              )
                            }
                            title="Update commission"
                            className="rounded-lg border border-blue-200 p-2 text-blue-600 hover:bg-blue-50"
                          >
                            <FiEdit2 />
                          </button>

                          {shop.status ===
                            "approved" &&
                          shop.isActive ? (
                            <button
                              type="button"
                              onClick={() =>
                                updateShopStatus(
                                  shop,
                                  "suspend",
                                )
                              }
                              disabled={
                                processingId ===
                                shop._id
                              }
                              title="Suspend shop"
                              className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              <FiSlash />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                updateShopStatus(
                                  shop,
                                  "activate",
                                )
                              }
                              disabled={
                                processingId ===
                                shop._id
                              }
                              title="Activate shop"
                              className="rounded-lg border border-emerald-200 p-2 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                            >
                              <FiShield />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 p-4 lg:hidden">
              {filteredShops.map((shop) => (
                <div
                  key={shop._id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {shop.shopName}
                      </h3>

                      <p className="text-sm text-slate-500">
                        {shop.owner?.name}
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-2 py-1 text-xs ${
                        statusStyles[
                          shop.status
                        ] ||
                        statusStyles.pending
                      }`}
                    >
                      {shop.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">
                        Commission
                      </p>
                      <p className="font-medium">
                        {shop.commissionRate ??
                          0}
                        %
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Available balance
                      </p>
                      <p className="font-medium">
                        ৳
                        {Number(
                          shop.availableBalance ||
                            0,
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() =>
                        openCommissionModal(shop)
                      }
                      className="flex-1 rounded-lg border border-blue-200 py-2 text-sm font-medium text-blue-600"
                    >
                      Commission
                    </button>

                    {shop.status ===
                      "approved" &&
                    shop.isActive ? (
                      <button
                        onClick={() =>
                          updateShopStatus(
                            shop,
                            "suspend",
                          )
                        }
                        className="flex-1 rounded-lg border border-red-200 py-2 text-sm font-medium text-red-600"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          updateShopStatus(
                            shop,
                            "activate",
                          )
                        }
                        className="flex-1 rounded-lg border border-emerald-200 py-2 text-sm font-medium text-emerald-600"
                      >
                        Activate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {commissionShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Update commission
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {commissionShop.shopName}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setCommissionShop(null)
                }
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <FiX />
              </button>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Commission rate (%)
              </label>

              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={commissionRate}
                onChange={(event) =>
                  setCommissionRate(
                    event.target.value,
                  )
                }
                className="w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setCommissionShop(null)
                }
                className="rounded-lg border border-slate-200 px-4 py-2.5"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={updateCommission}
                disabled={
                  processingId ===
                  commissionShop._id
                }
                className="rounded-lg bg-orange-600 px-4 py-2.5 font-medium text-white hover:bg-orange-700 disabled:opacity-50"
              >
                Save commission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminShops;