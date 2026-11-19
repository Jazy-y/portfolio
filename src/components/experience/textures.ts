import * as THREE from "three";

/** Resolved font families from next/font CSS variables (falls back to system fonts). */
export function fontFamily(kind: "sans" | "mono" | "display"): string {
  if (typeof document === "undefined") return kind === "mono" ? "monospace" : "sans-serif";
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(kind === "mono" ? "--font-jetbrains" : kind === "display" ? "--font-space" : "--font-inter")
    .trim();
  return v || (kind === "mono" ? "ui-monospace, monospace" : "system-ui, sans-serif");
}

export function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  return { canvas, ctx };
}

export function canvasTexture(canvas: HTMLCanvasElement, srgb = true) {
  const tex = new THREE.CanvasTexture(canvas);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Deterministic pseudo-random generator so textures look identical on every load. */
export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Walnut-like wood grain, tileable along X. */
export function woodTexture(base = "#4a2f22", seed = 7) {
  const { canvas, ctx } = createCanvas(1024, 256);
  const rnd = seeded(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 1024, 256);
  for (let i = 0; i < 140; i++) {
    const y = rnd() * 256;
    const amp = 2 + rnd() * 6;
    const freq = 0.004 + rnd() * 0.01;
    const light = rnd() > 0.5;
    ctx.strokeStyle = light ? `rgba(255,214,170,${0.03 + rnd() * 0.05})` : `rgba(20,8,4,${0.08 + rnd() * 0.12})`;
    ctx.lineWidth = 0.6 + rnd() * 2.2;
    ctx.beginPath();
    for (let x = 0; x <= 1024; x += 8) {
      const yy = y + Math.sin(x * freq + i) * amp + Math.sin(x * freq * 3.1) * amp * 0.25;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  // a few knots
  for (let k = 0; k < 3; k++) {
    const x = 120 + rnd() * 780;
    const y = 40 + rnd() * 170;
    const g = ctx.createRadialGradient(x, y, 1, x, y, 26);
    g.addColorStop(0, "rgba(25,10,5,0.55)");
    g.addColorStop(1, "rgba(25,10,5,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, 34, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = canvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** Night skyline seen through the window. */
export function cityTexture() {
  const W = 2048;
  const H = 1024;
  const { canvas, ctx } = createCanvas(W, H);
  const rnd = seeded(42);
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#050816");
  sky.addColorStop(0.55, "#0b1430");
  sky.addColorStop(0.82, "#1b2350");
  sky.addColorStop(1, "#3b2a4a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  // stars
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = `rgba(220,230,255,${0.2 + rnd() * 0.6})`;
    const s = rnd() * 1.6 + 0.4;
    ctx.fillRect(rnd() * W, rnd() * H * 0.5, s, s);
  }
  // moon
  const mx = W * 0.72;
  const my = H * 0.2;
  const halo = ctx.createRadialGradient(mx, my, 10, mx, my, 220);
  halo.addColorStop(0, "rgba(200,220,255,0.35)");
  halo.addColorStop(1, "rgba(200,220,255,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(mx - 240, my - 240, 480, 480);
  ctx.fillStyle = "#e6ecff";
  ctx.beginPath();
  ctx.arc(mx, my, 42, 0, Math.PI * 2);
  ctx.fill();
  // three layers of buildings
  const layers = [
    { color: "#0d1430", min: 0.35, max: 0.62, win: 0.18, lit: "rgba(120,170,255," },
    { color: "#0a0f24", min: 0.48, max: 0.8, win: 0.28, lit: "rgba(255,196,120," },
    { color: "#060914", min: 0.62, max: 0.95, win: 0.35, lit: "rgba(255,214,150," },
  ];
  for (const layer of layers) {
    let x = -20;
    while (x < W) {
      const w = 50 + rnd() * 140;
      const top = H * (1 - (layer.min + rnd() * (layer.max - layer.min)) * 0.75);
      ctx.fillStyle = layer.color;
      ctx.fillRect(x, top, w, H - top);
      if (rnd() > 0.7) {
        ctx.fillRect(x + w * 0.4, top - 30, 3, 30); // antenna
        ctx.fillStyle = "rgba(255,80,80,0.9)";
        ctx.fillRect(x + w * 0.4 - 1, top - 32, 5, 4);
      }
      for (let wy = top + 10; wy < H - 10; wy += 14) {
        for (let wx = x + 6; wx < x + w - 8; wx += 11) {
          if (rnd() < layer.win) {
            ctx.fillStyle = `${layer.lit}${0.35 + rnd() * 0.6})`;
            ctx.fillRect(wx, wy, 5, 7);
          }
        }
      }
      x += w + rnd() * 10;
    }
  }
  // haze near horizon
  const haze = ctx.createLinearGradient(0, H * 0.6, 0, H);
  haze.addColorStop(0, "rgba(90,70,140,0)");
  haze.addColorStop(1, "rgba(90,70,140,0.25)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, H * 0.6, W, H * 0.4);
  return canvasTexture(canvas);
}

/** Text label texture (for 3D chips, notes, cards). */
export function labelTexture(
  lines: { text: string; font: string; color: string; y: number; x?: number; align?: CanvasTextAlign }[],
  width: number,
  height: number,
  background?: (ctx: CanvasRenderingContext2D) => void,
) {
  const { canvas, ctx } = createCanvas(width, height);
  background?.(ctx);
  for (const l of lines) {
    ctx.font = l.font;
    ctx.fillStyle = l.color;
    ctx.textAlign = l.align ?? "left";
    ctx.textBaseline = "middle";
    ctx.fillText(l.text, l.x ?? 0, l.y);
  }
  return canvasTexture(canvas);
}
