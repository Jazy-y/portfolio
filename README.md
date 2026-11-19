# Youssef Mdimagh — Interactive 3D Portfolio

An interactive 3D developer workspace built with **Next.js, React Three Fiber and TypeScript**. Visitors explore my work by moving around a night-time studio: the monitors show my projects, a pinboard holds my background, a holographic projector displays my skills and a timeline on the wall covers my experience.

**Live:** https://youssef-mdimagh.vercel.app · **GitHub:** [@Jazy-y](https://github.com/Jazy-y)

## Highlights

- **Fully procedural 3D scene.** Every object is modelled in code with three.js primitives, instancing and canvas-generated textures (wood grain, cork, night skyline): desk, articulated lamp, 61-key mechanical keyboard, three monitors, headphones, speakers, chair, plants, pinboard and shelf. No downloaded models, so there are no licensing issues and the download stays tiny.
- **Live screens.** The monitors are animated canvas textures: a code editor typing real code from one of my projects, a terminal running a build, and the main display showing each project's real screenshot in a browser frame.
- **Cinematic camera.** GSAP drives the intro and moves the camera along curved paths between sections. A horizontal field of view held constant keeps each composition intact on any aspect ratio, and gentle mouse parallax adds depth.
- **Intro sequence.** The camera dollies in through moonlight while the room powers on: monitors wake up one after another with a CRT-style line, then the bias lighting, lamp and screens come up. It can be skipped.
- **Interactive objects.** Hover and click the monitors, pinboard, hologram, timeline or phone to navigate. The lamp toggles, the mug puffs steam, the headphones wobble, the keyboard keys press under your cursor and the hologram chips react on hover.
- **Real URLs.** `/about`, `/projects`, `/skills`, `/experience` and `/contact` are statically generated pages with their own metadata. Navigation uses the History API, so the 3D canvas is never remounted.
- **Accessible 2D view.** A text-first version of the whole site is server-rendered (for SEO), offered through a "2D view" toggle, and used automatically when WebGL is unavailable.

## Tech stack

| Area | Tools |
| --- | --- |
| Framework | Next.js 16 (App Router, React Compiler, static generation), React 19, TypeScript |
| 3D | three.js, React Three Fiber, Drei (RoundedBox, Billboard, Html, Environment + Lightformers, Sparkles, PerformanceMonitor), @react-three/postprocessing (bloom, vignette) |
| Animation | GSAP (intro timeline, camera paths), Motion (panel transitions), maath (damping), CSS transitions |
| UI | Tailwind CSS 4, Lucide icons, next/font (Inter, Space Grotesk, JetBrains Mono) |
| State | Zustand |
| Hosting | Vercel (Hobby plan) |

## Performance and accessibility

- The 3D scene is code-split and loaded only on the client. Shaders are precompiled before the intro, so it doesn't stutter.
- Quality tiers: phones and low-memory devices get a lower pixel ratio, no shadows, no post-processing and fewer particles. `PerformanceMonitor` downgrades quality on the fly if the frame rate drops.
- Canvas screens repaint at 4–24 FPS instead of every frame. The keyboard is a single instanced mesh.
- `prefers-reduced-motion` skips the intro, makes camera moves instant and stops ambient animation.
- Keyboard and screen-reader friendly: a skip link, real links and buttons, focus moved into each opened panel, Esc to close, ARIA labels, and an accessible project selector.
- SEO: per-page metadata, a generated Open Graph image, JSON-LD (`Person`), `sitemap.xml`, `robots.txt` and a server-rendered document.

## Project structure

```
src/
├── app/                      # routes: /, /about, /projects, /skills, /experience, /contact
│   ├── layout.tsx            # fonts, metadata, JSON-LD
│   ├── opengraph-image.tsx   # social preview generated at build time
│   └── sitemap.ts, robots.ts, icon.svg
├── content/profile.ts        # ← all personal content lives here (single source of truth)
├── components/
│   ├── experience/           # 3D scene
│   │   ├── Scene.tsx         # canvas, lights, environment, post-processing
│   │   ├── CameraRig.tsx     # intro timeline, camera paths, parallax, responsive FOV
│   │   ├── Room.tsx  Desk.tsx  Keyboard.tsx  Monitors.tsx  Peripherals.tsx  WallFeatures.tsx
│   │   ├── painters.ts       # animated canvas screens (editor, terminal, project display, phone)
│   │   └── textures.ts       # procedural textures and canvas helpers
│   └── ui/                   # DOM layer: nav, loader, hero, panels, 2D view, CV menu
└── lib/                      # Zustand store, section page helper
public/
├── cv/                       # downloadable CV (EN / FR / AR)
└── projects/                 # real screenshots of my projects
```

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck
npm run build
```

Optional environment variable (see `.env.example`):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL used for metadata, the sitemap and Open Graph (defaults to `https://youssef-mdimagh.vercel.app`) |

## Updating content

Edit `src/content/profile.ts`: profile text, projects, skills and timeline. Project screenshots go in `public/projects/` and CV PDFs in `public/cv/`. The 3D scene picks up the new content automatically: monitor screens, pinboard notes, timeline cards and hologram chips are all generated from that file.

## Deployment (Vercel, free)

1. Import the GitHub repository at [vercel.com/new](https://vercel.com/new). The framework is detected as Next.js, and no build settings need changing.
2. Optionally set `NEXT_PUBLIC_SITE_URL` to the final URL.
3. Every push to `main` deploys to production, and every other branch gets a preview URL.

### Custom domain later

Buy a domain (for example `youssefmdimagh.dev`), then in Vercel go to **Project → Settings → Domains → Add**. Vercel shows the DNS records to create at the registrar: an `A` record for the apex domain and a `CNAME` for `www`. HTTPS is issued automatically. Afterwards, update `NEXT_PUBLIC_SITE_URL` and redeploy.

## Credits

The 3D scene uses no third-party models or textures; everything is generated procedurally in code. Fonts come from Google Fonts (Open Font License).
