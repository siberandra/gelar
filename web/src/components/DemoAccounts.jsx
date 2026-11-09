import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarHeart, KeyRound, Ticket } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useUi } from "../context/UiContext";
import { errorMessage } from "../lib/api";

// Akun contoh dari data seed, supaya penguji bisa langsung mencoba tiap peran
export const DEMO_PASSWORD = "password123";
const ACCOUNTS = [
  {
    email: "budi@gelar.id",
    role: "Customer",
    name: "Budi Santoso",
    icon: Ticket,
    points: ["Punya 30.000 poin dari referral", "Ada tiket menunggu pembayaran", "Bisa memberi ulasan acara yang sudah lewat"],
  },
  {
    email: "soundwave@gelar.id",
    role: "Organizer",
    name: "Soundwave Production",
    icon: CalendarHeart,
    points: ["Dashboard & grafik penjualan", "Transaksi menunggu konfirmasi", "Kelola acara dan voucher"],
  },
];

export default function DemoAccounts({ compact = false }) {
  const { login } = useAuth();
  const { toast } = useUi();
  const navigate = useNavigate();
  const [busy, setBusy] = useState("");

  async function enter(email) {
    setBusy(email);
    try {
      const user = await login(email, DEMO_PASSWORD);
      toast(`Masuk sebagai ${user.name}`);
      navigate(user.role === "ORGANIZER" ? "/organizer" : "/my-tickets");
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy("");
    }
  }

  if (compact) {
    return (
      <div className="rounded-xl border border-dashed border-brand-500 bg-brand-50 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-brand-800">
          <KeyRound size={16} /> Akun demo (password: {DEMO_PASSWORD})
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {ACCOUNTS.map((a) => (
            <button key={a.email} type="button" className="btn-outline py-2 text-xs" disabled={Boolean(busy)} onClick={() => enter(a.email)}>
              Masuk sebagai {a.role}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {ACCOUNTS.map(({ email, role, name, icon: Icon, points }) => (
        <div key={email} className="card flex flex-col p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-brand-50 p-3 text-brand-700">
              <Icon size={22} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">{role}</p>
              <p className="font-bold">{name}</p>
            </div>
          </div>
          <ul className="mt-4 flex-1 space-y-1.5 text-sm text-slate-600">
            {points.map((p) => (
              <li key={p} className="flex gap-2">
                <span className="text-brand-600">✓</span> {p}
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600">
            {email} · {DEMO_PASSWORD}
          </p>
          <button className="btn-primary mt-3" disabled={Boolean(busy)} onClick={() => enter(email)}>
            {busy === email ? "Masuk..." : `Masuk sebagai ${role} →`}
          </button>
        </div>
      ))}
    </div>
  );
}
