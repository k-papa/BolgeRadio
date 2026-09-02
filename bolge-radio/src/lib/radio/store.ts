import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  PRESET_STATIONS,
  type IconKey,
  type Station,
  type TintKey,
} from "./catalog";
import type { TrackInfo } from "./now-playing";

export type PlayerStatus = "idle" | "loading" | "playing" | "paused" | "error";

export type StationDraft = {
  name: string;
  url: string;
  icon: IconKey;
  tint: TintKey;
};

type RadioState = {
  stations: Station[];
  activeId: string | null;
  status: PlayerStatus;
  volume: number;
  error: string | null;
  track: TrackInfo | null;
  addStation: (draft: StationDraft) => string;
  updateStation: (id: string, draft: StationDraft) => void;
  removeStation: (id: string) => void;
  play: (id: string) => void;
  pause: () => void;
  toggle: (id: string) => void;
  setStatus: (status: PlayerStatus, error?: string | null) => void;
  setTrack: (track: TrackInfo | null) => void;
  setVolume: (volume: number) => void;
};

export const useRadioStore = create<RadioState>()(
  persist(
    (set, get) => ({
      stations: PRESET_STATIONS,
      activeId: null,
      status: "idle",
      volume: 1,
      error: null,
      track: null,

      addStation: (draft) => {
        const station: Station = {
          id: crypto.randomUUID(),
          name: draft.name.trim(),
          url: draft.url.trim(),
          icon: draft.icon,
          tint: draft.tint,
        };
        set((s) => ({ stations: [...s.stations, station] }));
        return station.id;
      },

      updateStation: (id, draft) => {
        set((s) => ({
          stations: s.stations.map((st) =>
            st.id === id
              ? {
                  ...st,
                  name: draft.name.trim(),
                  url: draft.url.trim(),
                  icon: draft.icon,
                  tint: draft.tint,
                }
              : st,
          ),
        }));
      },

      removeStation: (id) => {
        const { activeId } = get();
        set((s) => ({
          stations: s.stations.filter((st) => st.id !== id),
          activeId: activeId === id ? null : s.activeId,
          status: activeId === id ? "idle" : s.status,
          error: activeId === id ? null : s.error,
          track: activeId === id ? null : s.track,
        }));
      },

      play: (id) => {
        const station = get().stations.find((st) => st.id === id);
        if (!station) return;
        set({
          activeId: id,
          status: "loading",
          error: null,
          track: null,
        });
      },

      pause: () => {
        const { status } = get();
        if (status === "idle") return;
        set({ status: "paused" });
      },

      toggle: (id) => {
        const { activeId, status } = get();
        if (activeId === id && (status === "playing" || status === "loading")) {
          get().pause();
          return;
        }
        get().play(id);
      },

      setStatus: (status, error = null) => {
        set({ status, error });
      },

      setTrack: (track) => {
        set({ track });
      },

      setVolume: (volume) => {
        set({ volume: Math.min(1, Math.max(0, volume)) });
      },
    }),
    {
      name: "bolge-radio-v1",
      skipHydration: true,
      partialize: (s) => ({
        stations: s.stations,
        volume: s.volume,
      }),
    },
  ),
);
