import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  FiAlertCircle,
  FiBox,
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiLoader,
  FiPackage,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { Link } from "react-router-dom";

const API_URL = String(
  import.meta.env.VITE_APP_SERVER_URL || "",
).replace(/\/+$/, "");

const money = (value) =>
  `৳${Number(value || 0).toLocaleString(
    "en-BD",
  )}`;

const getApprovalStyle = (status) => {
  if (status === "approved") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "rejected") {
    return "bg-red-100 text-red-700";
  }

  return "bg-amber-100 text-amber-700";
};

const getStockStyle = (stock) => {
  if (Number(stock) <= 0) {
    return "bg-red-100 text-red-700";
  }

  if (Number(stock) <= 10) {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-emerald-100 text-emerald-700";
};

const SellerProductList = () => {
  const [products, setProducts] = useState([]);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] =
    useState(1);

  const [searchInput, setSearchInput] =
    useState("");
  const [search, setSearch] = useState("");

  const [
    approvalStatus,
    setApprovalStatus,
  ] = useState("");

  const [stockStatus, setStockStatus] =
    useState("");

  const [loading, setLoading] =
    useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] =
    useState("");

  const [
    selectedProduct,
    setSelectedProduct,
  ] = useState(null);

  const [stockForm, setStockForm] =
    useState({
      action: "set",
      quantity: "",
      reason: "",
      note: "",
    });

  const [stockSaving, setStockSaving] =
    useState(false);
  const [deleteId, setDeleteId] =
    useState(null);
  const [deleting, setDeleting] =
    useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadProducts = useCallback(async () => {
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

    if (search) {
      params.set("q", search);
    }

    if (approvalStatus) {
      params.set(
        "approvalStatus",
        approvalStatus,
      );
    }

    if (stockStatus) {
      params.set("stockStatus", stockStatus);
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/products/manage/list?${params.toString()}`,
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
            "Products load করা যায়নি।",
        );
      }

      setProducts(
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
      setProducts([]);
      setError(
        err.message ||
          "Products load করতে সমস্যা হয়েছে।",
      );
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    search,
    approvalStatus,
    stockStatus,
  ]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setApprovalStatus("");
    setStockStatus("");
    setPage(1);
  };

  const openStockModal = (product) => {
    setSelectedProduct(product);

    setStockForm({
      action: "set",
      quantity: String(product.stock || 0),
      reason: "Manual stock update",
      note: "",
    });

    setError("");
    setSuccess("");
  };

  const closeStockModal = () => {
    if (stockSaving) return;

    setSelectedProduct(null);
  };

  const updateStock = async (event) => {
    event.preventDefault();

    const quantity = Number(
      stockForm.quantity,
    );

    if (
      !Number.isFinite(quantity) ||
      quantity < 0
    ) {
      setError(
        "সঠিক stock quantity প্রদান করুন।",
      );
      return;
    }

    if (
      ["add", "remove"].includes(
        stockForm.action,
      ) &&
      quantity <= 0
    ) {
      setError(
        "Add অথবা remove-এর quantity শূন্যের বেশি হতে হবে।",
      );
      return;
    }

    const token = localStorage.getItem("token");

    try {
      setStockSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/api/products/${selectedProduct._id}/stock`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: stockForm.action,
            quantity,
            reason:
              stockForm.reason.trim(),
            note: stockForm.note.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.errors?.quantity?.message ||
            data?.message ||
            "Stock update করা যায়নি।",
        );
      }

      setProducts((previous) =>
        previous.map((product) =>
          product._id ===
          selectedProduct._id
            ? {
                ...product,
                stock:
                  data?.product?.stock ??
                  product.stock,
                status:
                  data?.product?.status ??
                  product.status,
              }
            : product,
        ),
      );

      setSuccess(
        data?.message ||
          "Product stock updated successfully",
      );

      setSelectedProduct(null);
    } catch (err) {
      setError(
        err.message ||
          "Stock update করতে সমস্যা হয়েছে।",
      );
    } finally {
      setStockSaving(false);
    }
  };

  const deleteProduct = async () => {
    if (!deleteId) return;

    const token = localStorage.getItem("token");

    try {
      setDeleting(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/api/products/${deleteId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Product delete করা যায়নি।",
        );
      }

      setSuccess(
        data?.message ||
          "Product deleted successfully",
      );

      setDeleteId(null);

      if (
        products.length === 1 &&
        page > 1
      ) {
        setPage((previous) => previous - 1);
      } else {
        loadProducts();
      }
    } catch (err) {
      setError(
        err.message ||
          "Product delete করতে সমস্যা হয়েছে।",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      {/* Header */}

      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            My Products
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            আপনার shop-এর products, approval
            এবং stock পরিচালনা করুন।
          </p>
        </div>

        <Link
          to="/dashboard/seller/products/add"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
        >
          <FiPlus />
          Add Product
        </Link>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <FiAlertCircle className="mt-0.5 shrink-0 text-lg" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
          >
            <FiX />
          </button>
        </div>
      )}

      {/* Filters */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(
                  event.target.value,
                )
              }
              placeholder="Search product or SKU"
              className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <select
            value={approvalStatus}
            onChange={(event) => {
              setApprovalStatus(
                event.target.value,
              );
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500"
          >
            <option value="">
              All approval statuses
            </option>
            <option value="pending">
              Pending
            </option>
            <option value="approved">
              Approved
            </option>
            <option value="rejected">
              Rejected
            </option>
          </select>

          <select
            value={stockStatus}
            onChange={(event) => {
              setStockStatus(
                event.target.value,
              );
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500"
          >
            <option value="">
              All stock statuses
            </option>
            <option value="in_stock">
              In stock
            </option>
            <option value="low_stock">
              Low stock
            </option>
            <option value="out_of_stock">
              Out of stock
            </option>
          </select>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearFilters}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <FiX />
              Clear
            </button>

            <button
              type="button"
              onClick={loadProducts}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-4 py-3 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              aria-label="Refresh products"
            >
              <FiRefreshCw
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />
            </button>
          </div>
        </div>
      </section>

      {/* Product list */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-900">
              Products
            </h2>
            <p className="text-sm text-slate-500">
              Total {total} products
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <div className="text-center">
              <FiLoader className="mx-auto animate-spin text-4xl text-orange-500" />
              <p className="mt-3 text-sm text-slate-500">
                Products loading...
              </p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-5 text-center">
            <FiPackage className="text-5xl text-slate-300" />

            <h3 className="mt-4 font-bold text-slate-800">
              No products found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              নতুন product add করুন অথবা filter
              পরিবর্তন করুন।
            </p>

            <Link
              to="/dashboard/seller/products/add"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white"
            >
              <FiPlus />
              Add Product
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop table */}

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">
                      Product
                    </th>
                    <th className="px-5 py-4">
                      Price
                    </th>
                    <th className="px-5 py-4">
                      Stock
                    </th>
                    <th className="px-5 py-4">
                      Approval
                    </th>
                    <th className="px-5 py-4">
                      Published
                    </th>
                    <th className="px-5 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {products.map((product) => (
                    <tr
                      key={product._id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              product
                                ?.productImage?.[0] ||
                              "/default-product.png"
                            }
                            alt={
                              product.productName
                            }
                            className="h-14 w-14 rounded-xl border border-slate-200 object-cover"
                          />

                          <div className="min-w-0">
                            <p className="max-w-xs truncate font-semibold text-slate-800">
                              {
                                product.productName
                              }
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              SKU:{" "}
                              {product.sku || "N/A"}
                            </p>

                            {product.rejectionReason && (
                              <p className="mt-1 max-w-xs text-xs text-red-600">
                                {
                                  product.rejectionReason
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-800">
                          {money(product.price)}
                        </p>

                        {Number(
                          product.regularPrice,
                        ) >
                          Number(product.price) && (
                          <p className="text-xs text-slate-400 line-through">
                            {money(
                              product.regularPrice,
                            )}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            openStockModal(
                              product,
                            )
                          }
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${getStockStyle(
                            product.stock,
                          )}`}
                        >
                          <FiBox />
                          {product.stock || 0}
                        </button>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${getApprovalStyle(
                            product.approvalStatus,
                          )}`}
                        >
                          {product.approvalStatus ||
                            "pending"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`text-sm font-semibold ${
                            product.isPublished
                              ? "text-emerald-600"
                              : "text-slate-400"
                          }`}
                        >
                          {product.isPublished
                            ? "Published"
                            : "Hidden"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/dashboard/seller/products/${product._id}/edit`}
                            className="rounded-lg border border-slate-200 p-2.5 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                            title="Edit product"
                          >
                            <FiEdit2 />
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              setDeleteId(
                                product._id,
                              )
                            }
                            className="rounded-lg border border-slate-200 p-2.5 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            title="Delete product"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}

            <div className="space-y-4 p-4 lg:hidden">
              {products.map((product) => (
                <article
                  key={product._id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex gap-3">
                    <img
                      src={
                        product?.productImage?.[0] ||
                        "/default-product.png"
                      }
                      alt={product.productName}
                      className="h-20 w-20 rounded-xl object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 font-bold text-slate-800">
                        {product.productName}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        SKU: {product.sku}
                      </p>

                      <p className="mt-2 font-bold text-orange-600">
                        {money(product.price)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${getApprovalStyle(
                        product.approvalStatus,
                      )}`}
                    >
                      {product.approvalStatus}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        openStockModal(product)
                      }
                      className={`rounded-full px-3 py-1 text-xs font-bold ${getStockStyle(
                        product.stock,
                      )}`}
                    >
                      Stock: {product.stock || 0}
                    </button>
                  </div>

                  {product.rejectionReason && (
                    <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-600">
                      Reason:{" "}
                      {product.rejectionReason}
                    </p>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link
                      to={`/dashboard/seller/products/${product._id}/edit`}
                      className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600"
                    >
                      <FiEdit2 />
                      Edit
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        setDeleteId(product._id)
                      }
                      className="flex items-center justify-center gap-2 rounded-lg border border-red-200 py-2.5 text-sm font-semibold text-red-600"
                    >
                      <FiTrash2 />
                      Delete
                    </button>
                  </div>
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

      {/* Stock modal */}

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <form
            onSubmit={updateStock}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Update Stock
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedProduct.productName}
                </p>
              </div>

              <button
                type="button"
                onClick={closeStockModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <FiX />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Action
                </label>

                <select
                  value={stockForm.action}
                  onChange={(event) =>
                    setStockForm(
                      (previous) => ({
                        ...previous,
                        action:
                          event.target.value,
                      }),
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                >
                  <option value="set">
                    Set exact stock
                  </option>
                  <option value="add">
                    Add stock
                  </option>
                  <option value="remove">
                    Remove stock
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Quantity
                </label>

                <input
                  type="number"
                  min="0"
                  value={stockForm.quantity}
                  onChange={(event) =>
                    setStockForm(
                      (previous) => ({
                        ...previous,
                        quantity:
                          event.target.value,
                      }),
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Reason
                </label>

                <input
                  type="text"
                  value={stockForm.reason}
                  onChange={(event) =>
                    setStockForm(
                      (previous) => ({
                        ...previous,
                        reason:
                          event.target.value,
                      }),
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Note
                </label>

                <textarea
                  rows={3}
                  value={stockForm.note}
                  onChange={(event) =>
                    setStockForm(
                      (previous) => ({
                        ...previous,
                        note:
                          event.target.value,
                      }),
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={stockSaving}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 font-bold text-white disabled:opacity-60"
            >
              {stockSaving && (
                <FiLoader className="animate-spin" />
              )}
              Update Stock
            </button>
          </form>
        </div>
      )}

      {/* Delete confirmation */}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600">
              <FiTrash2 />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Delete product?
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Product permanently delete হবে। এই
              action undo করা যাবে না।
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  setDeleteId(null)
                }
                className="rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={deleteProduct}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {deleting && (
                  <FiLoader className="animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProductList;