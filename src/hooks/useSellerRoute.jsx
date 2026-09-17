import {
  Navigate,
  useLocation,
} from "react-router-dom";

import { useUser } from "./userContext";

export const SellerRoute = ({
  children,
}) => {
  const location = useLocation();

  const {
    loading,
    isAuthenticated,
    isApprovedSeller,
  } = useUser();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />

          <p className="mt-3 text-sm text-slate-500">
            Checking seller access...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  if (!isApprovedSeller) {
    return (
      <Navigate
        to="/dashboard/seller-application"
        replace
      />
    );
  }

  return children;
};