"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { easing } from "maath";
import { useStore } from "@/lib/store";
import { DESK_TOP } from "./Desk";
import { Interactive } from "./Interactive";
import { PhonePainter } from "./painters";
import { canvasTexture, createCanvas, fontFamily } from "./textures";

export function Peripherals({ go }: { go: (s: "contact") => void }) {
  const here = useStore((s) => s.section === "contact");
  return (
    <group>
      <Mouse />
      <Headphones />
      <Speaker position={[-1.13, DESK_TOP, -0.74]} rotation={0.25} />
      <Speaker position={[1.13, DESK_TOP, -0.74]} rotation={-0.25} />
      <Interactive id="contact" label="Contact →" onSelect={() => go("contact")} labelPosition={[-0.68, DESK_TOP + 0.16, -0.12]} enabled={!here}>
        <Notebook />
        <Phone />
      </Interactive>
    </group>
  );
}

function Mouse() {
  const ref = useRef<THREE.Group>(null);
  const reduced = useStore((s) => s.reducedMotion);
  useFrame((state, dt) => {
    if (!ref.current || reduced) return;
    // the mouse drifts slightly with the visitor's pointer, as if someone was using it
    easing.damp(ref.current.position, "x", 0.38 + state.pointer.x * 0.035, 0.4, dt);
    easing.damp(ref.current.position, "z", -0.2 - state.pointer.y * 0.03, 0.4, dt);
  });
  return (
    <group ref={ref} position={[0.38, DESK_TOP + 0.004, -0.2]}>
      <mesh scale={[0.032, 0.02, 0.058]} position={[0, 0.012, 0]} castShadow>
        <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#1d222c" roughness={0.35} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.03, -0.02]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.004, 0.004, 0.012, 12]} />
        <meshStandardMaterial color="#2dd4bf" emissive="#2dd4bf" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, 0.002, 0.01]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.03, 0.036, 32]} />
        <meshBasicMaterial color="#2dd4bf" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

function Headphones() {
  const ref = useRef<THREE.Group>(null);
  const kick = useRef(0);
  useFrame((state, dt) => {
    kick.current = Math.max(0, kick.current - dt * 1.2);
    if (ref.current) ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 9) * 0.12 * kick.current;
  });
  const dark = <meshStandardMaterial color="#14171d" roughness={0.45} metalness={0.3} />;
  const accent = <meshStandardMaterial color="#c9a227" roughness={0.3} metalness={0.9} />;
  return (
    <Interactive id="headphones" label="Now playing: lo-fi beats" onSelect={() => (kick.current = 1)} labelPosition={[1.02, DESK_TOP + 0.42, -0.4]}>
      <group position={[1.02, DESK_TOP, -0.4]}>
        <mesh position={[0, 0.006, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.06, 0.012, 32]} />
          {dark}
        </mesh>
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.007, 0.007, 0.29, 12]} />
          {accent}
        </mesh>
        <mesh position={[0, 0.3, 0]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.012, 0.012, 0.05, 16]} />
          {dark}
        </mesh>
        <group ref={ref} position={[0, 0.3, 0]}>
          {/* headband */}
          <mesh rotation-x={Math.PI / 2} rotation-z={Math.PI} position={[0, -0.005, 0]}>
            <torusGeometry args={[0.085, 0.011, 12, 40, Math.PI]} />
            {dark}
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s} position={[0, -0.075, s * 0.085]}>
              <mesh rotation-x={Math.PI / 2} castShadow>
                <cylinderGeometry args={[0.045, 0.045, 0.03, 32]} />
                {dark}
              </mesh>
              <mesh rotation-x={Math.PI / 2} position={[0, 0, s * 0.016]}>
                <cylinderGeometry args={[0.03, 0.03, 0.004, 32]} />
                {accent}
              </mesh>
            </group>
          ))}
        </group>
      </group>
    </Interactive>
  );
}

function Speaker({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  const power = useStore((s) => s.power);
  return (
    <group position={position} rotation-y={rotation}>
      <RoundedBox args={[0.12, 0.2, 0.13]} radius={0.01} position={[0, 0.1, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#1a1d24" roughness={0.6} />
      </RoundedBox>
      <mesh position={[0, 0.075, 0.0655]}>
        <circleGeometry args={[0.038, 40]} />
        <meshStandardMaterial color="#0b0c10" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.075, 0.066]}>
        <ringGeometry args={[0.036, 0.04, 40]} />
        <meshStandardMaterial color="#3a3f4a" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.15, 0.0655]}>
        <circleGeometry args={[0.014, 24]} />
        <meshStandardMaterial color="#2a2e37" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0.04, 0.02, 0.066]}>
        <circleGeometry args={[0.003, 12]} />
        <meshBasicMaterial color={power > 0.6 ? "#2dd4bf" : "#111"} toneMapped={false} />
      </mesh>
    </group>
  );
}

function notebookTexture() {
  const { canvas, ctx } = createCanvas(256, 340);
  ctx.fillStyle = "#f4efe4";
  ctx.fillRect(0, 0, 256, 340);
  ctx.strokeStyle = "rgba(80,120,170,0.35)";
  for (let y = 40; y < 340; y += 18) {
    ctx.beginPath();
    ctx.moveTo(12, y);
    ctx.lineTo(244, y);
    ctx.stroke();
  }
  ctx.fillStyle = "#1f2937";
  ctx.font = `600 17px ${fontFamily("mono")}`;
  ctx.fillText("TODO", 16, 32);
  ctx.font = `15px ${fontFamily("mono")}`;
  const items = ["✓ ship v1", "✓ write tests", "□ say hello :)"];
  items.forEach((t, i) => ctx.fillText(t, 18, 62 + i * 36));
  return canvasTexture(canvas);
}

function Notebook() {
  const tex = useMemo(() => notebookTexture(), []);
  return (
    <group position={[-0.84, DESK_TOP, -0.2]} rotation-y={0.22}>
      <RoundedBox args={[0.17, 0.012, 0.23]} radius={0.003} position={[0, 0.006, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#20304a" roughness={0.8} />
      </RoundedBox>
      <mesh position={[0, 0.0125, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.155, 0.215]} />
        <meshStandardMaterial map={tex} roughness={0.9} />
      </mesh>
      {/* pen */}
      <mesh position={[0.1, 0.008, 0]} rotation={[Math.PI / 2, 0, 0.1]} castShadow>
        <cylinderGeometry args={[0.0045, 0.0045, 0.14, 12]} />
        <meshStandardMaterial color="#c9a227" metalness={0.8} roughness={0.25} />
      </mesh>
    </group>
  );
}

function Phone() {
  const painter = useMemo(() => new PhonePainter(), []);
  const power = useStore((s) => s.power);
  const glow = useRef<THREE.MeshBasicMaterial>(null);
  useEffect(() => () => painter.texture.dispose(), [painter]);
  useFrame((state) => {
    painter.update(state.clock.elapsedTime, Math.min(1, power * 1.2));
    if (glow.current) glow.current.color.setScalar(0.85 + Math.sin(state.clock.elapsedTime * 2) * 0.05);
  });
  return (
    <group position={[-0.6, DESK_TOP, -0.09]} rotation-y={-0.3}>
      <RoundedBox args={[0.072, 0.008, 0.15]} radius={0.004} position={[0, 0.004, 0]} castShadow>
        <meshStandardMaterial color="#0d0f14" roughness={0.25} metalness={0.6} />
      </RoundedBox>
      <mesh position={[0, 0.0085, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.066, 0.142]} />
        <meshBasicMaterial ref={glow} map={painter.texture} toneMapped={false} />
      </mesh>
    </group>
  );
}
