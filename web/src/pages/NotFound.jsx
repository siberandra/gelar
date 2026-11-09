import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-6xl font-extrabold text-brand-700">404</p>
      <h1 className="mt-4 text-xl font-bold">Halaman tidak ditemukan</h1>
      <p className="mt-2 text-sm text-slate-500">Alamat yang kamu buka tidak ada atau sudah dipindahkan.</p>
      <Link to="/" className="btn-primary mt-6">
        Kembali ke beranda
      </Link>
    </div>
  );
}
