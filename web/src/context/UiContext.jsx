import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import Modal from "../components/Modal";

const UiContext = createContext(null);

// Menyediakan dua hal untuk semua halaman:
// - toast(pesan, "success" | "error")
// - confirm({ title, message, confirmText, danger }) -> Promise<boolean>
export function UiProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const resolver = useRef(null);

  const toast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list, { id, message, type }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3500);
  }, []);

  const confirm = useCallback((options) => {
    setDialog(options);
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  function close(result) {
    resolver.current?.(result);
    setDialog(null);
  }

  return (
    <UiContext.Provider value={{ toast, confirm }}>
      {children}

      <Modal open={Boolean(dialog)} onClose={() => close(false)} title={dialog?.title}>
        <p className="text-sm text-slate-600">{dialog?.message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => close(false)}>
            Batal
          </button>
          <button className={dialog?.danger ? "btn-danger" : "btn-primary"} onClick={() => close(true)} autoFocus>
            {dialog?.confirmText || "Ya, lanjutkan"}
          </button>
        </div>
      </Modal>

      <div className="fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${
              t.type === "error" ? "bg-red-600" : "bg-slate-900"
            }`}
          >
            {t.type === "error" ? <XCircle size={18} /> : <CheckCircle2 size={18} className="text-brand-500" />}
            {t.message}
          </div>
        ))}
      </div>
    </UiContext.Provider>
  );
}

export function useUi() {
  return useContext(UiContext);
}
