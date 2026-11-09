import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Search, Users } from "lucide-react";
import useFetch from "../../hooks/useFetch";
import { EmptyState, ErrorBox, PageTitle, Spinner } from "../../components/common";
import { formatDate, rupiah } from "../../lib/format";

export default function Attendees() {
  const { id } = useParams();
  const { data, loading, error } = useFetch(`/dashboard/events/${id}/attendees`);
  const [search, setSearch] = useState("");

  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} />;

  const list = data.attendees.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <Link to="/organizer/events" className="text-sm font-semibold text-brand-700 hover:underline">
        ← Acara Saya
      </Link>
      <PageTitle title="Daftar Peserta" subtitle={`${data.event.title} · ${formatDate(data.event.startDate)}`} />

      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          ["Peserta", data.totalAttendees],
          ["Tiket", data.totalTickets],
          ["Pendapatan", rupiah(data.totalRevenue)],
        ].map(([label, value]) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-lg font-bold sm:text-xl">{value}</p>
          </div>
        ))}
      </div>

      {data.attendees.length === 0 ? (
        <EmptyState icon={Users} title="Belum ada peserta" message="Peserta muncul setelah transaksinya kamu terima." />
      ) : (
        <>
          <div className="relative mb-4 max-w-sm">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-10" placeholder="Cari nama" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {list.length === 0 ? (
            <EmptyState title="Nama tidak ditemukan" />
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Nama</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Tiket</th>
                    <th className="px-4 py-3 font-medium">Jumlah</th>
                    <th className="px-4 py-3 font-medium">Total dibayar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {list.map((a) => (
                    <tr key={a.userId}>
                      <td className="px-4 py-3 font-medium">{a.name}</td>
                      <td className="px-4 py-3 text-slate-500">{a.email}</td>
                      <td className="px-4 py-3 text-slate-500">{a.tickets.join(", ")}</td>
                      <td className="px-4 py-3">{a.quantity}</td>
                      <td className="px-4 py-3 font-semibold">{rupiah(a.totalPaid)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
