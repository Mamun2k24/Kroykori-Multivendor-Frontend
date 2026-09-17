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
  FiCheckCircle,
  FiEye,
  FiMapPin,
  FiPackage,
  FiPhone,
  FiRefreshCw,
  FiSearch,
  FiTruck,
  FiX,
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
    import.meta.env.VITE_APP_SERVER_URL ||
    "";

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

const getShippedSellerOrders = (order) =>
  (order?.sellerOrders || []).filter(
    (sellerOrder) =>
      String(
        sellerOrder?.orderStatus || "",
      ).toLowerCase() === "shipped",
  );

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
    item?.product?.productImage;

  if (Array.isArray(image)) {
    return image[0] || null;
  }

  return image || null;
};

export default function ShippedOrders() {
  const [orders, setOrders] =
    useState([]);

  const [query, setQuery] =
    useState("");

  const [selected, setSelected] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [busyId, setBusyId] =
    useState(null);

  const [deliveryConfirm, setDeliveryConfirm] =
    useState(null);

  const fetchShippedOrders = async (
    showRefresh = false,
  ) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const baseUrl = getBaseUrl();

    try {
      const response = await axios.get(
        `${baseUrl}api/orders/shipped`,
        {
          headers: getAuthHeaders(),
        },
      );

      const list = Array.isArray(
        response.data,
      )
        ? response.data
        : response.data?.orders || [];

      const sorted = list
        .slice()
        .sort(
          (a, b) =>
            new Date(
              b.updatedAt ||
                b.createdAt,
            ) -
            new Date(
              a.updatedAt ||
                a.createdAt,
            ),
        );

      setOrders(sorted);
    } catch (firstError) {
      /*
       * Dedicated shipped endpoint না থাকলে
       * all-orders endpoint fallback হিসেবে
       * ব্যবহার করা হবে।
       */
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

        const shippedOrders =
          allOrders
            .filter((order) => {
              const parentStatus =
                String(
                  order?.orderStatus ||
                    "",
                ).toLowerCase();

              const hasShippedSubOrder =
                (
                  order?.sellerOrders ||
                  []
                ).some(
                  (sellerOrder) =>
                    String(
                      sellerOrder?.orderStatus ||
                        "",
                    ).toLowerCase() ===
                    "shipped",
                );

              return (
                parentStatus ===
                  "shipped" ||
                hasShippedSubOrder
              );
            })
            .sort(
              (a, b) =>
                new Date(
                  b.updatedAt ||
                    b.createdAt,
                ) -
                new Date(
                  a.updatedAt ||
                    a.createdAt,
                ),
            );

        setOrders(shippedOrders);
      } catch (fallbackError) {
        console.error(
          "Failed to load shipped orders:",
          fallbackError,
        );

        toast.error(
          fallbackError?.response?.data
            ?.message ||
            "Failed to load shipped orders",
        );

        setOrders([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchShippedOrders();
  }, []);

  const markOrderDelivered = async (
    order,
  ) => {
    if (!order?._id) return;

    try {
      setBusyId(order._id);

      const baseUrl = getBaseUrl();

      await axios.put(
        `${baseUrl}api/order/${order._id}`,
        {
          orderStatus: "delivered",
        },
        {
          headers: getAuthHeaders(),
        },
      );

      toast.success(
        "Order marked as delivered",
      );

      setDeliveryConfirm(null);
      setSelected(null);

      await fetchShippedOrders();
    } catch (error) {
      console.error(
        "markOrderDelivered error:",
        error,
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to mark order as delivered",
      );
    } finally {
      setBusyId(null);
    }
  };

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
          const customer = [
            order?.customer?.name,
            order?.customer?.mobile,
            order?.customer?.email,
            order?.address,
            order?.district,
            order?._id,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const products = (
            order?.products || []
          )
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

          const shipping =
            (
              order?.sellerOrders ||
              []
            )
              .map(
                (sellerOrder) =>
                  `${
                    sellerOrder?.shopName ||
                    ""
                  } ${
                    sellerOrder?.courierName ||
                    ""
                  } ${
                    sellerOrder?.trackingCode ||
                    ""
                  }`,
              )
              .join(" ")
              .toLowerCase();

          return (
            customer.includes(search) ||
            products.includes(search) ||
            shipping.includes(search)
          );
        },
      );
    }, [orders, query]);

  return (
    <div className="px-1 pt-2">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
            Shipped Orders
          </h1>

          <p className="text-sm text-gray-500">
            Courier-এ পাঠানো order এবং
            tracking information দেখুন।
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
              placeholder="Customer, product, tracking..."
              className="w-full rounded-lg border bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-72"
            />
          </div>

          <button
            type="button"
            disabled={refreshing}
            onClick={() =>
              fetchShippedOrders(true)
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
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
                  Courier
                </th>

                <th className="px-6 py-3 text-left font-medium">
                  Total
                </th>

                <th className="px-6 py-3 text-left font-medium">
                  Updated
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
                    <FiRefreshCw className="mx-auto mb-2 animate-spin text-xl text-blue-600" />
                    Loading shipped
                    orders...
                  </td>
                </tr>
              ) : (
                filteredOrders.map(
                  (order) => {
                    const productCount =
                      (
                        order?.products ||
                        []
                      ).reduce(
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

                    const shippedParts =
                      getShippedSellerOrders(
                        order,
                      );

                    const firstShipment =
                      shippedParts[0] ||
                      order
                        ?.sellerOrders?.[0];

                    return (
                      <tr
                        key={order._id}
                        className="transition hover:bg-blue-50/30"
                      >
                        <td className="px-6 py-3 align-top">
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900">
                              {order
                                ?.customer
                                ?.name ||
                                "—"}
                            </div>

                            <div className="flex items-center gap-1.5 text-sm text-gray-700">
                              <FiPhone className="text-blue-600" />

                              {order
                                ?.customer
                                ?.mobile ||
                                "—"}
                            </div>

                            <div className="flex items-start gap-1.5 text-xs text-gray-500">
                              <FiMapPin className="mt-[2px] shrink-0" />

                              <span className="max-w-[260px] truncate">
                                {order?.address ||
                                  "—"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-3">
                          <div className="font-medium text-gray-900">
                            {productCount}{" "}
                            items
                          </div>

                          <div className="mt-1 max-w-[260px] text-xs text-gray-500 line-clamp-2">
                            {(
                              order?.products ||
                              []
                            )
                              .slice(0, 3)
                              .map(
                                getProductName,
                              )
                              .join(", ")}

                            {(
                              order?.products ||
                              []
                            ).length > 3
                              ? "..."
                              : ""}
                          </div>
                        </td>

                        <td className="px-6 py-3">
                          <div className="font-medium text-gray-800">
                            {firstShipment?.courierName ||
                              "—"}
                          </div>

                          <div className="mt-1 font-mono text-xs text-blue-600">
                            {firstShipment?.trackingCode ||
                              "No tracking code"}
                          </div>

                          {shippedParts.length >
                            1 && (
                            <div className="mt-1 text-xs text-gray-500">
                              {
                                shippedParts.length
                              }{" "}
                              seller shipments
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-3 font-semibold text-gray-900">
                          {fmtBDT(
                            order?.totalPrice,
                          )}
                        </td>

                        <td className="px-6 py-3 text-gray-600">
                          <div className="flex items-center gap-1.5 text-xs">
                            <FiClock />

                            {fmtBDDateTime(
                              order?.updatedAt ||
                                order?.createdAt,
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-3">
                          <div className="flex justify-end">
                            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                              <FiTruck />
                              Shipped
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setSelected(
                                  order,
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                            >
                              <FiEye className="text-blue-600" />
                              View
                            </button>

                            <button
                              type="button"
                              disabled={
                                busyId ===
                                order._id
                              }
                              onClick={() =>
                                setDeliveryConfirm(
                                  order,
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <FiCheckCircle />

                              {busyId ===
                              order._id
                                ? "Updating..."
                                : "Delivered"}
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
                      <FiTruck className="mx-auto mb-2 text-3xl text-gray-300" />
                      No shipped orders
                      found.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <ShipmentDetailsModal
          order={selected}
          busy={
            busyId === selected._id
          }
          onDeliver={() =>
            setDeliveryConfirm(
              selected,
            )
          }
          onClose={() =>
            setSelected(null)
          }
        />
      )}

      {deliveryConfirm && (
        <DeliveryConfirmationModal
          order={deliveryConfirm}
          busy={
            busyId ===
            deliveryConfirm._id
          }
          onClose={() => {
            if (!busyId) {
              setDeliveryConfirm(null);
            }
          }}
          onConfirm={() =>
            markOrderDelivered(
              deliveryConfirm,
            )
          }
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

function ShipmentDetailsModal({
  order,
  busy,
  onDeliver,
  onClose,
}) {
  const shippedSellerOrders =
    getShippedSellerOrders(order);

  const shipments =
    shippedSellerOrders.length > 0
      ? shippedSellerOrders
      : order?.sellerOrders || [];

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      <div className="absolute left-1/2 top-1/2 w-[94vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Shipment Details
            </h3>

            <p className="font-mono text-xs text-gray-500">
              Order: {order?._id}
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

        <div className="max-h-[72vh] space-y-4 overflow-y-auto p-5">
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
                Address
              </p>

              <p className="text-sm text-gray-700">
                {order?.address || "—"}
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <p className="mb-1 text-xs text-gray-500">
                Order summary
              </p>

              <p className="text-sm text-gray-700">
                Shipping:{" "}
                {fmtBDT(
                  order?.shippingCost,
                )}
              </p>

              <p className="text-sm text-gray-700">
                Payment:{" "}
                {order?.paymentStatus ||
                  "—"}
              </p>

              <p className="mt-2 text-xs text-gray-500">
                Grand total
              </p>

              <p className="text-lg font-bold text-gray-900">
                {fmtBDT(
                  order?.totalPrice,
                )}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {shipments.map(
              (shipment) => (
                <div
                  key={
                    shipment._id
                  }
                  className="overflow-hidden rounded-xl border"
                >
                  <div className="flex flex-col justify-between gap-2 bg-blue-50 px-4 py-3 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {shipment.shopName ||
                          "Platform Store"}
                      </p>

                      <p className="text-xs text-gray-500">
                        Shipment ID:{" "}
                        {shipment._id}
                      </p>
                    </div>

                    <span className="inline-flex w-fit items-center gap-1 rounded-full border border-blue-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-700">
                      <FiTruck />
                      {shipment.orderStatus}
                    </span>
                  </div>

                  <div className="grid gap-3 border-b p-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-gray-500">
                        Courier
                      </p>

                      <p className="font-medium text-gray-900">
                        {shipment.courierName ||
                          "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Tracking code
                      </p>

                      <p className="font-mono font-medium text-blue-700">
                        {shipment.trackingCode ||
                          "—"}
                      </p>
                    </div>
                  </div>

                  <div className="divide-y">
                    {(
                      shipment.items ||
                      []
                    ).map((item) => {
                      const image =
                        getProductImage(
                          item,
                        );

                      return (
                        <div
                          key={
                            item._id ||
                            item.product
                          }
                          className="flex gap-3 p-4"
                        >
                          <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-gray-100">
                            {image ? (
                              <img
                                src={
                                  image
                                }
                                alt={getProductName(
                                  item,
                                )}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <FiPackage className="text-gray-400" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900">
                              {getProductName(
                                item,
                              )}
                            </p>

                            <p className="text-xs text-gray-500">
                              SKU:{" "}
                              {getProductSku(
                                item,
                              )}
                            </p>

                            <p className="mt-1 text-sm text-gray-600">
                              Qty:{" "}
                              {item.quantity ||
                                0}
                            </p>
                          </div>

                          <p className="font-semibold text-gray-900">
                            {fmtBDT(
                              item.lineTotal ||
                                Number(
                                  item.price ||
                                    0,
                                ) *
                                  Number(
                                    item.quantity ||
                                      0,
                                  ),
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border bg-white px-4 py-2 text-sm hover:bg-gray-50"
          >
            Close
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={onDeliver}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiCheckCircle />

            {busy
              ? "Updating..."
              : "Mark Delivered"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeliveryConfirmationModal({
  order,
  busy,
  onClose,
  onConfirm,
}) {
  const firstShipment =
    getShippedSellerOrders(order)[0] ||
    order?.sellerOrders?.[0];

  return (
    <div className="fixed inset-0 z-[70]">
      <div
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
        onClick={busy ? undefined : onClose}
      />

      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-2xl">
        <div className="relative bg-gradient-to-br from-emerald-50 via-white to-blue-50 px-6 pb-5 pt-7 text-center">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-gray-500 hover:bg-white disabled:opacity-50"
          >
            <FiX />
          </button>

          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl text-emerald-600 ring-8 ring-emerald-50">
            <FiCheckCircle />
          </div>

          <h3 className="text-xl font-bold text-gray-900">
            Confirm Delivery
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            আপনি কি নিশ্চিত যে customer orderটি পেয়েছেন?
          </p>
        </div>

        <div className="space-y-3 px-6 py-5">
          <div className="rounded-2xl border bg-gray-50 p-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-gray-500">Order</span>
              <span className="max-w-[220px] truncate font-mono font-medium text-gray-800">
                #{String(order?._id || "").slice(-10).toUpperCase()}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-sm">
              <span className="text-gray-500">Courier</span>
              <span className="font-medium text-gray-800">
                {firstShipment?.courierName || "—"}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-sm">
              <span className="text-gray-500">Tracking</span>
              <span className="font-mono font-medium text-blue-700">
                {firstShipment?.trackingCode || "—"}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3 text-sm">
              <span className="text-gray-500">Order total</span>
              <span className="font-bold text-gray-900">
                {fmtBDT(order?.totalPrice)}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-800">
            Delivered করলে payment <b>Paid</b> হবে, delivery time save হবে এবং seller earning process হবে।
          </div>
        </div>

        <div className="flex gap-3 border-t bg-gray-50 px-6 py-4">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="flex-1 rounded-xl border bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Not yet
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiCheckCircle />
            {busy ? "Updating..." : "Yes, Delivered"}
          </button>
        </div>
      </div>
    </div>
  );
}