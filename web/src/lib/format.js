const TZ = "Asia/Jakarta";

export function rupiah(value) {
  return "Rp " + Number(value || 0).toLocaleString("id-ID");
}

export function priceLabel(value) {
  return value === 0 ? "Gratis" : rupiah(value);
}

export function formatDate(value) {
  return new Date(value).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TZ,
  });
}

export function formatTime(value) {
  return new Date(value).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
}

export function formatDateTime(value) {
  return `${formatDate(value)} · ${formatTime(value)}`;
}

export function toInputDateTime(value) {
  const d = new Date(value);
  const local = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function fromInputDateTime(value) {
  return value ? new Date(`${value}:00+07:00`).toISOString() : "";
}

export function timeLeft(ms) {
  if (ms <= 0) return "Waktu habis";
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (days > 0) return `${days} hari ${hours} jam`;
  if (hours > 0) return `${hours} jam ${minutes} menit`;
  return `${minutes} menit`;
}

export const STATUS = {
  WAITING_PAYMENT: { label: "Menunggu Pembayaran", className: "bg-amber-100 text-amber-800" },
  WAITING_CONFIRMATION: { label: "Menunggu Konfirmasi", className: "bg-blue-100 text-blue-800" },
  DONE: { label: "Selesai", className: "bg-green-100 text-green-800" },
  REJECTED: { label: "Ditolak", className: "bg-red-100 text-red-700" },
  EXPIRED: { label: "Kedaluwarsa", className: "bg-slate-100 text-slate-600" },
  CANCELED: { label: "Dibatalkan", className: "border border-slate-300 text-slate-600" },
};
