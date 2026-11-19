"use client";

import { Download } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { profile } from "@/content/profile";

/** "Download CV" button with a small language menu (EN / FR / AR). */
export function CvMenu({ variant = "ghost", align = "left" }: { variant?: "ghost" | "primary"; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", close);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        className={variant === "primary" ? "btn-primary" : "btn-ghost"}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
      >
        <Download size={16} /> Download CV
      </button>
      {open && (
        <ul
          id={id}
          role="menu"
          className={`absolute top-full z-50 mt-2 min-w-44 overflow-hidden rounded-xl border border-white/10 bg-[#0b0f17]/95 p-1 shadow-2xl backdrop-blur ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {profile.cv.map((c) => (
            <li key={c.lang} role="none">
              <a
                role="menuitem"
                href={c.href}
                download
                className="flex items-center justify-between gap-6 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/8 focus:bg-white/8 focus:outline-none"
                onClick={() => setOpen(false)}
              >
                <span>{c.label}</span>
                <span className="font-mono text-xs text-slate-500">PDF · {c.lang}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
