"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { CultureGoApp } from "@/components/cultureGo/CultureGoApp";
import { APP_H, APP_W } from "@/components/cultureGo/size";
import { useStore } from "@/lib/store";

/**
 * 2D fallback for the phone showcase (mobile, classic view): the same
 * CultureGo recreation in a CSS phone frame.
 */
export function DemoModal() {
  const demo = useStore((s) => s.demo);
  const setDemo = useStore((s) => s.setDemo);
  const close = useRef<HTMLButtonElement>(null);
  const open = demo === "food-culture-guide";
  const screen = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.75);

  // the app keeps its real phone layout and is scaled to fit the frame (never squeezed)
  useEffect(() => {
    const el = screen.current;
    if (!open || !el) return;
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / APP_W));
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const id = setTimeout(() => close.current?.focus(), 50);
    return () => {
      clearTimeout(id);
      prev?.focus?.();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-[#03060b]/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="CultureGo app demo"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && setDemo(null)}
        >
          <motion.div
            initial={{ y: 40, scale: 0.94 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="demo-phone"
          >
            <div ref={screen} className="cg-phone-screen w-full" style={{ aspectRatio: `${APP_W} / ${APP_H}` }}>
              <div style={{ width: APP_W, height: APP_H, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
                <CultureGoApp />
                <div className="cg-island" aria-hidden />
              </div>
            </div>
          </motion.div>
          <p className="max-w-sm text-center text-xs text-slate-400">
            Interactive recreation of the app&apos;s interface with live TheMealDB data. Scanning and translation show sample results; this is
            not the production app.
          </p>
          <button ref={close} className="btn-ghost" onClick={() => setDemo(null)}>
            <X size={15} /> Close
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
