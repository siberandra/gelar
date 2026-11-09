import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarRange, Clock, Ticket, Wallet } from "lucide-react";
import useFetch from "../../hooks/useFetch";
import { useAuth } from "../../context/AuthContext";
import BarChart from "../../components/BarChart";
import { EmptyState, PageTitle, Spinner, StatusBadge } from "../../components/common";
import { formatDate, rupiah } from "../../lib/format";

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function StatCard({ icon: Icon, label, value, highlight }) {
  return (
    <div className={`card p-5 ${highlight ? "border-amber-300 bg-amber-50" : ""}`}>
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Icon size={18} className={highlight ? "text-amber-600" : "text-brand-700"} /> {label}
      </div>
      <p className="mt-2 text-2xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const now = new Date();
  const [period, setPeriod] = useState("month");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [eventId, setEventId] = useState("");

  const summary = useFetch("/dashboard/summary");
  const events = useFetch("/dashboard/events");
  const stats = useFetch("/dashboard/stats", { period, year, month, eventId: eventId || undefined });
  const recent = useFetch("/dashboard/transactions");

  const years = Array.from({ length: 4 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <>
      <PageTitle title={`Halo, ${user.name}`} subtitle="Ringkasan penjualan acara kamu" />

      {summary.data ? (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard icon={CalendarRange} label="Total Acara" value={summary.data.totalEvents} />
          <StatCard icon={Ticket} label="Tiket Terjual" value={summary.data.ticketsSold.toLocaleString("id-ID")} />
          <StatCard icon={Wallet} label="Pendapatan" value={rupiah(summary.data.revenue)} />
          <StatCard icon={Clock} label="Menunggu Konfirmasi" value={summary.data.waitingConfirmation} highlight={summary.data.waitingConfirmation > 0} />
        </div>
      ) : (
        <Spinner />
      )}

      <section className="card mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold">Penjualan Tiket</h2>
          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-lg bg-slate-100 p-1 text-sm">
              {[
                ["year", "Tahun"],
                ["month", "Bulan"],
                ["day", "Hari"],
              ].map(([value, label]) => (
                <button key={value} onClick={() => setPeriod(value)} className={`rounded-md px-3 py-1.5 font-medium ${period === value ? "bg-white text-brand-800 shadow-sm" : "text-slate-600"}`}>
                  {label}
                </button>
              ))}
            </div>
            {period !== "year" && (
              <select className="input w-auto py-2" value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label="Tahun">
                {years.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            )}
            {period === "day" && (
              <select className="input w-auto py-2" value={month} onChange={(e) => setMonth(Number(e.target.value))} aria-label="Bulan">
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            )}
            <select className="input w-auto max-w-56 py-2" value={eventId} onChange={(e) => setEventId(e.target.value)} aria-label="Acara">
              <option value="">Semua acara</option>
              {events.data?.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="mb-6 mt-1 text-xs text-slate-500">
          Pendapatan dari transaksi selesai
          {period === "month" && ` per bulan, tahun ${year}`}
          {period === "day" && ` per hari, ${MONTHS[month - 1]} ${year}`}
          {period === "year" && " per tahun"}. Arahkan kursor ke batang untuk detail.
        </p>
        {stats.loading ? <Spinner /> : stats.data && <BarChart data={stats.data} />}
        {stats.data && (
          <div className="mt-8 flex gap-6 text-sm">
            <p>
              <span className="text-slate-500">Total periode: </span>
              <b>{rupiah(stats.data.reduce((s, d) => s + d.revenue, 0))}</b>
            </p>
            <p>
              <b>{stats.data.reduce((s, d) => s + d.tickets, 0)}</b> <span className="text-slate-500">tiket</span>
            </p>
          </div>
        )}
      </section>

      <section className="card mt-6 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold">Transaksi Terbaru</h2>
          <Link to="/organizer/transactions" className="text-sm font-semibold text-brand-700 hover:underline">
            Lihat semua
          </Link>
        </div>
        {recent.data?.length === 0 && <EmptyState title="Belum ada transaksi" />}
        <div className="divide-y divide-slate-100">
          {recent.data?.slice(0, 5).map((t) => (
            <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium">{t.user.name}</p>
                <p className="truncate text-xs text-slate-500">
                  {t.event.title} · {formatDate(t.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{rupiah(t.total)}</span>
                <StatusBadge status={t.status} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
