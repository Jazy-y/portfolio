"use client";

import { ArrowRight, MousePointerClick } from "lucide-react";
import { profile, type Section } from "@/content/profile";
import { useStore } from "@/lib/store";
import { CvMenu } from "./CvMenu";
import { GithubIcon } from "./icons";

export function Hero({ onNavigate }: { onNavigate: (s: Section) => void }) {
  const section = useStore((s) => s.section);
  const phase = useStore((s) => s.phase);
  const power = useStore((s) => s.power);
  const show = section === "home" && (phase === "explore" || (phase === "intro" && power > 0.75));
  const words = profile.name.split(" ");

  return (
    <section
      aria-labelledby="hero-title"
      className={`absolute inset-x-0 bottom-0 px-5 pb-8 sm:px-10 sm:pb-12 lg:px-14 lg:pb-16 ${show ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!show}
    >
      <div className={`hero-scrim ${show ? "opacity-100" : "opacity-0"}`} aria-hidden />
      <div className={`hero ${show ? "hero-in" : ""} max-w-xl`}>
        <p className="eyebrow hero-line" style={{ ["--d" as string]: "0ms" }}>
          Portfolio · {profile.location}
        </p>
        <h1 id="hero-title" className="font-display text-[clamp(2.4rem,6vw,4.6rem)] font-semibold leading-[0.95] tracking-tight text-white">
          {words.map((w, i) => (
            <span key={w} className="hero-word mr-[0.22em]" style={{ ["--d" as string]: `${120 + i * 110}ms` }}>
              {w}
            </span>
          ))}
        </h1>
        <p className="hero-line mt-3 font-mono text-sm text-teal-300 sm:text-base" style={{ ["--d" as string]: "360ms" }}>
          {profile.title}
        </p>
        <p className="hero-line mt-4 max-w-lg text-[15px] leading-relaxed text-slate-300 sm:text-base" style={{ ["--d" as string]: "460ms" }}>
          {profile.intro}
        </p>
        <div className="hero-line mt-6 flex flex-wrap items-center gap-2" style={{ ["--d" as string]: "560ms" }}>
          <button className="btn-primary" onClick={() => onNavigate("projects")}>
            View projects <ArrowRight size={16} />
          </button>
          <CvMenu />
          <a className="btn-ghost !px-3" href={profile.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub profile">
            <GithubIcon /> <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
        <p className="hero-line mt-6 hidden items-center gap-2 font-mono text-xs text-slate-500 sm:flex" style={{ ["--d" as string]: "700ms" }}>
          <MousePointerClick size={14} /> Click the monitors, pinboard, hologram or phone to explore
        </p>
      </div>
    </section>
  );
}
