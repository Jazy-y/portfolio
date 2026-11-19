"use client";

import { ArrowRight, Box } from "lucide-react";
import { profile, projects } from "@/content/profile";
import { CvMenu } from "./CvMenu";
import { GithubIcon } from "./icons";
import { AboutContent, ContactContent, ExperienceContent, ProjectCard, SectionHeading, SkillsContent } from "./SectionContent";

/**
 * The accessible, text-first version of the portfolio. Rendered on the server
 * (SEO), used as the "2D view" and as the fallback when WebGL is unavailable.
 */
export function ClassicView({ onSwitchTo3d, webgl, active = true }: { onSwitchTo3d?: () => void; webgl: boolean; active?: boolean }) {
  return (
    <div id={active ? "top" : undefined} className="classic relative">
      <div className="classic-glow" aria-hidden />
      <main id={active ? "main" : undefined} className="relative mx-auto max-w-5xl px-5 pb-24 pt-28 sm:px-8">
        <section aria-labelledby="classic-title" className="py-10 sm:py-16">
          <p className="eyebrow">Portfolio · {profile.location}</p>
          <h1 id="classic-title" className="font-display text-[clamp(2.6rem,7vw,5rem)] font-semibold leading-[0.95] tracking-tight text-white">
            {profile.name}
          </h1>
          <p className="mt-3 font-mono text-teal-300">{profile.title}</p>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">{profile.intro}</p>
          <div className="mt-7 flex flex-wrap gap-2">
            <a className="btn-primary" href="#projects">
              View projects <ArrowRight size={16} />
            </a>
            <CvMenu />
            <a className="btn-ghost" href={profile.github} target="_blank" rel="noopener noreferrer">
              <GithubIcon /> GitHub
            </a>
            {onSwitchTo3d && (
              <button className="btn-ghost" onClick={onSwitchTo3d}>
                <Box size={16} /> Explore the 3D workspace
              </button>
            )}
          </div>
          {!webgl && (
            <p className="mt-4 text-sm text-slate-500">
              Your browser doesn&apos;t support WebGL, so you&apos;re seeing the lightweight version of this portfolio.
            </p>
          )}
        </section>

        <section id="about" className="classic-section">
          <AboutContent />
        </section>

        <section id="projects" className="classic-section">
          <SectionHeading eyebrow="02 — Projects" title="Selected work" />
          <div className="grid gap-6 md:grid-cols-2">
            {projects.map((p) => (
              <article key={p.slug} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <ProjectCard project={p} withImage />
              </article>
            ))}
          </div>
        </section>

        <section id="skills" className="classic-section">
          <SkillsContent />
        </section>

        <section id="experience" className="classic-section">
          <ExperienceContent />
        </section>

        <section id="contact" className="classic-section">
          <div className="max-w-2xl">
            <ContactContent />
          </div>
        </section>

        <footer className="mt-16 border-t border-white/10 pt-6 text-sm text-slate-500">
          © {profile.name} · Built with Next.js, React Three Fiber and TypeScript
        </footer>
      </main>
    </div>
  );
}
