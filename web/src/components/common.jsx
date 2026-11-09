import { Link } from "react-router-dom";
import { Loader2, SearchX, Star } from "lucide-react";
import { STATUS } from "../lib/format";
import { fileUrl } from "../lib/api";

export function Spinner({ label = "Memuat..." }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
      <Loader2 className="animate-spin" size={18} /> {label}
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="card p-6 text-center">
      <p className="text-sm text-red-600">{message}</p>
      {onRetry && (
        <button className="btn-outline mt-3" onClick={onRetry}>
          Coba lagi
        </button>
      )}
    </div>
  );
}

// Ditampilkan saat daftar kosong, misalnya hasil filter/pencarian tidak ada
export function EmptyState({ title, message, action, icon: Icon = SearchX }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <div className="mb-4 rounded-full bg-brand-50 p-4 text-brand-700">
        <Icon size={28} />
      </div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function StatusBadge({ status }) {
  const s = STATUS[status];
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${s.className}`}>{s.label}</span>;
}

export function Avatar({ name = "", fileId, size = 36 }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  if (fileId) {
    return <img src={fileUrl(fileId)} alt={name} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-800"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}

export function Stars({ value, size = 16 }) {
  return (
    <span className="inline-flex" aria-label={`${value} dari 5 bintang`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
      ))}
    </span>
  );
}

export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <button className="btn-outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Sebelumnya
      </button>
      <span className="px-3 text-sm text-slate-600">
        {page} / {totalPages}
      </span>
      <button className="btn-outline" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Berikutnya
      </button>
    </div>
  );
}

export function PageTitle({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Field({ label, error, hint, children }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function TextLink({ to, children }) {
  return (
    <Link to={to} className="font-semibold text-brand-700 hover:underline">
      {children}
    </Link>
  );
}
