import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { SITE_URL, profile, sectionMeta } from "@/content/profile";
import "./globals.css";

const sans = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const display = Space_Grotesk({ variable: "--font-space", subsets: ["latin"], display: "swap" });
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: sectionMeta.home.title, template: `%s` },
  description: sectionMeta.home.description,
  applicationName: `${profile.name} — Portfolio`,
  authors: [{ name: profile.name, url: profile.github }],
  creator: profile.name,
  keywords: [
    "Youssef Mdimagh",
    "Full-Stack Developer",
    "Software Engineer",
    "React",
    "Next.js",
    "React Native",
    "TypeScript",
    "Tunisia",
    "Portfolio",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: `${profile.name} — Portfolio`,
    title: sectionMeta.home.title,
    description: sectionMeta.home.description,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: sectionMeta.home.title, description: sectionMeta.home.description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#05070c",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  jobTitle: "Full-Stack Developer",
  email: `mailto:${profile.email}`,
  url: SITE_URL,
  sameAs: [profile.github],
  address: { "@type": "PostalAddress", addressLocality: "Teboulba", addressRegion: "Monastir", addressCountry: "TN" },
  alumniOf: { "@type": "CollegeOrUniversity", name: "EPI Digital School (EPI Sup)" },
  knowsAbout: ["TypeScript", "React", "Next.js", "React Native", "Node.js", "Firebase", "PostgreSQL"],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${mono.variable} antialiased`}>
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
