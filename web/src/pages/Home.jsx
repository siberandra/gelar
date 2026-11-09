import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ChevronDown, CreditCard, MapPin, Music, Search, Ticket, UploadCloud } from "lucide-react";
import useFetch from "../hooks/useFetch";
import { useAuth } from "../context/AuthContext";
import EventCard, { CATEGORY_ICONS } from "../components/EventCard";
import DemoAccounts from "../components/DemoAccounts";
import { Avatar, EmptyState, ErrorBox, Spinner, Stars } from "../components/common";

// Judul section dengan label kecil di atasnya
function SectionTitle({ eyebrow, title, subtitle, center = false, action }) {
  return (
    <div className={`mb-8 gap-4 ${center ? "flex flex-col items-center text-center" : "flex flex-wrap items-end justify-between"}`}>
      <div className={center ? "max-w-2xl" : ""}>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-2 text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const STEPS = [
  { icon: Search, title: "Pilih acara", text: "Cari berdasarkan nama, kategori, atau kota. Lihat sisa kursi dan promo yang berlaku." },
  { icon: CreditCard, title: "Checkout & potongan", text: "Pakai voucher acara, kupon referral, atau poin untuk memotong harga tiket." },
  { icon: UploadCloud, title: "Upload bukti bayar", text: "Transfer dalam 2 jam lalu upload buktinya. Hasil konfirmasi dikirim ke emailmu." },
];

const FAQ = [
  ["Bagaimana cara membayar tiket?", "Setelah checkout, transfer sesuai total ke rekening yang tertera lalu upload bukti transfer dalam 2 jam. Organizer akan mengonfirmasi paling lambat 3 hari."],
  ["Apa yang terjadi kalau saya lupa upload bukti bayar?", "Transaksi otomatis kedaluwarsa setelah 2 jam. Kursi, voucher, kupon, dan poin yang kamu pakai dikembalikan."],
  ["Bagaimana cara mendapatkan poin?", "Bagikan kode referralmu. Setiap teman yang mendaftar dengan kodemu memberi kamu 10.000 poin, dan temanmu mendapat kupon diskon 10%. Poin berlaku 3 bulan."],
  ["Apa bedanya voucher dan kupon?", "Voucher dibuat organizer dan hanya berlaku untuk acara tertentu. Kupon diberikan Gelar dari program referral dan berlaku untuk semua acara."],
  ["Kapan saya bisa memberi ulasan?", "Setelah acara selesai, jika transaksimu berstatus selesai. Tombol \"Beri Ulasan\" muncul di halaman Tiket Saya."],
];

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
      {FAQ.map(([q, a], i) => (
        <div key={q}>
          <button className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
            {q}
            <ChevronDown size={18} className={`shrink-0 text-slate-400 transition ${open === i ? "rotate-180" : ""}`} />
          </button>
          {open === i && <p className="px-5 pb-4 text-sm leading-relaxed text-slate-600">{a}</p>}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const events = useFetch("/events");
  const categories = useFetch("/categories");
  const cities = useFetch("/cities");
  const highlights = useFetch("/highlights");

  function submit(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (city) params.set("city", city);
    navigate(`/events?${params}`);
  }

  const stats = highlights.data?.stats;

  return (
    <>
      {/* Hero dengan foto */}
      <section className="relative overflow-hidden bg-slate-900 text-white">
        <img src="/hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/60 to-brand-900/30" />
        <div className="relative mx-auto max-w-7xl px-4 pb-32 pt-16 sm:pb-40 sm:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
            <Ticket size={14} className="text-amber-400" /> Konser · Seminar · Workshop · Fun Run
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.1] sm:text-6xl">
            Temukan acara seru <span className="text-amber-400">di kotamu</span>
          </h1>
          <p className="mt-5 max-w-xl text-white/80 sm:text-lg">Beli tiket dalam beberapa klik, pakai voucher dan poin, lalu simpan semua tiketmu di satu tempat.</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4">
        {/* Kotak pencarian mengambang di bawah hero */}
        <form onSubmit={submit} className="relative z-10 -mt-20 grid gap-3 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200 sm:-mt-24 sm:grid-cols-[1fr_14rem_auto] sm:p-5">
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cari acara</span>
            <div className="relative mt-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder="Nama konser, seminar, workshop..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </label>
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Kota</span>
            <div className="relative mt-1">
              <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select className="input pl-10" value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">Semua kota</option>
                {cities.data?.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </label>
          <button className="btn-primary self-end px-8 py-3">Cari Acara</button>
        </form>

        {/* Kategori */}
        <section className="mt-12">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {categories.data?.map((c) => {
              const Icon = CATEGORY_ICONS[c.slug] || Music;
              return (
                <Link key={c.id} to={`/events?category=${c.slug}`} className="group card flex flex-col items-center gap-2 p-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-brand-500 hover:text-brand-700">
                  <span className="rounded-xl bg-brand-50 p-3 text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white">
                    <Icon size={22} />
                  </span>
                  {c.name}
                </Link>
              );
            })}
          </div>
        </section>

        {/* Acara mendatang */}
        <section className="mt-16">
          <SectionTitle
            eyebrow="Jangan sampai kehabisan"
            title="Acara Mendatang"
            action={
              <Link to="/events" className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
                Lihat semua <ArrowRight size={16} />
              </Link>
            }
          />
          {events.loading && <Spinner />}
          {events.error && <ErrorBox message={events.error} onRetry={events.reload} />}
          {events.data && events.data.data.length === 0 && <EmptyState title="Belum ada acara mendatang" message="Cek lagi nanti, acara baru terus ditambahkan." />}
          {events.data && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {events.data.data.slice(0, 8).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Statistik dari data asli */}
      {stats && (
        <section className="mt-20 bg-brand-800 text-white">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 text-center md:grid-cols-4">
            {[
              [stats.events, "Acara mendatang"],
              [stats.ticketsSold.toLocaleString("id-ID"), "Tiket terjual"],
              [stats.cities, "Kota"],
              [stats.organizers, "Organizer"],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="text-4xl font-extrabold text-amber-400">{value}</p>
                <p className="mt-1 text-sm text-brand-100">{label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mx-auto max-w-7xl px-4">
        {/* Cara kerja */}
        <section className="mt-20">
          <SectionTitle eyebrow="Cara kerja" title="Tiga langkah dapat tiket" center />
          <div className="grid gap-5 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="card relative p-6">
                <span className="absolute right-5 top-4 text-5xl font-extrabold text-slate-100">0{i + 1}</span>
                <span className="relative inline-flex rounded-xl bg-amber-100 p-3 text-amber-700">
                  <Icon size={22} />
                </span>
                <h3 className="relative mt-4 font-bold">{title}</h3>
                <p className="relative mt-1 text-sm text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Kota */}
        {cities.data?.length > 0 && (
          <section className="mt-20">
            <SectionTitle eyebrow="Jelajah per kota" title="Ada acara di kotamu" />
            <div className="flex flex-wrap gap-3">
              {cities.data.map((c) => (
                <Link key={c} to={`/events?city=${encodeURIComponent(c)}`} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 font-semibold text-slate-700 transition hover:border-brand-600 hover:bg-brand-700 hover:text-white">
                  <MapPin size={16} /> {c}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Testimoni dari ulasan asli */}
        {highlights.data?.reviews.length > 0 && (
          <section className="mt-20">
            <SectionTitle eyebrow="Kata peserta" title="Ulasan dari mereka yang sudah datang" center />
            <div className="grid gap-5 md:grid-cols-3">
              {highlights.data.reviews.slice(0, 3).map((r) => (
                <figure key={r.id} className="card flex flex-col p-6">
                  <Stars value={r.rating} />
                  <blockquote className="mt-3 flex-1 text-slate-700">“{r.comment}”</blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                    <Avatar name={r.user.name} fileId={r.user.avatarId} size={40} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{r.user.name}</p>
                      <Link to={`/events/${r.event.slug}`} className="block truncate text-xs text-brand-700 hover:underline">
                        {r.event.title}
                      </Link>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* Akun demo, hanya untuk yang belum login */}
        {!user && (
          <section className="mt-20 rounded-3xl bg-slate-100 p-6 sm:p-10">
            <SectionTitle eyebrow="Akun demo" title="Coba setiap peran tanpa perlu daftar" subtitle="Semua data di aplikasi ini adalah data contoh. Pilih salah satu akun di bawah untuk langsung masuk." />
            <DemoAccounts />
          </section>
        )}

        {/* FAQ */}
        <section className="mt-20 grid items-start gap-8 lg:grid-cols-[1fr_1.4fr]">
          <SectionTitle eyebrow="FAQ" title="Ada pertanyaan?" subtitle="Hal yang paling sering ditanyakan soal pembayaran, poin, dan ulasan." />
          <Faq />
        </section>

        {/* Ajakan organizer */}
        <section className="relative mt-20 overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 p-8 text-white sm:p-12">
          <div className="relative max-w-xl">
            <h2 className="text-2xl font-extrabold sm:text-3xl">Punya acara? Jual tiketnya di Gelar</h2>
            <p className="mt-2 text-white/90">Buat acara, atur voucher promo, konfirmasi pembayaran, dan pantau penjualan dari satu dashboard. Gratis untuk organizer.</p>
            <Link to="/register?role=ORGANIZER" className="btn mt-6 bg-white text-orange-600 hover:bg-orange-50">
              Mulai jadi Organizer <ArrowRight size={16} />
            </Link>
          </div>
          <Ticket className="absolute -bottom-10 -right-6 h-64 w-64 rotate-12 text-white/15" />
        </section>
      </div>
    </>
  );
}
