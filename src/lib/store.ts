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
  setSection: (s: Section) => void;
  setPhase: (p: Phase) => void;
  setPower: (v: number) => void;
  setProjectIndex: (i: number) => void;
  setHovered: (h: string | null) => void;
  setQuality: (q: Quality) => void;
  setReducedMotion: (r: boolean) => void;
  toggleLamp: () => void;
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
  setSection: (section) => set({ section }),
  setPhase: (phase) => set({ phase }),
  setPower: (power) => set({ power }),
  setProjectIndex: (projectIndex) => set({ projectIndex }),
  setHovered: (hovered) => set({ hovered }),
  setQuality: (quality) => set({ quality }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  toggleLamp: () => set((s) => ({ lampOn: !s.lampOn })),
}));
