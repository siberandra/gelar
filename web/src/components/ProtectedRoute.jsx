import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "./common";
import Forbidden from "../pages/Forbidden";

// Halaman di dalamnya hanya bisa dibuka user yang login dengan peran tertentu.
// Belum login -> ke /login (lalu kembali ke halaman ini setelah login).
// Peran salah -> halaman "tidak punya akses".
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (roles && !roles.includes(user.role)) return <Forbidden />;
  return <Outlet />;
}

// Halaman login/daftar tidak perlu dibuka lagi kalau sudah login
export function GuestOnly() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user) return <Navigate to={user.role === "ORGANIZER" ? "/organizer" : "/"} replace />;
  return <Outlet />;
}
