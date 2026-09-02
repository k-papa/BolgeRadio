import { useEffect, useRef } from "react";
import { formatTrack, getStreamTrack } from "@/lib/radio/now-playing";
import { useRadioStore } from "@/lib/radio/store";

function mediaArtwork(color: string): { src: string; sizes: string; type: string }[] {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 192;
    canvas.height = 192;
    const ctx = canvas.getContext("2d");
    if (!ctx) return [];
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 192, 192);
    ctx.fillStyle = "rgba(244,244,245,0.92)";
    ctx.beginPath();
    ctx.arc(96, 96, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(96, 96, 12, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    return [{ src: canvas.toDataURL("image/png"), sizes: "192x192", type: "image/png" }];
  } catch {
    return [];
  }
}

const TINT_HEX: Record<string, string> = {
  ink: "#2c2c32",
  steel: "#4a5568",
  ocean: "#3a5363",
  forest: "#3a4d44",
  wine: "#5a3e42",
  clay: "#5c4a3c",
  dusk: "#43485c",
  fog: "#5c6168",
};

export function useRadioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSrc = useRef<string | null>(null);

  const stations = useRadioStore((s) => s.stations);
  const activeId = useRadioStore((s) => s.activeId);
  const status = useRadioStore((s) => s.status);
  const volume = useRadioStore((s) => s.volume);
  const setStatus = useRadioStore((s) => s.setStatus);
  const play = useRadioStore((s) => s.play);
  const pause = useRadioStore((s) => s.pause);
  const setTrack = useRadioStore((s) => s.setTrack);
  const track = useRadioStore((s) => s.track);

  const active = stations.find((st) => st.id === activeId) ?? null;

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audio.setAttribute("playsinline", "true");
    audioRef.current = audio;

    const onPlaying = () => setStatus("playing");
    const onWaiting = () => {
      const current = useRadioStore.getState();
      if (current.status === "paused" || current.status === "idle") return;
      setStatus("loading");
    };
    const onPause = () => {
      const current = useRadioStore.getState();
      if (current.status === "playing") {
        setStatus("paused");
      }
    };
    const onError = () => {
      setStatus("error", "Streamen kunne ikke startes. Tjek adressen.");
    };

    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [setStatus]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!active || status === "idle" || status === "paused") {
      if (!audio.paused) audio.pause();
      if (status === "idle") {
        audio.removeAttribute("src");
        lastSrc.current = null;
      }
      return;
    }

    if (status === "playing" && !audio.paused && lastSrc.current === active.url) {
      return;
    }

    const start = async () => {
      audio.src = active.url;
      lastSrc.current = active.url;
      audio.load();
      try {
        await audio.play();
      } catch (err) {
        const name = err instanceof DOMException ? err.name : "";
        if (name === "AbortError" || name === "NotAllowedError") return;
        setStatus("error", "Streamen kunne ikke startes. Tjek adressen.");
      }
    };

    void start();
  }, [active, status, setStatus]);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    const ctrl = new AbortController();

    const pull = async () => {
      const st = useRadioStore.getState().status;
      if (st === "paused" || st === "idle" || st === "error") return;
      try {
        const next = await getStreamTrack({
          data: { url: active.url },
          signal: ctrl.signal,
        });
        if (cancelled || !next) return;
        const current = useRadioStore.getState().track;
        if (current?.title === next.title && current?.artist === next.artist) {
          return;
        }
        setTrack(next);
      } catch {
        /* aborted or unreachable */
      }
    };

    void pull();
    const id = window.setInterval(() => {
      void pull();
    }, 15000);

    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearInterval(id);
    };
  }, [active, setTrack]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const session = navigator.mediaSession;

    if (!active) {
      session.metadata = null;
      return;
    }

    session.metadata = new MediaMetadata({
      title: track ? formatTrack(track) : active.name,
      artist: track?.artist ? active.name : "Bølge",
      album: active.name,
      artwork: mediaArtwork(TINT_HEX[active.tint] ?? "#2c2c32"),
    });
    session.playbackState =
      status === "playing" ? "playing" : status === "loading" ? "playing" : "paused";

    session.setActionHandler("play", () => play(active.id));
    session.setActionHandler("pause", () => pause());
    session.setActionHandler("stop", () => pause());
    session.setActionHandler("previoustrack", () => {
      const list = useRadioStore.getState().stations;
      if (list.length === 0) return;
      const idx = list.findIndex((st) => st.id === active.id);
      const prev = list[(idx - 1 + list.length) % list.length];
      if (prev) play(prev.id);
    });
    session.setActionHandler("nexttrack", () => {
      const list = useRadioStore.getState().stations;
      if (list.length === 0) return;
      const idx = list.findIndex((st) => st.id === active.id);
      const next = list[(idx + 1) % list.length];
      if (next) play(next.id);
    });

    return () => {
      session.setActionHandler("play", null);
      session.setActionHandler("pause", null);
      session.setActionHandler("stop", null);
      session.setActionHandler("previoustrack", null);
      session.setActionHandler("nexttrack", null);
    };
  }, [active, status, play, pause, track]);
}
