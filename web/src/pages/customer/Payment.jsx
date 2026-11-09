import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Copy, ImageUp, Timer } from "lucide-react";
import api, { errorMessage } from "../../lib/api";
import useFetch from "../../hooks/useFetch";
import { useUi } from "../../context/UiContext";
import PrivateImage from "../../components/PrivateImage";
import { ErrorBox, Spinner, StatusBadge } from "../../components/common";
import { formatDate, formatDateTime, rupiah } from "../../lib/format";

const BANK = { name: "Bank BCA", number: "8730 1234 5678", holder: "PT Gelar Acara Indonesia" };

// Hitung mundur sampai deadline, diperbarui setiap detik
function useCountdown(deadline) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const ms = Math.max(0, new Date(deadline).getTime() - now);
  const pad = (n) => String(n).padStart(2, "0");
  return { ms, text: `${pad(Math.floor(ms / 3600000))}:${pad(Math.floor((ms % 3600000) / 60000))}:${pad(Math.floor((ms % 60000) / 1000))}` };
}

export default function Payment() {
  const { id } = useParams();
  const { toast, confirm } = useUi();
  const { data: trx, loading, error, reload } = useFetch(`/transactions/${id}`);
  const countdown = useCountdown(trx?.paymentDeadline || Date.now());
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  // Saat waktu habis, ambil ulang data supaya status EXPIRED dari server tampil
  useEffect(() => {
    if (trx?.status === "WAITING_PAYMENT" && countdown.ms === 0) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown.ms === 0]);

  if (loading && !trx) return <Spinner />;
  if (error) return <div className="mx-auto max-w-3xl px-4 py-16"><ErrorBox message={error} /></div>;

  function pick(e) {
    const chosen = e.target.files[0];
    if (!chosen) return;
    if (chosen.size > 2 * 1024 * 1024) return toast("Ukuran file maksimal 2 MB", "error");
    setFile(chosen);
    setPreview(URL.createObjectURL(chosen));
  }

  async function upload() {
    const ok = await confirm({ title: "Kirim bukti bayar?", message: "Pastikan nominal transfer sesuai total pembayaran.", confirmText: "Kirim" });
    if (!ok) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append("proof", file);
      await api.post(`/transactions/${id}/proof`, form);
      toast("Bukti bayar terkirim, menunggu konfirmasi organizer");
      reload();
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    const ok = await confirm({
      title: "Batalkan transaksi?",
      message: "Kursi akan dilepas. Voucher, kupon, dan poin yang kamu pakai akan dikembalikan.",
      confirmText: "Ya, batalkan",
      danger: true,
    });
    if (!ok) return;
    try {
      await api.post(`/transactions/${id}/cancel`);
      toast("Transaksi dibatalkan");
      reload();
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  }

  function copy(text) {
    navigator.clipboard.writeText(text.replace(/\s/g, ""));
    toast("Disalin");
  }

  const waiting = trx.status === "WAITING_PAYMENT";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link to="/my-tickets" className="text-sm font-semibold text-brand-700 hover:underline">
        ← Tiket Saya
      </Link>
      <div className="card mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-5">
          <div>
            <p className="text-xs text-slate-500">{trx.invoice}</p>
            <h1 className="font-bold">{trx.event.title}</h1>
            <p className="text-sm text-slate-500">{formatDate(trx.event.startDate)} · {trx.event.city}</p>
          </div>
          <StatusBadge status={trx.status} />
        </div>

        {waiting && (
          <div className="bg-amber-50 p-5 text-center">
            <p className="flex items-center justify-center gap-1.5 text-sm font-medium text-amber-800">
              <Timer size={16} /> Sisa waktu pembayaran
            </p>
            <p className="mt-1 font-mono text-4xl font-bold tracking-wider text-amber-600">{countdown.text}</p>
            <p className="mt-1 text-xs text-amber-800">Batas: {formatDateTime(trx.paymentDeadline)} WIB</p>
          </div>
        )}

        <div className="space-y-5 p-5">
          <div>
            <ul className="space-y-1 text-sm">
              {trx.items.map((i) => (
                <li key={i.id} className="flex justify-between">
                  <span>{i.quantity} x {i.ticketType.name}</span>
                  <span>{rupiah(i.unitPrice * i.quantity)}</span>
                </li>
              ))}
              {trx.voucherDiscount > 0 && <li className="flex justify-between text-green-700"><span>Voucher {trx.voucher?.code}</span><span>-{rupiah(trx.voucherDiscount)}</span></li>}
              {trx.couponDiscount > 0 && <li className="flex justify-between text-green-700"><span>Kupon</span><span>-{rupiah(trx.couponDiscount)}</span></li>}
              {trx.pointsUsed > 0 && <li className="flex justify-between text-green-700"><span>Poin</span><span>-{rupiah(trx.pointsUsed)}</span></li>}
            </ul>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-extrabold text-brand-800">{rupiah(trx.total)}</span>
            </div>
          </div>

          {waiting && (
            <>
              <div className="rounded-lg bg-slate-50 p-4 text-sm">
                <p className="font-semibold">Transfer ke</p>
                <p className="mt-1">{BANK.name}</p>
                <p className="flex items-center gap-2 font-mono text-lg font-bold">
                  {BANK.number}
                  <button onClick={() => copy(BANK.number)} className="text-brand-700" aria-label="Salin nomor rekening">
                    <Copy size={16} />
                  </button>
                </p>
                <p className="text-slate-500">a.n. {BANK.holder}</p>
              </div>

              <div>
                <p className="label">Upload bukti transfer</p>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-6 text-center hover:border-brand-500">
                  {preview ? (
                    <img src={preview} alt="Pratinjau bukti" className="max-h-64 rounded-lg" />
                  ) : (
                    <>
                      <ImageUp size={32} className="text-slate-400" />
                      <span className="mt-2 text-sm font-medium">Pilih gambar bukti transfer</span>
                      <span className="text-xs text-slate-500">JPG, PNG, atau WEBP, maksimal 2 MB</span>
                    </>
                  )}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pick} />
                </label>
                <button className="btn-primary mt-3 w-full" disabled={!file || busy} onClick={upload}>
                  {busy ? "Mengirim..." : "Kirim bukti bayar"}
                </button>
              </div>
              <button className="w-full text-center text-sm font-semibold text-red-600 hover:underline" onClick={cancel}>
                Batalkan transaksi
              </button>
            </>
          )}

          {trx.status === "WAITING_CONFIRMATION" && (
            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
              Bukti bayar sudah dikirim. Organizer akan mengonfirmasi paling lambat {formatDateTime(trx.confirmDeadline)} WIB. Hasilnya dikirim ke emailmu.
            </div>
          )}
          {trx.status === "DONE" && <div className="rounded-lg bg-green-50 p-4 text-sm text-green-900">Pembayaran diterima. Sampai jumpa di acara!</div>}
          {["EXPIRED", "CANCELED", "REJECTED"].includes(trx.status) && (
            <div className="rounded-lg bg-slate-100 p-4 text-sm text-slate-700">
              Transaksi ini {trx.status === "EXPIRED" ? "kedaluwarsa" : trx.status === "REJECTED" ? "ditolak" : "dibatalkan"}. Kursi, voucher, kupon, dan poin sudah dikembalikan.
            </div>
          )}
          {trx.proofId && !waiting && (
            <div>
              <p className="label">Bukti bayar</p>
              <PrivateImage fileId={trx.proofId} alt="Bukti bayar" className="max-h-72 rounded-lg border border-slate-200" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
