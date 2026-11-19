import { rupiah } from "../lib/format";

function short(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 ? 1 : 0)} jt`;
  if (value >= 1000) return `${Math.round(value / 1000)} rb`;
  return String(value);
}

function niceMax(value) {
  if (value <= 0) return 0;
  const base = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 4, 5, 8, 10].find((s) => s * base >= value);
  return step * base;
}

export default function BarChart({ data }) {
  const max = niceMax(Math.max(...data.map((d) => d.revenue), 0));
  const ticks = [1, 0.75, 0.5, 0.25, 0];

  if (max === 0) {
    return <div className="flex h-64 items-center justify-center text-sm text-slate-500">Tidak ada penjualan pada periode ini</div>;
  }

  return (
    <div className="flex h-72 gap-2">
      <div className="flex flex-col justify-between pb-6 text-right text-[11px] text-slate-400">
        {ticks.map((t) => (
          <span key={t}>{short(Math.round(max * t))}</span>
        ))}
      </div>
      <div className="relative flex min-w-0 flex-1 items-end gap-[3px] border-b border-l border-slate-200 pb-0 sm:gap-1.5">
        {ticks.slice(0, -1).map((t) => (
          <div key={t} className="pointer-events-none absolute inset-x-0 border-t border-dashed border-slate-100" style={{ bottom: `${t * 100}%` }} />
        ))}
        {data.map((d) => (
          <div key={d.label} className="group relative flex h-full flex-1 flex-col justify-end">
            <div
              className="rounded-t bg-brand-600 transition group-hover:bg-amber-500"
              style={{ height: `${(d.revenue / max) * 100}%`, minHeight: d.revenue ? 2 : 0 }}
            />
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 sm:text-[11px]">{data.length > 16 && Number(d.label) % 5 !== 1 ? "" : d.label}</span>
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
              <p className="font-semibold">{d.label}</p>
              <p>{rupiah(d.revenue)}</p>
              <p>{d.tickets} tiket</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
