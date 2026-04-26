"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import RecipeImage from "@/components/etkezes/RecipeImage";
import type { Recipe } from "@/types/etkezes";

interface Props {
  recipe: Recipe;
  onClose: () => void;
}

type WakeLockSentinelLike = {
  release: () => Promise<void>;
  addEventListener?: (type: string, listener: () => void) => void;
};

type PlaylistTrack = {
  title: string;
  artist: string;
  mood: string;
  sourceLabel: string;
  url: string;
};

const COOKING_PLAYLIST: PlaylistTrack[] = [
  {
    title: "Placid Ambient",
    artist: "MusicLFiles",
    mood: "nyugodt, könnyű háttérzene",
    sourceLabel: "Wikimedia Commons",
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Placid%20Ambient%20by%20MusicLFiles.ogg",
  },
  {
    title: "Peaceful",
    artist: "Tamlin Lollis Love",
    mood: "lágy, meditatív hangulat",
    sourceLabel: "Wikimedia Commons",
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Peaceful.ogg",
  },
  {
    title: "Brenticus - Ambient",
    artist: "Brenticus",
    mood: "finom, lebegő háttér",
    sourceLabel: "Wikimedia Commons",
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Brenticus%20-%20Ambient.ogg",
  },
];

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="overflow-hidden rounded-full bg-surface-container h-2.5">
      <div
        className="h-full rounded-full bg-primary transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export default function CookingSessionModal({ recipe, onClose }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const [wakeLockSupported, setWakeLockSupported] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [playlistAnswered, setPlaylistAnswered] = useState(false);
  const [musicStarted, setMusicStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [musicError, setMusicError] = useState<string | null>(null);

  const totalItems = recipe.ingredients.length + recipe.instructions.length;
  const doneItems = checkedIngredients.size + checkedSteps.size;
  const progress = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
  const currentTrack = COOKING_PLAYLIST[currentTrackIndex];

  const progressLabel = useMemo(() => {
    if (progress === 100) return "Kész vagy";
    if (progress >= 70) return "Már a végén jársz";
    if (progress >= 35) return "Jól haladsz";
    return "Indulhat a főzés";
  }, [progress]);

  useEffect(() => {
    setCheckedIngredients(new Set());
    setCheckedSteps(new Set());
    setPlaylistAnswered(false);
    setMusicStarted(false);
    setIsPlaying(false);
    setCurrentTrackIndex(0);
    setMusicError(null);
  }, [recipe.id]);

  useEffect(() => {
    let activeSentinel: WakeLockSentinelLike | null = null;

    async function requestWakeLock() {
      if (typeof navigator === "undefined" || !("wakeLock" in navigator)) {
        setWakeLockSupported(false);
        return;
      }

      setWakeLockSupported(true);

      try {
        activeSentinel = await (navigator as Navigator & {
          wakeLock: { request: (type: "screen") => Promise<WakeLockSentinelLike> };
        }).wakeLock.request("screen");
        setWakeLockActive(true);

        activeSentinel.addEventListener?.("release", () => {
          setWakeLockActive(false);
        });
      } catch {
        setWakeLockActive(false);
      }
    }

    void requestWakeLock();

    return () => {
      if (activeSentinel) {
        void activeSentinel.release();
      }
      setWakeLockActive(false);
    };
  }, [recipe.id]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !musicStarted || !isPlaying) return;

    audio.src = currentTrack.url;
    audio.load();

    const playPromise = audio.play();
    if (playPromise) {
      void playPromise.catch(() => {
        setMusicError("A böngésző blokkolta az automatikus lejátszást. Nyomd meg a play gombot.");
      });
    }
  }, [currentTrack.url, isPlaying, musicStarted]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const toggleIngredient = (index: number) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleStep = (index: number) => {
    setCheckedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const startPlaylist = () => {
    setPlaylistAnswered(true);
    setMusicError(null);
    setMusicStarted(true);
    setIsPlaying(true);
    setCurrentTrackIndex(0);
    const audio = audioRef.current;
    if (audio) {
      audio.src = COOKING_PLAYLIST[0].url;
      audio.load();
      const playPromise = audio.play();
      if (playPromise) {
        void playPromise.catch(() => {
          setMusicError("A böngésző még most is blokkolja az automatikus lejátszást.");
        });
      }
    }
  };

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      setMusicStarted(true);
      setIsPlaying(true);
      setMusicError(null);
      void audio.play().catch(() => {
        setMusicError("Nem sikerült elindítani a zenét. Próbáld meg újra.");
      });
      return;
    }

    audio.pause();
  };

  const handleTrackEnded = () => {
    setCurrentTrackIndex((index) => (index + 1) % COOKING_PLAYLIST.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-0 backdrop-blur-sm sm:p-4">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden bg-[linear-gradient(180deg,rgba(253,251,248,0.99),rgba(248,244,239,0.98))] shadow-[0_32px_100px_-26px_rgba(20,25,20,0.48)] sm:h-[min(92vh,860px)] sm:rounded-[32px] sm:border sm:border-white/70">
        <div className="shrink-0 border-b border-white/70 bg-white/85 px-5 py-4 backdrop-blur-md sm:px-6">
          {!playlistAnswered && (
            <div className="mb-4 flex flex-col gap-3 rounded-[20px] border border-primary/15 bg-primary/[0.05] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-on-surface">Indítsunk egy ingyenes főzős playlistet is?</p>
              <div className="flex gap-2">
                <button
                  onClick={startPlaylist}
                  className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                >
                  Igen
                </button>
                <button
                  onClick={() => setPlaylistAnswered(true)}
                  className="rounded-full border border-surface-variant bg-white px-4 py-2 text-xs font-semibold text-on-surface cursor-pointer"
                >
                  Most ne
                </button>
              </div>
            </div>
          )}

          {playlistAnswered && (
            <div className="mb-4 rounded-[20px] border border-surface-variant/60 bg-surface-container-low px-4 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-outline">Főzős zene</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-on-surface">
                    <span className="font-medium">{currentTrack.title}</span>
                    <span className="text-on-surface-variant">•</span>
                    <span>{currentTrack.artist}</span>
                  </div>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {currentTrack.mood} - ingyenes forrás: {currentTrack.sourceLabel}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePlayPause}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-xs font-semibold text-white cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">{isPlaying ? "pause" : "play_arrow"}</span>
                    {isPlaying ? "Szünet" : "Lejátszás"}
                  </button>
                  <button
                    onClick={handleTrackEnded}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-surface-variant bg-white px-4 text-xs font-semibold text-on-surface cursor-pointer"
                  >
                    Következő
                  </button>
                </div>
              </div>
              {musicError && <p className="mt-2 text-xs text-error">{musicError}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {COOKING_PLAYLIST.map((track, index) => (
                  <button
                    key={track.title}
                    onClick={() => {
                      setPlaylistAnswered(true);
                      setMusicStarted(true);
                      setIsPlaying(true);
                      setMusicError(null);
                      setCurrentTrackIndex(index);
                    }}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                      index === currentTrackIndex
                        ? "bg-primary text-white"
                        : "bg-white text-on-surface border border-surface-variant"
                    }`}
                  >
                    {track.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-outline">Főzés folyamatban</p>
              <h2 className="mt-1 text-2xl font-semibold text-on-surface">{recipe.name}</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                {progressLabel}. {doneItems}/{totalItems} tétel kész.
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-on-surface-variant shadow-sm transition-colors hover:bg-surface-container cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
            <div className="relative h-32 overflow-hidden rounded-[22px] border border-white/70 shadow-sm">
              <RecipeImage recipe={recipe} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/28 via-black/8 to-transparent" />
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-on-surface-variant">
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[17px]">schedule</span>
                  {recipe.duration} perc
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[17px]">restaurant</span>
                  {recipe.instructions.length} lépés
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[17px]">shopping_basket</span>
                  {recipe.ingredients.length} hozzávaló
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[17px]">screen_lock_portrait</span>
                  {wakeLockSupported ? (wakeLockActive ? "Képernyő ébren tartva" : "Ébren tartás kérése fut") : "Ébren tartás itt nem támogatott"}
                </span>
              </div>
              <ProgressBar progress={progress} />
            </div>
          </div>
        </div>

        <div className="grid flex-1 gap-5 overflow-y-auto px-5 py-5 sm:px-6 lg:grid-cols-[0.92fr_1.08fr]">
          <section className="rounded-[24px] border border-surface-variant/50 bg-white/85 p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-outline">Hozzávalók</p>
                <h3 className="mt-1 text-lg font-semibold text-on-surface">Mi kell hozzá?</h3>
              </div>
              <span className="rounded-full bg-primary/[0.08] px-3 py-1 text-xs font-semibold text-primary">
                {checkedIngredients.size}/{recipe.ingredients.length}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {recipe.ingredients.map((ingredient, index) => {
                const checked = checkedIngredients.has(index);
                return (
                  <button
                    key={`${ingredient}-${index}`}
                    onClick={() => toggleIngredient(index)}
                    className="flex items-center gap-3 rounded-[18px] border border-surface-variant/50 bg-white px-3.5 py-3 text-left transition-colors hover:bg-surface-container-lowest cursor-pointer"
                  >
                    <span className={`flex h-5 w-5 items-center justify-center rounded border ${checked ? "border-primary bg-primary text-white" : "border-outline-variant bg-white"}`}>
                      {checked && <span className="material-symbols-outlined text-[14px]">check</span>}
                    </span>
                    <span className={`text-sm ${checked ? "text-outline line-through" : "text-on-surface"}`}>{ingredient}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-[24px] border border-surface-variant/50 bg-white/85 p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-outline">Lépések</p>
                <h3 className="mt-1 text-lg font-semibold text-on-surface">Hol tartasz most?</h3>
              </div>
              <span className="rounded-full bg-primary/[0.08] px-3 py-1 text-xs font-semibold text-primary">
                {checkedSteps.size}/{recipe.instructions.length}
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {recipe.instructions.map((step, index) => {
                const checked = checkedSteps.has(index);
                return (
                  <button
                    key={`${recipe.id}-step-${index}`}
                    onClick={() => toggleStep(index)}
                    className="flex items-start gap-3 rounded-[18px] border border-surface-variant/50 bg-white px-3.5 py-3 text-left transition-colors hover:bg-surface-container-lowest cursor-pointer"
                  >
                    <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${checked ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant"}`}>
                      {checked ? "✓" : index + 1}
                    </span>
                    <span className={`text-sm leading-relaxed ${checked ? "text-outline line-through" : "text-on-surface"}`}>{step}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <audio
          ref={audioRef}
          preload="none"
          onEnded={handleTrackEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={() => setMusicError("Nem sikerült betölteni a zenét. Próbálj másik számot.")}
        />
      </div>
    </div>
  );
}
