import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, Ticket } from "lucide-react";
import api, { errorMessage } from "../../lib/api";
import useFetch from "../../hooks/useFetch";
import { useUi } from "../../context/UiContext";
import Modal from "../../components/Modal";
import { EventImage } from "../../components/EventCard";
import { EmptyState, ErrorBox, PageTitle, Spinner, StatusBadge } from "../../components/common";
import { formatDate, rupiah, timeLeft } from "../../lib/format";

const TABS = [
  ["", "Semua"],
  ["WAITING_PAYMENT", "Menunggu Pembayaran"],
  ["WAITING_CONFIRMATION", "Menunggu Konfirmasi"],
  ["DONE", "Selesai"],
  ["CANCELED,EXPIRED,REJECTED", "Dibatalkan / Ditolak"],
];

function ReviewDialog({ trx, onClose, onDone }) {
  const { toast } = useUi();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await api.post(`/events/${trx.event.id}/reviews`, { rating, comment });
      toast("Terima kasih atas ulasanmu!");
      onDone();
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Beri Ulasan">
      <p className="text-sm text-slate-600">{trx.event.title}</p>
      <div className="mt-4 flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)} aria-label={`${n} bintang`}>
            <Star size={36} className={n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
          </button>
        ))}
      </div>
      <textarea className="input mt-4 min-h-28" placeholder="Ceritakan pengalamanmu" value={comment} onChange={(e) => setComment(e.target.value)} />
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn-outline" onClick={onClose}>
          Batal
        </button>
        <button className="btn-primary" disabled={!rating || comment.trim().length < 5 || busy} onClick={submit}>
          Kirim Ulasan
        </button>
      </div>
    </Modal>
  );
}

export default function MyTickets() {
  const [tab, setTab] = useState("");
  const [reviewing, setReviewing] = useState(null);
  const { data, loading, error, reload } = useFetch("/transactions", tab ? { status: tab } : undefined);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageTitle title="Tiket Saya" />
      <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1">
        {TABS.map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${tab === value ? "bg-brand-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <Spinner />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!loading && data?.length === 0 && (
        <EmptyState
          icon={Ticket}
          title="Belum ada transaksi"
          message="Tiket yang kamu beli akan muncul di sini."
          action={
            <Link to="/events" className="btn-primary">
              Jelajah acara
            </Link>
          }
        />
      )}

      <div className="space-y-4">
        {!loading &&
          data?.map((t) => {
            const quantity = t.items.reduce((s, i) => s + i.quantity, 0);
            const ended = new Date(t.event.endDate) < new Date();
            return (
              <div key={t.id} className="card flex flex-col gap-4 p-4 sm:flex-row">
                <EventImage event={t.event} className="h-32 w-full shrink-0 rounded-lg sm:h-24 sm:w-36" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="font-semibold">{t.event.title}</h2>
                      <p className="text-sm text-slate-500">
                        {formatDate(t.event.startDate)} · {quantity} tiket · {rupiah(t.total)}
                      </p>
                      <p className="text-xs text-slate-400">{t.invoice}</p>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {t.status === "WAITING_PAYMENT" && (
                      <>
                        <Link to={`/transactions/${t.id}`} className="btn-primary py-2">
                          Bayar
                        </Link>
                        <span className="text-xs text-amber-700">Sisa {timeLeft(new Date(t.paymentDeadline) - Date.now())}</span>
                      </>
                    )}
                    {t.canReview && (
                      <button className="btn bg-amber-500 py-2 text-white hover:bg-amber-600" onClick={() => setReviewing(t)}>
                        Beri Ulasan
                      </button>
                    )}
                    {t.status === "DONE" && ended && !t.canReview && <span className="text-xs text-slate-500">Ulasan sudah dikirim</span>}
                    {t.status !== "WAITING_PAYMENT" && (
                      <Link to={`/transactions/${t.id}`} className="btn-outline py-2">
                        Lihat Detail
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {reviewing && (
        <ReviewDialog
          trx={reviewing}
          onClose={() => setReviewing(null)}
          onDone={() => {
            setReviewing(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
