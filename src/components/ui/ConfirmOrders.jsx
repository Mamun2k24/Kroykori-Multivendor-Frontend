import {
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import {
  toast,
  ToastContainer,
} from "react-toastify";
import {
  FiClock,
  FiEye,
  FiMapPin,
  FiPackage,
  FiPhone,
  FiRefreshCw,
  FiSearch,
  FiTruck,
  FiX,
  FiXCircle,
} from "react-icons/fi";

const fmtBDT = (value) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const fmtBDDateTime = (date) =>
  date
    ? new Intl.DateTimeFormat("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Dhaka",
      }).format(new Date(date))
    : "—";

const getBaseUrl = () => {
  const base =
    import.meta.env
      .VITE_APP_SERVER_URL || "";

  return base.endsWith("/")
    ? base
    : `${base}/`;
};

const getAuthHeaders = () => {
  const token =
    localStorage.getItem("token");

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};

const getProductName = (item) =>
  item?.productName ||
  item?.product?.productName ||
  "N/A";

const getProductSku = (item) =>
  item?.sku ||
  item?.product?.sku ||
  "—";

const getProductImage = (item) => {
  const image =
    item?.image ||
    item?.productImage ||
    item?.product?.productImage;

  if (Array.isArray(image)) {
    return image[0] || null;
  }

  return image || null;
};

const getOrderProducts = (order) => {
  if (
    Array.isArray(order?.products) &&
    order.products.length > 0
  ) {
    return order.products;
  }

  return (order?.sellerOrders || [])
    .flatMap(
      (sellerOrder) =>
        sellerOrder?.items || [],
    );
};

export default function ConfirmOrders() {
  const [orders, setOrders] =
    useState([]);

  const [query, setQuery] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [busyId, setBusyId] =
    useState(null);

  const [selectedOrder, setSelectedOrder] =
    useState(null);

  const [shippingOrder, setShippingOrder] =
    useState(null);

  const [courierName, setCourierName] =
    useState("");

  const [trackingCode, setTrackingCode] =
    useState("");

  const fetchConfirmedOrders = async (
    showRefreshing = false,
  ) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const baseUrl = getBaseUrl();

    try {
      const response = await axios.get(
        `${baseUrl}api/orders/confirmed`,
        {
          headers: getAuthHeaders(),
        },
      );

      const list = Array.isArray(
        response.data,
      )
        ? response.data
        : response.data?.orders ||
          response.data?.items ||
          [];

      setOrders(
        list.slice().sort(
          (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt),
        ),
      );
    } catch (firstError) {
      try {
        const response = await axios.get(
          `${baseUrl}api/orders`,
          {
            headers:
              getAuthHeaders(),
          },
        );

        const allOrders =
          Array.isArray(response.data)
            ? response.data
            : response.data?.orders ||
              response.data?.items ||
              [];

        const confirmedOrders =
          allOrders
            .filter((order) =>
              [
                "confirmed",
                "processing",
              ].includes(
                String(
                  order?.orderStatus ||
                    "",
                ).toLowerCase(),
              ),
            )
            .sort(
              (a, b) =>
                new Date(
                  b.createdAt,
                ) -
                new Date(
                  a.createdAt,
                ),
            );

        setOrders(confirmedOrders);
      } catch (fallbackError) {
        console.error(
          "fetchConfirmedOrders:",
          fallbackError,
        );

        toast.error(
          fallbackError?.response?.data
            ?.message ||
            "Failed to load confirmed orders",
        );

        setOrders([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConfirmedOrders();
  }, []);

  const filteredOrders =
    useMemo(() => {
      const search = query
        .trim()
        .toLowerCase();

      if (!search) {
        return orders;
      }

      return orders.filter(
        (order) => {
          const customerText = [
            order?._id,
            order?.customer?.name,
            order?.customer?.mobile,
            order?.customer?.email,
            order?.address,
            order?.district,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const productText =
            getOrderProducts(order)
              .map(
                (item) =>
                  `${getProductName(
                    item,
                  )} ${getProductSku(
                    item,
                  )}`,
              )
              .join(" ")
              .toLowerCase();

          return (
            customerText.includes(
              search,
            ) ||
            productText.includes(search)
          );
        },
      );
    }, [orders, query]);

  const openShippingModal = (order) => {
    setShippingOrder(order);
    setCourierName("");
    setTrackingCode("");
  };

  const closeShippingModal = () => {
    if (busyId) return;

    setShippingOrder(null);
    setCourierName("");
    setTrackingCode("");
  };

  const shipOrder = async () => {
    if (!shippingOrder?._id) {
      return;
    }

    if (!courierName.trim()) {
      toast.error(
        "Courier name is required",
      );
      return;
    }

    if (!trackingCode.trim()) {
      toast.error(
        "Tracking code is required",
      );
      return;
    }

    try {
      setBusyId(shippingOrder._id);

      const baseUrl = getBaseUrl();

      await axios.put(
        `${baseUrl}api/order/${shippingOrder._id}`,
        {
          orderStatus: "shipped",

          courierName:
            courierName.trim(),

          trackingCode:
            trackingCode.trim(),
        },
        {
          headers: getAuthHeaders(),
        },
      );

      toast.success(
        "Order marked as shipped",
      );

      setShippingOrder(null);
      setSelectedOrder(null);
      setCourierName("");
      setTrackingCode("");

      await fetchConfirmedOrders();
    } catch (error) {
      console.error(
        "shipOrder error:",
        error,
      );

      toast.error(
        error?.response?.data
          ?.message ||
          "Failed to mark order as shipped",
      );
    } finally {
      setBusyId(null);
    }
  };

  const cancelOrder = async (order) => {
    if (!order?._id) return;

    const confirmed =
      window.confirm(
        "Are you sure you want to cancel this order?",
      );

    if (!confirmed) return;

    try {
      setBusyId(order._id);

      const baseUrl = getBaseUrl();

      await axios.delete(
        `${baseUrl}api/order/${order._id}`,
        {
          headers:
            getAuthHeaders(),
        },
      );

      toast.success(
        "Order cancelled successfully",
      );

      setSelectedOrder(null);

      await fetchConfirmedOrders();
    } catch (error) {
      console.error(
        "cancelOrder error:",
        error,
      );

      toast.error(
        error?.response?.data
          ?.message ||
          "Failed to cancel order",
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className=" pt-2">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
            Confirm Orders
          </h1>

          <p className="text-sm text-gray-500">
            Confirmed/processing orders
            courier-এ পাঠিয়ে Shipped
            করুন।
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

            <input
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value,
                )
              }
              placeholder="Search mobile, address, product..."
              className="w-full rounded-lg border bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:w-72"
            />
          </div>

          <button
            type="button"
            disabled={refreshing}
            onClick={() =>
              fetchConfirmedOrders(
                true,
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <FiRefreshCw
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-6 py-3 text-left font-medium">
                  Customer
                </th>

                <th className="px-6 py-3 text-left font-medium">
                  Products
                </th>

                <th className="px-6 py-3 text-left font-medium">
                  Shipping
                </th>

                <th className="px-6 py-3 text-left font-medium">
                  Total
                </th>

                <th className="px-6 py-3 text-left font-medium">
                  Created
                </th>

                <th className="px-6 py-3 text-right font-medium">
                  Status
                </th>

                <th className="px-6 py-3 text-right font-medium">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <FiRefreshCw className="mx-auto mb-2 animate-spin text-xl text-indigo-600" />

                    Loading confirmed
                    orders...
                  </td>
                </tr>
              ) : (
                filteredOrders.map(
                  (order) => {
                    const products =
                      getOrderProducts(
                        order,
                      );

                    const productCount =
                      products.reduce(
                        (
                          total,
                          item,
                        ) =>
                          total +
                          (Number(
                            item?.quantity,
                          ) || 0),
                        0,
                      );

                    const isBusy =
                      busyId ===
                      order._id;

                    return (
                      <tr
                        key={order._id}
                        className="transition hover:bg-indigo-50/30"
                      >
                        <td className="px-6 py-3 align-top">
                          <div className="space-y-1">
                            <p className="font-medium text-gray-900">
                              {order
                                ?.customer
                                ?.name ||
                                "—"}
                            </p>

                            <p className="flex items-center gap-1.5 text-sm text-gray-700">
                              <FiPhone className="text-indigo-600" />

                              {order
                                ?.customer
                                ?.mobile ||
                                "—"}
                            </p>

                            <p className="flex max-w-[280px] items-start gap-1.5 text-xs text-gray-500">
                              <FiMapPin className="mt-[2px] shrink-0" />

                              <span className="truncate">
                                {order?.address ||
                                  "—"}
                              </span>
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-3">
                          <p className="font-medium text-gray-900">
                            {productCount}{" "}
                            items
                          </p>

                          <p className="mt-1 max-w-[250px] text-xs text-gray-500 line-clamp-2">
                            {products
                              .slice(0, 3)
                              .map(
                                getProductName,
                              )
                              .join(", ")}

                            {products.length >
                            3
                              ? "..."
                              : ""}
                          </p>
                        </td>

                        <td className="px-6 py-3 text-gray-700">
                          <p>
                            {order?.shippingOption ||
                              "—"}
                          </p>

                          <p className="text-xs text-gray-500">
                            {fmtBDT(
                              order?.shippingCost,
                            )}
                          </p>
                        </td>

                        <td className="px-6 py-3 font-semibold text-gray-900">
                          {fmtBDT(
                            order?.totalPrice,
                          )}
                        </td>

                        <td className="px-6 py-3 text-gray-600">
                          <p className="flex items-center gap-1.5 text-xs">
                            <FiClock />

                            {fmtBDDateTime(
                              order?.createdAt,
                            )}
                          </p>
                        </td>

                        <td className="px-6 py-3">
                          <div className="flex justify-end">
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium capitalize text-amber-700">
                              {order?.orderStatus ||
                                "processing"}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedOrder(
                                  order,
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                            >
                              <FiEye className="text-indigo-600" />
                              View
                            </button>

                            <button
                              type="button"
                              disabled={
                                isBusy
                              }
                              onClick={() =>
                                openShippingModal(
                                  order,
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                            >
                              <FiTruck />
                              Shipped
                            </button>

                            <button
                              type="button"
                              disabled={
                                isBusy
                              }
                              onClick={() =>
                                cancelOrder(
                                  order,
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                            >
                              <FiXCircle />
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )
              )}

              {!loading &&
                filteredOrders.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No confirmed orders
                      found.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          busy={
            busyId ===
            selectedOrder._id
          }
          onClose={() =>
            setSelectedOrder(null)
          }
          onShip={() =>
            openShippingModal(
              selectedOrder,
            )
          }
          onCancel={() =>
            cancelOrder(
              selectedOrder,
            )
          }
        />
      )}

      {shippingOrder && (
        <ShippingModal
          order={shippingOrder}
          courierName={courierName}
          trackingCode={trackingCode}
          setCourierName={
            setCourierName
          }
          setTrackingCode={
            setTrackingCode
          }
          busy={
            busyId ===
            shippingOrder._id
          }
          onClose={
            closeShippingModal
          }
          onSubmit={shipOrder}
        />
      )}

      <ToastContainer
        position="top-center"
        autoClose={1200}
        hideProgressBar
      />
    </div>
  );
}

function OrderDetailsModal({
  order,
  busy,
  onClose,
  onShip,
  onCancel,
}) {
  const products =
    getOrderProducts(order);

  const productTotal =
    products.reduce(
      (total, item) =>
        total +
        Number(
          item?.lineTotal ||
            Number(
              item?.price || 0,
            ) *
              Number(
                item?.quantity || 0,
              ),
        ),
      0,
    );

  const status = String(
    order?.orderStatus || "",
  ).toLowerCase();

  const canManage = [
    "confirmed",
    "processing",
  ].includes(status);

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      <div className="absolute left-1/2 top-1/2 w-[94vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Order Details
            </h3>

            <p className="font-mono text-xs text-gray-500">
              ID: {order?._id}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg hover:bg-gray-100"
          >
            <FiX />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border p-4">
              <p className="mb-1 text-xs text-gray-500">
                Customer
              </p>

              <p className="font-medium text-gray-900">
                {order?.customer?.name ||
                  "—"}
              </p>

              <p className="text-sm text-gray-700">
                {order?.customer?.mobile ||
                  "—"}
              </p>

              <p className="mt-2 text-xs text-gray-500">
                Created
              </p>

              <p className="text-sm text-gray-700">
                {fmtBDDateTime(
                  order?.createdAt,
                )}
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <p className="mb-1 text-xs text-gray-500">
                Delivery
              </p>

              <p className="text-sm text-gray-700">
                {order?.shippingOption ||
                  "—"}{" "}
                •{" "}
                {fmtBDT(
                  order?.shippingCost,
                )}
              </p>

              <p className="mt-2 text-xs text-gray-500">
                Address
              </p>

              <p className="text-sm text-gray-700">
                {order?.address || "—"}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border">
            <div className="bg-gray-50 px-4 py-3 text-xs font-semibold uppercase text-gray-700">
              Products
            </div>

            <div className="divide-y">
              {products.map(
                (item, index) => {
                  const name =
                    getProductName(
                      item,
                    );

                  const sku =
                    getProductSku(
                      item,
                    );

                  const image =
                    getProductImage(
                      item,
                    );

                  const quantity =
                    Number(
                      item?.quantity ||
                        0,
                    );

                  const unitPrice =
                    Number(
                      item?.finalPrice ||
                        item?.price ||
                        0,
                    );

                  const subtotal =
                    Number(
                      item?.lineTotal ||
                        quantity *
                          unitPrice,
                    );

                  return (
                    <div
                      key={
                        item?._id ||
                        index
                      }
                      className="flex items-start gap-3 p-4"
                    >
                      <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-gray-100">
                        {image ? (
                          <img
                            src={image}
                            alt={name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <FiPackage className="text-gray-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900">
                          {name}
                        </p>

                        <p className="text-xs text-gray-500">
                          SKU: {sku}
                        </p>

                        <p className="mt-1 text-sm text-gray-600">
                          Qty:{" "}
                          {quantity} •
                          Unit:{" "}
                          {fmtBDT(
                            unitPrice,
                          )}
                        </p>
                      </div>

                      <p className="font-semibold text-gray-900">
                        {fmtBDT(
                          subtotal,
                        )}
                      </p>
                    </div>
                  );
                },
              )}
            </div>
          </div>

          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <p className="text-sm text-gray-600">
                Status:{" "}
                <span className="font-medium capitalize text-gray-900">
                  {status}
                </span>
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-gray-500">
                Product total
              </p>

              <p className="font-semibold text-gray-900">
                {fmtBDT(
                  productTotal,
                )}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Grand total
              </p>

              <p className="text-lg font-bold text-gray-900">
                {fmtBDT(
                  order?.totalPrice,
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-end gap-2 border-t px-5 py-4 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border bg-white px-4 py-2 text-sm hover:bg-gray-50"
          >
            Close
          </button>

          <button
            type="button"
            disabled={
              !canManage || busy
            }
            onClick={onCancel}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 hover:bg-rose-100 disabled:opacity-50"
          >
            <FiXCircle />
            Cancel
          </button>

          <button
            type="button"
            disabled={
              !canManage || busy
            }
            onClick={onShip}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700 hover:bg-blue-100 disabled:opacity-50"
          >
            <FiTruck />
            Mark Shipped
          </button>
        </div>
      </div>
    </div>
  );
}

function ShippingModal({
  order,
  courierName,
  trackingCode,
  setCourierName,
  setTrackingCode,
  busy,
  onClose,
  onSubmit,
}) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={
          busy ? undefined : onClose
        }
      />

      <form
        onSubmit={handleSubmit}
        className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Ship Order
            </h3>

            <p className="font-mono text-xs text-gray-500">
              {order?._id}
            </p>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <FiX />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Courier name
            </label>

            <input
              autoFocus
              required
              value={courierName}
              onChange={(event) =>
                setCourierName(
                  event.target.value,
                )
              }
              placeholder="Example: Pathao Courier"
              className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Tracking code
            </label>

            <input
              required
              value={trackingCode}
              onChange={(event) =>
                setTrackingCode(
                  event.target.value,
                )
              }
              placeholder="Example: PATHAO-123456"
              className="w-full rounded-xl border px-3 py-2.5 font-mono text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">
            Shipped করার পর orderটি
            Confirm Orders থেকে সরে
            Shipped Orders page-এ যাবে।
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t px-5 py-4">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-xl border bg-white px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              busy ||
              !courierName.trim() ||
              !trackingCode.trim()
            }
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiTruck />

            {busy
              ? "Updating..."
              : "Confirm Shipment"}
          </button>
        </div>
      </form>
    </div>
  );
}