import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Music, Search } from "lucide-react";
import useFetch from "../hooks/useFetch";
import EventCard, { CATEGORY_ICONS } from "../components/EventCard";
import { EmptyState, ErrorBox, Spinner } from "../components/common";

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const events = useFetch("/events");
  const categories = useFetch("/categories");
  const cities = useFetch("/cities");

  function submit(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (city) params.set("city", city);
    navigate(`/events?${params}`);
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-800 via-brand-700 to-teal-500 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
          <h1 className="max-w-2xl text-3xl font-extrabold leading-tight sm:text-5xl">Temukan acara seru di kotamu</h1>
          <p className="mt-4 max-w-xl text-brand-50/90 sm:text-lg">
            Konser, seminar, workshop, sampai fun run. Beli tiketnya di Gelar, cukup beberapa klik.
          </p>
          <form onSubmit={submit} className="mt-8 flex max-w-2xl flex-col gap-2 rounded-xl bg-white p-2 shadow-lg sm:flex-row">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-lg py-3 pl-10 pr-3 text-sm text-slate-800 outline-none"
                placeholder="Cari nama acara"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className="rounded-lg border-slate-200 px-3 py-3 text-sm text-slate-700 outline-none sm:w-44 sm:border-l" value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="">Semua kota</option>
              {cities.data?.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <button className="btn-primary px-6 py-3">Cari</button>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4">
        {/* Kategori */}
        <section className="-mt-6 flex gap-3 overflow-x-auto pb-2">
          {categories.data?.map((c) => {
            const Icon = CATEGORY_ICONS[c.slug] || Music;
            return (
              <Link
                key={c.id}
                to={`/events?category=${c.slug}`}
                className="card flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-brand-500 hover:text-brand-700"
              >
                <Icon size={18} className="text-brand-700" /> {c.name}
              </Link>
            );
          })}
        </section>

        {/* Acara mendatang */}
        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Acara Mendatang</h2>
            <Link to="/events" className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
              Lihat semua <ArrowRight size={16} />
            </Link>
          </div>
          {events.loading && <Spinner />}
          {events.error && <ErrorBox message={events.error} onRetry={events.reload} />}
          {events.data && events.data.data.length === 0 && (
            <EmptyState title="Belum ada acara mendatang" message="Cek lagi nanti, acara baru terus ditambahkan." />
          )}
          {events.data && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {events.data.data.slice(0, 8).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>

        {/* Kota */}
        {cities.data?.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-5 text-xl font-bold text-slate-900 sm:text-2xl">Jelajah per Kota</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {cities.data.map((c) => (
                <Link
                  key={c}
                  to={`/events?city=${encodeURIComponent(c)}`}
                  className="rounded-xl bg-slate-900 px-4 py-6 text-center font-semibold text-white transition hover:bg-brand-800"
                >
                  {c}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Ajakan organizer */}
        <section className="mt-14 flex flex-col items-start justify-between gap-4 rounded-2xl bg-amber-50 p-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Punya acara? Jual tiketnya di Gelar</h2>
            <p className="mt-1 text-sm text-slate-600">Buat acara, atur voucher promo, dan pantau penjualan dari satu dashboard.</p>
          </div>
          <Link to="/register?role=ORGANIZER" className="btn bg-amber-500 text-white hover:bg-amber-600">
            Mulai jadi Organizer
          </Link>
        </section>
      </div>
    </>
  );
}
