"use client";

import { ArrowLeft, ArrowRight, Briefcase, Check, Copy, ExternalLink, GraduationCap, Mail, MapPin, Send } from "lucide-react";
import Image from "next/image";
import { useState, type FormEvent } from "react";
import { languages, profile, projects, skillGroups, timeline } from "@/content/profile";
import { useStore } from "@/lib/store";
import { GithubIcon, LinkedinIcon } from "./icons";

export function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="mb-5">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h2>
    </header>
  );
}

export function AboutContent() {
  return (
    <div>
      <SectionHeading eyebrow="01 — About" title="Developer from Tunisia, building end to end" />
      <div className="space-y-3 text-[15px] leading-relaxed text-slate-300">
        {profile.about.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-3">
        {profile.facts.map((f) => (
          <div key={f.label} className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
            <dt className="font-mono text-[11px] uppercase tracking-wider text-teal-300/80">{f.label}</dt>
            <dd className="mt-1 text-sm text-slate-100">{f.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 text-sm text-slate-400">
        <span className="text-slate-300">Languages:</span> {languages.join(" · ")}
      </p>
    </div>
  );
}

export function ProjectsContent({ showSelector = true }: { showSelector?: boolean }) {
  const index = useStore((s) => s.projectIndex);
  const setIndex = useStore((s) => s.setProjectIndex);
  const p = projects[index];
  const go = (d: number) => setIndex((index + d + projects.length) % projects.length);
  return (
    <div>
      <SectionHeading eyebrow="02 — Projects" title="Selected work" />
      {showSelector && (
        <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Projects">
          {projects.map((proj, i) => (
            <button
              key={proj.slug}
              role="tab"
              aria-selected={i === index}
              onClick={() => setIndex(i)}
              className={`chip ${i === index ? "chip-active" : ""}`}
            >
              {proj.title}
            </button>
          ))}
        </div>
      )}
      <article key={p.slug} className="animate-reveal" aria-live="polite">
        <ProjectCard project={p} />
        {showSelector && (
          <div className="mt-5 flex items-center justify-between">
            <button className="btn-ghost" onClick={() => go(-1)} aria-label="Previous project">
              <ArrowLeft size={16} /> Prev
            </button>
            <span className="font-mono text-xs text-slate-500">
              {index + 1} / {projects.length}
            </span>
            <button className="btn-ghost" onClick={() => go(1)} aria-label="Next project">
              Next <ArrowRight size={16} />
            </button>
          </div>
        )}
      </article>
    </div>
  );
}

export function ProjectCard({ project: p, withImage = false }: { project: (typeof projects)[number]; withImage?: boolean }) {
  return (
    <div>
      {withImage && p.image && (
        <div className="relative mb-4 aspect-[16/10] overflow-hidden rounded-xl border border-white/10 bg-slate-900">
          <Image
            src={p.image}
            alt={p.imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 560px"
            className={p.image.endsWith(".png") ? "object-contain p-10" : "object-cover object-top"}
          />
        </div>
      )}
      <p className="font-mono text-[11px] uppercase tracking-wider" style={{ color: p.accent }}>
        {p.context} · {p.year}
      </p>
      <h3 className="mt-1 font-display text-xl font-semibold text-white">{p.title}</h3>
      <p className="text-sm text-slate-400">{p.tagline}</p>
      <p className="mt-3 text-[15px] leading-relaxed text-slate-300">{p.description}</p>
      <h4 className="mt-4 font-mono text-[11px] uppercase tracking-wider text-slate-500">What I built</h4>
      <ul className="mt-2 space-y-1.5 text-sm text-slate-300">
        {p.contributions.map((c) => (
          <li key={c} className="flex gap-2">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: p.accent }} />
            <span>{c}</span>
          </li>
        ))}
      </ul>
      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Technologies">
        {p.stack.map((s) => (
          <li key={s} className="tag">
            {s}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        {p.live && (
          <a className="btn-primary" href={p.live} target="_blank" rel="noopener noreferrer">
            Live demo <ExternalLink size={15} />
          </a>
        )}
        {p.repo && (
          <a className="btn-ghost" href={p.repo} target="_blank" rel="noopener noreferrer">
            <GithubIcon /> Source code
          </a>
        )}
        {!p.live && !p.repo && <span className="text-sm text-slate-500">Private client project — code and site not public.</span>}
      </div>
    </div>
  );
}

export function SkillsContent() {
  return (
    <div>
      <SectionHeading eyebrow="03 — Skills" title="Tools I ship with" />
      <div className="space-y-4">
        {skillGroups.map((g) => (
          <section key={g.id} aria-labelledby={`skills-${g.id}`}>
            <h3 id={`skills-${g.id}`} className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider" style={{ color: g.color }}>
              <span className="h-2 w-2 rounded-full" style={{ background: g.color, boxShadow: `0 0 12px ${g.color}` }} />
              {g.label}
            </h3>
            <ul className="flex flex-wrap gap-1.5">
              {g.items.map((s) => (
                <li key={s} className="skill-pill" style={{ ["--c" as string]: g.color }}>
                  {s}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

export function ExperienceContent() {
  return (
    <div>
      <SectionHeading eyebrow="04 — Experience" title="Experience & education" />
      <ol className="relative space-y-5 border-l border-white/10 pl-6">
        {timeline.map((t) => (
          <li key={t.title} className="relative">
            <span
              className={`absolute -left-[33px] top-0.5 grid h-6 w-6 place-items-center rounded-full border ${
                t.kind === "work" ? "border-teal-400/50 bg-teal-400/10 text-teal-300" : "border-violet-400/50 bg-violet-400/10 text-violet-300"
              }`}
              aria-hidden
            >
              {t.kind === "work" ? <Briefcase size={12} /> : <GraduationCap size={12} />}
            </span>
            <p className="font-mono text-xs text-slate-400">{t.period}</p>
            <h3 className="font-display text-lg font-semibold text-white">{t.title}</h3>
            <p className="text-sm text-slate-400">{t.org}</p>
            {t.points.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-slate-300">
                {t.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function ContactContent() {
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${profile.email}`;
    }
  };
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const from = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const subject = encodeURIComponent(`Portfolio contact from ${name || "a visitor"}`);
    const body = encodeURIComponent(`${message}\n\n— ${name}${from ? ` (${from})` : ""}`);
    window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
    setSent(true);
  };
  return (
    <div>
      <SectionHeading eyebrow="05 — Contact" title="Let's work together" />
      <p className="text-[15px] leading-relaxed text-slate-300">
        I&apos;m open to junior developer roles, software engineering internships and freelance projects. The fastest way to reach me is email.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <a className="btn-primary" href={`mailto:${profile.email}`}>
          <Mail size={16} /> {profile.email}
        </a>
        <button className="btn-ghost" onClick={copy} aria-live="polite">
          {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <a className="btn-ghost" href={profile.github} target="_blank" rel="noopener noreferrer">
          <GithubIcon /> github.com/{profile.githubHandle}
        </a>
        {profile.linkedin && (
          <a className="btn-ghost" href={profile.linkedin} target="_blank" rel="noopener noreferrer">
            <LinkedinIcon /> LinkedIn
          </a>
        )}
        <span className="inline-flex items-center gap-1.5 px-2 text-slate-400">
          <MapPin size={15} /> {profile.location}
        </span>
      </div>
      <form onSubmit={submit} className="mt-6 space-y-3" aria-label="Send me a message">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="field">
            <span>Name</span>
            <input name="name" required autoComplete="name" placeholder="Your name" />
          </label>
          <label className="field">
            <span>Email</span>
            <input name="email" type="email" required autoComplete="email" placeholder="you@company.com" />
          </label>
        </div>
        <label className="field">
          <span>Message</span>
          <textarea name="message" required rows={4} placeholder="Tell me about the role or project…" />
        </label>
        <button type="submit" className="btn-primary w-full justify-center">
          <Send size={16} /> Send message
        </button>
        {sent && <p className="text-xs text-slate-400">Your email app should open with the message ready to send.</p>}
      </form>
    </div>
  );
}
