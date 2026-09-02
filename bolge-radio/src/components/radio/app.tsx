import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Pause, Pencil, Play, Plus } from "lucide-react";
import { ICONS, TINT_BG, type Station } from "@/lib/radio/catalog";
import { formatTrack } from "@/lib/radio/now-playing";
import { useRadioStore } from "@/lib/radio/store";
import { cn } from "@/lib/utils";
import { EqBars } from "./eq-bars";
import { MarqueeText } from "./marquee";
import { StationEditor } from "./editor";
import { useRadioPlayer } from "./use-player";

export function RadioApp() {
  const [hydrated, setHydrated] = useState(false);
  const [editing, setEditing] = useState<Station | null | undefined>(undefined);

  const stations = useRadioStore((s) => s.stations);
  const activeId = useRadioStore((s) => s.activeId);
  const status = useRadioStore((s) => s.status);
  const error = useRadioStore((s) => s.error);
  const track = useRadioStore((s) => s.track);
  const volume = useRadioStore((s) => s.volume);
  const setVolume = useRadioStore((s) => s.setVolume);
  const toggle = useRadioStore((s) => s.toggle);
  const pause = useRadioStore((s) => s.pause);
  const play = useRadioStore((s) => s.play);

  useRadioPlayer();

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve(useRadioStore.persist.rehydrate()).finally(() => {
      if (!cancelled) setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const active = stations.find((st) => st.id === activeId) ?? null;
  const isLive = status === "playing" || status === "loading";

  return (
    <div className="fixed inset-0 overflow-y-auto overflow-x-hidden bg-bg text-fg">
      <div className="mx-auto max-w-lg">
      <header className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-[0.18em] text-subtle uppercase">
              Radio
            </p>
            <h1 className="font-display text-[2.75rem] leading-none tracking-tight italic">
              Bølge
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="mt-2 flex size-12 items-center justify-center rounded-full bg-accent text-accent-fg transition-transform duration-150 active:scale-[0.96]"
            aria-label="Tilføj station"
          >
            <Plus className="size-5" strokeWidth={2} />
          </button>
        </div>
        <p className="mt-3 max-w-[22ch] text-sm text-muted">
          Dine stationer. Tilføj en stream-adresse og vælg et ikon.
        </p>
      </header>

      <main className="px-4 pt-4 pb-36">
        {!hydrated ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/5] animate-pulse rounded-xl bg-surface"
              />
            ))}
          </div>
        ) : stations.length === 0 ? (
          <EmptyState onAdd={() => setEditing(null)} />
        ) : (
          <ul className="grid grid-cols-2 gap-3">
            {stations.map((station) => {
              const selected = station.id === activeId;
              const playingHere = selected && isLive;
              return (
                <li key={station.id} className="stagger-in">
                  <StationCard
                    station={station}
                    playing={playingHere}
                    loading={selected && status === "loading"}
                    onPlay={() => toggle(station.id)}
                    onEdit={() => setEditing(station)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </main>
      </div>

      {active ? (
        <NowPlaying
          station={active}
          status={status}
          error={error}
          track={track}
          volume={volume}
          onToggle={() => {
            if (isLive) pause();
            else play(active.id);
          }}
          onVolume={setVolume}
        />
      ) : null}

      {editing !== undefined
        ? createPortal(
            <StationEditor station={editing} onClose={() => setEditing(undefined)} />,
            document.body,
          )
        : null}
    </div>
  );
}

function StationCard({
  station,
  playing,
  loading,
  onPlay,
  onEdit,
}: {
  station: Station;
  playing: boolean;
  loading: boolean;
  onPlay: () => void;
  onEdit: () => void;
}) {
  const Icon = ICONS[station.icon] ?? ICONS.radio;

  return (
    <div className="relative rounded-xl bg-surface p-1.5 shadow-[var(--shadow-border)]">
      <button
        type="button"
        onClick={onPlay}
        className={cn(
          "flex aspect-[4/5] w-full flex-col items-start justify-between rounded-lg p-4 text-left transition-[box-shadow,transform] duration-150 active:scale-[0.98]",
          TINT_BG[station.tint],
          playing && "shadow-[var(--shadow-border-hover)]",
        )}
      >
        <span className="flex w-full items-start justify-between">
          <Icon className="size-8 text-fg" strokeWidth={1.5} />
          {playing ? <EqBars active={!loading} /> : null}
        </span>
        <span>
          <span className="block font-medium text-fg text-balance">{station.name}</span>
          <span className="mt-0.5 block text-xs text-fg/70">
            {loading ? "Forbinder…" : playing ? "Live" : "Tryk for at lytte"}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Rediger ${station.name}`}
        className="absolute top-2.5 right-2.5 flex size-10 items-center justify-center rounded-full bg-bg/40 text-fg/90 backdrop-blur-sm transition-colors duration-150 hover:bg-bg/60"
      >
        <Pencil className="size-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}

function NowPlaying({
  station,
  status,
  error,
  track,
  volume,
  onToggle,
  onVolume,
}: {
  station: Station;
  status: string;
  error: string | null;
  track: { title: string; artist: string | null } | null;
  volume: number;
  onToggle: () => void;
  onVolume: (v: number) => void;
}) {
  const Icon = ICONS[station.icon] ?? ICONS.radio;
  const live = status === "playing" || status === "loading";
  const headline = track ? formatTrack(track) : station.name;
  const subtitle =
    status === "error"
      ? (error ?? "Fejl")
      : status === "loading"
        ? track
          ? `${station.name} · Forbinder…`
          : "Forbinder…"
        : status === "playing"
          ? track
            ? `${station.name} · Live`
            : "Live"
          : track
            ? `${station.name} · Pauset`
            : "Pauset";

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-lg items-center gap-3 rounded-xl bg-elevated p-2 pr-3 shadow-[var(--shadow-border)]">
        <div
          className={cn(
            "flex size-14 shrink-0 items-center justify-center rounded-md",
            TINT_BG[station.tint],
          )}
        >
          <Icon className="size-6" strokeWidth={1.6} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="sr-only" aria-live="polite">
            {headline}
          </p>
          <MarqueeText text={headline} className="font-medium" />
          <p className="flex min-w-0 items-center gap-2 text-xs text-muted">
            {live ? <EqBars active={status === "playing"} /> : null}
            <span className={cn("truncate", status === "error" && "text-live")}>
              {subtitle}
            </span>
          </p>
        </div>
        <label className="hidden items-center sm:flex">
          <span className="sr-only">Lydstyrke</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => onVolume(Number(e.target.value))}
            className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-border accent-accent"
          />
        </label>
        <button
          type="button"
          onClick={onToggle}
          aria-label={live ? "Pause" : "Afspil"}
          className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg transition-transform duration-150 active:scale-[0.96]"
        >
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-[opacity,filter,scale] duration-200 ease-[cubic-bezier(0.2,0,0,1)]",
              live ? "scale-100 opacity-100 blur-none" : "scale-[0.25] opacity-0 blur-[4px]",
            )}
          >
            <Pause className="size-5" strokeWidth={1.8} fill="currentColor" />
          </span>
          <span
            className={cn(
              "flex items-center justify-center transition-[opacity,filter,scale] duration-200 ease-[cubic-bezier(0.2,0,0,1)]",
              live ? "scale-[0.25] opacity-0 blur-[4px]" : "scale-100 opacity-100 blur-none",
            )}
          >
            <Play className="ml-0.5 size-5" strokeWidth={1.8} fill="currentColor" />
          </span>
        </button>
      </div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-xl bg-surface px-6 py-10 text-center shadow-[var(--shadow-border)]">
      <h2 className="font-display text-3xl italic">Ingen stationer endnu</h2>
      <p className="mx-auto mt-2 max-w-[28ch] text-sm text-muted">
        Tilføj en stream-adresse og vælg et ikon, så den ligger klar på din telefon.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-6 inline-flex h-12 items-center gap-2 rounded-md bg-accent px-5 text-sm font-medium text-accent-fg transition-transform duration-150 active:scale-[0.96]"
      >
        <Plus className="size-4" strokeWidth={2} />
        Tilføj station
      </button>
    </div>
  );
}
