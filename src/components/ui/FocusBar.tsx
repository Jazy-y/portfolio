"use client";

import { ExternalLink, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { projects } from "@/content/profile";
import { useStore } from "@/lib/store";

/** Floating controls shown while the camera is zoomed on a live site or the phone demo. */
export function FocusBar() {
  const focus = useStore((s) => s.focus);
  const project = useStore((s) => projects[s.projectIndex]);
  const setFocus = useStore((s) => s.setFocus);
  const phone = project?.showcase === "phone";

  return (
    <AnimatePresence>
      {focus && project && (
        <motion.div
          role="toolbar"
          aria-label="Showcase controls"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, delay: 0.5 }}
          className="pointer-events-auto fixed left-1/2 top-20 z-30 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-[#070b12]/85 py-1.5 pl-4 pr-1.5 text-sm text-slate-300 shadow-2xl backdrop-blur-md"
        >
          <span className="truncate">
            {phone ? (
              <>
                <span className="text-white">CultureGo</span> · interactive UI recreation, not the production app
              </>
            ) : (
              <>
                <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-emerald-400 align-middle" aria-hidden />
                Live site · <span className="text-white">{project.live ? new URL(project.live).hostname : project.title}</span>
              </>
            )}
          </span>
          {!phone && project.live && (
            <a className="btn-ghost !py-1.5" href={project.live} target="_blank" rel="noopener noreferrer">
              Open <ExternalLink size={14} />
            </a>
          )}
          <button className="btn-primary !py-1.5" onClick={() => setFocus(false)}>
            <X size={15} /> Exit <kbd className="ml-1 hidden font-mono text-[10px] opacity-70 sm:inline">Esc</kbd>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
