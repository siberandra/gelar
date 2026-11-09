import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import EventCard from "../components/EventCard";
import { Avatar, EmptyState, ErrorBox, Spinner, Stars } from "../components/common";
import { formatDate } from "../lib/format";

export default function OrganizerProfile() {
  const { id } = useParams();
  const { data, loading, error } = useFetch(`/organizers/${id}`);
  const [tab, setTab] = useState("events");

  if (loading) return <Spinner />;
  if (error) return <div className="mx-auto max-w-3xl px-4 py-16"><ErrorBox message={error} /></div>;

  const maxCount = Math.max(1, ...data.breakdown.map((b) => b.count));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="card flex flex-col gap-6 p-6 md:flex-row md:items-center">
        <div className="flex flex-1 items-center gap-4">
          <Avatar name={data.name} fileId={data.avatarId} size={72} />
          <div>
            <h1 className="text-2xl font-bold">{data.name}</h1>
            {data.bio && <p className="mt-1 text-sm text-slate-600">{data.bio}</p>}
            <p className="mt-1 text-xs text-slate-400">Bergabung {formatDate(data.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-6 border-t border-slate-100 pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
          <div className="text-center">
            <p className="text-4xl font-extrabold">{data.rating || "-"}</p>
            <Stars value={data.rating} />
            <p className="text-xs text-slate-500">{data.reviewCount} ulasan</p>
          </div>
          <div className="w-40 space-y-1">
            {data.breakdown.map((b) => (
              <div key={b.star} className="flex items-center gap-2 text-xs">
                <span className="w-3">{b.star}</span>
                <div className="h-2 flex-1 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-amber-400" style={{ width: `${(b.count / maxCount) * 100}%` }} />
                </div>
                <span className="w-5 text-right text-slate-500">{b.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex gap-1 border-b border-slate-200">
        {[
          ["events", `Acara Mendatang (${data.events.length})`],
          ["reviews", `Ulasan (${data.reviews.length})`],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold ${tab === key ? "border-brand-700 text-brand-800" : "border-transparent text-slate-500"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "events" &&
          (data.events.length === 0 ? (
            <EmptyState title="Belum ada acara mendatang" />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.events.map((e) => (
                <EventCard key={e.id} event={{ ...e, minPrice: Math.min(...e.ticketTypes.map((t) => t.price)) }} />
              ))}
            </div>
          ))}

        {tab === "reviews" &&
          (data.reviews.length === 0 ? (
            <EmptyState title="Belum ada ulasan" />
          ) : (
            <div className="space-y-3">
              {data.reviews.map((r) => (
                <div key={r.id} className="card p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Avatar name={r.user.name} fileId={r.user.avatarId} size={32} />
                    <div>
                      <p className="text-sm font-semibold">{r.user.name}</p>
                      <Stars value={r.rating} size={13} />
                    </div>
                    <span className="ml-auto text-xs text-slate-400">{formatDate(r.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{r.comment}</p>
                  <Link to={`/events/${r.event.slug}`} className="mt-2 inline-block text-xs font-semibold text-brand-700 hover:underline">
                    {r.event.title}
                  </Link>
                </div>
              ))}
            </div>
          ))}
      </div>
    </div>
  );
}
