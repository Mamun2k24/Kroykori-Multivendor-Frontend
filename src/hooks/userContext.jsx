// src/hooks/userContext.jsx

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const UserContext = createContext(null);

const API_URL = String(
  import.meta.env.VITE_APP_SERVER_URL || "",
).replace(/\/+$/, "");

const normalizeUser = (userData) => {
  if (!userData) return null;

  const id =
    userData.id ||
    userData._id ||
    userData.userId;

  return {
    ...userData,
    id,
    role: String(
      userData.role || "user",
    ).toLowerCase(),

    sellerStatus: String(
      userData.sellerStatus || "none",
    ).toLowerCase(),
  };
};

const getStoredUser = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw =
      localStorage.getItem("user");

    return normalizeUser(
      raw ? JSON.parse(raw) : null,
    );
  } catch {
    localStorage.removeItem("user");
    return null;
  }
};

export const UserProvider = ({
  children,
}) => {
  const [user, setUser] = useState(
    getStoredUser,
  );

  const [loading, setLoading] =
    useState(true);

  const updateUser = useCallback(
    (userData) => {
      const normalized =
        normalizeUser(userData);

      setUser(normalized);

      if (normalized) {
        localStorage.setItem(
          "user",
          JSON.stringify(normalized),
        );
      } else {
        localStorage.removeItem("user");
      }
    },
    [],
  );

  const setAuth = useCallback(
    ({ token, user: userData }) => {
      if (token) {
        localStorage.setItem(
          "token",
          token,
        );
      }

      updateUser(userData);
    },
    [updateUser],
  );

  const clearUser = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
  }, []);

  const refreshUser = useCallback(
    async () => {
      const token =
        localStorage.getItem("token");

      if (!token) {
        setUser(null);
        setLoading(false);
        return null;
      }

      try {
        setLoading(true);

        const response = await fetch(
          `${API_URL}/api/users/profile`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          /*
           * Invalid/expired token হলে
           * সম্পূর্ণ auth clear হবে।
           */
          if (
            response.status === 401 ||
            response.status === 403
          ) {
            clearUser();
          }

          return null;
        }

        const data =
          await response.json();

        const freshUser =
          data?.user || data;

        if (!freshUser) {
          clearUser();
          return null;
        }

        updateUser(freshUser);
        return normalizeUser(freshUser);
      } catch (error) {
        /*
         * Temporary network error হলে cached
         * user logout করা হবে না।
         */
        console.error(
          "refreshUser failed:",
          error,
        );

        return null;
      } finally {
        setLoading(false);
      }
    },
    [clearUser, updateUser],
  );

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // অন্য browser tab-এ login/logout sync
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === "user") {
        try {
          const nextUser =
            event.newValue
              ? JSON.parse(
                  event.newValue,
                )
              : null;

          setUser(
            normalizeUser(nextUser),
          );
        } catch {
          setUser(null);
        }
      }

      if (
        event.key === "token" &&
        !event.newValue
      ) {
        setUser(null);
      }
    };

    window.addEventListener(
      "storage",
      handleStorage,
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage,
      );
    };
  }, []);

  const role = user?.role || null;

  const sellerStatus =
    user?.sellerStatus || "none";

  const isAuthenticated =
    Boolean(
      user &&
      localStorage.getItem("token"),
    );

  const isAdmin =
    role === "admin" ||
    role === "superadmin";

  const isSuperAdmin =
    role === "superadmin";

  const isSeller =
    role === "seller";

  const isApprovedSeller =
    isSeller &&
    sellerStatus === "approved";

  const canManageProducts =
    isAdmin || isApprovedSeller;

  const canAccessSellerDashboard =
    isApprovedSeller;

  const hasSellerApplication =
    sellerStatus !== "none";

  const value = useMemo(
    () => ({
      user,
      role,
      sellerStatus,
      loading,

      isAuthenticated,
      isAdmin,
      isSuperAdmin,
      isSeller,
      isApprovedSeller,

      canManageProducts,
      canAccessSellerDashboard,
      hasSellerApplication,

      updateUser,
      setAuth,
      clearUser,
      refreshUser,
    }),
    [
      user,
      role,
      sellerStatus,
      loading,
      isAuthenticated,
      isAdmin,
      isSuperAdmin,
      isSeller,
      isApprovedSeller,
      canManageProducts,
      canAccessSellerDashboard,
      hasSellerApplication,
      updateUser,
      setAuth,
      clearUser,
      refreshUser,
    ],
  );

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error(
      "useUser must be used inside UserProvider",
    );
  }

  return context;
};