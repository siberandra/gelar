import { Link } from "react-router-dom";
import { CalendarDays, Dumbbell, GraduationCap, Laptop, MapPin, Mic2, Music, Sparkles, UtensilsCrossed } from "lucide-react";
import { fileUrl } from "../lib/api";
import { formatDate, priceLabel } from "../lib/format";

const GRADIENTS = {
  musik: "from-fuchsia-500 to-indigo-600",
  seminar: "from-sky-500 to-blue-700",
  workshop: "from-amber-400 to-orange-600",
  olahraga: "from-emerald-400 to-teal-700",
  kuliner: "from-rose-400 to-red-600",
  teknologi: "from-cyan-500 to-slate-700",
};

export const CATEGORY_ICONS = {
  musik: Music,
  seminar: Mic2,
  workshop: GraduationCap,
  olahraga: Dumbbell,
  kuliner: UtensilsCrossed,
  teknologi: Laptop,
};

export function EventImage({ event, className = "" }) {
  if (event.imageId) {
    return <img src={fileUrl(event.imageId)} alt={event.title} className={`object-cover ${className}`} />;
  }
  const slug = event.category?.slug;
  const gradient = GRADIENTS[slug] || "from-brand-500 to-brand-800";
  const Icon = CATEGORY_ICONS[slug] || Sparkles;
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${gradient} ${className}`} role="img" aria-label={event.title}>
      <Icon className="absolute -right-4 -bottom-6 h-3/4 w-auto text-white/15" strokeWidth={1.5} />
      <Icon className="h-1/3 max-h-16 w-auto text-white/90" strokeWidth={1.5} />
    </div>
  );
}

export default function EventCard({ event }) {
  return (
    <Link
      to={`/events/${event.slug}`}
      className="group card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="aspect-video overflow-hidden">
        <EventImage event={event} className="h-full w-full transition duration-300 group-hover:scale-105" />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <span className="mb-2 w-fit rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
          {event.category?.name}
        </span>
        <h3 className="line-clamp-2 font-semibold text-slate-900">{event.title}</h3>
        <div className="mt-2 space-y-1 text-sm text-slate-500">
          <p className="flex items-center gap-1.5">
            <CalendarDays size={15} /> {formatDate(event.startDate)}
          </p>
          <p className="flex items-center gap-1.5">
            <MapPin size={15} /> {event.city}
          </p>
        </div>
        <p className="mt-auto pt-3 text-sm">
          {event.minPrice === 0 ? (
            <span className="font-bold text-brand-700">Gratis</span>
          ) : (
            <>
              <span className="text-slate-500">Mulai </span>
              <span className="font-bold text-amber-600">{priceLabel(event.minPrice)}</span>
            </>
          )}
        </p>
      </div>
    </Link>
  );
}
