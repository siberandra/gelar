import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, Pencil, Search, TicketPercent, Trash2, Users } from "lucide-react";
import api, { errorMessage } from "../../lib/api";
import useFetch from "../../hooks/useFetch";
import { useUi } from "../../context/UiContext";
import { EventImage } from "../../components/EventCard";
import { EmptyState, ErrorBox, PageTitle, Spinner } from "../../components/common";
import { formatDate, rupiah } from "../../lib/format";

export default function MyEvents() {
  const { toast, confirm } = useUi();
  const { data, loading, error, reload } = useFetch("/dashboard/events");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("upcoming");

  async function remove(event) {
    const ok = await confirm({
      title: "Hapus acara ini?",
      message: `"${event.title}" akan dihapus permanen. Acara yang sudah punya transaksi tidak bisa dihapus.`,
      confirmText: "Hapus",
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/events/${event.id}`);
      toast("Acara dihapus");
      reload();
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  }

  const now = new Date();
  const list = (data || []).filter((e) => {
    const upcoming = new Date(e.endDate) >= now;
    return (filter === "upcoming" ? upcoming : !upcoming) && e.title.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <>
      <PageTitle
        title="Acara Saya"
        action={
          <Link to="/organizer/events/new" className="btn-primary">
            <CalendarPlus size={18} /> Buat Acara
          </Link>
        }
      />
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Cari acara" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex rounded-lg bg-slate-100 p-1 text-sm">
          {[
            ["upcoming", "Mendatang"],
            ["past", "Selesai"],
          ].map(([value, label]) => (
            <button key={value} onClick={() => setFilter(value)} className={`rounded-md px-4 py-1.5 font-medium ${filter === value ? "bg-white text-brand-800 shadow-sm" : "text-slate-600"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading && <Spinner />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!loading && list.length === 0 && (
        <EmptyState
          title={data?.length ? "Tidak ada acara yang cocok" : "Belum ada acara"}
          message={data?.length ? "Coba ubah kata kunci atau tab." : "Buat acara pertamamu dan mulai jual tiket."}
          action={
            !data?.length && (
              <Link to="/organizer/events/new" className="btn-primary">
                Buat Acara
              </Link>
            )
          }
        />
      )}

      <div className="space-y-3">
        {list.map((e) => {
          const percent = e.quota ? Math.round((e.sold / e.quota) * 100) : 0;
          return (
            <div key={e.id} className="card flex flex-col gap-4 p-4 md:flex-row md:items-center">
              <EventImage event={e} className="h-28 w-full shrink-0 rounded-lg md:h-16 md:w-24" />
              <div className="min-w-0 flex-1">
                <Link to={`/events/${e.slug}`} className="font-semibold hover:text-brand-700">
                  {e.title}
                </Link>
                <p className="text-sm text-slate-500">
                  {formatDate(e.startDate)} · {e.city}
                </p>
              </div>
              <div className="w-full md:w-40">
                <p className="text-xs text-slate-500">
                  Terjual {e.sold}/{e.quota}
                </p>
                <div className="mt-1 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-brand-600" style={{ width: `${percent}%` }} />
                </div>
              </div>
              <p className="w-32 text-sm font-semibold">{rupiah(e.revenue)}</p>
              <div className="flex gap-1">
                <Link to={`/organizer/events/${e.id}/edit`} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" title="Edit" aria-label="Edit">
                  <Pencil size={18} />
                </Link>
                <Link to={`/organizer/vouchers?event=${e.id}`} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" title="Voucher" aria-label="Voucher">
                  <TicketPercent size={18} />
                </Link>
                <Link to={`/organizer/events/${e.id}/attendees`} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" title="Peserta" aria-label="Peserta">
                  <Users size={18} />
                </Link>
                <button onClick={() => remove(e)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" title="Hapus" aria-label="Hapus">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
