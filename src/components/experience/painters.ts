import * as THREE from "three";
import { canvasTexture, createCanvas, fontFamily, roundRect } from "./textures";
import type { Project } from "@/content/profile";

/**
 * Screen painters draw animated 2D UIs into canvases that are used as
 * monitor textures. They repaint at a throttled rate (not every frame).
 */
export abstract class ScreenPainter {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
  w: number;
  h: number;
  private last = -1;

  constructor(w: number, h: number, private fps = 20) {
    const { canvas, ctx } = createCanvas(w, h);
    this.canvas = canvas;
    this.ctx = ctx;
    this.w = w;
    this.h = h;
    this.texture = canvasTexture(canvas);
    // repainted many times per second: skip mipmap regeneration on every upload
    this.texture.generateMipmaps = false;
    this.texture.minFilter = THREE.LinearFilter;
  }

  /** `power` 0..1: CRT-style power-on, then content. */
  update(t: number, power: number, force = false) {
    if (!force && this.last >= 0 && t - this.last < 1 / this.fps) return;
    this.last = t;
    const { ctx, w, h } = this;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    if (power <= 0.001) {
      this.texture.needsUpdate = true;
      return;
    }
    if (power < 0.35) {
      // a thin bright line that grows, like a monitor waking up
      const p = power / 0.35;
      const lineH = Math.max(2, h * p * p * 0.9);
      const g = ctx.createLinearGradient(0, h / 2 - lineH / 2, 0, h / 2 + lineH / 2);
      g.addColorStop(0, "rgba(120,255,230,0)");
      g.addColorStop(0.5, `rgba(200,255,245,${0.9 - p * 0.4})`);
      g.addColorStop(1, "rgba(120,255,230,0)");
      ctx.fillStyle = g;
      ctx.fillRect(w * (0.5 - p * 0.5), h / 2 - lineH / 2, w * p, lineH);
    } else {
      ctx.save();
      ctx.globalAlpha = Math.min(1, (power - 0.35) / 0.4);
      this.paint(t);
      ctx.restore();
      // faint scanlines for texture
      ctx.fillStyle = "rgba(0,0,0,0.07)";
      for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
    }
    this.texture.needsUpdate = true;
  }

  protected abstract paint(t: number): void;
}

// ── Code editor (left monitor) ────────────────────────────────────────────────

const CODE = `// lib/pricing.ts — shared by the UI and the payment API
export const PEAK_START_HOUR = 18;
export const PEAK_MULTIPLIER = 1.2;
export const SERVICE_FEE_RATE = 0.04;

export function calculateBookingPrice(
  pricePerHour: number,
  durationHours: number,
  startHour: number,
): BookingPrice {
  const isPeak = startHour >= PEAK_START_HOUR;
  const subtotal =
    pricePerHour * durationHours *
    (isPeak ? PEAK_MULTIPLIER : 1);
  const fees = subtotal * SERVICE_FEE_RATE;
  return { subtotal, fees, total: subtotal + fees, isPeak };
}

// api/create-payment-intent/route.ts
export async function POST(req: Request) {
  const user = await requireUser(req);
  const booking = await getDocumentAsUser(
    user, "bookings", bookingId,
  );
  const { total } = calculateBookingPrice(
    stadium.pricePerHour, hours, startHour,
  );
  return Response.json({ clientSecret });
}`;

const KEYWORDS = /\b(export|const|function|return|async|await|import|from|type|number|boolean)\b/g;

function highlight(ctx: CanvasRenderingContext2D, line: string, x: number, y: number, font: string) {
  ctx.font = font;
  if (line.trimStart().startsWith("//")) {
    ctx.fillStyle = "#5c6f7e";
    ctx.fillText(line, x, y);
    return;
  }
  // tokenise roughly: strings, numbers, keywords, identifiers
  const parts = line.split(/(\s+|[(){}[\],.;:=*+?<>]|"[^"]*"|\b\d+(?:\.\d+)?\b)/).filter(Boolean);
  let cx = x;
  for (const part of parts) {
    let color = "#d6deeb";
    if (/^"/.test(part)) color = "#ecc48d";
    else if (/^\d/.test(part)) color = "#f78c6c";
    else if (KEYWORDS.test(part)) color = "#c792ea";
    else if (/^[A-Z][A-Z_]+$/.test(part)) color = "#82aaff";
    else if (/^[A-Z]/.test(part)) color = "#ffcb6b";
    else if (/^[(){}[\],.;:=*+?<>]$/.test(part)) color = "#89ddff";
    KEYWORDS.lastIndex = 0;
    ctx.fillStyle = color;
    ctx.fillText(part, cx, y);
    cx += ctx.measureText(part).width;
  }
}

export class CodePainter extends ScreenPainter {
  private lines = CODE.split("\n");
  private total = CODE.length;

  protected paint(t: number) {
    const { ctx, w, h } = this;
    const mono = fontFamily("mono");
    ctx.fillStyle = "#0b1020";
    ctx.fillRect(0, 0, w, h);
    // title bar + tabs
    ctx.fillStyle = "#070b16";
    ctx.fillRect(0, 0, w, 34);
    ["#ff5f57", "#febc2e", "#28c840"].forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(16 + i * 16, 17, 5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "#121a2e";
    ctx.fillRect(70, 6, 130, 28);
    ctx.font = `13px ${mono}`;
    ctx.fillStyle = "#9fb3c8";
    ctx.textBaseline = "middle";
    ctx.fillText("pricing.ts", 84, 21);
    ctx.fillStyle = "#5c6f7e";
    ctx.fillText("route.ts", 216, 21);

    // typing progress loops every ~22s
    const cycle = 22;
    const p = Math.min(1, ((t % cycle) / cycle) * 1.35);
    let budget = Math.floor(this.total * p);
    const lh = 19;
    const font = `13.5px ${mono}`;
    let y = 52;
    const scroll = Math.max(0, Math.floor(budget / 34) * lh - (h - 80) + lh);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 36, w, h - 60);
    ctx.clip();
    y -= Math.min(scroll, Math.max(0, this.lines.length * lh - (h - 90)));
    let cursorX = 0;
    let cursorY = 0;
    for (let i = 0; i < this.lines.length; i++) {
      const full = this.lines[i];
      const visible = full.slice(0, Math.max(0, budget));
      budget -= full.length + 1;
      ctx.fillStyle = "#33415c";
      ctx.font = `12px ${mono}`;
      ctx.textAlign = "right";
      ctx.fillText(String(i + 1), 34, y);
      ctx.textAlign = "left";
      highlight(ctx, visible, 46, y, font);
      if (budget < 0 && cursorY === 0) {
        ctx.font = font;
        cursorX = 46 + ctx.measureText(visible).width;
        cursorY = y;
      }
      y += lh;
      if (budget < 0 && i > 0 && visible.length === 0) break;
    }
    if (cursorY && Math.floor(t * 2) % 2 === 0) {
      ctx.fillStyle = "#5eead4";
      ctx.fillRect(cursorX + 1, cursorY - 9, 2, 18);
    }
    ctx.restore();
    // status bar
    ctx.fillStyle = "#0f766e";
    ctx.fillRect(0, h - 24, w, 24);
    ctx.fillStyle = "#e6fffb";
    ctx.font = `12px ${mono}`;
    ctx.fillText("main ✓  TypeScript  UTF-8", 10, h - 12);
  }
}

// ── Terminal (right monitor) ──────────────────────────────────────────────────

const TERMINAL: { text: string; color?: string; delay: number }[] = [
  { text: "~/portfolio $ npm run build", color: "#e5e7eb", delay: 0.6 },
  { text: "▲ Next.js — Creating an optimized production build", color: "#9ca3af", delay: 1.0 },
  { text: "✓ Compiled successfully", color: "#5eead4", delay: 1.6 },
  { text: "✓ Linting and checking validity of types", color: "#5eead4", delay: 0.9 },
  { text: "✓ Generating static pages (8/8)", color: "#5eead4", delay: 1.1 },
  { text: "", delay: 0.4 },
  { text: "~/portfolio $ git push origin main", color: "#e5e7eb", delay: 1.2 },
  { text: "To github.com:Jazy-y/portfolio.git", color: "#9ca3af", delay: 0.8 },
  { text: "   main -> main", color: "#9ca3af", delay: 0.5 },
  { text: "● Vercel: deployment ready", color: "#f59e0b", delay: 1.4 },
  { text: "", delay: 0.3 },
  { text: "~/portfolio $ npx expo export", color: "#e5e7eb", delay: 1.0 },
  { text: "Bundling android + ios …", color: "#9ca3af", delay: 1.3 },
  { text: "✓ Export was successful", color: "#5eead4", delay: 2.5 },
];
const TERMINAL_TOTAL = TERMINAL.reduce((a, l) => a + l.delay, 0) + 3;

export class TerminalPainter extends ScreenPainter {
  protected paint(t: number) {
    const { ctx, w, h } = this;
    const mono = fontFamily("mono");
    ctx.fillStyle = "#07090f";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#10141f";
    ctx.fillRect(0, 0, w, 30);
    ctx.font = `13px ${mono}`;
    ctx.fillStyle = "#6b7280";
    ctx.textBaseline = "middle";
    ctx.fillText("zsh — youssef@workstation", 14, 15);
    const local = t % TERMINAL_TOTAL;
    let acc = 0;
    let y = 52;
    ctx.font = `14px ${mono}`;
    for (const line of TERMINAL) {
      acc += line.delay;
      if (acc > local) break;
      ctx.fillStyle = line.color ?? "#e5e7eb";
      ctx.fillText(line.text, 14, y);
      y += 22;
    }
    if (Math.floor(t * 2) % 2 === 0) {
      ctx.fillStyle = "#e5e7eb";
      ctx.fillRect(14, y - 9, 9, 17);
    }
    // little CPU graph in the corner
    const gx = w - 170;
    const gy = h - 70;
    ctx.strokeStyle = "rgba(94,234,212,0.18)";
    ctx.strokeRect(gx, gy, 156, 56);
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const v = 0.5 + Math.sin(t * 1.7 + i * 0.6) * 0.22 + Math.sin(t * 0.7 + i * 1.9) * 0.15;
      const px = gx + (i / 40) * 156;
      const py = gy + 56 - v * 50;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = "#5eead4";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.lineWidth = 1;
  }
}

// ── Main monitor: desktop / project showcase ──────────────────────────────────

export class MainPainter extends ScreenPainter {
  mode: "desktop" | "project" = "desktop";
  project: Project | null = null;
  private images = new Map<string, HTMLImageElement>();
  private changedAt = 0;

  setProject(project: Project | null, t: number) {
    if (project?.slug === this.project?.slug && this.mode === (project ? "project" : "desktop")) return;
    this.project = project;
    this.mode = project ? "project" : "desktop";
    this.changedAt = t;
    if (project?.image && !this.images.has(project.image)) {
      const img = new Image();
      img.src = project.image;
      this.images.set(project.image, img);
    }
  }

  protected paint(t: number) {
    if (this.mode === "project" && this.project) this.paintProject(t);
    else this.paintDesktop(t);
    // quick wipe when the content changes
    const since = t - this.changedAt;
    if (since < 0.45) {
      const { ctx, w, h } = this;
      ctx.fillStyle = `rgba(4,8,16,${1 - since / 0.45})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  private paintDesktop(t: number) {
    const { ctx, w, h } = this;
    const display = fontFamily("display");
    const mono = fontFamily("mono");
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#071a1f");
    bg.addColorStop(0.55, "#0b1124");
    bg.addColorStop(1, "#1a0f24");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    // flowing contour lines
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 16) {
        const y = h * 0.18 + i * 22 + Math.sin(x * 0.006 + t * 0.4 + i * 0.5) * 18 + Math.sin(x * 0.013 - t * 0.25) * 8;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(94,234,212,${0.05 + (i % 3) * 0.025})`;
      ctx.stroke();
    }
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#e7fffb";
    ctx.font = `600 64px ${display}`;
    ctx.fillText("Youssef Mdimagh", 64, h * 0.52);
    ctx.font = `22px ${mono}`;
    ctx.fillStyle = "#5eead4";
    ctx.fillText("> full-stack developer_", 66, h * 0.52 + 44);
    // dock
    const icons = ["#5eead4", "#60a5fa", "#a78bfa", "#f59e0b", "#f472b6"];
    const dw = icons.length * 46 + 20;
    roundRect(ctx, w / 2 - dw / 2, h - 62, dw, 48, 14);
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.fill();
    icons.forEach((c, i) => {
      roundRect(ctx, w / 2 - dw / 2 + 14 + i * 46, h - 54, 32, 32, 8);
      ctx.fillStyle = c;
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
    });
    // clock
    const d = new Date();
    ctx.font = `20px ${mono}`;
    ctx.fillStyle = "rgba(231,255,251,0.75)";
    ctx.textAlign = "right";
    ctx.fillText(d.toTimeString().slice(0, 5), w - 32, 42);
    ctx.textAlign = "left";
  }

  private paintProject(t: number) {
    const { ctx, w, h } = this;
    const p = this.project!;
    const mono = fontFamily("mono");
    const display = fontFamily("display");
    ctx.fillStyle = "#0a0d14";
    ctx.fillRect(0, 0, w, h);
    // browser chrome
    ctx.fillStyle = "#161b26";
    ctx.fillRect(0, 0, w, 44);
    ["#ff5f57", "#febc2e", "#28c840"].forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(22 + i * 20, 22, 6, 0, Math.PI * 2);
      ctx.fill();
    });
    roundRect(ctx, 100, 9, w - 200, 26, 13);
    ctx.fillStyle = "#0d111a";
    ctx.fill();
    ctx.font = `14px ${mono}`;
    ctx.fillStyle = "#9ca3af";
    ctx.textBaseline = "middle";
    const url = p.live?.replace("https://", "") ?? p.repo?.replace("https://", "") ?? `${p.slug} · private client project`;
    ctx.fillText(`🔒 ${url}`, 118, 22);

    const img = p.image ? this.images.get(p.image) : undefined;
    const areaY = 44;
    const areaH = h - areaY;
    if (img && img.complete && img.naturalWidth > 0 && !p.image!.endsWith("logo.png")) {
      // slow Ken Burns pan over the real screenshot
      const scale = w / img.naturalWidth;
      const drawH = img.naturalHeight * scale;
      const overflow = Math.max(0, drawH - areaH);
      const pan = (Math.sin((t - this.changedAt) * 0.25 - Math.PI / 2) * 0.5 + 0.5) * overflow;
      ctx.drawImage(img, 0, areaY - pan, w, drawH);
    } else {
      // mobile app or private project: branded card instead of a screenshot
      const g = ctx.createLinearGradient(0, areaY, w, h);
      g.addColorStop(0, "#0b1222");
      g.addColorStop(1, "#140b1f");
      ctx.fillStyle = g;
      ctx.fillRect(0, areaY, w, areaH);
      if (img && img.complete && img.naturalWidth > 0) {
        // phone mockup with the app icon
        const pw = 170;
        const ph = 320;
        const px = w * 0.68;
        const py = areaY + (areaH - ph) / 2 + Math.sin(t * 1.2) * 4;
        roundRect(ctx, px, py, pw, ph, 26);
        ctx.fillStyle = "#05070c";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 2;
        ctx.stroke();
        roundRect(ctx, px + 10, py + 12, pw - 20, ph - 24, 18);
        ctx.fillStyle = "#fff8ee";
        ctx.fill();
        ctx.drawImage(img, px + 25, py + 70, pw - 50, pw - 50);
        ctx.fillStyle = "#3b2a1a";
        ctx.font = `600 15px ${display}`;
        ctx.textAlign = "center";
        ctx.fillText(p.title, px + pw / 2, py + ph - 70);
        ctx.textAlign = "left";
      }
      ctx.fillStyle = p.accent;
      ctx.font = `600 46px ${display}`;
      ctx.textBaseline = "alphabetic";
      ctx.fillText(p.title, 56, areaY + areaH * 0.42);
      ctx.fillStyle = "#cbd5e1";
      ctx.font = `20px ${fontFamily("sans")}`;
      ctx.fillText(p.tagline, 58, areaY + areaH * 0.42 + 38);
      ctx.font = `15px ${mono}`;
      let x = 58;
      const y = areaY + areaH * 0.42 + 84;
      for (const s of p.stack.slice(0, 5)) {
        const tw = ctx.measureText(s).width + 22;
        if (x + tw > w * 0.64) break;
        roundRect(ctx, x, y - 16, tw, 28, 14);
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.fill();
        ctx.fillStyle = "#e2e8f0";
        ctx.textBaseline = "middle";
        ctx.fillText(s, x + 11, y - 2);
        x += tw + 8;
      }
    }
  }
}

/** Phone lock-screen for the contact area. */
export class PhonePainter extends ScreenPainter {
  constructor() {
    super(256, 512, 4);
  }
  protected paint() {
    const { ctx, w, h } = this;
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#0f766e");
    g.addColorStop(1, "#1e1b4b");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const d = new Date();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `300 64px ${fontFamily("display")}`;
    ctx.fillText(d.toTimeString().slice(0, 5), w / 2, 120);
    roundRect(ctx, 20, 220, w - 40, 96, 18);
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = `600 18px ${fontFamily("sans")}`;
    ctx.fillText("New message", w / 2, 250);
    ctx.font = `15px ${fontFamily("sans")}`;
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillText("Let's build something together", w / 2, 284);
    ctx.textAlign = "left";
  }
}
