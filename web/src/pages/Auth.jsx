import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { CalendarHeart, Eye, EyeOff, Ticket } from "lucide-react";
import api, { errorMessage } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useUi } from "../context/UiContext";
import { Field, TextLink } from "../components/common";
import DemoAccounts from "../components/DemoAccounts";

function AuthShell({ title, subtitle, children }) {
  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-10 md:grid-cols-2 md:py-16">
      <div className="hidden flex-col justify-center rounded-2xl bg-gradient-to-br from-brand-800 to-teal-500 p-10 text-white md:flex">
        <CalendarHeart size={44} />
        <h2 className="mt-6 text-3xl font-extrabold leading-tight">Satu tempat untuk semua acara serumu</h2>
        <p className="mt-3 text-brand-50/90">Temukan acara, beli tiket, kumpulkan poin dari ajak teman.</p>
      </div>
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder = "Minimal 8 karakter", id }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input id={id} type={show ? "text" : "password"} className="input pr-10" value={value} onChange={onChange} placeholder={placeholder} required />
      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" onClick={() => setShow(!show)} aria-label={show ? "Sembunyikan password" : "Tampilkan password"}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

function Alert({ children, type = "error" }) {
  const style = type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-800";
  return <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${style}`} role="alert">{children}</div>;
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = await login(form.email, form.password);
      // Kembali ke halaman sebelumnya (misal checkout) jika ada
      const { from, checkout } = location.state || {};
      if (checkout && user.role === "CUSTOMER") navigate("/checkout", { state: checkout, replace: true });
      else if (from) navigate(from, { replace: true });
      else navigate(user.role === "ORGANIZER" ? "/organizer" : "/", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Masuk" subtitle="Selamat datang kembali di Gelar">
      {error && <Alert>{error}</Alert>}
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="nama@email.com" />
        </Field>
        <Field label="Password">
          <PasswordInput value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" />
        </Field>
        <div className="text-right text-sm">
          <TextLink to="/forgot-password">Lupa password?</TextLink>
        </div>
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "Memproses..." : "Masuk"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Belum punya akun? <TextLink to="/register">Daftar</TextLink>
      </p>
      <div className="mt-6">
        <DemoAccounts compact />
      </div>
    </AuthShell>
  );
}

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    role: params.get("role") === "ORGANIZER" ? "ORGANIZER" : "CUSTOMER",
    referralCode: params.get("ref") || "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) return setError("Konfirmasi password tidak sama");
    setBusy(true);
    setError("");
    try {
      const data = { ...form };
      delete data.confirm;
      if (data.role !== "CUSTOMER" || !data.referralCode) delete data.referralCode;
      const user = await register(data);
      navigate(user.role === "ORGANIZER" ? "/organizer" : "/", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const roles = [
    { value: "CUSTOMER", icon: Ticket, title: "Saya ingin membeli tiket", text: "Customer" },
    { value: "ORGANIZER", icon: CalendarHeart, title: "Saya ingin membuat acara", text: "Organizer" },
  ];

  return (
    <AuthShell title="Buat akun" subtitle="Gratis, hanya butuh satu menit">
      {error && <Alert>{error}</Alert>}
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {roles.map(({ value, icon: Icon, title, text }) => (
            <button
              type="button"
              key={value}
              onClick={() => setForm({ ...form, role: value })}
              className={`rounded-xl border-2 p-3 text-left transition ${form.role === value ? "border-brand-700 bg-brand-50" : "border-slate-200 hover:border-slate-300"}`}
            >
              <Icon size={20} className="text-brand-700" />
              <p className="mt-2 text-sm font-semibold leading-snug">{title}</p>
              <p className="text-xs text-slate-500">{text}</p>
            </button>
          ))}
        </div>
        <Field label={form.role === "ORGANIZER" ? "Nama organizer / komunitas" : "Nama lengkap"}>
          <input className="input" value={form.name} onChange={set("name")} required minLength={2} />
        </Field>
        <Field label="Email">
          <input type="email" className="input" value={form.email} onChange={set("email")} required placeholder="nama@email.com" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password">
            <PasswordInput value={form.password} onChange={set("password")} />
          </Field>
          <Field label="Konfirmasi password">
            <PasswordInput value={form.confirm} onChange={set("confirm")} placeholder="Ulangi password" />
          </Field>
        </div>
        {form.role === "CUSTOMER" && (
          <Field label="Kode referral (opsional)" hint="Dapatkan kupon diskon 10% dengan kode referral teman">
            <input className="input uppercase" value={form.referralCode} onChange={set("referralCode")} placeholder="Contoh: BUDI2026" />
          </Field>
        )}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "Memproses..." : "Daftar"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Sudah punya akun? <TextLink to="/login">Masuk</TextLink>
      </p>
    </AuthShell>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setSent(res.data.message);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Lupa password" subtitle="Kami kirim link untuk membuat password baru ke emailmu">
      {error && <Alert>{error}</Alert>}
      {sent ? (
        <Alert type="success">{sent}. Cek kotak masuk (dan folder spam) kamu.</Alert>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email">
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="nama@email.com" />
          </Field>
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "Mengirim..." : "Kirim link reset"}
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm">
        <TextLink to="/login">Kembali ke halaman masuk</TextLink>
      </p>
    </AuthShell>
  );
}

export function ResetPassword() {
  const [params] = useSearchParams();
  const { toast } = useUi();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const token = params.get("token");

  async function submit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) return setError("Konfirmasi password tidak sama");
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/auth/reset-password", { token, password: form.password });
      toast(res.data.message);
      navigate("/login", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <AuthShell title="Link tidak valid">
        <p className="text-sm text-slate-600">Link reset tidak lengkap. Minta link baru dari halaman lupa password.</p>
        <Link to="/forgot-password" className="btn-primary mt-4 w-full">
          Minta link baru
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Buat password baru">
      {error && (
        <Alert>
          {error}. <TextLink to="/forgot-password">Minta link baru</TextLink>
        </Alert>
      )}
      <form onSubmit={submit} className="space-y-4">
        <Field label="Password baru">
          <PasswordInput value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <Field label="Konfirmasi password">
          <PasswordInput value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} placeholder="Ulangi password" />
        </Field>
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "Menyimpan..." : "Simpan password"}
        </button>
      </form>
    </AuthShell>
  );
}
