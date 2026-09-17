import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  HiOutlineSearch,
  HiOutlineChevronRight,
  HiOutlineCollection,
  HiOutlineRefresh,
} from "react-icons/hi";

const getApiBaseUrl = () => {
  const url =
    import.meta.env.VITE_APP_SERVER_URL ||
    "http://localhost:5000/";

  return url.endsWith("/") ? url : `${url}/`;
};

const CategorySkeleton = () => {
  return (
    <div className="flex animate-pulse items-center gap-3 border-b border-slate-100 px-4 py-4">
      <div className="h-16 w-16 shrink-0 rounded-2xl bg-slate-200" />

      <div className="min-w-0 flex-1">
        <div className="h-4 w-36 rounded bg-slate-200" />
        <div className="mt-2 h-3 w-24 rounded bg-slate-100" />
      </div>

      <div className="h-8 w-8 rounded-full bg-slate-100" />
    </div>
  );
};

const CategoryImage = ({ src, name }) => {
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
        <HiOutlineCollection className="text-2xl" />
      </div>
    );
  }

  return (
    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
      <img
        src={src}
        alt={name}
        loading="lazy"
        onError={() => setImageError(true)}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </div>
  );
};

export default function AllCategories() {
  const [search, setSearch] = useState("");

  const baseUrl = getApiBaseUrl();

  const {
    data: categories = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["all-categories"],
    queryFn: async () => {
      const response = await fetch(`${baseUrl}api/categories`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Categories could not be loaded");
      }

      const data = await response.json();

      return Array.isArray(data)
        ? data.filter((category) => !category.parent)
        : [];
    },
  });

  const filteredCategories = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return categories;
    }

    return categories.filter((category) => {
      const categoryName = String(
        category?.name || ""
      ).toLowerCase();

      const matchingSubcategory =
        category?.subcategories?.some((subcategory) =>
          String(subcategory?.name || "")
            .toLowerCase()
            .includes(keyword)
        );

      return (
        categoryName.includes(keyword) ||
        matchingSubcategory
      );
    });
  }, [categories, search]);

  const totalSubcategories = useMemo(() => {
    return categories.reduce(
      (total, category) =>
        total +
        (Array.isArray(category?.subcategories)
          ? category.subcategories.length
          : 0),
      0
    );
  }, [categories]);

  return (
    <main className="min-h-screen bg-slate-50 pb-24 md:pb-10">
      <div className="mx-auto w-full max-w-7xl">
        {/* Mobile sticky header */}
        <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 px-4 pb-4 pt-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                All Categories
              </h1>

              <p className="mt-0.5 text-xs font-medium text-slate-500">
                Browse products by category
              </p>
            </div>

            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-500 disabled:opacity-50"
              aria-label="Refresh categories"
            >
              <HiOutlineRefresh
                className={`text-xl ${
                  isFetching ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <HiOutlineSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xl text-slate-400" />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search categories..."
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
            />
          </div>
        </header>

        {/* Summary */}
        {!isLoading && !isError && (
          <section className="px-2 pt-4">
            <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3">
              <div>
                <p className="text-xs font-semibold text-orange-600">
                  Explore Kroykori Mart
                </p>

                <p className="mt-0.5 text-sm font-bold text-slate-800">
                  {categories.length} categories and{" "}
                  {totalSubcategories} subcategories
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-orange-500 shadow-sm">
                <HiOutlineCollection className="text-xl" />
              </div>
            </div>
          </section>
        )}

        {/* Category list */}
        <section className="px-4 py-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            {isLoading ? (
              <>
                {Array.from({ length: 7 }).map(
                  (_, index) => (
                    <CategorySkeleton key={index} />
                  )
                )}
              </>
            ) : isError ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                  <HiOutlineRefresh className="text-2xl" />
                </div>

                <h2 className="mt-4 font-bold text-slate-800">
                  Categories could not be loaded
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {error?.message ||
                    "Please check your internet connection."}
                </p>

                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-5 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600"
                >
                  Try Again
                </button>
              </div>
            ) : filteredCategories.length ? (
              filteredCategories.map(
                (category, index) => {
                  const subcategoryCount =
                    Array.isArray(
                      category?.subcategories
                    )
                      ? category.subcategories.length
                      : 0;

                  return (
                    <Link
                      key={category._id}
                      to={`/category/${category.slug}`}
                      className={`group flex items-center gap-3 px-4 py-4 transition duration-200 hover:bg-orange-50/60 active:scale-[0.99] ${
                        index !==
                        filteredCategories.length - 1
                          ? "border-b border-slate-100"
                          : ""
                      }`}
                    >
                      <CategoryImage
                        src={category.image}
                        name={category.name}
                      />

                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-[15px] font-extrabold text-slate-800 transition group-hover:text-orange-600">
                          {category.name}
                        </h2>

                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {subcategoryCount > 0
                            ? `${subcategoryCount} subcategories`
                            : "Explore products"}
                        </p>

                        {subcategoryCount > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {category.subcategories
                              .slice(0, 3)
                              .map((subcategory) => (
                                <span
                                  key={subcategory._id}
                                  className="max-w-[90px] truncate rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500"
                                >
                                  {subcategory.name}
                                </span>
                              ))}

                            {subcategoryCount > 3 && (
                              <span className="rounded-full bg-orange-50 px-2 py-1 text-[10px] font-bold text-orange-500">
                                +
                                {subcategoryCount -
                                  3}{" "}
                                more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all duration-200 group-hover:translate-x-1 group-hover:bg-orange-100 group-hover:text-orange-500">
                        <HiOutlineChevronRight className="text-xl" />
                      </div>
                    </Link>
                  );
                }
              )
            ) : (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <HiOutlineSearch className="text-2xl" />
                </div>

                <h2 className="mt-4 font-bold text-slate-800">
                  No category found
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Try searching with another category
                  name.
                </p>

                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white"
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}