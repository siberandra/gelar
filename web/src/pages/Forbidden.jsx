import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Forbidden() {
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <ShieldAlert size={56} className="mx-auto text-amber-500" />
      <h1 className="mt-4 text-xl font-bold">Kamu tidak punya akses ke halaman ini</h1>
      <p className="mt-2 text-sm text-slate-500">Halaman ini khusus untuk {user?.role === "ORGANIZER" ? "customer" : "organizer"}.</p>
      <Link to={user?.role === "ORGANIZER" ? "/organizer" : "/"} className="btn-primary mt-6">
        Kembali
      </Link>
    </div>
  );
}
