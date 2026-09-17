import { Link, useLocation } from "react-router-dom";
import {
  HiHome,
  HiOutlineSearch,
  HiOutlineShoppingCart,
  HiOutlineUser,
} from "react-icons/hi";
import { TbCategory2 } from "react-icons/tb";

const BottomMobileNav = () => {
  const location = useLocation();

  const menus = [
    { name: "Home", path: "/", icon: HiHome },
    { name: "Categories", path: "/categories", icon: TbCategory2 },
    { name: "Search", path: "/search", icon: HiOutlineSearch },
    { name: "Cart", path: "/cart", icon: HiOutlineShoppingCart },
    { name: "Account", path: "/login", icon: HiOutlineUser },
  ];

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:hidden">
      <div className="grid h-16 grid-cols-5">
        {menus.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.name}
              to={item.path}
              aria-label={item.name}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-all duration-200 ${
                active ? "text-[#F77426]" : "text-gray-500 hover:text-[#F77426]"
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xl transition-all duration-200 ${
                  active ? "bg-orange-50 text-[#F77426]" : "text-gray-500"
                }`}
              >
                <Icon />
              </span>

              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomMobileNav;