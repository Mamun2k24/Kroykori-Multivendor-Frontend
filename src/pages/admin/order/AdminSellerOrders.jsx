import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FiEye,
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
  FiTruck,
  FiX,
} from "react-icons/fi";
import { toast } from "react-toastify";

const SERVER_URL = (
  import.meta.env.VITE_APP_SERVER_URL ||
  "http://localhost:5000/"
).replace(/\/+$/, "");

const apiUrl = (path) =>
  `${SERVER_URL}/api${path}`;

const formatMoney = (value) =>
  `৳${Number(value || 0).toLocaleString()}`;

const statusStyles = {
  pending:
    "border-amber-200 bg-amber-50 text-amber-700",
  confirmed:
    "border-blue-200 bg-blue-50 text-blue-700",
  processing:
    "border-violet-200 bg-violet-50 text-violet-700",
  shipped:
    "border-cyan-200 bg-cyan-50 text-cyan-700",
  delivered:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled:
    "border-red-200 bg-red-50 text-red-700",
  unpaid:
    "border-amber-200 bg-amber-50 text-amber-700",
  paid:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const initialForm = {
  orderStatus: "",
  paymentStatus: "",
  courierName: "",
  trackingCode: "",
  sellerNote: "",
  cancellationReason: "",
};

const AdminSellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] =
    useState("");
  const [loading, setLoading] =
    useState(true);
  const [selectedOrder, setSelectedOrder] =
    useState(null);
  const [loadingDetails, setLoadingDetails] =
    useState(false);
  const [updating, setUpdating] =
    useState(false);
  const [form, setForm] =
    useState(initialForm);

  const token = localStorage.getItem("token");

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);

      const query = new URLSearchParams();

      if (status) {
        query.set("status", status);
      }

      if (paymentStatus) {
        query.set(
          "paymentStatus",
          paymentStatus,
        );
      }

      const response = await fetch(
        apiUrl(
          `/admin/seller-orders${
            query.toString()
              ? `?${query.toString()}`
              : ""
          }`,
        ),
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
            "Failed to load seller orders",
        );
      }

      setOrders(
        Array.isArray(data)
          ? data
          : data?.items ||
              data?.orders ||
              [],
      );
    } catch (error) {
      toast.error(error.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [token, status, paymentStatus]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    if (!keyword) return orders;

    return orders.filter((item) => {
      const searchableText = [
        item.parentOrderId,
        item.orderId,
        item.sellerOrderId,
        item.shopName,
        item.shop?.shopName,
        item.seller?.name,
        item.seller?.email,
        item.customer?.name,
        item.customer?.email,
        item.customer?.mobile,
        item.trackingCode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [orders, search]);

  const getParentOrderId = (item) =>
    item.parentOrderId ||
    item.orderId ||
    item.order?._id ||
    item._id;

  const openDetails = async (item) => {
    const orderId = getParentOrderId(item);

    const sellerOrderId =
      item.sellerOrderId ||
      item.sellerOrder?._id ||
      item._id;

    if (!orderId || !sellerOrderId) {
      toast.error(
        "Order information is incomplete",
      );
      return;
    }

    try {
      setLoadingDetails(true);

      const response = await fetch(
        apiUrl(
          `/admin/seller-orders/${orderId}/${sellerOrderId}`,
        ),
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
            "Failed to load order details",
        );
      }

      const details =
        data?.sellerOrder
          ? {
              ...data,
              parentOrder:
                data.order ||
                data.parentOrder,
            }
          : data;

      const sellerOrder =
        details?.sellerOrder || details;

      setSelectedOrder({
        ...details,
        sellerOrder,
        orderId,
        sellerOrderId,
      });

      setForm({
        orderStatus:
          sellerOrder?.orderStatus || "",
        paymentStatus:
          sellerOrder?.paymentStatus || "",
        courierName:
          sellerOrder?.courierName || "",
        trackingCode:
          sellerOrder?.trackingCode || "",
        sellerNote:
          sellerOrder?.sellerNote || "",
        cancellationReason:
          sellerOrder?.cancellationReason ||
          "",
      });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const updateOrder = async () => {
    if (!form.orderStatus) {
      toast.error(
        "Order status is required",
      );
      return;
    }

    if (
      form.orderStatus === "shipped" &&
      (!form.courierName.trim() ||
        !form.trackingCode.trim())
    ) {
      toast.error(
        "Courier and tracking code are required",
      );
      return;
    }

    if (
      form.orderStatus === "cancelled" &&
      !form.cancellationReason.trim()
    ) {
      toast.error(
        "Cancellation reason is required",
      );
      return;
    }

    try {
      setUpdating(true);

      const response = await fetch(
        apiUrl(
          `/admin/seller-orders/${selectedOrder.orderId}/${selectedOrder.sellerOrderId}/status`,
        ),
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(form),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to update seller order",
        );
      }

      toast.success(
        data?.message ||
          "Seller order updated successfully",
      );

      setSelectedOrder(null);
      setForm(initialForm);
      await loadOrders();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Seller Orders
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor and manage every seller
            sub-order.
          </p>
        </div>

        <button
          type="button"
          onClick={loadOrders}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <FiRefreshCw
            className={
              loading ? "animate-spin" : ""
            }
          />
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search order, shop or customer..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-orange-500"
            />
          </div>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none"
          >
            <option value="">
              All order statuses
            </option>
            <option value="pending">
              Pending
            </option>
            <option value="confirmed">
              Confirmed
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

          <select
            value={paymentStatus}
            onChange={(event) =>
              setPaymentStatus(
                event.target.value,
              )
            }
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none"
          >
            <option value="">
              All payments
            </option>
            <option value="unpaid">
              Unpaid
            </option>
            <option value="paid">
              Paid
            </option>
          </select>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <FiRefreshCw className="animate-spin text-3xl text-orange-500" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center">
            <FiTruck className="mb-3 text-5xl text-slate-300" />

            <p className="font-medium text-slate-700">
              No seller orders found
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">
                      Order
                    </th>
                    <th className="px-5 py-3">
                      Shop
                    </th>
                    <th className="px-5 py-3">
                      Customer
                    </th>
                    <th className="px-5 py-3">
                      Total
                    </th>
                    <th className="px-5 py-3">
                      Order status
                    </th>
                    <th className="px-5 py-3">
                      Payment
                    </th>
                    <th className="px-5 py-3 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map(
                    (item, index) => (
                      <tr
                        key={
                          item.sellerOrderId ||
                          item._id ||
                          index
                        }
                        className="hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-slate-800">
                            #
                            {String(
                              getParentOrderId(
                                item,
                              ),
                            ).slice(-8)}
                          </p>

                          <p className="text-xs text-slate-500">
                            {item.createdAt
                              ? new Date(
                                  item.createdAt,
                                ).toLocaleString()
                              : "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-slate-700">
                            {item.shopName ||
                              item.shop
                                ?.shopName ||
                              "—"}
                          </p>

                          <p className="text-xs text-slate-500">
                            {item.seller?.name ||
                              item.seller
                                ?.email ||
                              "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm text-slate-700">
                            {item.customer
                              ?.name || "—"}
                          </p>

                          <p className="text-xs text-slate-500">
                            {item.customer
                              ?.mobile ||
                              item.customer
                                ?.email ||
                              "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {formatMoney(
                            item.total,
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                              statusStyles[
                                item
                                  .orderStatus
                              ] ||
                              statusStyles.pending
                            }`}
                          >
                            {item.orderStatus}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                              statusStyles[
                                item
                                  .paymentStatus
                              ] ||
                              statusStyles.unpaid
                            }`}
                          >
                            {item.paymentStatus}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              openDetails(item)
                            }
                            disabled={
                              loadingDetails
                            }
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                            title="View order"
                          >
                            <FiEye />
                          </button>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 p-4 lg:hidden">
              {filteredOrders.map(
                (item, index) => (
                  <div
                    key={
                      item.sellerOrderId ||
                      item._id ||
                      index
                    }
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {item.shopName ||
                            item.shop
                              ?.shopName ||
                            "Shop"}
                        </p>

                        <p className="text-xs text-slate-500">
                          #
                          {String(
                            getParentOrderId(
                              item,
                            ),
                          ).slice(-8)}
                        </p>
                      </div>

                      <p className="font-bold text-orange-600">
                        {formatMoney(
                          item.total,
                        )}
                      </p>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <span
                        className={`rounded-full border px-2 py-1 text-xs ${
                          statusStyles[
                            item.orderStatus
                          ] ||
                          statusStyles.pending
                        }`}
                      >
                        {item.orderStatus}
                      </span>

                      <span
                        className={`rounded-full border px-2 py-1 text-xs ${
                          statusStyles[
                            item.paymentStatus
                          ] ||
                          statusStyles.unpaid
                        }`}
                      >
                        {item.paymentStatus}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        openDetails(item)
                      }
                      className="mt-4 w-full rounded-lg border border-slate-200 py-2 text-sm font-medium"
                    >
                      View & manage
                    </button>
                  </div>
                ),
              )}
            </div>
          </>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Seller Order #
                  {String(
                    selectedOrder.orderId,
                  ).slice(-8)}
                </h2>

                <p className="text-sm text-slate-500">
                  {
                    selectedOrder
                      .sellerOrder?.shopName
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedOrder(null)
                }
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <FiX />
              </button>
            </div>

            <div className="space-y-6 p-5">
              <div className="grid gap-4 rounded-xl bg-slate-50 p-4 md:grid-cols-3">
                <div>
                  <p className="text-xs text-slate-500">
                    Customer
                  </p>
                  <p className="font-medium">
                    {selectedOrder.parentOrder
                      ?.customer?.name ||
                      selectedOrder.customer
                        ?.name ||
                      "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Mobile
                  </p>
                  <p className="font-medium">
                    {selectedOrder.parentOrder
                      ?.customer?.mobile ||
                      selectedOrder.customer
                        ?.mobile ||
                      "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Shop total
                  </p>
                  <p className="font-bold text-orange-600">
                    {formatMoney(
                      selectedOrder
                        .sellerOrder?.total,
                    )}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-semibold text-slate-800">
                  Products
                </h3>

                <div className="space-y-3">
                  {selectedOrder.sellerOrder?.items?.map(
                    (item) => (
                      <div
                        key={
                          item._id ||
                          item.product
                        }
                        className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"
                      >
                        <div>
                          <p className="font-medium text-slate-800">
                            {
                              item.productName
                            }
                          </p>

                          <p className="text-xs text-slate-500">
                            Qty:{" "}
                            {item.quantity} ·{" "}
                            {item.selectedSize ||
                              item.selectedColor ||
                              ""}
                          </p>
                        </div>

                        <p className="font-semibold">
                          {formatMoney(
                            item.lineTotal,
                          )}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Order status
                  </label>

                  <select
                    name="orderStatus"
                    value={form.orderStatus}
                    onChange={updateField}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5"
                  >
                    <option value="pending">
                      Pending
                    </option>
                    <option value="confirmed">
                      Confirmed
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

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Payment status
                  </label>

                  <select
                    name="paymentStatus"
                    value={
                      form.paymentStatus
                    }
                    onChange={updateField}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5"
                  >
                    <option value="unpaid">
                      Unpaid
                    </option>
                    <option value="paid">
                      Paid
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Courier name
                  </label>

                  <input
                    name="courierName"
                    value={form.courierName}
                    onChange={updateField}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Tracking code
                  </label>

                  <input
                    name="trackingCode"
                    value={form.trackingCode}
                    onChange={updateField}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5"
                  />
                </div>
              </div>

              {form.orderStatus ===
                "cancelled" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-red-700">
                    Cancellation reason
                  </label>

                  <textarea
                    name="cancellationReason"
                    value={
                      form.cancellationReason
                    }
                    onChange={updateField}
                    rows={3}
                    className="w-full rounded-lg border border-red-200 p-3"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Admin/Seller note
                </label>

                <textarea
                  name="sellerNote"
                  value={form.sellerNote}
                  onChange={updateField}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 p-3"
                />
              </div>

              <div className="flex justify-end border-t pt-5">
                <button
                  type="button"
                  onClick={updateOrder}
                  disabled={updating}
                  className="rounded-lg bg-orange-600 px-5 py-2.5 font-medium text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  {updating
                    ? "Updating..."
                    : "Update seller order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSellerOrders;