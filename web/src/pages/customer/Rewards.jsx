import { Coins, Copy, Gift } from "lucide-react";
import useFetch from "../../hooks/useFetch";
import { useUi } from "../../context/UiContext";
import { EmptyState, ErrorBox, PageTitle, Spinner } from "../../components/common";
import { formatDate, rupiah } from "../../lib/format";

const COUPON_STATUS = {
  ACTIVE: ["Aktif", "bg-green-100 text-green-800"],
  USED: ["Terpakai", "bg-slate-100 text-slate-600"],
  EXPIRED: ["Kedaluwarsa", "bg-slate-100 text-slate-500"],
};

export default function Rewards() {
  const { toast } = useUi();
  const { data, loading, error, reload } = useFetch("/profile/rewards");

  if (loading) return <Spinner />;
  if (error) return <div className="mx-auto max-w-3xl px-4 py-16"><ErrorBox message={error} onRetry={reload} /></div>;

  const shareLink = `${window.location.origin}/register?ref=${data.referralCode}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageTitle title="Poin & Kupon" />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-gradient-to-br from-brand-800 to-teal-500 p-6 text-white">
          <p className="text-sm text-brand-50/90">Kode referral kamu</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="font-mono text-3xl font-bold tracking-widest">{data.referralCode}</span>
            <button
              className="rounded-lg bg-white/20 p-2 hover:bg-white/30"
              aria-label="Salin kode referral"
              onClick={() => {
                navigator.clipboard.writeText(shareLink);
                toast("Link ajakan disalin");
              }}
            >
              <Copy size={18} />
            </button>
          </div>
          <p className="mt-3 text-sm text-brand-50/90">Ajak teman daftar dengan kodemu. Kamu dapat 10.000 poin, temanmu dapat kupon diskon 10%.</p>
        </div>
        <div className="card p-6">
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Coins size={18} className="text-amber-500" /> Saldo poin
          </p>
          <p className="mt-2 text-3xl font-extrabold">{data.balance.toLocaleString("id-ID")}</p>
          <p className="mt-1 text-sm text-slate-500">1 poin = Rp 1. Setiap poin berlaku 3 bulan sejak diterima.</p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold">Riwayat poin</h2>
        {data.points.length === 0 ? (
          <EmptyState icon={Coins} title="Belum ada poin" message="Bagikan kode referralmu untuk mendapatkan poin." />
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Sumber</th>
                  <th className="px-4 py-3 font-medium">Poin</th>
                  <th className="px-4 py-3 font-medium">Sisa</th>
                  <th className="px-4 py-3 font-medium">Diterima</th>
                  <th className="px-4 py-3 font-medium">Berlaku s.d.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.points.map((p) => (
                  <tr key={p.id} className={p.expired ? "text-slate-400" : ""}>
                    <td className="px-4 py-3">{p.source}</td>
                    <td className="px-4 py-3">{p.amount.toLocaleString("id-ID")}</td>
                    <td className="px-4 py-3">{p.expired ? "Hangus" : p.remaining.toLocaleString("id-ID")}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(p.createdAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(p.expiresAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold">Kupon saya</h2>
        {data.coupons.length === 0 ? (
          <EmptyState icon={Gift} title="Belum ada kupon" message="Kupon didapat saat mendaftar dengan kode referral." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.coupons.map((c) => {
              const [label, style] = COUPON_STATUS[c.status];
              return (
                <div key={c.id} className={`rounded-xl border-2 border-dashed p-4 ${c.status === "ACTIVE" ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white opacity-70"}`}>
                  <div className="flex items-start justify-between">
                    <p className="text-xl font-extrabold text-amber-700">Diskon {c.percent}%</p>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>{label}</span>
                  </div>
                  <p className="text-sm text-slate-600">Maksimal potongan {rupiah(c.maxDiscount)} · semua acara</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {c.code} · berlaku s.d. {formatDate(c.expiresAt)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
