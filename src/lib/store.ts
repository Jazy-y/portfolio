import { create } from "zustand";
import type { Section } from "@/content/profile";

export type Quality = "high" | "low";
export type Phase = "loading" | "ready" | "intro" | "explore";

type State = {
  section: Section;
  phase: Phase;
  /** 0 → 1 while the opening sequence runs; drives lights and screens. */
  power: number;
  projectIndex: number;
  hovered: string | null;
  quality: Quality;
  reducedMotion: boolean;
  lampOn: boolean;
  /** Close-up on the live website or the phone demo (desktop 3D only). */
  focus: boolean;
  /** True once the camera has finished flying to the current shot. */
  arrived: boolean;
  /** Desktop 3D view: the project showcases can be used in place. */
  canFocus: boolean;
  /** Slug of the project whose demo is open in the 2D modal. */
  demo: string | null;
  setSection: (s: Section) => void;
  setPhase: (p: Phase) => void;
  setPower: (v: number) => void;
  setProjectIndex: (i: number) => void;
  setHovered: (h: string | null) => void;
  setQuality: (q: Quality) => void;
  setReducedMotion: (r: boolean) => void;
  toggleLamp: () => void;
  setFocus: (f: boolean) => void;
  setArrived: (a: boolean) => void;
  setCanFocus: (c: boolean) => void;
  setDemo: (slug: string | null) => void;
};

export const useStore = create<State>((set) => ({
  section: "home",
  phase: "loading",
  power: 0,
  projectIndex: 0,
  hovered: null,
  quality: "high",
  reducedMotion: false,
  lampOn: true,
  focus: false,
  arrived: false,
  canFocus: false,
  demo: null,
  setSection: (section) => set({ section, focus: false }),
  setPhase: (phase) => set({ phase }),
  setPower: (power) => set({ power }),
  setProjectIndex: (projectIndex) => set({ projectIndex, focus: false }),
  setHovered: (hovered) => set({ hovered }),
  setQuality: (quality) => set({ quality }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  toggleLamp: () => set((s) => ({ lampOn: !s.lampOn })),
  setFocus: (focus) => set({ focus }),
  setArrived: (arrived) => set({ arrived }),
  setCanFocus: (canFocus) => set({ canFocus }),
  setDemo: (demo) => set({ demo }),
}));
