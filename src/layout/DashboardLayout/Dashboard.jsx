// src/layout/DashboardLayout/Dashboard.jsx
import { useMemo, useState } from "react";
import { Outlet, Link, NavLink } from "react-router-dom";
import { RxDashboard } from "react-icons/rx";
import { HiOutlineArchive } from "react-icons/hi";
import {
  FiMenu,
  FiLogOut,
  FiLayout,
  FiUser,
  FiHome,
  FiTag,
  FiLayers,
  FiShoppingBag,
  FiImage,
  FiUsers,
  FiStar,
  FiPackage,
  FiCreditCard,
  FiDollarSign,
  FiFileText,
  FiBookmark,
  FiSettings,
  FiCheckSquare,
  FiTruck,
  FiXSquare,
  FiDroplet,
  FiVideo,
  FiMaximize2,
  FiX,
  FiMessageCircle,
  FiHelpCircle,
  FiPercent,
  FiRefreshCcw,
  FiUserCheck,
  FiGrid,
  FiTrendingUp,
} from "react-icons/fi";

import { FaChartLine } from "react-icons/fa";

import useLogout from "../../hooks/useLogout";
import { useUser } from "../../hooks/userContext";
import NotificationBell from "../../components/NotificationBell";
import logo from "../../assets/images/logo.png";
import useGeneralSettings from "../../hooks/useGeneralSettings";

const navBase =
  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200";
const navIdle = "text-slate-600 hover:text-indigo-700 hover:bg-indigo-50";
const navActive =
  "text-indigo-700 bg-indigo-100 ring-1 ring-indigo-200 shadow-sm";

const defaultAvatar = "https://preline.co/assets/img/160x160/img1.jpg";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: settings, isLoading: isSettingsLoading } = useGeneralSettings();

  const {
    user,
    role,
    sellerStatus,
    loading,
    isAdmin,
    isSuperAdmin,
    isApprovedSeller,
    hasSellerApplication,
  } = useUser();

  const { handleLogout } = useLogout();

  const token = localStorage.getItem("token");

  const displayName = user?.name || user?.username || user?.fullName || "User";
  const siteBrand = settings?.brandName || "Kroykori";
  const resolvedLogo = settings?.logoUrl || logo;

  const avatarSrc =
    user?.profileImage && user.profileImage !== "default-profile.png"
      ? user.profileImage
      : defaultAvatar;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    if (h < 21) return "Good Evening";
    return "Good Night";
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.();
    }
  };

  const adminGroups = useMemo(() => {
    const groups = [
      {
        title: "Overview",
        items: [
          {
            to: "/dashboard",
            icon: <RxDashboard />,
            label: "Dashboard",
            end: true,
          },
          { to: "/", icon: <FiHome />, label: "Home" },
        ],
      },

      {
        title: "Sales",
        items: [
          {
            to: "/dashboard/orders",
            icon: <FiShoppingBag />,
            label: "All Orders",
          },
          {
  to: "/dashboard/pre-book-orders",
  icon: <FiBookmark />,
  label: "Pre-book Orders",
},
          {
            to: "/dashboard/confirm-orders",
            icon: <FiCheckSquare />,
            label: "Confirm Orders",
          },
          {
            to: "/dashboard/shipped-orders",
            icon: <FiTruck />,
            label: "Shipped Orders",
          },
          {
            to: "/dashboard/delivery-orders",
            icon: <FiTruck />,
            label: "Delivered Orders",
          },
          {
            to: "/dashboard/cancel-orders",
            icon: <FiXSquare />,
            label: "Cancel Orders",
          },
          {
            to: "/dashboard/invoices",
            icon: <FiCreditCard />,
            label: "Invoices",
          },
          // { to: "/dashboard/coupon", icon: <FiTag />, label: "Coupons" },
          // {
          //   to: "/dashboard/flash-sale",
          //   icon: <FiStar />,
          //   label: "Flash Sale",
          // },
          {
            to: "/dashboard/sales-report",
            icon: <FaChartLine />,
            label: "Reports",
          },
        ],
      },
      {
        title: "Catalog",
        items: [
          { to: "/dashboard/product", icon: <FiPackage />, label: "Products" },
          {
            to: "/dashboard/categories",
            icon: <FiLayers />,
            label: "Categories",
          },

          { to: "/dashboard/color", icon: <FiDroplet />, label: "Colors" },
          { to: "/dashboard/brands", icon: <FiBookmark />, label: "Brands" },
          {
            to: "/dashboard/stock-management",
            label: "Stock Management",
            icon: <HiOutlineArchive />,
          },
          { to: "/dashboard/hero", icon: <FiImage />, label: "Banners" },
          { to: "/dashboard/video", icon: <FiVideo />, label: "Videos" },
        ],
      },

      {
        title: "Customers",
        items: [
          {
            to: "/dashboard/user",
            icon: <FiUsers />,
            label: isSuperAdmin ? "Users & Admins" : "Users",
          },
          { to: "/dashboard/review", icon: <FiStar />, label: "Reviews" },
        ],
      },
      
      {
        title: "Marketing",
        items: [
          {
            to: "/dashboard/coupon",
            icon: <FiPercent />,
            label: "Coupons",
          },
          {
            to: "/dashboard/flash-sale",
            icon: <FiTag />,
            label: "Flash Sale",
          },
          {
            to: "/dashboard/landing-pages",
            icon: <FiLayout />,
            label: "Landing Pages",
          },
          // {
          //   to: "/dashboard/setting-section",
          //   icon: <FiGrid />,
          //   label: "Homepage Sections",
          // },
          // {
          //   to: "/dashboard/setting-header",
          //   icon: <FiSettings />,
          //   label: "Header Settings",
          // },
        ],
      },
      {
        title: "Marketplace",
        items: [
          {
            to: "/dashboard/admin/marketplace",
            icon: <FiGrid />,
            label: "Marketplace Overview",
          },
          {
            to: "/dashboard/admin/seller-performance",
            icon: <FiTrendingUp />,
            label: "Seller Performance",
          },
          {
            to: "/dashboard/admin/seller-applications",
            icon: <FiUserCheck />,
            label: "Seller Applications",
          },
          {
            to: "/dashboard/admin/shops",
            icon: <FiShoppingBag />,
            label: "Shops",
          },
          {
            to: "/dashboard/admin/seller-products",
            icon: <FiPackage />,
            label: "Seller Products",
          },
          {
            to: "/dashboard/admin/seller-orders",
            icon: <FiTruck />,
            label: "Seller Orders",
          },
        ],
      },
      
      {
        title: "Marketplace Finance",
        items: [
          {
            to: "/dashboard/admin/payouts",
            icon: <FiCreditCard />,
            label: "Seller Payouts",
          },
          {
            to: "/dashboard/admin/seller-transactions",
            icon: <FiDollarSign />,
            label: "Seller Transactions",
          },
          {
            to: "/dashboard/admin/returns",
            icon: <FiRefreshCcw />,
            label: "Return Requests",
          },
          {
            to: "/dashboard/admin/notifications",
            icon: <FiMessageCircle />,
            label: "Marketplace Notifications",
          },
        ],
      },

      // এগুলো নিয়ে পরে কাজ করা হবে
      // {
      //   title: "Support & Chat",
      //   items: [
      //     {
      //       to: "/dashboard/chat",
      //       icon: <FiMessageCircle />,
      //       label: "Customer Chat",
      //     },
      //     {
      //       to: "/dashboard/chatbot-questions",
      //       icon: <FiHelpCircle />,
      //       label: "Chatbot Q/A",
      //     },
      //   ],
      // },
      {
        title: "Settings",
        items: [
          {
            to: "/dashboard/setting-shipping",
            icon: <FiTruck />,
            label: "Shipping",
          },
          {
            to: "/dashboard/general-setting",
            icon: <FiSettings />,
            label: "General Setting",
          },
          // {
          //   to: "/dashboard/setting-logo",
          //   icon: <FiImage />,
          //   label: "Logo Settings",
          // },
          // {
          //   to: "/dashboard/setting-header",
          //   icon: <FiSettings />,
          //   label: "Header Settings",
          // },
          // {
          //   to: "/dashboard/setting-ticker",
          //   icon: <FiMessageCircle />,
          //   label: "Ticker Settings",
          // },
        ],
      },
    ];

    return groups;
  }, [isSuperAdmin]);

  const sellerGroups = useMemo(
    () => [
      {
        title: "Overview",
        items: [
          {
            to: "/dashboard/seller",
            icon: <RxDashboard />,
            label: "Seller Dashboard",
            end: true,
          },
          {
            to: "/",
            icon: <FiHome />,
            label: "Store Home",
          },
        ],
      },
      {
        title: "My Shop",
        items: [
          {
            to: "/dashboard/seller/shop",
            icon: <FiShoppingBag />,
            label: "Shop Profile",
          },
          {
            to: "/dashboard/seller/products",
            icon: <FiPackage />,
            label: "My Products",
          },
          {
            to: "/dashboard/seller/products/add",
            icon: <FiTag />,
            label: "Add Product",
          },
        ],
      },
      {
        title: "Sales",
        items: [
          {
            to: "/dashboard/seller/orders",
            icon: <FiLayers />,
            label: "Seller Orders",
          },
          {
            to: "/dashboard/seller/returns",
            icon: <HiOutlineArchive />,
            label: "Returns",
          },
          {
            to: "/dashboard/seller/notifications",
            icon: <FiMessageCircle />,
            label: "Notifications",
          },
        ],
      },
      {
        title: "Finance",
        items: [
          {
            to: "/dashboard/seller/wallet",
            icon: <FiCreditCard />,
            label: "Withdrawals",
          },
          {
            to: "/dashboard/seller/transactions",
            icon: <FaChartLine />,
            label: "Transactions",
          },
          // {
          //   to: "/dashboard/seller/withdrawals",
          //   icon: <FiTruck />,
          //   label: "Withdrawals",
          // },
        ],
      },
      {
        title: "Account",
        items: [
          {
            to: "/dashboard/order",
            icon: <FiShoppingBag />,
            label: "My Purchases",
          },

          {
            to: "/dashboard/profile",
            icon: <FiUser />,
            label: "Profile",
          },
          {
            to: "/dashboard/seller/settings",
            icon: <FiSettings />,
            label: "Seller Settings",
          },
        ],
      },
    ],
    [],
  );

  const userGroups = useMemo(
    () => [
      {
        title: "Navigation",
        items: [
          {
            to: "/",
            icon: <FiHome />,
            label: "Home",
          },
        ],
      },
      {
        title: "Shopping",
        items: [
          {
            to: "/dashboard/cart",
            icon: <FiShoppingBag />,
            label: "My Cart",
          },
          {
            to: "/dashboard/order",
            icon: <FiLayers />,
            label: "Order History",
          },
          {
            to: "/dashboard/my-invoices",
            icon: <FiCreditCard />,
            label: "My Invoices",
          },
          {
            to: "/dashboard/my-returns",
            icon: <FiRefreshCcw />,
            label: "My Returns",
          },
          {
            to: "/dashboard/setting",
            icon: <FiSettings />,
            label: "Settings",
          },
        ],
      },
      {
        title: "Sell With Us",
        items: [
          {
            to: "/dashboard/verification",
            icon: <FiPackage />,
            label:
              sellerStatus === "pending"
                ? "Application Pending"
                : sellerStatus === "rejected"
                  ? "Reapply as Seller"
                  : sellerStatus === "suspended"
                    ? "Seller Account Suspended"
                    : hasSellerApplication
                      ? "Seller Application"
                      : "Become a Seller",
          },
        ],
      },
    ],
    [sellerStatus, hasSellerApplication],
  );

  const groups = !role
    ? []
    : isAdmin
      ? adminGroups
      : isApprovedSeller
        ? sellerGroups
        : userGroups;

  const flatLinks = useMemo(() => {
    return groups.flatMap((group) => group.items || []);
  }, [groups]);

  if (loading || isSettingsLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-11 h-11 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-poppins">
      <header className="sticky top-0 z-40 h-16 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="h-16 px-3 md:px-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <FiMenu />
            </button>

            <Link to="/" className="flex items-center gap-2">
              <img
                src={resolvedLogo}
                alt={`${siteBrand} logo`}
                className="h-10 w-auto object-contain max-w-[135px]"
                onError={(e) => {
                  e.currentTarget.src = logo;
                }}
              />
            </Link>
          </div>

          <div className="hidden lg:flex items-center px-4 py-2 rounded-xl border bg-slate-50 text-sm text-slate-700">
            {getGreeting()},{" "}
            <span className="font-semibold ml-1">{displayName}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              title="Fullscreen"
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
            >
              <FiMaximize2 />
            </button>

            <NotificationBell token={token} isAdmin={isAdmin} />

            <Link
              to="/dashboard/profile"
              className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
            >
              <img
                src={avatarSrc}
                alt="avatar"
                className="h-8 w-8 rounded-full object-cover bg-slate-100"
                onError={(e) => {
                  e.currentTarget.src = defaultAvatar;
                }}
              />
              <div className="leading-tight max-w-[130px]">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-500 capitalize truncate">
                  {role || "user"}
                </p>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-slate-600 border border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition"
            >
              <FiLogOut className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex px-0 md:px-4">
        <aside className="hidden md:flex w-[225px] shrink-0 pt-5 pb-6 mr-5">
          <div className="sticky top-20 w-full h-[calc(100vh-5.5rem)] rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="p-3 border-b border-slate-100">
              <div className="flex items-center gap-3 p-2 rounded-xl bg-indigo-50">
                <img
                  src={avatarSrc}
                  alt="profile"
                  className="h-10 w-10 rounded-full object-cover bg-white"
                  onError={(e) => {
                    e.currentTarget.src = defaultAvatar;
                  }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-indigo-600 capitalize truncate">
                    {role || "user"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 nice-scrollbar">
              <nav className="space-y-5">
                {groups.map((group) => (
                  <div key={group.title}>
                    <h6 className="px-2 mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      {group.title}
                    </h6>

                    <ul className="flex flex-col gap-1">
                      {(group.items || []).map(({ to, icon, label, end }) => (
                        <li key={to}>
                          <NavLink
                            to={to}
                            end={end}
                            className={({ isActive }) =>
                              `${navBase} ${isActive ? navActive : navIdle}`
                            }
                          >
                            <span className="text-[17px]">{icon}</span>
                            <span className="truncate">{label}</span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>
            </div>

            <div className="border-t border-slate-100 p-3">
              <NavLink
                to="/dashboard/profile"
                className={({ isActive }) =>
                  `${navBase} ${isActive ? navActive : navIdle}`
                }
              >
                <FiUser className="text-[17px]" />
                <span>My Profile</span>
              </NavLink>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            />

            <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl flex flex-col">
              <div className="h-16 px-4 flex items-center justify-between border-b">
                <Link to="/" onClick={() => setSidebarOpen(false)}>
                  <img
                    src={resolvedLogo}
                    alt={`${siteBrand} logo`}
                    className="h-9 w-auto object-contain"
                    onError={(e) => {
                      e.currentTarget.src = logo;
                    }}
                  />
                </Link>

                <button
                  className="h-10 w-10 rounded-xl border flex items-center justify-center"
                  onClick={() => setSidebarOpen(false)}
                >
                  <FiX />
                </button>
              </div>

              <div className="p-4 border-b">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-indigo-50">
                  <img
                    src={avatarSrc}
                    alt="profile"
                    className="h-12 w-12 rounded-full object-cover bg-white"
                    onError={(e) => {
                      e.currentTarget.src = defaultAvatar;
                    }}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">
                      {displayName}
                    </p>
                    <p className="text-sm text-indigo-600 capitalize">
                      {role || "user"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <nav className="space-y-2">
                  {flatLinks.map(({ to, icon, label, end }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={end}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `${navBase} ${isActive ? navActive : navIdle}`
                      }
                    >
                      <span className="text-[17px]">{icon}</span>
                      <span>{label}</span>
                    </NavLink>
                  ))}

                  <NavLink
                    to="/dashboard/profile"
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `${navBase} ${isActive ? navActive : navIdle}`
                    }
                  >
                    <FiUser />
                    <span>My Profile</span>
                  </NavLink>
                </nav>
              </div>

              <div className="p-4 border-t">
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    handleLogout();
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 font-medium"
                >
                  <FiLogOut />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0 pb-8">
          <div className="pt-4 md:pt-5">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
