"use client";

import { SkipForward } from "lucide-react";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

/**
 * Loading screen → intro. Progress is cosmetic until the scene reports its
 * first rendered frame; then the intro starts automatically and can be skipped.
 */
export function Loader() {
  const phase = useStore((s) => s.phase);
  const setPhase = useStore((s) => s.setPhase);
  const [progress, setProgress] = useState(0);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (phase !== "loading") return;
    const id = setInterval(() => setProgress((p) => Math.min(92, p + (92 - p) * 0.08 + 0.4)), 60);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "ready") return;
    const id = setTimeout(() => setPhase("intro"), 450);
    return () => clearTimeout(id);
  }, [phase, setPhase]);

  useEffect(() => {
    if (phase !== "intro" && phase !== "explore") return;
    const id = setTimeout(() => setGone(true), 900);
    return () => clearTimeout(id);
  }, [phase]);

  const fading = phase === "intro" || phase === "explore";
  const shown = phase === "loading" ? progress : 100;
  return (
    <>
      {!gone && (
        <div
          className={`fixed inset-0 z-50 grid place-items-center bg-[#05070c] transition-opacity duration-700 ${fading ? "pointer-events-none opacity-0" : "opacity-100"}`}
          role="status"
          aria-live="polite"
        >
          <div className="flex w-64 flex-col items-center">
            <div className="loader-mark font-display text-2xl font-bold tracking-tight text-teal-200">YM</div>
            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.3em] text-slate-500">Booting workspace</p>
            <div className="mt-3 h-px w-full overflow-hidden bg-white/10">
              <div className="h-full bg-gradient-to-r from-teal-300 to-amber-300 transition-[width] duration-300" style={{ width: `${shown}%` }} />
            </div>
            <p className="mt-2 font-mono text-xs tabular-nums text-slate-500">{Math.round(shown)}%</p>
          </div>
        </div>
      )}
      {phase === "intro" && (
        <button className="btn-ghost fixed bottom-6 right-6 z-50 bg-black/40 backdrop-blur" onClick={() => setPhase("explore")}>
          Skip intro <SkipForward size={15} />
        </button>
      )}
    </>
  );
}
