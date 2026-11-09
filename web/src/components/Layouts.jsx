import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { CalendarRange, LayoutDashboard, LogOut, Menu, ReceiptText, Settings, TicketPercent, X } from "lucide-react";
import Navbar, { Logo } from "./Navbar";
import { Avatar } from "./common";
import { useAuth } from "../context/AuthContext";

function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <Logo />
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link to="/events" className="hover:text-brand-700">
            Jelajah Acara
          </Link>
          <Link to="/register" className="hover:text-brand-700">
            Jadi Organizer
          </Link>
        </div>
        <p>© {new Date().getFullYear()} Gelar</p>
      </div>
    </footer>
  );
}

// Layout halaman publik dan customer: navbar di atas, footer di bawah
export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

const MENU = [
  { to: "/organizer", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/organizer/events", icon: CalendarRange, label: "Acara Saya" },
  { to: "/organizer/transactions", icon: ReceiptText, label: "Transaksi" },
  { to: "/organizer/vouchers", icon: TicketPercent, label: "Voucher" },
  { to: "/organizer/settings", icon: Settings, label: "Pengaturan" },
];

// Layout organizer: sidebar di kiri (desktop), menu hamburger (HP)
export function OrganizerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="space-y-1">
      {MENU.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              isActive ? "bg-brand-50 text-brand-800" : "text-slate-600 hover:bg-slate-100"
            }`
          }
        >
          <Icon size={18} /> {label}
        </NavLink>
      ))}
    </nav>
  );

  const profile = (
    <div className="flex items-center gap-3 border-t border-slate-200 pt-4">
      <Avatar name={user.name} fileId={user.avatarId} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{user.name}</p>
        <Link to={`/organizers/${user.id}`} className="text-xs text-brand-700 hover:underline">
          Lihat profil publik
        </Link>
      </div>
      <button
        className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
        aria-label="Keluar"
        onClick={() => {
          logout();
          navigate("/");
        }}
      >
        <LogOut size={18} />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-slate-200 bg-white p-5 lg:sticky lg:top-0 lg:flex lg:h-screen">
        <div className="space-y-8">
          <Logo />
          {nav}
        </div>
        {profile}
      </aside>

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <Logo />
        <button className="rounded-lg p-2 hover:bg-slate-100" onClick={() => setOpen(!open)} aria-label="Buka menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>
      {open && (
        <div className="space-y-4 border-b border-slate-200 bg-white p-4 lg:hidden">
          {nav}
          {profile}
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
