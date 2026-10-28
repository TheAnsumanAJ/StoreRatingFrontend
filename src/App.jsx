import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import OwnerDashboard from "./pages/OwnerDashboard";

function getRolePath(role) {
  const paths = {
    SYSTEM_ADMIN: "/admin",
    NORMAL_USER: "/user",
    STORE_OWNER: "/owner",
  };

  return paths[role] || "/login";
}

function ProtectedRoute({ allowedRoles, children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user || !localStorage.getItem("token")) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={getRolePath(user.role)} replace />;
  }

  return children;
}

function LoginRoute() {
  const { user } = useAuth();

  if (user && localStorage.getItem("token")) {
    return <Navigate to={getRolePath(user.role)} replace />;
  }

  return <Login />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<LoginRoute />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["SYSTEM_ADMIN"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

       

      <Route
        path="/user"
        element={
          <ProtectedRoute allowedRoles={["NORMAL_USER"]}>
            <UserDashboard />
          </ProtectedRoute>
        }
      />



      <Route
        path="/owner"
        element={
          <ProtectedRoute allowedRoles={["STORE_OWNER"]}>
            <OwnerDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


export default App;
