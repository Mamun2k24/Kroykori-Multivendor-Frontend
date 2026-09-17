// src/hooks/useLogout.js

import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useUser } from "./userContext";

const useLogout = () => {
  const navigate = useNavigate();

  const { user, clearUser } = useUser();

  const handleLogout = async () => {
    try {
      const role = user?.role;

      const response = await fetch(
        `${import.meta.env.VITE_APP_SERVER_URL}api/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      // Backend success/fail যাই হোক local auth clear করবো
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      clearUser();

      toast.success("Logout successful");

      if (role === "admin" || role === "superadmin") {
        navigate("/admin-login", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    } catch (error) {
      console.error("Logout error:", error);

      // Network error হলেও logout করে দিবো
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      clearUser();

      toast.success("Logout successful");

      if (user?.role === "admin" || user?.role === "superadmin") {
        navigate("/admin-login", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    }
  };

  return { handleLogout };
};

export default useLogout;