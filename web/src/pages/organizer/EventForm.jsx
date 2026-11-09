import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ImageUp, Plus, Trash2 } from "lucide-react";
import api, { errorMessage, fileUrl } from "../../lib/api";
import useFetch from "../../hooks/useFetch";
import { useUi } from "../../context/UiContext";
import { Field, PageTitle, Spinner } from "../../components/common";
import { fromInputDateTime, toInputDateTime } from "../../lib/format";

const CITIES = ["Jakarta", "Bandung", "Yogyakarta", "Surabaya", "Bali", "Medan", "Semarang", "Makassar", "Malang", "Solo"];
const emptyTicket = { name: "", price: 0, quota: 50 };

export default function EventForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { toast, confirm } = useUi();
  const categories = useFetch("/categories");
  const myEvents = useFetch(editing ? "/dashboard/events" : null);

  const [form, setForm] = useState({ title: "", categoryId: "", description: "", city: "", venue: "", startDate: "", endDate: "" });
  const [tickets, setTickets] = useState([{ ...emptyTicket, name: "Reguler" }]);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  // Mode edit: isi form dengan data acara
  useEffect(() => {
    const event = myEvents.data?.find((e) => e.id === Number(id));
    if (!event) return;
    setForm({
      title: event.title,
      categoryId: event.categoryId,
      description: event.description,
      city: event.city,
      venue: event.venue,
      startDate: toInputDateTime(event.startDate),
      endDate: toInputDateTime(event.endDate),
    });
    setTickets(event.ticketTypes.map(({ id, name, price, quota, available }) => ({ id, name, price, quota, sold: quota - available })));
    if (event.imageId) setPreview(fileUrl(event.imageId));
  }, [myEvents.data, id]);

  if (editing && myEvents.loading) return <Spinner />;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const setTicket = (index, key, value) => setTickets(tickets.map((t, i) => (i === index ? { ...t, [key]: value } : t)));

  // Validasi sederhana di browser; aturan lengkap tetap dicek di server
  function validate() {
    const e = {};
    if (form.title.trim().length < 5) e.title = "Nama acara minimal 5 karakter";
    if (!form.categoryId) e.categoryId = "Pilih kategori";
    if (form.description.trim().length < 20) e.description = "Deskripsi minimal 20 karakter";
    if (!form.city) e.city = "Pilih kota";
    if (form.venue.trim().length < 2) e.venue = "Tempat wajib diisi";
    if (!form.startDate) e.startDate = "Tanggal mulai wajib diisi";
    if (!form.endDate) e.endDate = "Tanggal selesai wajib diisi";
    else if (form.startDate && form.endDate <= form.startDate) e.endDate = "Tanggal selesai harus setelah tanggal mulai";
    tickets.forEach((t, i) => {
      if (!t.name.trim()) e[`ticket${i}`] = "Nama tiket wajib diisi";
      else if (Number(t.quota) < 1) e[`ticket${i}`] = "Kuota tiket minimal 1";
      else if (Number(t.price) < 0) e[`ticket${i}`] = "Harga tidak boleh negatif";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function pickImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast("Ukuran gambar maksimal 2 MB", "error");
    setImage(file);
    setPreview(URL.createObjectURL(file));
  }

  async function submit(e) {
    e.preventDefault();
    if (!validate()) return toast("Periksa kembali isian yang ditandai", "error");
    const ok = await confirm({
      title: editing ? "Simpan perubahan acara?" : "Terbitkan acara?",
      message: editing ? "Perubahan langsung terlihat oleh pengunjung." : "Acara langsung tayang dan bisa dibeli tiketnya.",
      confirmText: editing ? "Simpan" : "Terbitkan",
    });
    if (!ok) return;

    // Form berisi file, jadi dikirim sebagai multipart/form-data
    const body = new FormData();
    Object.entries({ ...form, startDate: fromInputDateTime(form.startDate), endDate: fromInputDateTime(form.endDate) }).forEach(([k, v]) => body.append(k, v));
    body.append("ticketTypes", JSON.stringify(tickets.map(({ id, name, price, quota }) => ({ id, name, price: Number(price), quota: Number(quota) }))));
    if (image) body.append("image", image);

    setBusy(true);
    try {
      if (editing) await api.put(`/events/${id}`, body);
      else await api.post("/events", body);
      toast(editing ? "Perubahan disimpan" : "Acara berhasil diterbitkan");
      navigate("/organizer/events");
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl pb-24">
      <PageTitle title={editing ? "Edit Acara" : "Buat Acara"} />

      <section className="card space-y-4 p-6">
        <h2 className="font-bold">Info dasar</h2>
        <Field label="Nama acara" error={errors.title}>
          <input className="input" value={form.title} onChange={set("title")} placeholder="Contoh: Jakarta Indie Music Fest 2026" />
        </Field>
        <Field label="Kategori" error={errors.categoryId}>
          <select className="input" value={form.categoryId} onChange={set("categoryId")}>
            <option value="">Pilih kategori</option>
            {categories.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Deskripsi" error={errors.description}>
          <textarea className="input min-h-32" value={form.description} onChange={set("description")} placeholder="Ceritakan acaramu: siapa pengisinya, apa yang didapat peserta, dan hal yang perlu dibawa." />
        </Field>
        <div>
          <p className="label">Banner (opsional)</p>
          <label className="flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 hover:border-brand-500">
            {preview ? (
              <img src={preview} alt="Banner" className="aspect-video w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center p-8 text-center">
                <ImageUp size={30} className="text-slate-400" />
                <span className="mt-2 text-sm font-medium">Upload gambar 16:9</span>
                <span className="text-xs text-slate-500">JPG, PNG, WEBP, maksimal 2 MB</span>
              </div>
            )}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pickImage} />
          </label>
        </div>
      </section>

      <section className="card mt-6 space-y-4 p-6">
        <h2 className="font-bold">Waktu & tempat</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Mulai (WIB)" error={errors.startDate}>
            <input type="datetime-local" className="input" value={form.startDate} onChange={set("startDate")} />
          </Field>
          <Field label="Selesai (WIB)" error={errors.endDate}>
            <input type="datetime-local" className="input" value={form.endDate} onChange={set("endDate")} />
          </Field>
          <Field label="Kota" error={errors.city}>
            <select className="input" value={form.city} onChange={set("city")}>
              <option value="">Pilih kota</option>
              {[...new Set([...CITIES, form.city].filter(Boolean))].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Nama tempat / alamat" error={errors.venue}>
            <input className="input" value={form.venue} onChange={set("venue")} placeholder="Contoh: Istora Senayan" />
          </Field>
        </div>
      </section>

      <section className="card mt-6 space-y-4 p-6">
        <div>
          <h2 className="font-bold">Tiket</h2>
          <p className="text-sm text-slate-500">Isi harga 0 untuk tiket gratis.</p>
        </div>
        {tickets.map((t, i) => (
          <div key={t.id || `new-${i}`} className="rounded-lg border border-slate-200 p-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_10rem_7rem_auto] sm:items-end">
              <Field label="Nama tiket">
                <input className="input" value={t.name} onChange={(e) => setTicket(i, "name", e.target.value)} placeholder="Reguler, VIP..." />
              </Field>
              <Field label="Harga (Rp)">
                <input type="number" min="0" step="1000" className="input" value={t.price} onChange={(e) => setTicket(i, "price", e.target.value)} />
              </Field>
              <Field label="Kursi">
                <input type="number" min="1" className="input" value={t.quota} onChange={(e) => setTicket(i, "quota", e.target.value)} />
              </Field>
              <button
                type="button"
                className="rounded-lg p-2.5 text-red-600 hover:bg-red-50 disabled:opacity-30"
                disabled={tickets.length === 1 || t.sold > 0}
                onClick={() => setTickets(tickets.filter((_, j) => j !== i))}
                aria-label="Hapus tiket"
                title={t.sold > 0 ? "Sudah ada yang membeli" : "Hapus tiket"}
              >
                <Trash2 size={18} />
              </button>
            </div>
            {t.sold > 0 && <p className="mt-2 text-xs text-slate-500">Sudah terjual {t.sold} tiket, kuota minimal {t.sold}.</p>}
            {errors[`ticket${i}`] && <p className="mt-2 text-xs text-red-600">{errors[`ticket${i}`]}</p>}
          </div>
        ))}
        <button type="button" className="btn-outline" onClick={() => setTickets([...tickets, { ...emptyTicket }])}>
          <Plus size={16} /> Tambah jenis tiket
        </button>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-3xl justify-end gap-2">
          <button type="button" className="btn-outline" onClick={() => navigate("/organizer/events")}>
            Batal
          </button>
          <button className="btn-primary" disabled={busy}>
            {busy ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan Acara"}
          </button>
        </div>
      </div>
    </form>
  );
}
