"use client";

import { Billboard, Line, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { easing } from "maath";
import { profile, skillGroups, timeline, type Section } from "@/content/profile";
import { useStore } from "@/lib/store";
import { DESK_TOP, Succulent } from "./Desk";
import { Interactive } from "./Interactive";
import { canvasTexture, createCanvas, fontFamily, roundRect, seeded } from "./textures";

const WALL_Z = -1.2;

function washTexture() {
  const { canvas, ctx } = createCanvas(256, 256);
  const g = ctx.createRadialGradient(128, 40, 4, 128, 90, 150);
  g.addColorStop(0, "rgba(255,214,160,0.9)");
  g.addColorStop(0.45, "rgba(255,200,140,0.28)");
  g.addColorStop(1, "rgba(255,200,140,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return canvasTexture(canvas);
}

/**
 * Brass picture light. Instead of a real spotlight (each light makes every
 * material more expensive), the warm pool of light is an additive gradient.
 */
function PictureLight({ position, width, washSize }: { position: [number, number, number]; width: number; washSize: [number, number] }) {
  const tex = useMemo(() => washTexture(), []);
  const wash = useRef<THREE.MeshBasicMaterial>(null);
  const bulb = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(() => {
    const p = useStore.getState().power;
    if (wash.current) wash.current.opacity = p * 0.55;
    if (bulb.current) bulb.current.emissiveIntensity = p * 0.9;
  });
  return (
    <group>
      <group position={position}>
        <mesh rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.018, 0.018, width, 20]} />
          <meshStandardMaterial color="#b08d57" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.016, 0.006]}>
          <boxGeometry args={[width * 0.92, 0.004, 0.012]} />
          <meshStandardMaterial ref={bulb} color="#fff1d6" emissive="#ffcf8a" emissiveIntensity={0} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.03, -0.03]}>
          <boxGeometry args={[0.02, 0.06, 0.06]} />
          <meshStandardMaterial color="#b08d57" metalness={0.9} roughness={0.3} />
        </mesh>
      </group>
      <mesh position={[position[0], position[1] - washSize[1] / 2 + 0.02, WALL_Z + 0.004]}>
        <planeGeometry args={washSize} />
        <meshBasicMaterial ref={wash} map={tex} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
    </group>
  );
}

// ── About: pinboard ───────────────────────────────────────────────────────────

function noteTexture(lines: string[], bg: string, ink: string, title?: string) {
  const { canvas, ctx } = createCanvas(320, 240);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 320, 240);
  const g = ctx.createLinearGradient(0, 0, 0, 240);
  g.addColorStop(0, "rgba(255,255,255,0.12)");
  g.addColorStop(1, "rgba(0,0,0,0.08)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 320, 240);
  ctx.fillStyle = ink;
  ctx.textBaseline = "top";
  let y = 30;
  if (title) {
    ctx.font = `700 30px ${fontFamily("display")}`;
    ctx.fillText(title, 24, y, 320 - 48);
    y += 50;
  }
  // shrink a line that would run past the note's edge instead of clipping it
  const maxW = 320 - 48;
  for (const l of lines) {
    ctx.font = `24px ${fontFamily("sans")}`;
    const w = ctx.measureText(l).width;
    if (w > maxW) ctx.font = `${Math.floor((24 * maxW) / w)}px ${fontFamily("sans")}`;
    ctx.fillText(l, 24, y);
    y += 34;
  }
  return canvasTexture(canvas);
}

function polaroidTexture() {
  const { canvas, ctx } = createCanvas(300, 360);
  ctx.fillStyle = "#f7f4ee";
  ctx.fillRect(0, 0, 300, 360);
  const g = ctx.createLinearGradient(20, 20, 280, 280);
  g.addColorStop(0, "#0f766e");
  g.addColorStop(1, "#312e81");
  ctx.fillStyle = g;
  ctx.fillRect(20, 20, 260, 260);
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = `700 120px ${fontFamily("display")}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("YM", 150, 152);
  ctx.fillStyle = "#334155";
  ctx.font = `28px ${fontFamily("sans")}`;
  ctx.fillText("hello, I'm Youssef", 150, 320);
  return canvasTexture(canvas);
}

function corkTexture() {
  const { canvas, ctx } = createCanvas(512, 360);
  const rnd = seeded(5);
  ctx.fillStyle = "#9c7348";
  ctx.fillRect(0, 0, 512, 360);
  for (let i = 0; i < 5000; i++) {
    ctx.fillStyle = rnd() > 0.5 ? `rgba(60,35,15,${rnd() * 0.35})` : `rgba(230,190,140,${rnd() * 0.25})`;
    ctx.fillRect(rnd() * 512, rnd() * 360, 1 + rnd() * 2, 1 + rnd() * 2);
  }
  return canvasTexture(canvas);
}

/** Left of the slat wall (first slat at x = -1.3), so no note is hidden behind the slats. */
export const PINBOARD_X = -1.86;

export function Pinboard({ go }: { go: (s: Section) => void }) {
  // no "open this section" label while the section is already open
  const here = useStore((s) => s.section === "about");
  const cork = useMemo(() => corkTexture(), []);
  const cards = useMemo(
    () => [
      { tex: polaroidTexture(), size: [0.2, 0.24] as const, pos: [-0.24, 0.04] as const, rot: -0.06 },
      { tex: noteTexture(["Teboulba, Monastir", "Tunisia"], "#fde68a", "#422006", "📍 Home"), size: [0.2, 0.15] as const, pos: [0.04, 0.16] as const, rot: 0.05 },
      { tex: noteTexture(["B.Sc. Computer Science", "EPI Digital School", "2022 – 2025"], "#bae6fd", "#0c4a6e", "🎓 Degree"), size: [0.22, 0.165] as const, pos: [0.3, 0.13] as const, rot: -0.04 },
      { tex: noteTexture(["Food Culture Guide", "React Native · Expo"], "#bbf7d0", "#14532d", "🍜 PFE"), size: [0.2, 0.15] as const, pos: [0.06, -0.08] as const, rot: -0.07 },
      { tex: noteTexture(["Web apps for clients", "Next.js · Firebase"], "#fbcfe8", "#701a75", "💼 Freelance"), size: [0.21, 0.155] as const, pos: [0.31, -0.12] as const, rot: 0.06 },
    ],
    [],
  );
  const pins = cards.map((c) => new THREE.Vector3(c.pos[0], c.pos[1] + c.size[1] / 2 - 0.02, 0.02));
  return (
    <Interactive id="about" label={`About ${profile.firstName} →`} onSelect={() => go("about")} labelPosition={[PINBOARD_X, 2.02, WALL_Z + 0.1]} lift={0} enabled={!here}>
      <group position={[PINBOARD_X, 1.6, WALL_Z + 0.025]}>
        <RoundedBox args={[0.98, 0.7, 0.03]} radius={0.01} castShadow receiveShadow>
          <meshStandardMaterial color="#3a2a1d" roughness={0.6} />
        </RoundedBox>
        <mesh position={[0, 0, 0.0155]} receiveShadow>
          <planeGeometry args={[0.92, 0.64]} />
          <meshStandardMaterial map={cork} roughness={1} />
        </mesh>
        {cards.map((c, i) => (
          <group key={i} position={[c.pos[0], c.pos[1], 0.018 + i * 0.0006]} rotation-z={c.rot}>
            <mesh castShadow>
              <planeGeometry args={[c.size[0], c.size[1]]} />
              <meshStandardMaterial map={c.tex} emissiveMap={c.tex} emissive="#ffffff" emissiveIntensity={0.35} roughness={0.85} />
            </mesh>
          </group>
        ))}
        {pins.map((p, i) => (
          <mesh key={i} position={p}>
            <sphereGeometry args={[0.009, 16, 16]} />
            <meshStandardMaterial color={["#ef4444", "#2dd4bf", "#f59e0b", "#a78bfa", "#ef4444"][i]} roughness={0.3} />
          </mesh>
        ))}
        <Line points={[pins[0], pins[1], pins[2]]} color="#ef4444" lineWidth={1.2} />
        <Line points={[pins[1], pins[3], pins[4]]} color="#ef4444" lineWidth={1.2} />
      </group>
      <PictureLight position={[PINBOARD_X, 2.0, WALL_Z + 0.06]} width={0.5} washSize={[1.3, 0.95]} />
    </Interactive>
  );
}

// ── Experience: timeline wall + floating shelf ────────────────────────────────

function timelineCardTexture(item: (typeof timeline)[number]) {
  const { canvas, ctx } = createCanvas(400, 480);
  roundRect(ctx, 0, 0, 400, 480, 26);
  ctx.fillStyle = "#0e1420";
  ctx.fill();
  ctx.strokeStyle = item.kind === "work" ? "rgba(45,212,191,0.65)" : "rgba(167,139,250,0.65)";
  ctx.lineWidth = 4;
  roundRect(ctx, 2, 2, 396, 476, 24);
  ctx.stroke();
  ctx.fillStyle = item.kind === "work" ? "#2dd4bf" : "#a78bfa";
  ctx.font = `600 26px ${fontFamily("mono")}`;
  ctx.textBaseline = "top";
  ctx.fillText(item.period, 28, 34);
  ctx.fillStyle = "#f1f5f9";
  ctx.font = `700 38px ${fontFamily("display")}`;
  wrap(ctx, item.title, 28, 92, 344, 46, 3);
  ctx.fillStyle = "#94a3b8";
  ctx.font = `26px ${fontFamily("sans")}`;
  wrap(ctx, item.org, 28, 330, 344, 34, 3);
  ctx.fillStyle = item.kind === "work" ? "rgba(45,212,191,0.15)" : "rgba(167,139,250,0.15)";
  roundRect(ctx, 28, 412, 150, 40, 20);
  ctx.fill();
  ctx.fillStyle = item.kind === "work" ? "#5eead4" : "#c4b5fd";
  ctx.font = `600 20px ${fontFamily("mono")}`;
  ctx.fillText(item.kind === "work" ? "EXPERIENCE" : "EDUCATION", 44, 422);
  return canvasTexture(canvas);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number, maxLines: number) {
  const words = text.split(" ");
  let line = "";
  let lines = 0;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y + lines * lh);
      lines++;
      line = w;
      if (lines >= maxLines) return;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, y + lines * lh);
}

export function TimelineWall({ go }: { go: (s: Section) => void }) {
  const here = useStore((s) => s.section === "experience");
  const textures = useMemo(() => timeline.map(timelineCardTexture), []);
  const railMat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((state) => {
    if (railMat.current) railMat.current.emissiveIntensity = 1.2 * useStore.getState().power + Math.sin(state.clock.elapsedTime) * 0.1;
  });
  // starts right of the slat wall (which ends at x ≈ 1.34) so no card is hidden
  const startX = 1.53;
  const gap = 0.27;
  return (
    <group>
      <Interactive id="experience" label="Experience & education →" onSelect={() => go("experience")} labelPosition={[1.93, 1.95, WALL_Z + 0.1]} lift={0} enabled={!here}>
        <group position={[0, 0, WALL_Z + 0.02]}>
          <mesh position={[startX + gap * 1.5, 1.42, 0]}>
            <boxGeometry args={[gap * 4 + 0.08, 0.008, 0.008]} />
            <meshStandardMaterial ref={railMat} color="#0c3b37" emissive="#2dd4bf" emissiveIntensity={0} toneMapped={false} />
          </mesh>
          {textures.map((tex, i) => {
            const x = startX + i * gap;
            const up = i % 2 === 0;
            return (
              <group key={i} position={[x, up ? 1.58 : 1.26, 0.006]} rotation-z={(i % 2 ? 1 : -1) * 0.02}>
                <mesh castShadow>
                  <planeGeometry args={[0.22, 0.264]} />
                  <meshStandardMaterial map={tex} emissiveMap={tex} emissive="#ffffff" emissiveIntensity={0.55} roughness={0.7} />
                </mesh>
                <mesh position={[0, up ? -0.16 : 0.16, 0]}>
                  <sphereGeometry args={[0.011, 16, 16]} />
                  <meshStandardMaterial color="#2dd4bf" emissive="#2dd4bf" emissiveIntensity={1.4} toneMapped={false} />
                </mesh>
              </group>
            );
          })}
        </group>
      </Interactive>
      <PictureLight position={[1.93, 1.82, WALL_Z + 0.06]} width={0.6} washSize={[1.3, 0.8]} />
      {/* floating shelf with books and a plant */}
      <group position={[1.95, 1.98, WALL_Z + 0.12]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.95, 0.03, 0.22]} />
          <meshStandardMaterial color="#4a2f22" roughness={0.6} />
        </mesh>
        {["#0f766e", "#7c2d12", "#1e3a8a", "#d6c7a1", "#334155", "#9a3412"].map((c, i) => (
          <mesh key={i} position={[-0.42 + i * 0.045, 0.1 + (i % 3) * 0.008, 0]} rotation-z={i === 5 ? 0.25 : 0} castShadow>
            <boxGeometry args={[0.038, 0.17 + (i % 3) * 0.016, 0.15]} />
            <meshStandardMaterial color={c} roughness={0.8} />
          </mesh>
        ))}
        <Succulent position={[0.38, 0.015, 0]} />
        <mesh position={[0.05, 0.075, 0]} castShadow>
          <icosahedronGeometry args={[0.06, 0]} />
          <meshStandardMaterial color="#c9a227" metalness={0.9} roughness={0.25} flatShading />
        </mesh>
      </group>
    </group>
  );
}

// ── Skills: holographic projector ─────────────────────────────────────────────

function chipTexture(text: string, color: string) {
  const { canvas, ctx } = createCanvas(320, 80);
  roundRect(ctx, 4, 4, 312, 72, 36);
  // near-opaque so the orbit rings behind a chip never show through its text
  ctx.fillStyle = "rgba(6,12,20,0.94)";
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#f8fafc";
  ctx.font = `600 32px ${fontFamily("sans")}`;
  const w = ctx.measureText(text).width;
  if (w > 270) ctx.font = `600 ${Math.floor((32 * 270) / w)}px ${fontFamily("sans")}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 160, 42);
  return canvasTexture(canvas);
}

const HOLO_POS: [number, number, number] = [0.78, DESK_TOP, -0.1];
/** Vertical spacing between the skill-group orbits. */
const LEVEL_GAP = 0.1;

export function SkillsHologram({ section, go }: { section: Section; go: (s: Section) => void }) {
  const open = section === "skills";
  const chips = useMemo(() => {
    const out: { tex: THREE.Texture; group: number; angle: number; color: string; label: string }[] = [];
    skillGroups.forEach((g, gi) => {
      g.items.forEach((label, i) => {
        out.push({ tex: chipTexture(label, g.color), group: gi, angle: (i / g.items.length) * Math.PI * 2 + gi * 0.7, color: g.color, label });
      });
    });
    return out;
  }, []);
  const orbit = useRef<THREE.Group>(null);
  const cone = useRef<THREE.MeshBasicMaterial>(null);
  const core = useRef<THREE.Mesh>(null);
  const scale = useRef(0);
  const [hoverChip, setHoverChip] = useState<number | null>(null);
  const reduced = useStore((s) => s.reducedMotion);
  const chipMats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const tmp = useRef({ chip: new THREE.Vector3(), center: new THREE.Vector3() });

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    easing.damp(scale, "current", open ? 1 : 0, 0.35, dt);
    if (orbit.current) {
      orbit.current.scale.setScalar(Math.max(0.0001, scale.current));
      orbit.current.visible = scale.current > 0.01;
      if (!reduced) orbit.current.rotation.y += dt * 0.12;
    }
    if (cone.current) cone.current.opacity = 0.02 + scale.current * 0.05;
    // chips on the far side of the orbit fade out so the front ones stay readable
    if (orbit.current?.visible) {
      const { chip, center } = tmp.current;
      orbit.current.getWorldPosition(center);
      const dc = center.distanceTo(state.camera.position);
      orbit.current.children.forEach((child) => {
        const i = child.userData.chip as number | undefined;
        const mat = i === undefined ? null : chipMats.current[i];
        if (!mat) return;
        child.getWorldPosition(chip);
        const behind = THREE.MathUtils.clamp((chip.distanceTo(state.camera.position) - dc) / 0.3, -1, 1);
        mat.opacity = THREE.MathUtils.lerp(1, 0.18, THREE.MathUtils.smoothstep(behind, -0.2, 0.8));
      });
    }
    if (core.current) {
      core.current.rotation.y = t * 0.6;
      core.current.rotation.x = t * 0.3;
      core.current.scale.setScalar(1 - scale.current * 0.4);
    }
  });

  const levels = skillGroups.length;
  return (
    <group>
      <Interactive id="skills" label="Explore skills →" onSelect={() => go("skills")} labelPosition={[HOLO_POS[0], DESK_TOP + 0.3, HOLO_POS[2]]} enabled={!open}>
        <group position={HOLO_POS}>
          <mesh position={[0, 0.012, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.065, 0.024, 40]} />
            <meshStandardMaterial color="#151922" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.0245, 0]} rotation-x={-Math.PI / 2}>
            <ringGeometry args={[0.03, 0.045, 40]} />
            <meshBasicMaterial color="#2dd4bf" toneMapped={false} />
          </mesh>
          <mesh ref={core} position={[0, 0.12, 0]}>
            <icosahedronGeometry args={[0.035, 1]} />
            <meshBasicMaterial color="#5eead4" wireframe transparent opacity={0.8} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.2, 0]} rotation-x={Math.PI}>
            <coneGeometry args={[0.32, 0.4, 40, 1, true]} />
            <meshBasicMaterial ref={cone} color="#2dd4bf" transparent opacity={0.02} side={THREE.FrontSide} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>
      </Interactive>
      <group ref={orbit} position={[HOLO_POS[0], DESK_TOP + 0.36, HOLO_POS[2]]}>
        {/* rings draw first and write no depth, so chips always paint over them */}
        {Array.from({ length: levels }).map((_, gi) => (
          <mesh key={gi} position={[0, (gi - (levels - 1) / 2) * LEVEL_GAP, 0]} rotation-x={Math.PI / 2} renderOrder={1}>
            <torusGeometry args={[0.26 + (gi % 2) * 0.05, 0.0012, 6, 96]} />
            <meshBasicMaterial color={skillGroups[gi].color} transparent opacity={0.3} depthWrite={false} toneMapped={false} />
          </mesh>
        ))}
        {chips.map((c, i) => {
          const r = 0.26 + (c.group % 2) * 0.05;
          const y = (c.group - (levels - 1) / 2) * LEVEL_GAP;
          const hovered = hoverChip === i;
          return (
            <Billboard key={i} position={[Math.cos(c.angle) * r, y, Math.sin(c.angle) * r]} userData={{ chip: i }}>
              <mesh
                renderOrder={2}
                scale={hovered ? 1.35 : 1}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHoverChip(i);
                }}
                onPointerOut={() => setHoverChip(null)}
              >
                <planeGeometry args={[0.1, 0.025]} />
                <meshBasicMaterial
                  ref={(m) => {
                    chipMats.current[i] = m;
                  }}
                  map={c.tex}
                  transparent
                  toneMapped={false}
                  depthWrite={false}
                />
              </mesh>
            </Billboard>
          );
        })}
      </group>
    </group>
  );
}
