import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Gift, LayoutDashboard, LogOut, Menu, Search, Settings, Ticket, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Avatar } from "./common";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-brand-800">
      <img src="/favicon.svg" alt="" className="h-8 w-8" />
      Gelar
    </Link>
  );
}

function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const links =
    user.role === "ORGANIZER"
      ? [{ to: "/organizer", icon: LayoutDashboard, label: "Dashboard" }]
      : [
          { to: "/my-tickets", icon: Ticket, label: "Tiket Saya" },
          { to: "/rewards", icon: Gift, label: "Poin & Kupon" },
        ];

  return (
    <div className="relative" ref={ref}>
      <button className="flex items-center gap-2 rounded-full p-1 hover:bg-slate-100" onClick={() => setOpen(!open)} aria-label="Menu akun">
        <Avatar name={user.name} fileId={user.avatarId} size={34} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-lg" onClick={() => setOpen(false)}>
          <div className="border-b border-slate-100 px-4 pb-2">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-slate-500">{user.role === "ORGANIZER" ? "Organizer" : "Customer"}</p>
          </div>
          {[...links, { to: user.role === "ORGANIZER" ? "/organizer/settings" : "/settings", icon: Settings, label: "Pengaturan Akun" }].map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50">
              <Icon size={16} /> {label}
            </Link>
          ))}
          <button onClick={onLogout} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
            <LogOut size={16} /> Keluar
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  function submit(e) {
    e.preventDefault();
    navigate(`/events?search=${encodeURIComponent(search.trim())}`);
    setMobileOpen(false);
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  const searchForm = (
    <form onSubmit={submit} className="relative w-full">
      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input className="input pl-10" placeholder="Cari konser, seminar, workshop..." value={search} onChange={(e) => setSearch(e.target.value)} />
    </form>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Logo />
        <div className="hidden flex-1 md:block md:max-w-md lg:ml-6">{searchForm}</div>
        <nav className="ml-auto hidden items-center gap-2 md:flex">
          <NavLink to="/events" className="btn-ghost">
            Jelajah
          </NavLink>
          {user ? (
            <UserMenu user={user} onLogout={handleLogout} />
          ) : (
            <>
              <Link to="/login" className="btn-outline">
                Masuk
              </Link>
              <Link to="/register" className="btn-primary">
                Daftar
              </Link>
            </>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-1 md:hidden">
          {user && <UserMenu user={user} onLogout={handleLogout} />}
          <button className="rounded-lg p-2 hover:bg-slate-100" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Buka menu">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="space-y-3 border-t border-slate-200 px-4 py-4 md:hidden">
          {searchForm}
          <Link to="/events" className="btn-outline w-full" onClick={() => setMobileOpen(false)}>
            Jelajah Acara
          </Link>
          {!user && (
            <div className="grid grid-cols-2 gap-2">
              <Link to="/login" className="btn-outline" onClick={() => setMobileOpen(false)}>
                Masuk
              </Link>
              <Link to="/register" className="btn-primary" onClick={() => setMobileOpen(false)}>
                Daftar
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
