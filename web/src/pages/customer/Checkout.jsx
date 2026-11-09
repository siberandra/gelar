import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, Clock, Coins, TicketPercent } from "lucide-react";
import api, { errorMessage } from "../../lib/api";
import useFetch from "../../hooks/useFetch";
import { useUi } from "../../context/UiContext";
import { EventImage } from "../../components/EventCard";
import { ErrorBox, Spinner } from "../../components/common";
import { formatDate, rupiah } from "../../lib/format";

// Hanya untuk tampilan. Harga final tetap dihitung ulang di server.
function preview({ subtotal, voucher, coupon, balance, usePoints }) {
  const voucherCut = voucher ? Math.min(voucher.discount, subtotal) : 0;
  const afterVoucher = subtotal - voucherCut;
  const couponCut = coupon ? Math.min(Math.floor((afterVoucher * coupon.percent) / 100), coupon.maxDiscount) : 0;
  const afterCoupon = afterVoucher - couponCut;
  const points = usePoints ? Math.min(balance, afterCoupon) : 0;
  return { voucherCut, couponCut, points, total: afterCoupon - points };
}

export default function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { toast, confirm } = useUi();
  const event = useFetch(state ? `/events/${state.slug}` : null);
  const rewards = useFetch(state ? "/profile/rewards" : null);

  const [code, setCode] = useState("");
  const [voucher, setVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState("");
  const [couponId, setCouponId] = useState("");
  const [usePoints, setUsePoints] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!state?.items?.length) return <Navigate to="/events" replace />;
  if (event.loading || rewards.loading) return <Spinner />;
  if (event.error) return <div className="mx-auto max-w-3xl px-4 py-16"><ErrorBox message={event.error} /></div>;

  const items = state.items.map((i) => ({ ...i, ticket: event.data.ticketTypes.find((t) => t.id === i.ticketTypeId) })).filter((i) => i.ticket);
  const subtotal = items.reduce((s, i) => s + i.ticket.price * i.quantity, 0);
  const coupons = (rewards.data?.coupons || []).filter((c) => c.status === "ACTIVE");
  const coupon = coupons.find((c) => c.id === Number(couponId));
  const balance = rewards.data?.balance || 0;
  const price = preview({ subtotal, voucher, coupon, balance, usePoints });

  async function applyVoucher() {
    setVoucherError("");
    try {
      const res = await api.get("/vouchers/check", { params: { eventId: event.data.id, code } });
      setVoucher(res.data);
    } catch (err) {
      setVoucher(null);
      setVoucherError(errorMessage(err));
    }
  }

  async function pay() {
    const ok = await confirm({
      title: "Lanjutkan pembayaran?",
      message: `Total yang harus dibayar ${rupiah(price.total)}. ${price.total > 0 ? "Kamu punya waktu 2 jam untuk upload bukti transfer." : ""}`,
      confirmText: "Ya, buat pesanan",
    });
    if (!ok) return;
    setBusy(true);
    try {
      const res = await api.post("/transactions", {
        eventId: event.data.id,
        items: state.items,
        voucherCode: voucher?.code,
        couponId: coupon?.id,
        usePoints,
      });
      if (res.data.status === "DONE") {
        toast("Tiket berhasil didapatkan!");
        navigate("/my-tickets", { replace: true });
      } else {
        navigate(`/transactions/${res.data.id}`, { replace: true });
      }
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }

  const row = (label, value, className = "") => (
    <div className={`flex justify-between text-sm ${className}`}>
      <span className="text-slate-500">{label}</span>
      <span>{value}</span>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <div className="mt-6 gap-8 lg:flex">
        <div className="min-w-0 flex-1 space-y-6">
          <div className="card flex gap-4 p-4">
            <EventImage event={event.data} className="h-20 w-28 shrink-0 rounded-lg sm:h-24 sm:w-40" />
            <div className="min-w-0">
              <h2 className="font-semibold">{event.data.title}</h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                <CalendarDays size={15} /> {formatDate(event.data.startDate)} · {event.data.city}
              </p>
              <ul className="mt-2 space-y-0.5 text-sm">
                {items.map((i) => (
                  <li key={i.ticketTypeId}>
                    {i.quantity} x {i.ticket.name} <span className="text-slate-500">({rupiah(i.ticket.price)})</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {subtotal > 0 && (
            <div className="card space-y-6 p-5">
              <div>
                <label className="label flex items-center gap-2" htmlFor="voucher">
                  <TicketPercent size={16} className="text-amber-600" /> Kode voucher
                </label>
                <div className="flex gap-2">
                  <input id="voucher" className="input uppercase" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Contoh: INDIEFEST" />
                  <button className="btn-outline" onClick={applyVoucher} disabled={!code.trim()}>
                    Pakai
                  </button>
                </div>
                {voucher && (
                  <p className="mt-2 text-sm text-green-700">
                    Voucher {voucher.code} dipakai: -{rupiah(voucher.discount)}{" "}
                    <button className="ml-1 text-slate-500 underline" onClick={() => setVoucher(null)}>
                      hapus
                    </button>
                  </p>
                )}
                {voucherError && <p className="mt-2 text-sm text-red-600">{voucherError}</p>}
              </div>

              <div>
                <p className="label">Kupon saya</p>
                {coupons.length === 0 ? (
                  <p className="text-sm text-slate-500">Tidak ada kupon aktif. Daftar dengan kode referral teman untuk mendapatkan kupon.</p>
                ) : (
                  <div className="space-y-2">
                    {[{ id: "", label: "Tidak pakai kupon" }, ...coupons].map((c) => (
                      <label key={c.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm ${String(couponId) === String(c.id) ? "border-brand-600 bg-brand-50" : "border-slate-200"}`}>
                        <input type="radio" name="coupon" className="accent-brand-700" checked={String(couponId) === String(c.id)} onChange={() => setCouponId(c.id)} />
                        {c.id ? (
                          <span>
                            <b>Diskon {c.percent}%</b> (maks {rupiah(c.maxDiscount)}) · berlaku s.d. {formatDate(c.expiresAt)}
                          </span>
                        ) : (
                          c.label
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-slate-200 p-3">
                <span className="flex items-center gap-3 text-sm">
                  <Coins size={20} className="text-amber-500" />
                  <span>
                    <b>Pakai poin</b>
                    <br />
                    <span className="text-slate-500">Saldo: {balance.toLocaleString("id-ID")} poin</span>
                  </span>
                </span>
                <input type="checkbox" className="h-5 w-5 accent-brand-700" checked={usePoints} disabled={balance === 0} onChange={(e) => setUsePoints(e.target.checked)} />
              </label>
            </div>
          )}
        </div>

        <aside className="mt-6 lg:mt-0 lg:w-96 lg:shrink-0">
          <div className="card space-y-2 p-5 lg:sticky lg:top-24">
            <h2 className="mb-2 font-bold">Rincian Harga</h2>
            {row("Subtotal", rupiah(subtotal))}
            {price.voucherCut > 0 && row("Diskon voucher", `-${rupiah(price.voucherCut)}`, "text-green-700")}
            {price.couponCut > 0 && row("Diskon kupon", `-${rupiah(price.couponCut)}`, "text-green-700")}
            {price.points > 0 && row("Poin dipakai", `-${rupiah(price.points)}`, "text-green-700")}
            <div className="flex justify-between border-t border-slate-100 pt-3">
              <span className="font-semibold">Total Bayar</span>
              <span className="text-xl font-extrabold text-brand-800">{rupiah(price.total)}</span>
            </div>
            <button className="btn-primary mt-3 w-full" onClick={pay} disabled={busy}>
              {busy ? "Memproses..." : price.total === 0 ? "Dapatkan Tiket" : "Bayar Sekarang"}
            </button>
            {price.total > 0 && (
              <p className="flex items-center gap-1.5 pt-1 text-xs text-slate-500">
                <Clock size={14} /> Selesaikan pembayaran dalam 2 jam setelah checkout
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
