/**
 * Every fact on the site comes from this file. Only verified information
 * from the CV and the project repositories belongs here.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://youssef-mdimagh.vercel.app";

export const profile = {
  name: "Youssef Mdimagh",
  firstName: "Youssef",
  title: "Software Engineer · Full-Stack Developer",
  shortTitle: "Full-Stack Developer",
  location: "Teboulba, Monastir, Tunisia",
  email: "youssefmd101@gmail.com",
  github: "https://github.com/Jazy-y",
  githubHandle: "Jazy-y",
  /** Add your LinkedIn profile URL here; links stay hidden while it is null. */
  linkedin: null as string | null,
  intro:
    "I build and ship complete web and mobile applications with React, Next.js, React Native and TypeScript — from the interface to the backend, payments and deployment.",
  about: [
    "I'm a full-stack developer from Tunisia with a Bachelor's degree in Computer Science (Software Engineering) from EPI Digital School.",
    "For my final-year project I built Food Culture Guide, a cross-platform mobile app that recognises dishes from photos, translates menus and finds nearby restaurants.",
    "Today I work as a freelancer, delivering production web apps for clients: a stadium-booking platform, e-commerce stores, payments, admin dashboards and VPS deployments.",
  ],
  facts: [
    { label: "Based in", value: "Teboulba, Tunisia" },
    { label: "Degree", value: "B.Sc. Computer Science" },
    { label: "Focus", value: "React · Next.js · React Native" },
    { label: "Status", value: "Open to junior roles & internships" },
  ],
  cv: [
    { lang: "EN", label: "English", href: "/cv/Youssef_Mdimagh_CV_EN.pdf" },
    { lang: "FR", label: "Français", href: "/cv/Youssef_Mdimagh_CV_FR.pdf" },
    { lang: "AR", label: "العربية", href: "/cv/Youssef_Mdimagh_CV_AR.pdf" },
  ],
} as const;

export type Project = {
  slug: string;
  title: string;
  tagline: string;
  context: string;
  year: string;
  description: string;
  contributions: string[];
  stack: string[];
  image: string | null;
  imageAlt: string;
  /** Accent used by the 3D screen when the project is displayed. */
  accent: string;
  repo?: string;
  live?: string;
  /**
   * 3D showcase: "phone" runs the interactive app recreation on a phone,
   * "site" embeds the live website in the main monitor (the site must allow framing).
   */
  showcase?: "phone" | "site";
};

export const projects: Project[] = [
  {
    slug: "food-culture-guide",
    title: "Food Culture Guide",
    tagline: "AI-powered food & culture discovery app",
    context: "Final-year project (PFE) · Terraform Group internship",
    year: "2025",
    description:
      "A cross-platform Android/iOS app that helps travellers understand local food: identify a dish from a photo, read its ingredients and cultural background, translate a restaurant menu and find nearby places that serve it.",
    contributions: [
      "Built the 16-screen React Native + Expo app in TypeScript with authentication-aware navigation.",
      "Integrated Clarifai food recognition with on-device image resizing, OCR-based menu translation and a geolocated restaurant finder (Google Places, maps).",
      "Designed the Firebase backend: Auth (email + Google), Firestore data model and security rules, reviews, favourites and an admin analytics dashboard.",
    ],
    stack: ["React Native", "Expo", "TypeScript", "Firebase", "Clarifai API", "Google Places API", "React Navigation"],
    image: "/projects/food-culture-guide-logo.png",
    imageAlt: "Food Culture Guide app logo",
    accent: "#f59e0b",
    repo: "https://github.com/Jazy-y/food-culture-guide",
    showcase: "phone",
  },
  {
    slug: "foottn",
    title: "FootTN",
    tagline: "Stadium booking & football community platform",
    context: "Freelance · client project",
    year: "2026",
    description:
      "A multi-role web platform for amateur football in Tunisia. Players book and pay for pitches, form teams, chat in real time and join events; stadium owners manage venues and reservations; admins moderate the platform.",
    contributions: [
      "Built the full Next.js 16 / React 19 application: bookings, teams, real-time team chat, events, social feed, support tickets and analytics dashboards.",
      "Implemented Stripe card and wallet payments with server-side price calculation and Firebase ID-token verification in API routes.",
      "Enforced role-based access (player, owner, admin) with Firestore security rules; generated PDF receipts, QR-code tickets and an installable PWA.",
    ],
    stack: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS", "Firebase", "Stripe", "Cloudinary", "Vercel"],
    image: "/projects/foottn.webp",
    imageAlt: "FootTN stadium discovery page",
    accent: "#2dd4bf",
    repo: "https://github.com/Jazy-y/foottn",
    live: "https://foottn.vercel.app",
  },
  {
    slug: "viorika",
    title: "Viorika",
    tagline: "Full-stack e-commerce platform",
    context: "Freelance · client project",
    year: "2026",
    description:
      "An online fashion store with a product catalogue, cart, orders, customer accounts and an admin dashboard, self-hosted on a Linux VPS.",
    contributions: [
      "Developed the store end to end with Next.js, React and TypeScript.",
      "Built product management, cart, checkout orders, authentication and the admin dashboard.",
      "Deployed and maintain it on an OVH VPS with Nginx, SSL and PM2.",
    ],
    stack: ["Next.js", "React", "TypeScript", "Nginx", "PM2", "OVH VPS"],
    image: "/projects/viorika.webp",
    imageAlt: "Viorika store home page",
    accent: "#e5e7eb",
    live: "https://viorika.shop",
    showcase: "site",
  },
  {
    slug: "merveilles-artisanat",
    title: "Merveilles de l'Artisanat",
    tagline: "E-commerce & workshop booking for Tunisian artisans",
    context: "Freelance · client project",
    year: "2026",
    description:
      "A French-language online shop for Tunisian handcrafted jewellery, where customers also book hands-on craft workshops and trainings. Orders use cash on delivery, and a role-based admin back office manages the whole catalogue.",
    contributions: [
      "Built the storefront with Next.js 15, React 19 and TypeScript on PostgreSQL with Prisma: catalogue, product pages, cart, wishlist, reviews and cash-on-delivery checkout.",
      "Implemented workshop and training booking, customer accounts and NextAuth.js authentication with role checks in middleware and API routes.",
      "Built the admin dashboard (products, stock, orders, bookings, users, audit log) and hardened the app with Zod validation, CSRF protection, rate limiting and strict security headers.",
    ],
    stack: ["Next.js 15", "React 19", "TypeScript", "PostgreSQL", "Prisma", "NextAuth.js", "Tailwind CSS", "Vercel"],
    image: "/projects/merveilles.webp",
    imageAlt: "Merveilles de l'Artisanat storefront home page",
    accent: "#c084fc",
    repo: "https://github.com/Jazy-y/merveilles-de-lartisanat",
    live: "https://merveilles-de-lartisanat.vercel.app",
    showcase: "site",
  },
];

export type SkillGroup = { id: string; label: string; color: string; items: string[] };

export const skillGroups: SkillGroup[] = [
  { id: "lang", label: "Languages", color: "#2dd4bf", items: ["TypeScript", "JavaScript", "SQL", "HTML5", "CSS3"] },
  {
    id: "front",
    label: "Frontend & Mobile",
    color: "#60a5fa",
    items: ["React", "Next.js", "React Native", "Expo", "Tailwind CSS", "PWA"],
  },
  {
    id: "back",
    label: "Backend & Data",
    color: "#a78bfa",
    items: ["Node.js", "Express.js", "REST APIs", "Firebase", "Firestore", "PostgreSQL", "Prisma"],
  },
  {
    id: "int",
    label: "Integrations",
    color: "#f59e0b",
    items: ["Stripe", "OpenAI API", "Google Cloud Vision", "Clarifai", "Google Places", "Cloudinary"],
  },
  {
    id: "ops",
    label: "DevOps & Tools",
    color: "#f472b6",
    items: ["Git", "GitHub", "Docker", "Linux", "Nginx", "PM2", "Vercel"],
  },
];

export type TimelineItem = {
  period: string;
  title: string;
  org: string;
  kind: "work" | "education";
  points: string[];
};

export const timeline: TimelineItem[] = [
  {
    period: "2026",
    title: "Freelance Full-Stack Developer",
    org: "Self-employed",
    kind: "work",
    points: [
      "FootTN — stadium booking platform with Stripe payments (Next.js, Firebase).",
      "Viorika — e-commerce store deployed on an OVH VPS (Nginx, SSL, PM2).",
      "Merveilles de l'Artisanat — e-commerce and workshop booking (PostgreSQL, Prisma, NextAuth.js).",
    ],
  },
  {
    period: "Feb 2025 – May 2025",
    title: "Software Developer Intern",
    org: "Terraform Group",
    kind: "work",
    points: [
      "Final-year project: Food Culture Guide, a React Native / Expo mobile app.",
      "AI food recognition, menu translation, restaurant finder and Firebase backend.",
    ],
  },
  {
    period: "2022 – 2025",
    title: "Bachelor's Degree in Computer Science",
    org: "EPI Digital School (EPI Sup), Sousse",
    kind: "education",
    points: ["Software Engineering track."],
  },
  {
    period: "2022",
    title: "Baccalaureate",
    org: "Lycée Teboulba",
    kind: "education",
    points: [],
  },
];

export const languages = ["Arabic", "French", "English"];

export const SECTIONS = ["home", "about", "projects", "skills", "experience", "contact"] as const;
export type Section = (typeof SECTIONS)[number];

export const sectionMeta: Record<Section, { label: string; path: string; title: string; description: string }> = {
  home: {
    label: "Home",
    path: "/",
    title: `${profile.name} — ${profile.shortTitle}`,
    description: `${profile.name} is a full-stack developer building web and mobile apps with React, Next.js, React Native and TypeScript.`,
  },
  about: {
    label: "About",
    path: "/about",
    title: `About — ${profile.name}`,
    description: "Background, education and what I build as a full-stack developer.",
  },
  projects: {
    label: "Projects",
    path: "/projects",
    title: `Projects — ${profile.name}`,
    description: "Food Culture Guide, FootTN, Viorika and Merveilles de l'Artisanat: web and mobile apps I built.",
  },
  skills: {
    label: "Skills",
    path: "/skills",
    title: `Skills — ${profile.name}`,
    description: "TypeScript, React, Next.js, React Native, Node.js, Firebase, PostgreSQL, Stripe and more.",
  },
  experience: {
    label: "Experience",
    path: "/experience",
    title: `Experience & Education — ${profile.name}`,
    description: "Freelance full-stack work, internship at Terraform Group and education at EPI Digital School.",
  },
  contact: {
    label: "Contact",
    path: "/contact",
    title: `Contact — ${profile.name}`,
    description: "Get in touch about junior developer roles, internships or freelance projects.",
  },
};
