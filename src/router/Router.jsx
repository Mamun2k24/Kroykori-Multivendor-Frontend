// src/router/Router.jsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

// 👑 Core Layouts & Route Guards (এগুলো নরমাল ইম্পোর্ট থাকবে)
import MainLayout from "../layout/MainLayout";
import { AdminRoute } from "../hooks/useAdmin";
import { UserRoute } from "../hooks/userRole";
import { ShareRoute } from "../hooks/useShareRoute";
import { SellerRoute } from "../hooks/useSellerRoute";
import CustomerOrderDetails from "../pages/user/CustomerOrderDetails";
import LandingPages from "../pages/dashboard/LandingPages";
import PreBookOrders from "../components/ui/PreBookOrders";

// 🚀 ALL Core Pages Lazy Loaded (হোমপেজ বান্ডেল ছোট করার জন্য)
const Home = lazy(() => import("../pages/home/Home"));
const ProductDetails = lazy(
  () => import("../pages/home/sections/ProductDetails/ProductDetails"),
);
const Dashboard = lazy(() => import("../layout/DashboardLayout/Dashboard"));
const Cart = lazy(() => import("../components/Cart"));
const Product = lazy(() => import("../components/Product"));
const User = lazy(() => import("../components/User"));
const DashbrodAdmin = lazy(() => import("../components/DashbrodAdmin"));
const MyProfile = lazy(() => import("../components/MyProfile"));
const Order = lazy(() => import("../components/Order"));
const Review = lazy(() => import("../components/Review"));
const Signup = lazy(() => import("../Auth/Signup"));
const Category = lazy(() => import("../components/Category"));
const CartCheckout = lazy(() => import("../pages/checkOut/CartCheckout"));
const Otp = lazy(() => import("../components/Otp"));
const Buynow = lazy(() => import("../components/Buynow"));
const AllOrders = lazy(() => import("../components/AllOrders"));
// const PreBookOrders = lazy(
//  () => import("../components/ui/PreBookOrders")
// );
const HeroUpload = lazy(() => import("../components/HeroUpload"));
const AdminVideoManager = lazy(
  () => import("../pages/admin/AdminVideoManager"),
);

const Producttwo = lazy(() => import("../components/product/Producttwo"));
const LandingPageView = lazy(
  () => import("../pages/dashboard/LandingPageView"),
);

// 🚀 NEW & UI Components Lazy Loaded
const SearchResults = lazy(() => import("../pages/search/SearchResults"));
const SellerVerificationForm = lazy(
  () => import("../pages/seller/SellerVerificationForm"),
);
const SellerShopProfile = lazy(
  () => import("../pages/seller/SellerShopProfile"),
);
const SellerProductList = lazy(
  () => import("../pages/seller/products/SellerProductList"),
);

const AllCategories = lazy(
  () => import("../../src/pages/productCategory/AllCategories"),
);
const MyInvoices = lazy(() => import("../pages/user/MyInvoices"));
const AdminInvoices = lazy(() => import("../pages/admin/AdminInvoices"));
const AdminCoupons = lazy(() => import("../components/AdminCoupons"));
const AdminCategories = lazy(() => import("../pages/admin/AdminCategories"));
const AdminSubCategory = lazy(() => import("../pages/admin/AdminSubCategory"));
const AdminLoginPage = lazy(() => import("../pages/admin/AdminLoginPage"));

const SellerDashboardHome = lazy(
  () => import("../pages/seller/SellerDashboardHome"),
);

const SellerAddProduct = lazy(() => import("../pages/seller/SellerAddProduct"));
const SellerEditProduct = lazy(
  () => import("../pages/seller/products/SellerEditProduct"),
);

const SellerOrderList = lazy(
  () => import("../pages/seller/orders/SellerOrderList"),
);
const SellerOrderDetails = lazy(
  () => import("../pages/seller/orders/SellerOrderDetails"),
);
const SellerWallet = lazy(() => import("../pages/seller/wallet/SellerWallet"));
const SellerTransactions = lazy(
  () => import("../pages/seller/wallet/SellerTransactions"),
);
const SellerReturns = lazy(
  () => import("../pages/seller/returns/SellerReturns"),
);
const SellerNotifications = lazy(
  () => import("../pages/seller/notifications/SellerNotifications"),
);
const PublicShopPage = lazy(() => import("../pages/shop/PublicShopPage"));

const SectionCategoriDetails = lazy(
  () => import("../components/ui/SectionCategoriDetails"),
);

const AllProductsHeader = lazy(
  () => import("../components/ui/AllProductsHeader"),
);
const Color = lazy(() => import("../components/Color"));
const AdminBrands = lazy(() => import("../components/ui/AdminBrands"));
const StockManagement = lazy(() => import("../pages/admin/StockManagement"));
const ChangePassword = lazy(
  () => import("../components/ui/userProfile/ChangePassword"),
);
const LogoSettings = lazy(() => import("../components/ui/LogoSettings"));
const SettingHomeSection = lazy(
  () => import("../components/ui/SettingHomeSection"),
);
const AdminTickerSettings = lazy(
  () => import("../components/ui/AdminTickerSettings"),
);
const Wishlist = lazy(() => import("../components/Wishlist"));
const ConfirmOrders = lazy(() => import("../components/ui/ConfirmOrders"));
const CancelOrders = lazy(() => import("../components/ui/CancelOrders"));
const DeliveredOrders = lazy(() => import("../components/ui/DeliveredOrders"));
const SalesReport = lazy(() => import("../components/ui/SalesReport"));
const HeaderSectionSettings = lazy(
  () => import("../components/ui/HeaderSectionSettings"),
);
const AdminShippingSettings = lazy(
  () => import("../components/ui/AdminShippingSettings"),
);
const AdminMarketplaceDashboard = lazy(
  () => import("../pages/admin/marketplace/AdminMarketplaceDashboard"),
);
const AdminSellerApplications = lazy(
  () => import("../pages/admin/sellers/AdminSellerApplications"),
);
const AdminShops = lazy(() => import("../pages/admin/shop/AdminShops"));
const AdminSellerProducts = lazy(
  () => import("../pages/admin/products/AdminSellerProducts"),
);
const AdminSellerOrders = lazy(
  () => import("../pages/admin/order/AdminSellerOrders"),
);
const AdminSellerPayouts = lazy(
  () => import("../pages/admin/finance/AdminSellerPayouts"),
);
const AdminSellerTransactions = lazy(
  () => import("../pages/admin/finance/AdminSellerTransactions"),
);
const AdminReturnRequests = lazy(
  () => import("../pages/admin/returns/AdminReturnRequests"),
);
const AdminSellerPerformance = lazy(
  () => import("../pages/admin/marketplace/AdminSellerPerformance"),
);
const AdminNotifications = lazy(
  () => import("../pages/admin/notifications/AdminNotifications"),
);

const ShippedOrders = lazy(() => import("../components/ui/ShippedOrders"));

const MyReturns = lazy(() => import("../pages/user/MyReturns"));
const GuestOrderDetails = lazy(
  () => import("../pages/guest/GuestOrderDetails"),
);

const GeneralSetting = lazy(() => import("../components/ui/GeneralSetting"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword"));
const OrderSuccess = lazy(() => import("../pages/OrderSuccess"));
const KroyKoriAboutPage = lazy(() => import("../components/about/AboutPag"));
const KroyKoriContactPage = lazy(
  () => import("../components/contact/KroyKoriContactPage"),
);
const FlashSaleDashboard = lazy(
  () => import("../components/FlashSaleDashboard"),
);

const CreateLandingPage = lazy(
  () => import("../pages/dashboard/CreateLandingPage"),
);
const EditLandingPage = lazy(
  () => import("../pages/dashboard/EditLandingPage"),
);

const AdminChatInbox = lazy(() => import("../pages/admin/AdminChatInbox"));
const AdminChatbotQuestions = lazy(
  () => import("../pages/admin/AdminChatbotQuestions"),
);
const ErrorPage = lazy(() => import("../pages/ErrorPage"));

const withBase = (p) => {
  const base = import.meta.env.VITE_APP_SERVER_URL || "";
  return `${base.replace(/\/$/, "")}/${String(p).replace(/^\//, "")}`;
};

// Global loadable helper
const loadable = (Component) => (
  <Suspense
    fallback={<div className="p-4 text-center text-gray-500">Loading...</div>}
  >
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  { path: "/admin-login", element: loadable(AdminLoginPage) },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: loadable(Home) }, // 👈 এখন সম্পূর্ণ Lazy
      { path: "admin/login", element: loadable(AdminLoginPage) },
      { path: "search", element: loadable(SearchResults) },
      {
        path: "lp/:slug",
        element: loadable(LandingPageView),
      },
      {
        path: "shop/:slug",
        element: loadable(PublicShopPage),
      },
      {
        path: "product-details/:id",
        element: loadable(ProductDetails),
        loader: ({ params }) => fetch(withBase(`api/products/${params.id}`)),
      },
      { path: "/about", element: loadable(KroyKoriAboutPage) },
      { path: "/contact", element: loadable(KroyKoriContactPage) },
      { path: "/order-success", element: loadable(OrderSuccess) },
      {
        path: "/categories",
        element: loadable(AllCategories),
      },
      { path: "category/:slug", element: loadable(SectionCategoriDetails) },
      {
        path: "category/:slug/:subSlug",
        element: loadable(SectionCategoriDetails),
      },

      // Auth & Checkout (এগুলোও এখন Lazy)
      { path: "login", element: loadable(Signup) },
      { path: "otp-verify", element: loadable(Otp) },
      { path: "/forgot-password", element: loadable(ForgotPassword) },
      { path: "cart-checkout", element: loadable(CartCheckout) },
      { path: "cart", element: loadable(Cart) },
      { path: "buy-checkout", element: loadable(Buynow) },
      { path: "producttwo", element: loadable(Producttwo) },
      {
        path: "guest-order/:orderId",
        element: loadable(GuestOrderDetails),
      },
      { path: "/all-product", element: loadable(AllProductsHeader) },
    ],
  },

  // DASHBOARD
  {
    path: "dashboard",
    element: loadable(Dashboard),
    children: [
      {
        index: true,
        element: <AdminRoute>{loadable(DashbrodAdmin)}</AdminRoute>,
      },

      // ---- ADMIN ONLY ----
      {
        path: "orders",
        element: <AdminRoute>{loadable(AllOrders)}</AdminRoute>,
      },
      {
        path: "pre-book-orders",
        element: <AdminRoute>{loadable(PreBookOrders)}</AdminRoute>,
      },
      {
        path: "hero",
        element: <AdminRoute>{loadable(HeroUpload)}</AdminRoute>,
      },
      {
        path: "video",
        element: <AdminRoute>{loadable(AdminVideoManager)}</AdminRoute>,
      },
      {
        path: "product",
        element: <AdminRoute>{loadable(Product)}</AdminRoute>,
      },
      {
        path: "category",
        element: <AdminRoute>{loadable(Category)}</AdminRoute>,
      },
      {
        path: "stock-management",
        element: <AdminRoute>{loadable(StockManagement)}</AdminRoute>,
      },
      {
        path: "admin/seller-applications",
        element: <AdminRoute>{loadable(AdminSellerApplications)}</AdminRoute>,
      },
      {
        path: "admin/shops",
        element: <AdminRoute>{loadable(AdminShops)}</AdminRoute>,
      },
      {
        path: "admin/seller-products",
        element: <AdminRoute>{loadable(AdminSellerProducts)}</AdminRoute>,
      },
      {
        path: "admin/seller-orders",
        element: <AdminRoute>{loadable(AdminSellerOrders)}</AdminRoute>,
      },
      {
        path: "admin/payouts",
        element: <AdminRoute>{loadable(AdminSellerPayouts)}</AdminRoute>,
      },
      {
        path: "admin/seller-transactions",
        element: <AdminRoute>{loadable(AdminSellerTransactions)}</AdminRoute>,
      },
      {
        path: "admin/returns",
        element: <AdminRoute>{loadable(AdminReturnRequests)}</AdminRoute>,
      },
      {
        path: "admin/marketplace",
        element: <AdminRoute>{loadable(AdminMarketplaceDashboard)}</AdminRoute>,
      },
      {
        path: "admin/seller-performance",
        element: <AdminRoute>{loadable(AdminSellerPerformance)}</AdminRoute>,
      },
      {
        path: "shipped-orders",
        element: <AdminRoute>{loadable(ShippedOrders)}</AdminRoute>,
      },
      {
        path: "admin/notifications",
        element: <AdminRoute>{loadable(AdminNotifications)}</AdminRoute>,
      },

      { path: "color", element: <AdminRoute>{loadable(Color)}</AdminRoute> },
      {
        path: "brands",
        element: <AdminRoute>{loadable(AdminBrands)}</AdminRoute>,
      },
      { path: "user", element: <AdminRoute>{loadable(User)}</AdminRoute> },
      { path: "review", element: <AdminRoute>{loadable(Review)}</AdminRoute> },
      {
        path: "invoices",
        element: <AdminRoute>{loadable(AdminInvoices)}</AdminRoute>,
      },
      {
        path: "coupon",
        element: <AdminRoute>{loadable(AdminCoupons)}</AdminRoute>,
      },
      {
        path: "flash-sale",
        element: <AdminRoute>{loadable(FlashSaleDashboard)}</AdminRoute>,
      },
      {
        path: "landing-pages",
        element: <AdminRoute>{loadable(LandingPages)}</AdminRoute>,
      },
      {
        path: "landing-pages/create",
        element: <AdminRoute>{loadable(CreateLandingPage)}</AdminRoute>,
      },
      {
        path: "landing-pages/edit/:id",
        element: <AdminRoute>{loadable(EditLandingPage)}</AdminRoute>,
      },
      {
        path: "shiping",
        element: <AdminRoute>{loadable(AdminShippingSettings)}</AdminRoute>,
      },
      {
        path: "categories",
        element: <AdminRoute>{loadable(AdminCategories)}</AdminRoute>,
      },
      {
        path: "subcategories",
        element: <AdminRoute>{loadable(AdminSubCategory)}</AdminRoute>,
      },
      {
        path: "setting-logo",
        element: <AdminRoute>{loadable(LogoSettings)}</AdminRoute>,
      },
      {
        path: "setting-section",
        element: <AdminRoute>{loadable(SettingHomeSection)}</AdminRoute>,
      },
      {
        path: "setting-header",
        element: <AdminRoute>{loadable(HeaderSectionSettings)}</AdminRoute>,
      },
      {
        path: "setting-ticker",
        element: <AdminRoute>{loadable(AdminTickerSettings)}</AdminRoute>,
      },
      {
        path: "setting-shipping",
        element: <AdminRoute>{loadable(AdminShippingSettings)}</AdminRoute>,
      },
      {
        path: "general-setting",
        element: <AdminRoute>{loadable(GeneralSetting)}</AdminRoute>,
      },
      {
        path: "confirm-orders",
        element: <AdminRoute>{loadable(ConfirmOrders)}</AdminRoute>,
      },

      {
        path: "delivery-orders",
        element: <AdminRoute>{loadable(DeliveredOrders)}</AdminRoute>,
      },
      {
        path: "cancel-orders",
        element: <AdminRoute>{loadable(CancelOrders)}</AdminRoute>,
      },
      {
        path: "sales-report",
        element: <AdminRoute>{loadable(SalesReport)}</AdminRoute>,
      },
      {
        path: "chat",
        element: <AdminRoute>{loadable(AdminChatInbox)}</AdminRoute>,
      },
      {
        path: "chatbot-questions",
        element: <AdminRoute>{loadable(AdminChatbotQuestions)}</AdminRoute>,
      },

      // ---- SELLER ONLY ----
      {
        path: "seller",
        element: <SellerRoute>{loadable(SellerDashboardHome)}</SellerRoute>,
      },
      {
        path: "seller/shop",
        element: <SellerRoute>{loadable(SellerShopProfile)}</SellerRoute>,
      },
      {
        path: "seller/products",
        element: <SellerRoute>{loadable(SellerProductList)}</SellerRoute>,
      },
      {
        path: "seller/products/add",
        element: <SellerRoute>{loadable(SellerAddProduct)}</SellerRoute>,
      },
      {
        path: "seller/products/:id/edit",
        element: <SellerRoute>{loadable(SellerEditProduct)}</SellerRoute>,
      },
      {
        path: "seller/orders",
        element: <SellerRoute>{loadable(SellerOrderList)}</SellerRoute>,
      },
      {
        path: "order/:orderId",
        element: <ShareRoute>{loadable(CustomerOrderDetails)}</ShareRoute>,
      },
      {
        path: "seller/orders/:orderId/:sellerOrderId",
        element: <SellerRoute>{loadable(SellerOrderDetails)}</SellerRoute>,
      },
      {
        path: "seller/wallet",
        element: <SellerRoute>{loadable(SellerWallet)}</SellerRoute>,
      },
      {
        path: "seller/returns",
        element: <SellerRoute>{loadable(SellerReturns)}</SellerRoute>,
      },
      {
        path: "seller/transactions",
        element: <SellerRoute>{loadable(SellerTransactions)}</SellerRoute>,
      },
      {
        path: "seller/notifications",
        element: <SellerRoute>{loadable(SellerNotifications)}</SellerRoute>,
      },
      {
        path: "order/:orderId",
        element: <ShareRoute>{loadable(CustomerOrderDetails)}</ShareRoute>,
      },
      // ---- USER & SELLER SHARED ----
      {
        path: "cart",
        element: <ShareRoute>{loadable(Cart)}</ShareRoute>,
      },
      {
        path: "profile",
        element: (
          <ShareRoute>
            <Suspense
              fallback={
                <div className="p-4 text-center text-gray-500">
                  Loading Profile...
                </div>
              }
            >
              <MyProfile />
            </Suspense>
          </ShareRoute>
        ), // 👈 প্রোফাইলের এরর দূর করার জন্য ইনলাইন সাসপেন্স দেওয়া হলো
      },
      {
        path: "order",
        element: <ShareRoute>{loadable(Order)}</ShareRoute>,
      },
      {
        path: "my-returns",
        element: <ShareRoute>{loadable(MyReturns)}</ShareRoute>,
      },
      {
        path: "/dashboard/verification",
        element: <UserRoute>{loadable(SellerVerificationForm)}</UserRoute>,
      },
      {
        path: "my-invoices",
        element: <ShareRoute>{loadable(MyInvoices)}</ShareRoute>,
      },
      {
        path: "setting",
        element: <ShareRoute>{loadable(ChangePassword)}</ShareRoute>,
      },
      {
        path: "wishlist",
        element: <ShareRoute>{loadable(Wishlist)}</ShareRoute>,
      },
    ],
  },
  {
    path: "*",
    element: loadable(ErrorPage),
  },
]);
