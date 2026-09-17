import React, {
  lazy,
  Suspense,
  useContext,
  useEffect,
  useRef,
} from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import logo from "../../assets/images/logo.png";
import useCart from "../../hooks/useCart";
import { useUser } from "../../hooks/userContext";
import useLogout from "../../hooks/useLogout";
import { SearchContext } from "../../context/SearchContext";

// Lazy Load
// const HeaderDesktop = lazy(() => import("./HeaderDesktop"));
// const HeaderMobile = lazy(() => import("./HeaderMobile"));
import HeaderDesktop from "./HeaderDesktop";
import HeaderMobile from "./HeaderMobile";

const MOBILE_MENU = [
  {
    id: "",
    name: "Home",
    icon: "https://cdn-icons-png.flaticon.com/128/263/263115.png",
  },
  {
    id: "",
    name: "All Category",
    icon: "https://cdn-icons-png.flaticon.com/128/5991/5991059.png",
    innermenue: [],
  },
  // {
  //   id: "",
  //   name: "Contact",
  //   icon: "https://cdn-icons-png.flaticon.com/128/10261/10261328.png",
  // },
];

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== "undefined"
      ? window.innerWidth < breakpoint
      : false
  );

  useEffect(() => {
    const onResize = () =>
      setIsMobile(window.innerWidth < breakpoint);

    window.addEventListener("resize", onResize);

    return () =>
      window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isMobile;
}

const Header = () => {
  const [cart] = useCart();
  const { user } = useUser();
  const { handleLogout } = useLogout();
  const menuRef = useRef(null);
  const isMobile = useIsMobile();

  const {
    searchTerm,
    setSearchTerm,
    handleSearch,
    productSearch,
    searchResults,
  } = useContext(SearchContext);

  // Debounce Search
  useEffect(() => {
    const q = searchTerm?.trim();

    if (!q || q.length < 2) return;

    const timer = setTimeout(() => {
      productSearch(q);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Categories Query
  const { data: categories = [], error } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_APP_SERVER_URL}api/categories`
      );

      if (!res.ok) {
        throw new Error("Failed to load categories");
      }

      return res.json();
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  return (
    <div ref={menuRef}>
      <Helmet>
        <title>Kroykori</title>
      </Helmet>

      {error && (
        <div className="text-center text-red-500 text-xs py-1">
          Failed to load categories
        </div>
      )}

      <Suspense fallback={<div className="h-[110px]" />}>
        {isMobile ? (
          <HeaderMobile
            logo={logo}
            cart={cart}
            user={user}
            categories={categories}
            mobileMenue={MOBILE_MENU}
            handleLogout={handleLogout}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            productSearch={productSearch}
            searchResults={searchResults}
          />
        ) : (
          <HeaderDesktop
            logo={logo}
            cart={cart}
            user={user}
            categories={categories}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            handleSearch={handleSearch}
            productSearch={productSearch}
            searchResults={searchResults}
          />
        )}
      </Suspense>
    </div>
  );
};

export default Header;