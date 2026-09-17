import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  FiCheck,
  FiEye,
  FiPackage,
  FiRefreshCw,
  FiSearch,
  FiX,
} from "react-icons/fi";
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

const formatMoney = (value) =>
  `৳${Number(value || 0).toLocaleString()}`;

const AdminSellerProducts = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] =
    useState("pending");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] =
    useState({
      total: 0,
      totalPages: 1,
    });
  const [selectedProduct, setSelectedProduct] =
    useState(null);
  const [rejectProduct, setRejectProduct] =
    useState(null);
  const [rejectionReason, setRejectionReason] =
    useState("");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] =
    useState(null);

  const token = localStorage.getItem("token");

  const loadSellerProducts =
  useCallback(async () => {
    try {
      setLoading(true);

      const query = new URLSearchParams({
        page: String(page),
        limit: "20",
        approvalStatus: activeTab,
      });

      if (search.trim()) {
        query.set(
          "search",
          search.trim(),
        );
      }

      const response = await fetch(
        apiUrl(
          `/products/admin/seller-products?${query.toString()}`,
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
            "Failed to load seller products",
        );
      }

      setProducts(data?.items || []);

      setPagination({
        total: data?.total || 0,
        totalPages:
          data?.totalPages || 1,
      });
    } catch (error) {
      toast.error(error.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [
    token,
    activeTab,
    page,
    search,
  ]);

useEffect(() => {
  const timer = setTimeout(() => {
    loadSellerProducts();
  }, 350);

  return () => clearTimeout(timer);
}, [loadSellerProducts]);

useEffect(() => {
  setPage(1);
}, [activeTab]);

  const approveProduct = async (product) => {
    const confirmed = window.confirm(
      `Approve "${product.productName}" and publish it?`,
    );

    if (!confirmed) return;

    try {
      setProcessingId(product._id);

      const response = await fetch(
        apiUrl(
          `/products/admin/${product._id}/approve`,
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
            "Failed to approve product",
        );
      }

      toast.success(
        data?.message ||
          "Product approved successfully",
      );

      setSelectedProduct(null);
      await loadSellerProducts();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const togglePublication = async (
    product,
  ) => {
    const nextValue = !product.isPublished;

    const confirmed = window.confirm(
      `${nextValue ? "Publish" : "Unpublish"} "${product.productName}"?`,
    );

    if (!confirmed) return;

    try {
      setProcessingId(product._id);

      const response = await fetch(
        apiUrl(
          `/products/admin/${product._id}/publication`,
        ),
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            isPublished: nextValue,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to update publication",
        );
      }

      toast.success(
        data?.message ||
          `Product ${nextValue ? "published" : "unpublished"} successfully`,
      );

      setSelectedProduct(null);
      await loadSellerProducts();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const submitRejection = async () => {
    const reason = rejectionReason.trim();

    if (!rejectProduct?._id) {
      toast.error("No product selected for rejection");
      return;
    }

    if (!reason) {
      toast.error(
        "Product rejection reason is required",
      );
      return;
    }

    try {
      setProcessingId(rejectProduct._id);

      const response = await fetch(
        apiUrl(
          `/products/admin/${rejectProduct._id}/reject`,
        ),
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({ reason }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to reject product",
        );
      }

      toast.success(
        data?.message ||
          "Product rejected successfully",
      );

      setRejectProduct(null);
      setSelectedProduct(null);
      setRejectionReason("");

      await loadSellerProducts();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Seller Product Approvals
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Review seller products before they are
            published.
          </p>
        </div>

        <button
          type="button"
          onClick={loadSellerProducts}
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

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium capitalize text-slate-600">
          {activeTab} products
        </p>

        <p className="mt-1 text-3xl font-bold text-slate-900">
          {pagination.total}
        </p>
      </div>
            <div className="flex overflow-x-auto rounded-lg bg-slate-100 p-1">
  {[
    {
      value: "pending",
      label: "Pending",
    },
    {
      value: "approved",
      label: "Approved",
    },
    {
      value: "rejected",
      label: "Rejected",
    },
  ].map((tab) => (
    <button
      key={tab.value}
      type="button"
      onClick={() =>
        setActiveTab(tab.value)
      }
      className={`rounded-md px-4 py-2 text-sm font-medium transition ${
        activeTab === tab.value
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-500"
      }`}
    >
      {tab.label}
    </button>
  ))}
</div>
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4">
          <div className="relative max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search product, SKU, shop..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <FiRefreshCw className="animate-spin text-3xl text-orange-500" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-4 text-center">
            <FiPackage className="mb-3 text-5xl text-slate-300" />

            <h3 className="font-semibold text-slate-700">
              No {activeTab} seller products
            </h3>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">
                      Product
                    </th>
                    <th className="px-5 py-3">
                      Shop
                    </th>
                    <th className="px-5 py-3">
                      Price
                    </th>
                    <th className="px-5 py-3">
                      Stock
                    </th>
                    <th className="px-5 py-3">
                      Submitted
                    </th>
                    <th className="px-5 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {products.map(
                    (product) => (
                      <tr
                        key={product._id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {product
                              .productImage?.[0] ? (
                              <img
                                src={getImageUrl(
                                  product
                                    .productImage[0],
                                )}
                                alt={
                                  product.productName
                                }
                                className="h-12 w-12 rounded-lg border object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
                                <FiPackage />
                              </div>
                            )}

                            <div>
                              <p className="font-medium text-slate-800">
                                {
                                  product.productName
                                }
                              </p>

                              <p className="text-xs text-slate-500">
                                SKU:{" "}
                                {product.sku || "—"}
                              </p>

                              {product.approvalStatus ===
                                "rejected" &&
                                product.rejectionReason && (
                                  <p className="mt-1 max-w-xs text-xs text-red-600">
                                    {product.rejectionReason}
                                  </p>
                                )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-slate-700">
                            {product.shop
                              ?.shopName || "—"}
                          </p>

                          <p className="text-xs text-slate-500">
                            {product.seller
                              ?.name ||
                              product.seller
                                ?.email ||
                              "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-800">
                            {formatMoney(
                              product.price,
                            )}
                          </p>

                          {Number(
                            product.regularPrice,
                          ) >
                            Number(
                              product.price,
                            ) && (
                            <p className="text-xs text-slate-400 line-through">
                              {formatMoney(
                                product.regularPrice,
                              )}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-slate-700">
                          {product.stock || 0}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {new Date(
                            product.createdAt,
                          ).toLocaleDateString()}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedProduct(
                                  product,
                                )
                              }
                              title="View product"
                              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                            >
                              <FiEye />
                            </button>

                            {product.approvalStatus ===
                              "pending" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    approveProduct(
                                      product,
                                    )
                                  }
                                  disabled={
                                    processingId ===
                                    product._id
                                  }
                                  title="Approve product"
                                  className="rounded-lg bg-emerald-600 p-2 text-white hover:bg-emerald-700 disabled:opacity-50"
                                >
                                  <FiCheck />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectProduct(
                                      product,
                                    );
                                    setRejectionReason(
                                      "",
                                    );
                                  }}
                                  disabled={
                                    processingId ===
                                    product._id
                                  }
                                  title="Reject product"
                                  className="rounded-lg bg-red-600 p-2 text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                  <FiX />
                                </button>
                              </>
                            )}

                            {product.approvalStatus ===
                              "approved" && (
                              <button
                                type="button"
                                onClick={() =>
                                  togglePublication(
                                    product,
                                  )
                                }
                                disabled={
                                  processingId ===
                                  product._id
                                }
                                className={`rounded-lg px-3 py-2 text-xs font-medium text-white disabled:opacity-50 ${
                                  product.isPublished
                                    ? "bg-slate-600 hover:bg-slate-700"
                                    : "bg-emerald-600 hover:bg-emerald-700"
                                }`}
                              >
                                {product.isPublished
                                  ? "Unpublish"
                                  : "Publish"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 p-4 md:hidden">
              {products.map(
                (product) => (
                  <div
                    key={product._id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex gap-3">
                      <img
                        src={getImageUrl(
                          product
                            .productImage?.[0],
                        )}
                        alt={product.productName}
                        className="h-16 w-16 rounded-lg border bg-slate-100 object-cover"
                      />

                      <div>
                        <h3 className="font-semibold text-slate-800">
                          {product.productName}
                        </h3>

                        <p className="text-sm text-slate-500">
                          {product.shop
                            ?.shopName || "—"}
                        </p>

                        <p className="font-medium text-orange-600">
                          {formatMoney(
                            product.price,
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedProduct(
                          product,
                        )
                      }
                      className="mt-4 w-full rounded-lg border border-slate-200 py-2 text-sm font-medium"
                    >
                      Review product
                    </button>
                  </div>
                ),
              )}
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Page {page} of {pagination.totalPages}
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) =>
                        Math.max(current - 1, 1),
                      )
                    }
                    disabled={page <= 1 || loading}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) =>
                        Math.min(
                          current + 1,
                          pagination.totalPages,
                        ),
                      )
                    }
                    disabled={
                      page >= pagination.totalPages ||
                      loading
                    }
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b bg-white p-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {selectedProduct.productName}
                </h2>

                <p className="text-sm text-slate-500">
                  Product approval review
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedProduct(null)
                }
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <FiX />
              </button>
            </div>

            <div className="space-y-6 p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                {selectedProduct.productImage?.map(
                  (image, index) => (
                    <img
                      key={`${image}-${index}`}
                      src={getImageUrl(image)}
                      alt={`${selectedProduct.productName} ${index + 1}`}
                      className="h-52 w-full rounded-xl border bg-slate-100 object-contain"
                    />
                  ),
                )}
              </div>

              <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-xs text-slate-500">
                    Shop
                  </p>
                  <p className="font-medium">
                    {selectedProduct.shop
                      ?.shopName || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Seller
                  </p>
                  <p className="font-medium">
                    {selectedProduct.seller
                      ?.name || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    SKU
                  </p>
                  <p className="font-medium">
                    {selectedProduct.sku ||
                      "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Category
                  </p>
                  <p className="font-medium">
                    {selectedProduct.categoryName ||
                      "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Price
                  </p>
                  <p className="font-medium">
                    {formatMoney(
                      selectedProduct.price,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Stock
                  </p>
                  <p className="font-medium">
                    {selectedProduct.stock ||
                      0}
                  </p>
                </div>
              </div>

              {selectedProduct.approvalStatus ===
                "rejected" &&
                selectedProduct.rejectionReason && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <h3 className="font-semibold text-red-700">
                      Rejection reason
                    </h3>

                    <p className="mt-1 whitespace-pre-line text-sm text-red-600">
                      {selectedProduct.rejectionReason}
                    </p>
                  </div>
                )}

              <div>
                <h3 className="font-semibold text-slate-800">
                  Product details
                </h3>

                <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                  {selectedProduct.details ||
                    "No details provided"}
                </p>
              </div>

              {selectedProduct.longDetails && (
                <div>
                  <h3 className="mb-2 font-semibold text-slate-800">
                    Full description
                  </h3>

                  <div
                    className="prose max-w-none rounded-xl border border-slate-200 p-4 text-sm"
                    dangerouslySetInnerHTML={{
                      __html:
                        selectedProduct.longDetails,
                    }}
                  />
                </div>
              )}

              <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:justify-end">
                {selectedProduct.approvalStatus ===
                  "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectProduct(
                          selectedProduct,
                        );
                        setRejectionReason(
                          "",
                        );
                      }}
                      className="rounded-lg border border-red-200 px-5 py-2.5 font-medium text-red-600 hover:bg-red-50"
                    >
                      Reject product
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        approveProduct(
                          selectedProduct,
                        )
                      }
                      disabled={
                        processingId ===
                        selectedProduct._id
                      }
                      className="rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Approve & publish
                    </button>
                  </>
                )}

                {selectedProduct.approvalStatus ===
                  "approved" && (
                  <button
                    type="button"
                    onClick={() =>
                      togglePublication(
                        selectedProduct,
                      )
                    }
                    disabled={
                      processingId ===
                      selectedProduct._id
                    }
                    className={`rounded-lg px-5 py-2.5 font-medium text-white disabled:opacity-50 ${
                      selectedProduct.isPublished
                        ? "bg-slate-600 hover:bg-slate-700"
                        : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    {selectedProduct.isPublished
                      ? "Unpublish product"
                      : "Publish product"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {rejectProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6">
            <h2 className="text-xl font-bold text-slate-900">
              Reject seller product
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Explain why “
              {rejectProduct.productName}” was
              rejected.
            </p>

            <textarea
              rows={5}
              value={rejectionReason}
              onChange={(event) =>
                setRejectionReason(
                  event.target.value,
                )
              }
              placeholder="Enter rejection reason..."
              className="mt-5 w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setRejectProduct(null);
                  setRejectionReason("");
                }}
                className="rounded-lg border border-slate-200 px-4 py-2.5"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={submitRejection}
                disabled={
                  processingId ===
                  rejectProduct._id
                }
                className="rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Reject product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSellerProducts;