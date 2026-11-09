import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import useFetch from "../hooks/useFetch";
import useDebounce from "../hooks/useDebounce";
import EventCard from "../components/EventCard";
import { EmptyState, ErrorBox, Pagination, Spinner } from "../components/common";

export default function Explore() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("search") || "");
  const [showFilter, setShowFilter] = useState(false);
  const debouncedSearch = useDebounce(search, 500);

  const category = params.get("category") || "";
  const city = params.get("city") || "";
  const price = params.get("price") || "";
  const page = Number(params.get("page")) || 1;

  // Ubah satu filter di URL. Filter selain halaman mengembalikan ke halaman 1.
  function setFilter(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next, { replace: true });
  }

  // Kata kunci masuk ke URL setelah user berhenti mengetik 500 ms (debounce)
  useEffect(() => {
    if ((params.get("search") || "") !== debouncedSearch) setFilter("search", debouncedSearch.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const query = { search: params.get("search") || undefined, category: category || undefined, city: city || undefined, price: price || undefined, page };
  const events = useFetch("/events", query);
  const categories = useFetch("/categories");
  const cities = useFetch("/cities");

  function reset() {
    setSearch("");
    setParams({}, { replace: true });
  }

  const hasFilter = Boolean(params.get("search") || category || city || price);

  const filters = (
    <div className="space-y-5">
      <div>
        <p className="label">Kategori</p>
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="category" checked={!category} onChange={() => setFilter("category", "")} className="accent-brand-700" />
            Semua kategori
          </label>
          {categories.data?.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm">
              <input type="radio" name="category" checked={category === c.slug} onChange={() => setFilter("category", c.slug)} className="accent-brand-700" />
              {c.name}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="label" htmlFor="city">
          Kota
        </label>
        <select id="city" className="input" value={city} onChange={(e) => setFilter("city", e.target.value)}>
          <option value="">Semua kota</option>
          {cities.data?.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <p className="label">Harga</p>
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1 text-sm">
          {[
            ["", "Semua"],
            ["free", "Gratis"],
            ["paid", "Berbayar"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter("price", value)}
              className={`rounded-md py-1.5 font-medium ${price === value ? "bg-white text-brand-800 shadow-sm" : "text-slate-600"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <button className="btn-outline w-full" onClick={reset} disabled={!hasFilter}>
        Reset filter
      </button>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Jelajah Acara</h1>

      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Cari nama acara..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Cari acara" />
        </div>
        <button className="btn-outline lg:hidden" onClick={() => setShowFilter(!showFilter)}>
          <SlidersHorizontal size={18} /> Filter
        </button>
      </div>

      <div className="mt-6 gap-8 lg:flex">
        <aside className={`${showFilter ? "block" : "hidden"} card mb-6 p-5 lg:sticky lg:top-24 lg:mb-0 lg:block lg:h-fit lg:w-64 lg:shrink-0`}>{filters}</aside>

        <section className="min-w-0 flex-1">
          {events.data && (
            <p className="mb-4 text-sm text-slate-500">
              <span className="font-semibold text-slate-800">{events.data.total}</span> acara ditemukan
            </p>
          )}
          {events.loading && <Spinner />}
          {events.error && <ErrorBox message={events.error} onRetry={events.reload} />}
          {!events.loading && events.data?.data.length === 0 && (
            <EmptyState
              title="Tidak ada acara yang cocok"
              message="Coba ubah kata kunci atau filter yang kamu pilih."
              action={
                <button className="btn-primary" onClick={reset}>
                  Reset filter
                </button>
              }
            />
          )}
          {!events.loading && events.data?.data.length > 0 && (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {events.data.data.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
              <Pagination page={events.data.page} totalPages={events.data.totalPages} onChange={(p) => setFilter("page", String(p))} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
