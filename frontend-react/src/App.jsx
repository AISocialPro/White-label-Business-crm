import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { AdminPanelPage } from "./pages/AdminPanelPage";
import { DashboardPage } from "./pages/DashboardPage";

const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
};

const SuperAdminRoute = ({ children }) => {
  const { user } = useAuth();
  return user?.isSuperAdmin ? children : <Navigate to="/" replace />;
};

const HomePage = () => {
  const { user } = useAuth();
  return user?.isSuperAdmin ? <AdminPanelPage /> : <DashboardPage />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <HomePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/super-admin"
        element={
          <PrivateRoute>
            <SuperAdminRoute>
              <AdminPanelPage />
            </SuperAdminRoute>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}