# Project improvements & lessons

A running log of the important fixes and technical decisions, and the pitfalls to avoid repeating.

## Technical decisions

| Decision | Why |
| --- | --- |
| Procedural models (three.js primitives + canvas textures) instead of downloaded GLB assets | No licensing questions, tiny payload (no model downloads), and everything stays editable in code. |
| Screens are `CanvasTexture`s repainted at 4–24 FPS by `ScreenPainter` subclasses | Real-looking UIs (code editor, terminal, browser) for a fraction of the cost of DOM-in-3D. Throttling keeps texture uploads cheap. |
| One `profile.ts` content file | Every fact on the site (panels, 2D view, 3D pinboard, timeline cards, hologram chips, metadata) comes from one verified source. |
| Static routes per section + History API navigation | Clean, indexable URLs with their own metadata, without remounting the WebGL canvas on navigation. `dynamicParams` is unavailable with Cache Components in Next 16, so each section has its own small `page.tsx`. |
| Constant horizontal FOV | Camera framings were designed for 16:9. Recomputing the vertical FOV from the aspect ratio keeps compositions on square or tall windows. |
| Mobile shots aim ~15° below the subject (`mobileShot`) | The hero text or content sheet covers the bottom half on phones, so the subject has to sit in the upper half. |
| `Environment` built from `Lightformer`s instead of an HDR file | No runtime CDN fetch, consistent reflections, and it renders once (`frames={1}`). |
| GSAP for the intro and camera paths; `maath` damping for hover and small motion | GSAP timelines are skippable (`progress(1)`). Damping is interruptible and frame-rate independent. |
| Server-rendered 2D view | Used for SEO, as an accessible alternative, and as the WebGL fallback, all from the same components as the 3D panels. |

| Live websites on the monitor via drei `Html transform` iframes | Viorika and Merveilles allow framing, so visitors use the real sites instead of screenshots. Mounted only after the camera arrives, desktop only; FootTN keeps a screenshot because it sends `X-Frame-Options: DENY`. |
| CultureGo recreation on a 3D phone | The PFE is a mobile app that can't run in a browser, so its screens were rebuilt in React from the source and real screenshots, with live TheMealDB data. Labelled everywhere as a recreation, not the production app. |
| Focus shots fitted to the viewport (`fitShot`) | A fixed camera distance made the close-ups too small on square windows and clipped on wide ones. |

## Fixes made during QA

- **Lamp geometry.** The first arm angles pointed the lamp head away from the desk and into the left monitor. Recomputed the joint angles and moved the lamp to the front-left corner, aimed at the notebook and phone.
- **Skip intro.** The camera tween created inside the intro timeline replaced the timeline reference, so skipping didn't work. The camera progress tween now lives inside the timeline.
- **Missing space in the hero name.** Inline-block word spans collapsed the trailing space ("YoussefMdimagh"). Spacing now uses a margin.
- **Tailwind v4 cascade layers.** Unlayered custom classes (`.btn-ghost { display: inline-flex }`) overrode utilities like `lg:hidden`. All component classes now live in `@layer components`.
- **Focus ring on panels.** Programmatic focus on the panel heading (`tabIndex={-1}`) showed the global focus ring. The rule is now `:focus-visible:not([tabindex="-1"])`.
- **`new Date()` in a client component** broke prerendering with Cache Components. Removed the dynamic year from the footer.
- **Sky leaking above the walls.** Without a ceiling, the window's skyline plane was visible above the wall. Added a ceiling and a right wall.
- **Hologram beam** looked like a solid triangle. It's now flipped (widening upward), front-side only and much fainter.
- **Projects, skills and contact framings** were too tight on narrower windows; the cameras were pulled back.
- **Dark wall features.** Added brass picture lights above the pinboard and the timeline.
- **React Compiler lint rules.** Mutable per-frame buffers moved from `useMemo` to refs. Environment detection uses `useSyncExternalStore` instead of `setState` in effects. The camera FOV is updated from the `useFrame` state, not a hook value.

- **CSS modules turned global.** The Turbopack rule ran every `*.css` file through the Tailwind loader `as: "*.css"`, so module class names (e.g. `.hero`) leaked into the page. The rule now targets `globals.css` only.
- **Wall layout vs the slat wall.** The pinboard, the first timeline card and the plant hid content behind or in front of the slats. Everything on the back wall now stays outside x ∈ [-1.35, 1.35].
- **Hologram labels.** Orbit rings crossed the chips' text. Rings render first without depth writes, chips are near-opaque, and far-side chips fade.

## Pitfalls to avoid

- **Hot reload and WebGL.** Editing scene files while the dev page is open can leave old render loops alive and drop the frame rate to ~1 FPS. This is a dev-only artifact: always do a full reload before measuring performance. (A fresh load measured 56–110 FPS on an integrated AMD GPU.)
- **First load of each route in `next dev`** compiles on demand and can sit on the loader for several seconds. Production builds don't do this.
- **Never put personal data in the 3D textures** that isn't also in `profile.ts`. Keep one source of truth.
- **Brand icons** were removed from lucide-react v1. The GitHub icon is a local SVG (`components/ui/icons.tsx`).
- **Canvas fonts.** Canvas painters read the `next/font` CSS variables (`--font-inter`, `--font-space`, `--font-jetbrains`). If you rename them in `layout.tsx`, update `textures.ts`.

## Ideas for later

- Add a short demo video or GIFs of Food Culture Guide running on a phone.
- Add a custom `.dev` domain (see README).
- Optional French version of the site (the CV already exists in French and Arabic).
