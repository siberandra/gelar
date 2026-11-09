import { useEffect, useState } from "react";

// Nilai baru dipakai setelah user berhenti mengetik selama `delay` ms.
// Jadi request pencarian tidak dikirim di setiap ketukan tombol.
export default function useDebounce(value, delay = 500) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
