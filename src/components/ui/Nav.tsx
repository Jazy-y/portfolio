"use client";

import { Box, LayoutList, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { SECTIONS, profile, sectionMeta, type Section } from "@/content/profile";
import { useStore } from "@/lib/store";
import { CvMenu } from "./CvMenu";

type Props = {
  mode: "3d" | "classic";
  canUse3d: boolean;
  onNavigate: (s: Section) => void;
  onSwitchMode: (m: "3d" | "classic") => void;
};

export function Nav({ mode, canUse3d, onNavigate, onSwitchMode }: Props) {
  const section = useStore((s) => s.section);
  const phase = useStore((s) => s.phase);
  const [open, setOpen] = useState(false);
  const visible = mode === "classic" || phase === "explore";

  const go = (s: Section) => {
    setOpen(false);
    if (mode === "classic") {
      document.getElementById(s === "home" ? "top" : s)?.scrollIntoView({ behavior: "smooth" });
      window.history.replaceState(null, "", sectionMeta[s].path);
      return;
    }
    onNavigate(s);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-700 ${visible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-4 opacity-0"} ${
        mode === "classic" ? "border-b border-white/[0.06] bg-[#05070c]/75 backdrop-blur-xl" : ""
      }`}
    >
      <nav className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-4 sm:px-6" aria-label="Main">
        <Link
          href="/"
          onClick={(e) => {
            e.preventDefault();
            go("home");
          }}
          className="group flex items-center gap-3"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-teal-300/30 bg-teal-300/10 font-display text-sm font-bold text-teal-200 transition group-hover:border-teal-300/70">
            YM
          </span>
          <span className="hidden font-display text-sm font-medium text-white/90 sm:block">{profile.name}</span>
        </Link>

        <ul className="hidden items-center gap-1 rounded-full border border-white/10 bg-black/30 p-1 backdrop-blur-md lg:flex">
          {SECTIONS.map((s) => (
            <li key={s}>
              <Link
                href={sectionMeta[s].path}
                onClick={(e) => {
                  e.preventDefault();
                  go(s);
                }}
                aria-current={mode === "3d" && section === s ? "page" : undefined}
                className={`nav-link ${mode === "3d" && section === s ? "nav-link-active" : ""}`}
              >
                {sectionMeta[s].label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <CvMenu align="right" />
          </div>
          {canUse3d && (
            <button
              className="btn-ghost !px-3"
              onClick={() => onSwitchMode(mode === "3d" ? "classic" : "3d")}
              title={mode === "3d" ? "Switch to the simple 2D page" : "Switch to the 3D workspace"}
            >
              {mode === "3d" ? <LayoutList size={16} /> : <Box size={16} />}
              <span className="hidden md:inline">{mode === "3d" ? "2D view" : "3D view"}</span>
            </button>
          )}
          <button className="btn-ghost !px-3 lg:hidden" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
            <Menu size={18} />
          </button>
        </div>
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute inset-x-3 top-3 rounded-2xl border border-white/10 bg-[#0b0f17] p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-sm text-white">{profile.name}</span>
              <button className="btn-ghost !px-2.5" aria-label="Close menu" onClick={() => setOpen(false)} autoFocus>
                <X size={18} />
              </button>
            </div>
            <ul className="grid gap-1">
              {SECTIONS.map((s, i) => (
                <li key={s}>
                  <Link
                    href={sectionMeta[s].path}
                    onClick={(e) => {
                      e.preventDefault();
                      go(s);
                    }}
                    className="flex items-center justify-between rounded-xl px-3 py-3 text-base text-slate-100 hover:bg-white/5"
                  >
                    {sectionMeta[s].label}
                    <span className="font-mono text-xs text-slate-500">0{i}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-3 border-t border-white/10 pt-3">
              <CvMenu variant="primary" />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
