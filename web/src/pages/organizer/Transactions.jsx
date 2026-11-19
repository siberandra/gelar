import { useState } from "react";
import { Check, ReceiptText, X } from "lucide-react";
import api, { errorMessage } from "../../lib/api";
import useFetch from "../../hooks/useFetch";
import { useUi } from "../../context/UiContext";
import Modal from "../../components/Modal";
import PrivateImage from "../../components/PrivateImage";
import { EmptyState, ErrorBox, PageTitle, Spinner, StatusBadge } from "../../components/common";
import { formatDateTime, rupiah, timeLeft } from "../../lib/format";

const TABS = [
  ["WAITING_CONFIRMATION", "Menunggu Konfirmasi"],
  ["WAITING_PAYMENT", "Menunggu Pembayaran"],
  ["DONE", "Selesai"],
  ["REJECTED,EXPIRED,CANCELED", "Gagal"],
  ["", "Semua"],
];

function Detail({ trx, onClose, onChanged }) {
  const { toast, confirm } = useUi();
  const [busy, setBusy] = useState(false);

  async function decide(accept) {
    const ok = await confirm(
      accept
        ? { title: "Terima pembayaran ini?", message: `Status menjadi Selesai dan ${trx.user.name} akan menerima email konfirmasi.`, confirmText: "Terima" }
        : {
            title: "Tolak transaksi ini?",
            message: "Kursi, poin, voucher, dan kupon akan dikembalikan ke customer, lalu customer menerima email pemberitahuan.",
            confirmText: "Tolak",
            danger: true,
          }
    );
    if (!ok) return;
    setBusy(true);
    try {
      await api.post(`/dashboard/transactions/${trx.id}/${accept ? "accept" : "reject"}`);
      toast(accept ? "Transaksi diterima" : "Transaksi ditolak");
      onChanged();
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={trx.invoice} wide>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-slate-500">Customer</p>
            <p className="font-semibold">{trx.user.name}</p>
            <p className="text-slate-500">{trx.user.email}</p>
          </div>
          <div>
            <p className="text-slate-500">Acara</p>
            <p className="font-semibold">{trx.event.title}</p>
          </div>
          <div className="space-y-1 rounded-lg bg-slate-50 p-3">
            {trx.items.map((i) => (
              <p key={i.id} className="flex justify-between">
                <span>
                  {i.quantity} x {i.ticketType.name}
                </span>
                <span>{rupiah(i.unitPrice * i.quantity)}</span>
              </p>
            ))}
            {trx.voucherDiscount + trx.couponDiscount + trx.pointsUsed > 0 && (
              <p className="flex justify-between text-green-700">
                <span>Diskon & poin</span>
                <span>-{rupiah(trx.voucherDiscount + trx.couponDiscount + trx.pointsUsed)}</span>
              </p>
            )}
            <p className="flex justify-between border-t border-slate-200 pt-2 font-bold">
              <span>Harus dibayar</span>
              <span>{rupiah(trx.total)}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={trx.status} />
            {trx.status === "WAITING_CONFIRMATION" && <span className="text-xs text-slate-500">Batas konfirmasi: {formatDateTime(trx.confirmDeadline)}</span>}
          </div>
        </div>
        <div>
          <p className="label">Bukti bayar</p>
          {trx.proofId ? (
            <PrivateImage fileId={trx.proofId} alt="Bukti bayar" className="max-h-80 w-full rounded-lg border border-slate-200 object-contain" />
          ) : (
            <p className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">Belum ada bukti bayar</p>
          )}
        </div>
      </div>
      {trx.status === "WAITING_CONFIRMATION" && (
        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button className="btn border border-red-300 text-red-600 hover:bg-red-50" disabled={busy} onClick={() => decide(false)}>
            <X size={16} /> Tolak
          </button>
          <button className="btn-primary" disabled={busy} onClick={() => decide(true)}>
            <Check size={16} /> Terima
          </button>
        </div>
      )}
    </Modal>
  );
}

export default function Transactions() {
  const [status, setStatus] = useState("WAITING_CONFIRMATION");
  const [eventId, setEventId] = useState("");
  const [selected, setSelected] = useState(null);
  const events = useFetch("/dashboard/events");
  const { data, loading, error, reload } = useFetch("/dashboard/transactions", { status: status || undefined, eventId: eventId || undefined });

  return (
    <>
      <PageTitle title="Transaksi" subtitle="Cek bukti bayar lalu terima atau tolak" />
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="-mx-4 flex flex-1 gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {TABS.map(([value, label]) => (
            <button
              key={value}
              onClick={() => setStatus(value)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${status === value ? "bg-brand-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <select className="input w-full sm:w-64" value={eventId} onChange={(e) => setEventId(e.target.value)} aria-label="Filter acara">
          <option value="">Semua acara</option>
          {events.data?.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </select>
      </div>

      {loading && <Spinner />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!loading && data?.length === 0 && <EmptyState icon={ReceiptText} title="Tidak ada transaksi" message="Belum ada transaksi dengan status ini." />}
      {!loading && data?.length > 0 && (
        <div className="space-y-3 md:hidden">
          {data.map((t) => (
            <button key={t.id} onClick={() => setSelected(t)} className="card block w-full p-4 text-left">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold">{t.user.name}</p>
                  <p className="truncate text-xs text-slate-500">{t.event.title}</p>
                </div>
                <StatusBadge status={t.status} />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-slate-500">{t.items.reduce((s, i) => s + i.quantity, 0)} tiket</span>
                <span className="font-bold">{rupiah(t.total)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {!loading && data?.length > 0 && (
        <div className="card hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Acara</th>
                <th className="px-4 py-3 font-medium">Tiket</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{t.user.name}</p>
                    <p className="text-xs text-slate-400">{t.invoice}</p>
                  </td>
                  <td className="max-w-56 truncate px-4 py-3">{t.event.title}</td>
                  <td className="px-4 py-3">{t.items.reduce((s, i) => s + i.quantity, 0)}</td>
                  <td className="px-4 py-3 font-semibold">{rupiah(t.total)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} />
                    {t.status === "WAITING_CONFIRMATION" && <p className="mt-1 text-xs text-slate-500">Sisa {timeLeft(new Date(t.confirmDeadline) - Date.now())}</p>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="btn-outline py-1.5" onClick={() => setSelected(t)}>
                      Lihat
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <Detail
          trx={selected}
          onClose={() => setSelected(null)}
          onChanged={() => {
            setSelected(null);
            reload();
          }}
        />
      )}
    </>
  );
}
