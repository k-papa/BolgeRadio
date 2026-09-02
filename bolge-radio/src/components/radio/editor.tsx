import { useEffect, useId, useState } from "react";
import { Check, Trash2, X } from "lucide-react";
import {
  ICON_KEYS,
  ICONS,
  TINTS,
  TINT_BG,
  type IconKey,
  type Station,
  type TintKey,
} from "@/lib/radio/catalog";
import { useRadioStore } from "@/lib/radio/store";
import { cn } from "@/lib/utils";

type EditorProps = {
  station: Station | null;
  onClose: () => void;
};

function isStreamUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function StationEditor({ station, onClose }: EditorProps) {
  const addStation = useRadioStore((s) => s.addStation);
  const updateStation = useRadioStore((s) => s.updateStation);
  const removeStation = useRadioStore((s) => s.removeStation);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(station?.name ?? "");
  const [url, setUrl] = useState(station?.url ?? "");
  const [icon, setIcon] = useState<IconKey>(station?.icon ?? "radio");
  const [tint, setTint] = useState<TintKey>(station?.tint ?? "steel");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameId = useId();
  const urlId = useId();
  const Icon = ICONS[icon];

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(id);
  }, []);

  function close() {
    setOpen(false);
    window.setTimeout(onClose, 160);
  }

  function save() {
    const trimmedName = name.trim();
    const trimmedUrl = url.trim();
    if (!trimmedName) {
      setError("Giv stationen et navn.");
      return;
    }
    if (!isStreamUrl(trimmedUrl)) {
      setError("Indsæt en gyldig http- eller https-adresse.");
      return;
    }
    const draft = { name: trimmedName, url: trimmedUrl, icon, tint };
    if (station) updateStation(station.id, draft);
    else addStation(draft);
    close();
  }

  function onDelete() {
    if (!station) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    removeStation(station.id);
    close();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className={cn("sheet-overlay absolute inset-0 bg-bg/70", open && "open")}
        aria-label="Luk"
        onClick={close}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-title"
        className={cn(
          "sheet-panel relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-surface shadow-[var(--shadow-border)] sm:rounded-2xl",
          open && "open",
        )}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <h2 id="editor-title" className="font-display text-2xl tracking-tight">
            {station ? "Rediger station" : "Ny station"}
          </h2>
          <button
            type="button"
            onClick={close}
            className="flex size-11 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:bg-elevated hover:text-fg active:scale-[0.96]"
            aria-label="Luk"
          >
            <X className="size-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
          <div className="mb-5 flex items-center gap-4">
            <div
              className={cn(
                "flex size-16 items-center justify-center rounded-lg text-fg",
                TINT_BG[tint],
              )}
            >
              <Icon className="size-7" strokeWidth={1.6} />
            </div>
            <p className="text-sm text-muted">
              Vælg et ikon og en farve, så du kender stationen på et øjeblik.
            </p>
          </div>

          <p className="mb-2 text-xs font-medium tracking-wide text-subtle uppercase">
            Ikon
          </p>
          <div className="mb-5 grid grid-cols-6 gap-1.5 sm:grid-cols-8">
            {ICON_KEYS.map((key) => {
              const Item = ICONS[key];
              const selected = key === icon;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIcon(key)}
                  aria-label={key}
                  aria-pressed={selected}
                  className={cn(
                    "flex size-11 items-center justify-center rounded-md transition-[background-color,box-shadow,color] duration-150",
                    selected
                      ? "bg-accent text-accent-fg shadow-[var(--shadow-border)]"
                      : "bg-elevated text-muted hover:text-fg",
                  )}
                >
                  <Item className="size-5" strokeWidth={1.7} />
                </button>
              );
            })}
          </div>

          <p className="mb-2 text-xs font-medium tracking-wide text-subtle uppercase">
            Farve
          </p>
          <div className="mb-6 flex flex-wrap gap-2">
            {TINTS.map((key) => {
              const selected = key === tint;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTint(key)}
                  aria-label={key}
                  aria-pressed={selected}
                  className={cn(
                    "flex size-11 items-center justify-center rounded-full transition-transform duration-150 active:scale-[0.96]",
                    TINT_BG[key],
                    selected && "ring-2 ring-fg ring-offset-2 ring-offset-surface",
                  )}
                >
                  {selected ? <Check className="size-4 text-fg" strokeWidth={2.4} /> : null}
                </button>
              );
            })}
          </div>

          <label htmlFor={nameId} className="mb-1.5 block text-sm font-medium text-muted">
            Navn
          </label>
          <input
            id={nameId}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="DR P3"
            autoComplete="off"
            className="mb-4 h-12 w-full rounded-md border-0 bg-elevated px-3.5 text-base text-fg shadow-[var(--shadow-border)] outline-none transition-[box-shadow] duration-150 placeholder:text-subtle focus:shadow-[var(--shadow-border-hover)]"
          />

          <label htmlFor={urlId} className="mb-1.5 block text-sm font-medium text-muted">
            Stream-adresse
          </label>
          <input
            id={urlId}
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            placeholder="https://…"
            inputMode="url"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="mb-2 h-12 w-full rounded-md border-0 bg-elevated px-3.5 font-mono text-sm text-fg shadow-[var(--shadow-border)] outline-none transition-[box-shadow] duration-150 placeholder:font-sans placeholder:text-subtle focus:shadow-[var(--shadow-border-hover)]"
          />
          <p className="text-sm text-subtle">
            Brug den direkte lydadresse (ofte .mp3 eller .aac) — ikke stationens hjemmeside.
          </p>

          {error ? (
            <p className="mt-3 text-sm text-live" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2 border-t border-border px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {station ? (
            <button
              type="button"
              onClick={onDelete}
              className={cn(
                "flex h-12 items-center gap-2 rounded-md px-3.5 text-sm font-medium transition-colors duration-150 active:scale-[0.96]",
                confirmDelete ? "bg-live/15 text-live" : "text-muted hover:text-fg",
              )}
            >
              <Trash2 className="size-4" strokeWidth={1.75} />
              {confirmDelete ? "Slet nu" : "Slet"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={close}
            className="ml-auto h-12 rounded-md px-4 text-sm font-medium text-muted transition-colors duration-150 hover:text-fg"
          >
            Annuller
          </button>
          <button
            type="button"
            onClick={save}
            className="h-12 rounded-md bg-accent px-5 text-sm font-medium text-accent-fg transition-transform duration-150 active:scale-[0.96]"
          >
            Gem
          </button>
        </div>
      </div>
    </div>
  );
}
