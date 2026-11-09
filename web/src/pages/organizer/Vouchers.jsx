import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, TicketPercent, Trash2 } from "lucide-react";
import api, { errorMessage } from "../../lib/api";
import useFetch from "../../hooks/useFetch";
import { useUi } from "../../context/UiContext";
import Modal from "../../components/Modal";
import { EmptyState, Field, PageTitle, Spinner } from "../../components/common";
import { formatDate, fromInputDateTime, rupiah } from "../../lib/format";

function voucherStatus(v) {
  const now = new Date();
  if (new Date(v.startDate) > now) return ["Belum mulai", "bg-blue-100 text-blue-800"];
  if (new Date(v.endDate) < now) return ["Berakhir", "bg-slate-100 text-slate-600"];
  if (v.used >= v.quota) return ["Habis", "bg-slate-100 text-slate-600"];
  return ["Aktif", "bg-green-100 text-green-800"];
}

function VoucherForm({ eventId, onClose, onSaved }) {
  const { toast } = useUi();
  const [form, setForm] = useState({ code: "", discount: 25000, quota: 50, startDate: "", endDate: "" });
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/events/${eventId}/vouchers`, {
        ...form,
        startDate: fromInputDateTime(form.startDate),
        endDate: fromInputDateTime(form.endDate),
      });
      toast("Voucher dibuat");
      onSaved();
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Buat Voucher">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Kode voucher" hint="Huruf dan angka, contoh: HEMAT50">
          <input className="input uppercase" value={form.code} onChange={set("code")} required minLength={3} maxLength={20} pattern="[A-Za-z0-9]+" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Potongan (Rp)">
            <input type="number" min="1000" step="1000" className="input" value={form.discount} onChange={set("discount")} required />
          </Field>
          <Field label="Kuota">
            <input type="number" min="1" className="input" value={form.quota} onChange={set("quota")} required />
          </Field>
          <Field label="Mulai berlaku">
            <input type="datetime-local" className="input" value={form.startDate} onChange={set("startDate")} required />
          </Field>
          <Field label="Berakhir">
            <input type="datetime-local" className="input" value={form.endDate} onChange={set("endDate")} required />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-outline" onClick={onClose}>
            Batal
          </button>
          <button className="btn-primary" disabled={busy}>
            Simpan
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function Vouchers() {
  const [params, setParams] = useSearchParams();
  const { toast, confirm } = useUi();
  const events = useFetch("/dashboard/events");
  const [creating, setCreating] = useState(false);
  const eventId = params.get("event") || "";
  const vouchers = useFetch(eventId ? `/events/${eventId}/vouchers` : null);

  // Pilih acara pertama secara otomatis
  useEffect(() => {
    if (!eventId && events.data?.length) setParams({ event: String(events.data[0].id) }, { replace: true });
  }, [eventId, events.data, setParams]);

  async function remove(v) {
    const ok = await confirm({ title: `Hapus voucher ${v.code}?`, message: "Voucher yang sudah dipakai tidak bisa dihapus.", confirmText: "Hapus", danger: true });
    if (!ok) return;
    try {
      await api.delete(`/vouchers/${v.id}`);
      toast("Voucher dihapus");
      vouchers.reload();
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  }

  if (events.loading) return <Spinner />;

  return (
    <>
      <PageTitle
        title="Voucher Promo"
        subtitle="Voucher hanya berlaku untuk acara yang dipilih"
        action={
          eventId && (
            <button className="btn-primary" onClick={() => setCreating(true)}>
              <Plus size={18} /> Buat Voucher
            </button>
          )
        }
      />

      {events.data?.length === 0 ? (
        <EmptyState icon={TicketPercent} title="Belum ada acara" message="Buat acara dulu sebelum membuat voucher." />
      ) : (
        <>
          <select className="input mb-5 max-w-md" value={eventId} onChange={(e) => setParams({ event: e.target.value })} aria-label="Pilih acara">
            {events.data?.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>

          {vouchers.loading && <Spinner />}
          {vouchers.data?.length === 0 && <EmptyState icon={TicketPercent} title="Belum ada voucher" message="Buat voucher untuk menarik lebih banyak pembeli." />}
          {vouchers.data?.length > 0 && (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Kode</th>
                    <th className="px-4 py-3 font-medium">Potongan</th>
                    <th className="px-4 py-3 font-medium">Dipakai</th>
                    <th className="px-4 py-3 font-medium">Periode</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vouchers.data.map((v) => {
                    const [label, style] = voucherStatus(v);
                    return (
                      <tr key={v.id}>
                        <td className="px-4 py-3 font-mono font-semibold">{v.code}</td>
                        <td className="px-4 py-3">{rupiah(v.discount)}</td>
                        <td className="px-4 py-3">
                          {v.used}/{v.quota}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {formatDate(v.startDate)} – {formatDate(v.endDate)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>{label}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={() => remove(v)} aria-label="Hapus voucher">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {creating && (
        <VoucherForm
          eventId={eventId}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            vouchers.reload();
          }}
        />
      )}
    </>
  );
}
