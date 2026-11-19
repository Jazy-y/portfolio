"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { SECTIONS, sectionMeta, type Section } from "@/content/profile";
import { useStore } from "@/lib/store";
import { ClassicView } from "./ClassicView";
import { DemoModal } from "./DemoModal";
import { FocusBar } from "./FocusBar";
import { Hero } from "./Hero";
import { Loader } from "./Loader";
import { Nav } from "./Nav";
import { Panel } from "./Panel";

const Scene = dynamic(() => import("@/components/experience/Scene"), { ssr: false });

type Mode = "pending" | "3d" | "classic";

function sectionFromPath(pathname: string): Section {
  const match = SECTIONS.find((s) => sectionMeta[s].path === pathname.replace(/\/$/, "") || (s === "home" && pathname === "/"));
  return match ?? "home";
}

let webglCache: boolean | null = null;
function hasWebGL() {
  if (webglCache !== null) return webglCache;
  try {
    const c = document.createElement("canvas");
    webglCache = Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    webglCache = false;
  }
  return webglCache;
}

const noop = () => () => {};
const MOBILE_QUERY = "(max-width: 820px), (pointer: coarse)";
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
function mediaStore(query: string) {
  return {
    subscribe: (cb: () => void) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    get: () => window.matchMedia(query).matches,
  };
}
const mobileStore = mediaStore(MOBILE_QUERY);
const reducedStore = mediaStore(REDUCED_QUERY);

function readStoredMode(): "3d" | "classic" | null {
  try {
    const v = localStorage.getItem("view-mode");
    return v === "3d" || v === "classic" ? v : null;
  } catch {
    return null;
  }
}

export function PortfolioApp({ initialSection }: { initialSection: Section }) {
  const isClient = useSyncExternalStore(noop, () => true, () => false);
  const webgl = useSyncExternalStore(noop, hasWebGL, () => true);
  const mobile = useSyncExternalStore(mobileStore.subscribe, mobileStore.get, () => false);
  const reduced = useSyncExternalStore(reducedStore.subscribe, reducedStore.get, () => false);
  const stored = useSyncExternalStore(noop, readStoredMode, () => null);
  const [choice, setChoice] = useState<"3d" | "classic" | null>(null);
  const preferred = choice ?? stored ?? "3d";
  const mode: Mode = !isClient ? "pending" : webgl && preferred === "3d" ? "3d" : "classic";

  const section = useStore((s) => s.section);
  const setSection = useStore((s) => s.setSection);
  const setPhase = useStore((s) => s.setPhase);
  const setQuality = useStore((s) => s.setQuality);
  const setReducedMotion = useStore((s) => s.setReducedMotion);
  const setCanFocus = useStore((s) => s.setCanFocus);

  // Sync detected environment into the shared store (external state, not React state).
  useEffect(() => {
    setSection(initialSection);
  }, [initialSection, setSection]);
  useEffect(() => {
    setReducedMotion(reduced);
  }, [reduced, setReducedMotion]);
  // the showcases can be used in place only in the desktop 3D view
  useEffect(() => {
    setCanFocus(mode === "3d" && !mobile);
    if (mode !== "3d" || mobile) useStore.getState().setFocus(false);
  }, [mode, mobile, setCanFocus]);
  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number };
    const weak = (nav.deviceMemory !== undefined && nav.deviceMemory < 4) || (navigator.hardwareConcurrency ?? 8) < 4;
    setQuality(mobile || weak ? "low" : "high");
  }, [mobile, setQuality]);

  const navigate = useCallback(
    (s: Section) => {
      setSection(s);
      const meta = sectionMeta[s];
      if (window.location.pathname !== meta.path) window.history.pushState({ section: s }, "", meta.path);
      document.title = meta.title;
      if (useStore.getState().phase !== "explore" && mode === "3d") setPhase("explore");
    },
    [setSection, setPhase, mode],
  );

  useEffect(() => {
    const onPop = () => {
      const s = sectionFromPath(window.location.pathname);
      setSection(s);
      document.title = sectionMeta[s].title;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [setSection]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const st = useStore.getState();
      // close the innermost layer first: demo modal, then showcase focus, then the section
      if (st.demo) st.setDemo(null);
      else if (mode !== "3d") return;
      else if (st.focus) st.setFocus(false);
      else if (st.section !== "home") navigate("home");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, navigate]);

  const switchMode = (next: "3d" | "classic") => {
    try {
      localStorage.setItem("view-mode", next);
    } catch {}
    if (next === "3d") setPhase("loading");
    setChoice(next);
    window.scrollTo({ top: 0 });
  };

  const onReady = useCallback(() => {
    if (useStore.getState().phase === "loading") setPhase("ready");
  }, [setPhase]);

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Nav
        mode={mode === "classic" ? "classic" : "3d"}
        canUse3d={webgl}
        onNavigate={navigate}
        onSwitchMode={switchMode}
      />
      {mode === "3d" && (
        <>
          <div className="fixed inset-0 z-0" aria-hidden>
            <Scene section={section} mobile={mobile} onNavigate={navigate} onReady={onReady} />
          </div>
          <main id="main" className="pointer-events-none relative z-10 min-h-dvh">
            <Hero onNavigate={navigate} />
            <Panel onNavigate={navigate} mobile={mobile} />
            <FocusBar />
          </main>
          <Loader />
        </>
      )}
      {/* Semantic document: rendered on the server for SEO, shown as the 2D view and as the no-WebGL fallback. */}
      <div hidden={mode === "3d"} className={mode === "pending" ? "opacity-0" : ""}>
        <ClassicView onSwitchTo3d={webgl ? () => switchMode("3d") : undefined} webgl={webgl} active={mode !== "3d"} />
      </div>
      <DemoModal />
    </>
  );
}
