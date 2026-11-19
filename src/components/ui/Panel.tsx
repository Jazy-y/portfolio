"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import type { Section } from "@/content/profile";
import { useStore } from "@/lib/store";
import { AboutContent, ContactContent, ExperienceContent, ProjectsContent, SkillsContent } from "./SectionContent";

const CONTENT: Record<Exclude<Section, "home">, () => React.ReactElement> = {
  about: AboutContent,
  projects: () => <ProjectsContent />,
  skills: SkillsContent,
  experience: ExperienceContent,
  contact: ContactContent,
};

/** Which side of the screen the panel uses, so it never covers the 3D focus. */
const SIDE: Record<Exclude<Section, "home">, "left" | "right"> = {
  about: "right",
  projects: "right",
  skills: "right",
  experience: "left",
  contact: "right",
};

export function Panel({ onNavigate, mobile }: { onNavigate: (s: Section) => void; mobile: boolean }) {
  const section = useStore((s) => s.section);
  const phase = useStore((s) => s.phase);
  const reduced = useStore((s) => s.reducedMotion);
  const open = section !== "home" && phase === "explore";
  const scroller = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    scroller.current?.scrollTo({ top: 0 });
    // move focus to the panel for keyboard and screen-reader users
    const id = setTimeout(() => heading.current?.focus({ preventScroll: true }), 450);
    return () => clearTimeout(id);
  }, [open, section]);

  const side = section === "home" ? "right" : SIDE[section];
  const Content = section === "home" ? null : CONTENT[section];
  const fromX = side === "right" ? 40 : -40;

  return (
    <AnimatePresence mode="wait">
      {open && Content && (
        <motion.aside
          key={section}
          aria-label={section}
          initial={reduced ? { opacity: 0 } : mobile ? { opacity: 0, y: 60 } : { opacity: 0, x: fromX, filter: "blur(6px)" }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
          exit={reduced ? { opacity: 0 } : mobile ? { opacity: 0, y: 40 } : { opacity: 0, x: fromX / 2, filter: "blur(4px)" }}
          transition={{ duration: reduced ? 0.15 : 0.55, ease: [0.22, 1, 0.36, 1], delay: reduced ? 0 : 0.35 }}
          className={
            mobile
              ? "panel pointer-events-auto fixed inset-x-0 bottom-0 z-20 h-[56dvh] rounded-t-3xl"
              : `panel pointer-events-auto fixed top-24 bottom-6 z-20 w-[min(460px,40vw)] rounded-3xl ${side === "right" ? "right-6" : "left-6"}`
          }
        >
          {mobile && <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-white/20" aria-hidden />}
          <button className="btn-ghost absolute right-4 top-4 z-10 !px-2.5" onClick={() => onNavigate("home")} aria-label="Close and return home">
            <X size={16} />
          </button>
          <div ref={scroller} className="panel-scroll h-full overflow-y-auto overscroll-contain px-6 pb-8 pt-6 sm:px-7">
            <div ref={heading} tabIndex={-1} className="outline-none">
              <Content />
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
