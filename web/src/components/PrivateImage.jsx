import { useEffect, useState } from "react";
import api from "../lib/api";

// Bukti bayar bersifat privat: harus diminta dengan token login.
// Tag <img> biasa tidak bisa mengirim token, jadi gambar diambil lewat Axios lalu ditampilkan sebagai blob.
export default function PrivateImage({ fileId, alt, className }) {
  const [src, setSrc] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let url;
    api
      .get(`/files/${fileId}`, { responseType: "blob" })
      .then((res) => {
        url = URL.createObjectURL(res.data);
        setSrc(url);
      })
      .catch(() => setFailed(true));
    return () => url && URL.revokeObjectURL(url);
  }, [fileId]);

  if (failed) return <p className="text-sm text-red-600">Gambar tidak bisa dimuat</p>;
  if (!src) return <div className={`animate-pulse bg-slate-100 ${className}`} />;
  return (
    <a href={src} target="_blank" rel="noreferrer">
      <img src={src} alt={alt} className={className} />
    </a>
  );
}
