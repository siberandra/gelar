import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CalendarDays, Clock, MapPin, Minus, Plus, TicketPercent } from "lucide-react";
import useFetch from "../hooks/useFetch";
import { useAuth } from "../context/AuthContext";
import { useUi } from "../context/UiContext";
import { EventImage } from "../components/EventCard";
import { Avatar, EmptyState, ErrorBox, Spinner, Stars } from "../components/common";
import { formatDate, formatTime, priceLabel, rupiah } from "../lib/format";

const MAX_TICKETS = 10;

export default function EventDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { toast } = useUi();
  const navigate = useNavigate();
  const { data: event, loading, error } = useFetch(`/events/${slug}`);
  const [qty, setQty] = useState({});

  if (loading) return <Spinner />;
  if (error) return <div className="mx-auto max-w-3xl px-4 py-16"><ErrorBox message={error} /></div>;

  const total = Object.values(qty).reduce((s, n) => s + n, 0);
  const subtotal = event.ticketTypes.reduce((s, t) => s + t.price * (qty[t.id] || 0), 0);
  const started = new Date(event.startDate) <= new Date();

  function change(ticket, delta) {
    const next = (qty[ticket.id] || 0) + delta;
    if (next < 0 || next > ticket.available) return;
    if (delta > 0 && total >= MAX_TICKETS) return toast(`Maksimal ${MAX_TICKETS} tiket per transaksi`, "error");
    setQty({ ...qty, [ticket.id]: next });
  }

  function buy() {
    const items = Object.entries(qty)
      .filter(([, n]) => n > 0)
      .map(([ticketTypeId, quantity]) => ({ ticketTypeId: Number(ticketTypeId), quantity }));
    const target = { pathname: "/checkout", state: { slug, items } };
    if (!user) return navigate("/login", { state: { from: `/events/${slug}`, checkout: target.state } });
    if (user.role !== "CUSTOMER") return toast("Organizer tidak bisa membeli tiket", "error");
    navigate(target.pathname, { state: target.state });
  }

  const ticketPicker = (
    <div className="card p-5">
      <h2 className="font-bold text-slate-900">Pilih Tiket</h2>
      <div className="mt-4 space-y-3">
        {event.ticketTypes.map((t) => {
          const soldOut = t.available === 0;
          return (
            <div key={t.id} className={`rounded-lg border p-3 ${soldOut ? "border-slate-200 bg-slate-50" : "border-slate-200"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-sm font-bold text-amber-600">{priceLabel(t.price)}</p>
                  <p className="text-xs text-slate-500">{soldOut ? "Habis" : `Sisa ${t.available} kursi`}</p>
                </div>
                {soldOut || started ? (
                  <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">{soldOut ? "Habis" : "Ditutup"}</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <button className="rounded-lg border border-slate-300 p-1.5 disabled:opacity-40" onClick={() => change(t, -1)} disabled={!qty[t.id]} aria-label={`Kurangi ${t.name}`}>
                      <Minus size={14} />
                    </button>
                    <span className="w-5 text-center text-sm font-semibold">{qty[t.id] || 0}</span>
                    <button className="rounded-lg border border-slate-300 p-1.5" onClick={() => change(t, 1)} aria-label={`Tambah ${t.name}`}>
                      <Plus size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-sm text-slate-500">{total} tiket</span>
        <span className="text-lg font-bold">{rupiah(subtotal)}</span>
      </div>
      <button className="btn-primary mt-4 w-full" disabled={total === 0} onClick={buy}>
        Beli Tiket
      </button>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="aspect-video overflow-hidden rounded-2xl sm:aspect-[21/9] lg:aspect-[3/1]">
        <EventImage event={event} className="h-full w-full" />
      </div>

      <div className="mt-8 gap-10 lg:flex">
        <div className="min-w-0 flex-1">
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{event.category.name}</span>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-900 sm:text-3xl">{event.title}</h1>

          <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <p className="flex items-center gap-2">
              <CalendarDays size={18} className="text-brand-700" /> {formatDate(event.startDate)}
            </p>
            <p className="flex items-center gap-2">
              <Clock size={18} className="text-brand-700" /> {formatTime(event.startDate)} – {formatTime(event.endDate)} WIB
            </p>
            <p className="flex items-center gap-2 sm:col-span-2">
              <MapPin size={18} className="text-brand-700" /> {event.venue}, {event.city}
            </p>
          </div>

          <Link to={`/organizers/${event.organizer.id}`} className="card mt-6 flex items-center gap-3 p-4 hover:border-brand-500">
            <Avatar name={event.organizer.name} fileId={event.organizer.avatarId} size={44} />
            <div>
              <p className="text-xs text-slate-500">Diselenggarakan oleh</p>
              <p className="font-semibold">{event.organizer.name}</p>
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <Stars value={event.organizerRating} size={12} /> {event.organizerRating || "-"} ({event.organizerReviewCount} ulasan)
              </p>
            </div>
          </Link>

          {event.promos.length > 0 && (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="flex items-center gap-2 font-semibold text-amber-800">
                <TicketPercent size={18} /> Promo untuk acara ini
              </p>
              <ul className="mt-2 space-y-1 text-sm text-amber-900">
                {event.promos.map((p) => (
                  <li key={p.code}>
                    Pakai kode <span className="rounded bg-white px-1.5 py-0.5 font-mono font-bold">{p.code}</span> potongan {rupiah(p.discount)}, berlaku s.d.{" "}
                    {formatDate(p.endDate)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <section className="mt-8">
            <h2 className="text-lg font-bold">Deskripsi</h2>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-slate-600">{event.description}</p>
          </section>

          {/* Pemilih tiket di HP tampil di sini; di desktop di kolom kanan */}
          <div className="mt-8 lg:hidden">{ticketPicker}</div>

          <section className="mt-10">
            <h2 className="text-lg font-bold">Ulasan ({event.reviews.length})</h2>
            {event.reviews.length === 0 ? (
              <div className="mt-3">
                <EmptyState title="Belum ada ulasan" message="Ulasan muncul setelah peserta menghadiri acara ini." />
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {event.reviews.map((r) => (
                  <div key={r.id} className="card p-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.user.name} fileId={r.user.avatarId} size={32} />
                      <div>
                        <p className="text-sm font-semibold">{r.user.name}</p>
                        <Stars value={r.rating} size={13} />
                      </div>
                      <span className="ml-auto text-xs text-slate-400">{formatDate(r.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="hidden w-96 shrink-0 lg:block">
          <div className="sticky top-24">{ticketPicker}</div>
        </aside>
      </div>
    </div>
  );
}
