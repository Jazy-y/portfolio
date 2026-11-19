import type { Metadata } from "next";
import { PortfolioApp } from "@/components/ui/PortfolioApp";
import { sectionMeta, type Section } from "@/content/profile";

/** Shared metadata + page for the deep-linkable section URLs (/about, /projects, …). */
export function sectionMetadata(section: Section): Metadata {
  const meta = sectionMeta[section];
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: meta.path },
    openGraph: { title: meta.title, description: meta.description, url: meta.path },
    twitter: { title: meta.title, description: meta.description },
  };
}

export function SectionPage({ section }: { section: Section }) {
  return <PortfolioApp initialSection={section} />;
}
