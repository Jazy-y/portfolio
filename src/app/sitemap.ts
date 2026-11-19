import type { MetadataRoute } from "next";
import { SECTIONS, SITE_URL, sectionMeta } from "@/content/profile";

export default function sitemap(): MetadataRoute.Sitemap {
  return SECTIONS.map((s) => ({
    url: `${SITE_URL}${sectionMeta[s].path === "/" ? "" : sectionMeta[s].path}`,
    changeFrequency: "monthly",
    priority: s === "home" ? 1 : 0.7,
  }));
}
