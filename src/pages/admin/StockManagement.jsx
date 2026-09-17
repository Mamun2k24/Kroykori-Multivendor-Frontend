import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  HiOutlineAdjustments,
  HiOutlineArchive,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineClock,
  HiOutlineDownload,
  HiOutlineExclamation,
  HiOutlineMinus,
  HiOutlinePlus,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineShoppingBag,
  HiOutlineX,
} from "react-icons/hi";

const API_BASE_URL = (
  import.meta.env.VITE_APP_SERVER_URL ||
  "http://localhost:5000/"
).replace(/\/+$/, "");

const apiUrl = (path) =>
  `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

const getAuthHeaders = (
  includeContentType = false
) => {
  const token = localStorage.getItem("token");

  return {
    ...(includeContentType
      ? {
          "Content-Type": "application/json",
        }
      : {}),

    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
};

const LOW_STOCK_DEFAULT = 10;

const currency = (amount) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const formatNumber = (number) =>
  new Intl.NumberFormat("en-BD").format(
    Number(number || 0)
  );

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Dhaka",
  }).format(parsedDate);
};

const getStockState = (
  stock,
  lowThreshold = LOW_STOCK_DEFAULT
) => {
  const quantity = Number(stock || 0);

  if (quantity <= 0) {
    return {
      key: "out",
      label: "Out of Stock",
      className:
        "bg-rose-50 text-rose-700 ring-rose-600/20",
    };
  }

  if (quantity <= lowThreshold) {
    return {
      key: "low",
      label: "Low Stock",
      className:
        "bg-amber-50 text-amber-700 ring-amber-600/20",
    };
  }

  return {
    key: "in",
    label: "In Stock",
    className:
      "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  };
};

const getProductImage = (product) => {
  if (
    Array.isArray(product?.productImage) &&
    product.productImage.length
  ) {
    return product.productImage[0];
  }

  return product?.image || "";
};

export default function StockManagement() {
  const [products, setProducts] = useState([]);
  const [serverStats, setServerStats] =
    useState(null);

  const [thresholds, setThresholds] = useState({
    low: LOW_STOCK_DEFAULT,
    out: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");
  const [categoryFilter, setCategoryFilter] =
    useState("all");
  const [supplierFilter, setSupplierFilter] =
    useState("all");
  const [sortBy, setSortBy] =
    useState("stock-low");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] =
    useState(10);

  const [selectedProduct, setSelectedProduct] =
    useState(null);
  const [stockModalOpen, setStockModalOpen] =
    useState(false);

  const [historyProduct, setHistoryProduct] =
    useState(null);
  const [historyOpen, setHistoryOpen] =
    useState(false);

  const loadProducts = async ({
    silent = false,
  } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch(
        apiUrl(
          "/api/products/admin/stock-table?limit=500"
        ),
        {
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Stock data could not be loaded"
        );
      }

      const list = Array.isArray(data)
        ? data
        : data?.items || [];

      setProducts(list);
      setServerStats(data?.stats || null);

      if (data?.thresholds) {
        setThresholds(data.thresholds);
      }
    } catch (requestError) {
      console.error(requestError);

      setError(
        requestError?.message ||
          "Stock data could not be loaded"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [
    search,
    statusFilter,
    categoryFilter,
    supplierFilter,
    sortBy,
    pageSize,
  ]);

  const categories = useMemo(() => {
    return [
      ...new Set(
        products
          .map(
            (product) =>
              product.categoryName ||
              "Uncategorized"
          )
          .filter(Boolean)
      ),
    ].sort((first, second) =>
      first.localeCompare(second)
    );
  }, [products]);

  const computedStats = useMemo(() => {
    return products.reduce(
      (result, product) => {
        const stock = Number(
          product.stock ?? product.qty ?? 0
        );

        const buyPrice = Number(
          product.buyPrice || 0
        );

        const sellPrice = Number(
          product.price || 0
        );

        result.totalProducts += 1;
        result.totalUnits += stock;
        result.inventoryValue +=
          stock * buyPrice;
        result.retailValue +=
          stock * sellPrice;

        if (stock <= 0) {
          result.outOfStock += 1;
        } else if (
          stock <= Number(thresholds.low || 10)
        ) {
          result.lowStock += 1;
        } else {
          result.inStock += 1;
        }

        return result;
      },
      {
        totalProducts: 0,
        totalUnits: 0,
        inventoryValue: 0,
        retailValue: 0,
        inStock: 0,
        lowStock: 0,
        outOfStock: 0,
      }
    );
  }, [products, thresholds.low]);

  const stats = serverStats || computedStats;

  const filteredProducts = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    const filtered = products.filter(
      (product) => {
        const stock = Number(
          product.stock ?? product.qty ?? 0
        );

        const stockState = getStockState(
          stock,
          thresholds.low
        );

        const productName = String(
          product.productName ||
            product.name ||
            ""
        ).toLowerCase();

        const sku = String(
          product.sku || ""
        ).toLowerCase();

        const categoryName = String(
          product.categoryName ||
            "Uncategorized"
        );

        const supplier = String(
          product.supplier || "local"
        ).toLowerCase();

        const matchesSearch =
          !keyword ||
          productName.includes(keyword) ||
          sku.includes(keyword) ||
          categoryName
            .toLowerCase()
            .includes(keyword);

        const matchesStatus =
          statusFilter === "all" ||
          stockState.key === statusFilter;

        const matchesCategory =
          categoryFilter === "all" ||
          categoryName === categoryFilter;

        const matchesSupplier =
          supplierFilter === "all" ||
          supplier === supplierFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesCategory &&
          matchesSupplier
        );
      }
    );

    return [...filtered].sort(
      (first, second) => {
        const firstStock = Number(
          first.stock ?? first.qty ?? 0
        );

        const secondStock = Number(
          second.stock ?? second.qty ?? 0
        );

        switch (sortBy) {
          case "stock-high":
            return secondStock - firstStock;

          case "name-az":
            return String(
              first.productName ||
                first.name ||
                ""
            ).localeCompare(
              String(
                second.productName ||
                  second.name ||
                  ""
              )
            );

          case "name-za":
            return String(
              second.productName ||
                second.name ||
                ""
            ).localeCompare(
              String(
                first.productName ||
                  first.name ||
                  ""
              )
            );

          case "updated":
            return (
              new Date(
                second.updatedAt || 0
              ) -
              new Date(
                first.updatedAt || 0
              )
            );

          case "value-high":
            return (
              Number(second.buyPrice || 0) *
                secondStock -
              Number(first.buyPrice || 0) *
                firstStock
            );

          case "stock-low":
          default:
            return firstStock - secondStock;
        }
      }
    );
  }, [
    products,
    search,
    statusFilter,
    categoryFilter,
    supplierFilter,
    sortBy,
    thresholds.low,
  ]);

  const totalPages = Math.max(
    Math.ceil(
      filteredProducts.length / pageSize
    ),
    1
  );

  const currentPage = Math.min(
    page,
    totalPages
  );

  const paginatedProducts = useMemo(() => {
    const start =
      (currentPage - 1) * pageSize;

    return filteredProducts.slice(
      start,
      start + pageSize
    );
  }, [
    filteredProducts,
    currentPage,
    pageSize,
  ]);

  const openStockModal = (product) => {
    setSelectedProduct(product);
    setStockModalOpen(true);
  };

  const closeStockModal = () => {
    setStockModalOpen(false);
    setSelectedProduct(null);
  };

  const openHistory = (product) => {
    setHistoryProduct(product);
    setHistoryOpen(true);
  };

  const updateProductLocally = (
    productId,
    updatedProduct
  ) => {
    setProducts((currentProducts) =>
      currentProducts.map((product) => {
        const currentId =
          product.id || product._id;

        if (String(currentId) !== String(productId)) {
          return product;
        }

        return {
          ...product,
          ...updatedProduct,
          id:
            updatedProduct._id ||
            product.id ||
            product._id,
          _id:
            updatedProduct._id ||
            product._id ||
            product.id,
          qty:
            updatedProduct.stock ??
            product.qty,
        };
      })
    );

    setServerStats(null);
  };

  const exportCSV = () => {
    if (!filteredProducts.length) {
      alert("No products are available to export.");
      return;
    }

    const header = [
      "Product",
      "SKU",
      "Category",
      "Supplier",
      "Buy Price",
      "Selling Price",
      "Stock",
      "Stock Status",
      "Inventory Value",
      "Last Updated",
    ];

    const rows = filteredProducts.map(
      (product) => {
        const stock = Number(
          product.stock ?? product.qty ?? 0
        );

        return [
          product.productName ||
            product.name ||
            "",
          product.sku || "",
          product.categoryName ||
            "Uncategorized",
          product.supplier || "local",
          Number(product.buyPrice || 0),
          Number(product.price || 0),
          stock,
          getStockState(
            stock,
            thresholds.low
          ).label,
          stock *
            Number(product.buyPrice || 0),
          formatDate(product.updatedAt),
        ];
      }
    );

    const csv =
      "\uFEFF" +
      [header, ...rows]
        .map((row) =>
          row
            .map(
              (value) =>
                `"${String(value).replace(
                  /"/g,
                  '""'
                )}"`
            )
            .join(",")
        )
        .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link =
      document.createElement("a");

    link.href = url;
    link.download = `Kroykori_stock_report_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setSupplierFilter("all");
    setSortBy("stock-low");
  };

  return (
    <main className="min-h-screen w-full min-w-0 max-w-full overflow-x-hidden bg-slate-50 p-4 md:p-2">
      <div className="mx-auto w-full min-w-0 max-w-[1600px] space-y-2">
        {/* Header */}
        <section className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                <HiOutlineArchive className="text-2xl" />
              </div>

              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
                  Stock Management
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Manage inventory, stock adjustments and product history.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportCSV}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              <HiOutlineDownload className="text-lg" />
              Export CSV
            </button>

            <button
              type="button"
              onClick={() =>
                loadProducts({
                  silent: true,
                })
              }
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <HiOutlineRefresh
                className={`text-lg ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Products"
            value={formatNumber(
              stats.totalProducts
            )}
            secondary={`${formatNumber(
              stats.totalUnits
            )} total units`}
            icon={
              <HiOutlineShoppingBag />
            }
            tone="indigo"
          />

          <StatCard
            title="Low Stock"
            value={formatNumber(
              stats.lowStock
            )}
            secondary={`Threshold: ${thresholds.low} or less`}
            icon={
              <HiOutlineExclamation />
            }
            tone="amber"
          />

          <StatCard
            title="Out of Stock"
            value={formatNumber(
              stats.outOfStock
            )}
            secondary="Requires attention"
            icon={
              <HiOutlineArchive />
            }
            tone="rose"
          />

          <StatCard
            title="Inventory Value"
            value={currency(
              stats.inventoryValue
            )}
            secondary={`Retail: ${currency(
              stats.retailValue
            )}`}
            icon={
              <HiOutlineAdjustments />
            }
            tone="emerald"
          />
        </section>

        {/* Filters */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(250px,1fr)_180px_190px_170px_190px_auto]">
            <div className="relative">
              <HiOutlineSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xl text-slate-400" />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search product, SKU or category..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            >
              <option value="all">
                All stock status
              </option>
              <option value="in">
                In Stock
              </option>
              <option value="low">
                Low Stock
              </option>
              <option value="out">
                Out of Stock
              </option>
            </select>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            >
              <option value="all">
                All categories
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                )
              )}
            </select>

            <select
              value={supplierFilter}
              onChange={(event) =>
                setSupplierFilter(
                  event.target.value
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            >
              <option value="all">
                All suppliers
              </option>
              <option value="local">
                Local
              </option>
              <option value="banggomart">
                Banggomart
              </option>
            </select>

            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(
                  event.target.value
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            >
              <option value="stock-low">
                Stock: low first
              </option>
              <option value="stock-high">
                Stock: high first
              </option>
              <option value="name-az">
                Name: A–Z
              </option>
              <option value="name-za">
                Name: Z–A
              </option>
              <option value="value-high">
                Value: high first
              </option>
              <option value="updated">
                Recently updated
              </option>
            </select>

            <button
              type="button"
              onClick={clearFilters}
              className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
        </section>

        {error && (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </section>
        )}

        {/* Desktop Table */}
        <section className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-black text-slate-900">
                Product Inventory
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Showing{" "}
                {filteredProducts.length} of{" "}
                {products.length} products
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">
                Rows:
              </span>

              <select
                value={pageSize}
                onChange={(event) =>
                  setPageSize(
                    Number(
                      event.target.value
                    )
                  )
                }
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {loading ? (
            <StockTableSkeleton />
          ) : paginatedProducts.length ? (
            <>
              <div className="hidden w-full min-w-0 max-w-full overflow-x-auto md:block">
                <table className="w-full min-w-[1050px] text-sm">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200 text-left">
                      <th className="px-4 py-4 font-bold text-slate-600">
                        Product
                      </th>
                      <th className="px-4 py-4 font-bold text-slate-600">
                        Category
                      </th>
                      <th className="px-4 py-4 font-bold text-slate-600">
                        Buy Price
                      </th>
                      <th className="px-4 py-4 font-bold text-slate-600">
                        Sell Price
                      </th>
                      <th className="px-4 py-4 font-bold text-slate-600">
                        Stock
                      </th>
                      <th className="px-4 py-4 font-bold text-slate-600">
                        Status
                      </th>
                      <th className="px-4 py-4 font-bold text-slate-600">
                        Stock Value
                      </th>
                      <th className="px-4 py-4 text-right font-bold text-slate-600">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {paginatedProducts.map(
                      (product) => (
                        <StockTableRow
                          key={
                            product.id ||
                            product._id
                          }
                          product={product}
                          lowThreshold={
                            thresholds.low
                          }
                          onAdjust={() =>
                            openStockModal(
                              product
                            )
                          }
                          onHistory={() =>
                            openHistory(
                              product
                            )
                          }
                        />
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="divide-y divide-slate-100 md:hidden">
                {paginatedProducts.map(
                  (product) => (
                    <MobileStockCard
                      key={
                        product.id ||
                        product._id
                      }
                      product={product}
                      lowThreshold={
                        thresholds.low
                      }
                      onAdjust={() =>
                        openStockModal(
                          product
                        )
                      }
                      onHistory={() =>
                        openHistory(
                          product
                        )
                      }
                    />
                  )
                )}
              </div>

              <Pagination
                page={currentPage}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </>
          ) : (
            <EmptyState
              onClear={clearFilters}
            />
          )}
        </section>
      </div>

      {stockModalOpen &&
        selectedProduct && (
          <StockAdjustmentModal
            product={selectedProduct}
            onClose={closeStockModal}
            onUpdated={(
              updatedProduct
            ) => {
              updateProductLocally(
                selectedProduct.id ||
                  selectedProduct._id,
                updatedProduct
              );

              closeStockModal();
            }}
          />
        )}

      {historyOpen && historyProduct && (
        <StockHistoryDrawer
          product={historyProduct}
          onClose={() => {
            setHistoryOpen(false);
            setHistoryProduct(null);
          }}
        />
      )}
    </main>
  );
}

function StockTableRow({
  product,
  lowThreshold,
  onAdjust,
  onHistory,
}) {
  const stock = Number(
    product.stock ?? product.qty ?? 0
  );

  const stockState = getStockState(
    stock,
    lowThreshold
  );

  const image = getProductImage(product);

  return (
    <tr className="transition hover:bg-slate-50/80">
      <td className="px-4 py-4">
        <div className="flex min-w-[270px] items-center gap-3">
          <ProductImage
            src={image}
            name={
              product.productName ||
              product.name
            }
          />

          <div className="min-w-0">
            <p className="max-w-[260px] truncate font-bold text-slate-900">
              {product.productName ||
                product.name}
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>
                SKU:{" "}
                {product.sku || "—"}
              </span>

              <span className="rounded-full bg-slate-100 px-2 py-0.5 capitalize">
                {product.supplier ||
                  "local"}
              </span>
            </div>
          </div>
        </div>
      </td>

      <td className="px-4 py-4 text-slate-600">
        {product.categoryName ||
          "Uncategorized"}
      </td>

      <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-700">
        {currency(product.buyPrice)}
      </td>

      <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-900">
        {currency(product.price)}
      </td>

      <td className="px-4 py-4">
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-black text-slate-900">
            {formatNumber(stock)}
          </span>

          <span className="text-xs text-slate-400">
            units
          </span>
        </div>
      </td>

      <td className="px-4 py-4">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${stockState.className}`}
        >
          {stockState.label}
        </span>
      </td>

      <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-800">
        {currency(
          stock *
            Number(product.buyPrice || 0)
        )}
      </td>

      <td className="px-4 py-4">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onHistory}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
          >
            <HiOutlineClock className="text-base" />
            History
          </button>

          <button
            type="button"
            onClick={onAdjust}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-700"
          >
            <HiOutlineAdjustments className="text-base" />
            Adjust
          </button>
        </div>
      </td>
    </tr>
  );
}

function MobileStockCard({
  product,
  lowThreshold,
  onAdjust,
  onHistory,
}) {
  const stock = Number(
    product.stock ?? product.qty ?? 0
  );

  const stockState = getStockState(
    stock,
    lowThreshold
  );

  return (
    <article className="p-4">
      <div className="flex gap-3">
        <ProductImage
          src={getProductImage(product)}
          name={
            product.productName ||
            product.name
          }
        />

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 font-bold text-slate-900">
            {product.productName ||
              product.name}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            SKU: {product.sku || "—"}
          </p>

          <span
            className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-bold ring-1 ring-inset ${stockState.className}`}
          >
            {stockState.label}
          </span>
        </div>

        <div className="text-right">
          <p className="text-xl font-black text-slate-900">
            {stock}
          </p>

          <p className="text-[10px] text-slate-400">
            units
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-xs">
        <div>
          <p className="text-slate-400">
            Buy price
          </p>

          <p className="mt-1 font-bold text-slate-700">
            {currency(product.buyPrice)}
          </p>
        </div>

        <div>
          <p className="text-slate-400">
            Sell price
          </p>

          <p className="mt-1 font-bold text-slate-700">
            {currency(product.price)}
          </p>
        </div>

        <div>
          <p className="text-slate-400">
            Category
          </p>

          <p className="mt-1 truncate font-bold text-slate-700">
            {product.categoryName ||
              "Uncategorized"}
          </p>
        </div>

        <div>
          <p className="text-slate-400">
            Stock value
          </p>

          <p className="mt-1 font-bold text-slate-700">
            {currency(
              stock *
                Number(
                  product.buyPrice || 0
                )
            )}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onHistory}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600"
        >
          <HiOutlineClock className="text-base" />
          History
        </button>

        <button
          type="button"
          onClick={onAdjust}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2.5 text-xs font-bold text-white"
        >
          <HiOutlineAdjustments className="text-base" />
          Adjust Stock
        </button>
      </div>
    </article>
  );
}

function StockAdjustmentModal({
  product,
  onClose,
  onUpdated,
}) {
  const currentStock = Number(
    product.stock ?? product.qty ?? 0
  );

  const [action, setAction] =
    useState("add");
  const [quantity, setQuantity] =
    useState("");
  const [reason, setReason] =
    useState("New purchase");
  const [note, setNote] = useState("");
  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState("");

  const quantityNumber = Number(
    quantity || 0
  );

  const previewStock = useMemo(() => {
    if (action === "add") {
      return currentStock + quantityNumber;
    }

    if (action === "remove") {
      return currentStock - quantityNumber;
    }

    return quantityNumber;
  }, [
    action,
    currentStock,
    quantityNumber,
  ]);

  useEffect(() => {
    if (action === "add") {
      setReason("New purchase");
    }

    if (action === "remove") {
      setReason("Damaged or sold offline");
    }

    if (action === "set") {
      setReason(
        "Physical inventory correction"
      );
    }
  }, [action]);

  const submitStock = async (event) => {
    event.preventDefault();
    setError("");

    if (
      !Number.isFinite(quantityNumber) ||
      quantityNumber < 0
    ) {
      setError(
        "Enter a valid stock quantity."
      );
      return;
    }

    if (
      action !== "set" &&
      quantityNumber <= 0
    ) {
      setError(
        "Quantity must be greater than zero."
      );
      return;
    }

    if (
      action === "remove" &&
      quantityNumber > currentStock
    ) {
      setError(
        `Only ${currentStock} item(s) are available.`
      );
      return;
    }

    const productId =
      product.id || product._id;

    setSaving(true);

    try {
      const response = await fetch(
        apiUrl(
          `/api/products/${productId}/stock`
        ),
        {
          method: "PATCH",
          headers: getAuthHeaders(true),
          body: JSON.stringify({
            action,
            quantity: quantityNumber,
            reason,
            note,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.errors?.quantity
            ?.message ||
            data?.message ||
            "Stock could not be updated"
        );
      }

      onUpdated(data.product);
    } catch (requestError) {
      console.error(requestError);

      setError(
        requestError?.message ||
          "Stock could not be updated"
      );
    } finally {
      setSaving(false);
    }
  };

  const actionOptions = [
    {
      value: "add",
      label: "Add",
      icon: <HiOutlinePlus />,
    },
    {
      value: "remove",
      label: "Remove",
      icon: <HiOutlineMinus />,
    },
    {
      value: "set",
      label: "Set Exact",
      icon: <HiOutlineAdjustments />,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="max-h-[95vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Adjust Stock
            </h2>

            <p className="mt-1 max-w-[300px] truncate text-xs text-slate-500">
              {product.productName ||
                product.name}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
          >
            <HiOutlineX className="text-xl" />
          </button>
        </header>

        <form
          onSubmit={submitStock}
          className="space-y-5 p-5"
        >
          <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4">
            <div>
              <p className="text-xs font-semibold text-slate-400">
                Current stock
              </p>

              <p className="mt-1 text-2xl font-black text-slate-900">
                {currentStock}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs font-semibold text-slate-400">
                New stock
              </p>

              <p
                className={`mt-1 text-2xl font-black ${
                  previewStock < 0
                    ? "text-rose-600"
                    : "text-indigo-600"
                }`}
              >
                {previewStock}
              </p>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Operation
            </label>

            <div className="grid grid-cols-3 gap-2">
              {actionOptions.map(
                (option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setAction(
                        option.value
                      )
                    }
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-bold transition ${
                      action ===
                      option.value
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-lg">
                      {option.icon}
                    </span>

                    {option.label}
                  </button>
                )
              )}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              {action === "set"
                ? "New stock quantity"
                : "Quantity"}
            </label>

            <input
              type="number"
              min="0"
              step="1"
              value={quantity}
              onChange={(event) =>
                setQuantity(
                  event.target.value
                )
              }
              placeholder="Enter quantity"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Reason
            </label>

            <select
              value={reason}
              onChange={(event) =>
                setReason(
                  event.target.value
                )
              }
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            >
              {action === "add" && (
                <>
                  <option>
                    New purchase
                  </option>
                  <option>
                    Customer return
                  </option>
                  <option>
                    Supplier replacement
                  </option>
                  <option>
                    Previous entry correction
                  </option>
                </>
              )}

              {action === "remove" && (
                <>
                  <option>
                    Damaged or sold offline
                  </option>
                  <option>
                    Expired product
                  </option>
                  <option>
                    Supplier return
                  </option>
                  <option>
                    Lost product
                  </option>
                  <option>
                    Previous entry correction
                  </option>
                </>
              )}

              {action === "set" && (
                <>
                  <option>
                    Physical inventory correction
                  </option>
                  <option>
                    Opening stock
                  </option>
                  <option>
                    System migration
                  </option>
                  <option>
                    Previous entry correction
                  </option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Note{" "}
              <span className="font-normal text-slate-400">
                (optional)
              </span>
            </label>

            <textarea
              rows={3}
              value={note}
              onChange={(event) =>
                setNote(
                  event.target.value
                )
              }
              placeholder="Write additional details..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-11 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="h-11 rounded-xl bg-indigo-600 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Updating..."
                : "Update Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StockHistoryDrawer({
  product,
  onClose,
}) {
  const [history, setHistory] =
    useState([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadHistory = async () => {
      const productId =
        product.id || product._id;

      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          apiUrl(
            `/api/products/${productId}/stock-history?limit=100`
          ),
          {
            headers: getAuthHeaders(),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Stock history could not be loaded"
          );
        }

        setHistory(
          Array.isArray(data)
            ? data
            : data?.items || []
        );
      } catch (requestError) {
        console.error(requestError);

        setError(
          requestError?.message ||
            "Stock history could not be loaded"
        );
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [product]);

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/40 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={onClose}
      />

      <aside className="absolute bottom-0 right-0 top-0 z-10 flex w-full max-w-md flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-black text-slate-900">
              Stock History
            </h2>

            <p className="mt-1 truncate text-xs text-slate-500">
              {product.productName ||
                product.name}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600"
          >
            <HiOutlineX className="text-xl" />
          </button>
        </header>

        <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
          <p className="text-xs font-semibold text-slate-400">
            Current stock
          </p>

          <p className="mt-1 text-2xl font-black text-slate-900">
            {Number(
              product.stock ??
                product.qty ??
                0
            )}{" "}
            <span className="text-xs font-semibold text-slate-400">
              units
            </span>
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="space-y-4">
              {Array.from({
                length: 5,
              }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-2xl border border-slate-100 p-4"
                >
                  <div className="h-4 w-28 rounded bg-slate-200" />
                  <div className="mt-3 h-3 w-44 rounded bg-slate-100" />
                  <div className="mt-2 h-3 w-32 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : history.length ? (
            <div className="space-y-4">
              {history.map((item) => {
                const isAdd =
                  item.action === "add";
                const isRemove =
                  item.action ===
                  "remove";

                return (
                  <article
                    key={item._id}
                    className="relative rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${
                            isAdd
                              ? "bg-emerald-50 text-emerald-600"
                              : isRemove
                              ? "bg-rose-50 text-rose-600"
                              : "bg-indigo-50 text-indigo-600"
                          }`}
                        >
                          {isAdd ? (
                            <HiOutlinePlus />
                          ) : isRemove ? (
                            <HiOutlineMinus />
                          ) : (
                            <HiOutlineAdjustments />
                          )}
                        </div>

                        <div>
                          <p className="font-black capitalize text-slate-900">
                            {item.action}{" "}
                            stock
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {item.reason ||
                              "No reason provided"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-black ${
                          isAdd
                            ? "bg-emerald-50 text-emerald-700"
                            : isRemove
                            ? "bg-rose-50 text-rose-700"
                            : "bg-indigo-50 text-indigo-700"
                        }`}
                      >
                        {isAdd
                          ? "+"
                          : isRemove
                          ? "−"
                          : "="}
                        {item.quantity}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-xs">
                      <div>
                        <p className="text-slate-400">
                          Previous
                        </p>

                        <p className="mt-1 font-black text-slate-700">
                          {
                            item.previousStock
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-400">
                          New stock
                        </p>

                        <p className="mt-1 font-black text-slate-700">
                          {item.newStock}
                        </p>
                      </div>
                    </div>

                    {item.note && (
                      <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        {item.note}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        {item.updatedBy
                          ?.name ||
                          item.updatedBy
                            ?.email ||
                          "Admin"}
                      </span>

                      <span>
                        {formatDate(
                          item.createdAt
                        )}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center">
              <HiOutlineClock className="mx-auto text-4xl text-slate-300" />

              <h3 className="mt-4 font-black text-slate-800">
                No stock history
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Stock adjustments will appear here.
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function StatCard({
  title,
  value,
  secondary,
  icon,
  tone,
}) {
  const toneStyles = {
    indigo:
      "bg-indigo-50 text-indigo-600",
    amber:
      "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    emerald:
      "bg-emerald-50 text-emerald-600",
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-2 truncate text-2xl font-black text-slate-900">
            {value}
          </p>

          <p className="mt-1 truncate text-xs text-slate-400">
            {secondary}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-2xl ${
            toneStyles[tone] ||
            toneStyles.indigo
          }`}
        >
          {icon}
        </div>
      </div>
    </article>
  );
}

function ProductImage({
  src,
  name,
}) {
  const [failed, setFailed] =
    useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
        <HiOutlineShoppingBag className="text-2xl" />
      </div>
    );
  }

  return (
    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
      <img
        src={src}
        alt={name || "Product"}
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-semibold text-slate-500">
        Page {page} of {totalPages}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() =>
            onPageChange(page - 1)
          }
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <HiOutlineChevronLeft />
          Previous
        </button>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() =>
            onPageChange(page + 1)
          }
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <HiOutlineChevronRight />
        </button>
      </div>
    </div>
  );
}

function StockTableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 8 }).map(
        (_, index) => (
          <div
            key={index}
            className="flex animate-pulse items-center gap-4 rounded-xl border border-slate-100 p-3"
          >
            <div className="h-14 w-14 rounded-xl bg-slate-200" />

            <div className="flex-1">
              <div className="h-4 w-52 rounded bg-slate-200" />
              <div className="mt-2 h-3 w-28 rounded bg-slate-100" />
            </div>

            <div className="hidden h-4 w-20 rounded bg-slate-100 sm:block" />
            <div className="hidden h-8 w-24 rounded bg-slate-100 md:block" />
          </div>
        )
      )}
    </div>
  );
}

function EmptyState({ onClear }) {
  return (
    <div className="px-6 py-20 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <HiOutlineSearch className="text-3xl" />
      </div>

      <h3 className="mt-4 text-lg font-black text-slate-800">
        No products found
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        Try changing your search or filters.
      </p>

      <button
        type="button"
        onClick={onClear}
        className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white"
      >
        Clear Filters
      </button>
    </div>
  );
}