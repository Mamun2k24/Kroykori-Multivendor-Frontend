import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiLoader,
  FiMail,
  FiMapPin,
  FiPackage,
  FiPhone,
  FiRefreshCw,
  FiShoppingBag,
  FiStar,
  FiTruck,
} from "react-icons/fi";
import {
  Link,
  useParams,
} from "react-router-dom";

const API_URL = String(
  import.meta.env.VITE_APP_SERVER_URL || "",
).replace(/\/+$/, "");

const money = (value) =>
  `৳${Number(value || 0).toLocaleString(
    "en-BD",
  )}`;

const getProductPrice = (product) => {
  if (
    product?.flashSale?.enabled &&
    Number(product?.flashSale?.salePrice) > 0
  ) {
    return Number(
      product.flashSale.salePrice,
    );
  }

  return Number(product?.price || 0);
};

const PublicShopPage = () => {
  const { slug } = useParams();

  const [shop, setShop] = useState(null);
  const [products, setProducts] =
    useState([]);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] =
    useState(1);

  const [shopLoading, setShopLoading] =
    useState(true);
  const [
    productsLoading,
    setProductsLoading,
  ] = useState(true);

  const [error, setError] = useState("");

  const loadShop = useCallback(async () => {
    try {
      setShopLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/shops/public/${encodeURIComponent(
          slug,
        )}`,
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Shop পাওয়া যায়নি।",
        );
      }

      setShop(data);
    } catch (err) {
      setShop(null);

      setError(
        err.message ||
          "Shop load করতে সমস্যা হয়েছে।",
      );
    } finally {
      setShopLoading(false);
    }
  }, [slug]);

  const loadProducts =
    useCallback(async () => {
      try {
        setProductsLoading(true);

        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });

        const response = await fetch(
          `${API_URL}/api/shops/public/${encodeURIComponent(
            slug,
          )}/products?${params.toString()}`,
        );

        const data = await response
          .json()
          .catch(() => ({}));

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
        setProductsLoading(false);
      }
    }, [slug, page, limit]);

  useEffect(() => {
    setPage(1);
    loadShop();
  }, [loadShop]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  if (shopLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <FiLoader className="mx-auto animate-spin text-4xl text-orange-500" />

          <p className="mt-3 text-sm text-slate-500">
            Shop loading...
          </p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 text-center">
        <FiShoppingBag className="text-6xl text-slate-300" />

        <h1 className="mt-5 text-2xl font-bold text-slate-900">
          Shop not found
        </h1>

        <p className="mt-2 text-slate-500">
          {error ||
            "এই shop unavailable অথবা inactive।"}
        </p>

        <Link
          to="/"
          className="mt-6 rounded-xl bg-orange-500 px-6 py-3 font-bold text-white"
        >
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-12">
      {/* Banner */}

      <section className="relative h-48 overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-orange-900 sm:h-64 lg:h-72">
        {shop.banner && (
          <img
            src={shop.banner}
            alt={`${shop.shopName} banner`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/25 to-transparent" />
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Shop profile */}

        <section className="relative -mt-16 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-slate-100 shadow-lg">
              {shop.logo ? (
                <img
                  src={shop.logo}
                  alt={shop.shopName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <FiShoppingBag className="text-4xl text-slate-400" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  {shop.shopName}
                </h1>

                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                  Verified Shop
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <FiStar className="fill-amber-400 text-amber-400" />

                  {Number(
                    shop.ratingAverage || 0,
                  ).toFixed(1)}

                  <span>
                    ({shop.ratingCount || 0}{" "}
                    reviews)
                  </span>
                </span>

                <span className="flex items-center gap-1.5">
                  <FiPackage />
                  {total} products
                </span>

                {shop.owner?.name && (
                  <span>
                    Seller: {shop.owner.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {shop.description && (
            <p className="mt-5 max-w-4xl whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {shop.description}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-4 border-t border-slate-100 pt-5 text-sm text-slate-600">
            {shop.contactPhone && (
              <a
                href={`tel:${shop.contactPhone}`}
                className="flex items-center gap-2 hover:text-orange-600"
              >
                <FiPhone />
                {shop.contactPhone}
              </a>
            )}

            {shop.contactEmail && (
              <a
                href={`mailto:${shop.contactEmail}`}
                className="flex items-center gap-2 hover:text-orange-600"
              >
                <FiMail />
                {shop.contactEmail}
              </a>
            )}

            {shop.businessAddress && (
              <span className="flex items-center gap-2">
                <FiMapPin />
                {shop.businessAddress}
              </span>
            )}
          </div>
        </section>

        {/* Shipping information */}

        {shop.shippingSettings && (
          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <FiTruck />
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Inside Dhaka
                </p>

                <p className="font-bold text-slate-800">
                  {money(
                    shop.shippingSettings
                      .insideDhaka,
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <FiTruck />
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Outside Dhaka
                </p>

                <p className="font-bold text-slate-800">
                  {money(
                    shop.shippingSettings
                      .outsideDhaka,
                  )}
                </p>
              </div>
            </div>

            {shop.shippingSettings
              .freeDeliveryEnabled && (
              <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <FiTruck />
                </div>

                <div>
                  <p className="text-xs text-emerald-600">
                    Free delivery
                  </p>

                  <p className="font-bold text-emerald-700">
                    Over{" "}
                    {money(
                      shop.shippingSettings
                        .freeDeliveryMinimum,
                    )}
                  </p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Products heading */}

        <section className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Shop Products
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {total} products available
              </p>
            </div>

            <button
              type="button"
              onClick={loadProducts}
              disabled={productsLoading}
              className="rounded-xl border border-slate-200 bg-white p-3 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <FiRefreshCw
                className={
                  productsLoading
                    ? "animate-spin"
                    : ""
                }
              />
            </button>
          </div>

          {productsLoading ? (
            <div className="flex min-h-72 items-center justify-center">
              <FiLoader className="animate-spin text-4xl text-orange-500" />
            </div>
          ) : products.length === 0 ? (
            <div className="mt-6 flex min-h-72 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center">
              <FiPackage className="text-5xl text-slate-300" />

              <h3 className="mt-4 font-bold text-slate-800">
                No products available
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                এই shop-এ এখন কোনো published
                product নেই।
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {products.map((product) => {
                const currentPrice =
                  getProductPrice(product);

                const hasDiscount =
                  Number(
                    product.regularPrice,
                  ) > currentPrice;

                return (
                  <Link
                    key={product._id}
                    to={`/product/${product._id}`}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg"
                  >
                    <div className="relative aspect-square overflow-hidden bg-slate-100">
                      <img
                        src={
                          product
                            .productImage?.[0] ||
                          "/default-product.png"
                        }
                        alt={product.productName}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />

                      {product.stock <= 0 && (
                        <span className="absolute inset-x-2 bottom-2 rounded-lg bg-slate-950/80 px-2 py-1.5 text-center text-xs font-bold text-white">
                          Out of stock
                        </span>
                      )}

                      {product?.flashSale
                        ?.enabled && (
                        <span className="absolute left-2 top-2 rounded-lg bg-red-500 px-2 py-1 text-xs font-bold text-white">
                          Flash Sale
                        </span>
                      )}
                    </div>

                    <div className="p-3 sm:p-4">
                      {product.brand && (
                        <p className="text-xs font-semibold uppercase text-orange-500">
                          {product.brand}
                        </p>
                      )}

                      <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold text-slate-800">
                        {product.productName}
                      </h3>

                      <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                        <FiStar className="fill-amber-400 text-amber-400" />

                        {Number(
                          product.ratingAvg ||
                            product.ratings ||
                            0,
                        ).toFixed(1)}

                        <span>
                          (
                          {product.ratingCount ||
                            0}
                          )
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="font-bold text-orange-600">
                          {money(currentPrice)}
                        </span>

                        {hasDiscount && (
                          <span className="text-xs text-slate-400 line-through">
                            {money(
                              product.regularPrice,
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination */}

          {!productsLoading &&
            totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => {
                    setPage(
                      (previous) =>
                        previous - 1,
                    );

                    window.scrollTo({
                      top: 350,
                      behavior: "smooth",
                    });
                  }}
                  className="rounded-xl border border-slate-200 bg-white p-3 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiChevronLeft />
                </button>

                <span className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white">
                  {page} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => {
                    setPage(
                      (previous) =>
                        previous + 1,
                    );

                    window.scrollTo({
                      top: 350,
                      behavior: "smooth",
                    });
                  }}
                  className="rounded-xl border border-slate-200 bg-white p-3 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiChevronRight />
                </button>
              </div>
            )}
        </section>
      </div>
    </main>
  );
};

export default PublicShopPage;