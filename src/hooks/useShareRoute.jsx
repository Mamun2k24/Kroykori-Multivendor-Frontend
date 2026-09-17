import { Navigate } from "react-router-dom";
import { useUser } from "./userContext";

export const ShareRoute = ({ children }) => {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Allow all authenticated roles
  if (
    ["user", "admin", "superadmin", "seller"].includes(user.role)
  ) {
    return children;
  }

  return <Navigate to="/" replace />;
};