"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { easing } from "maath";
import { useStore } from "@/lib/store";
import { Interactive } from "./Interactive";
import { canvasTexture, createCanvas, woodTexture } from "./textures";

export const DESK_TOP = 0.76;

export function Desk() {
  const wood = useMemo(() => {
    const t = woodTexture("#4a2f22", 7);
    t.repeat.set(1.5, 1);
    return t;
  }, []);
  const metal = <meshStandardMaterial color="#1b1f27" roughness={0.35} metalness={0.85} />;
  return (
    <group>
      <RoundedBox args={[2.5, 0.045, 0.86]} radius={0.012} smoothness={4} position={[0, DESK_TOP - 0.0225, -0.45]} castShadow receiveShadow>
        <meshPhysicalMaterial map={wood} color="#d8b49a" roughness={0.42} clearcoat={0.55} clearcoatRoughness={0.35} />
      </RoundedBox>
      {/* steel frame */}
      {[-1.12, 1.12].map((x) => (
        <group key={x}>
          {[-0.12, -0.78].map((z) => (
            <mesh key={z} position={[x, (DESK_TOP - 0.045) / 2, z]} castShadow>
              <boxGeometry args={[0.05, DESK_TOP - 0.045, 0.05]} />
              {metal}
            </mesh>
          ))}
          <mesh position={[x, 0.02, -0.45]} castShadow>
            <boxGeometry args={[0.06, 0.04, 0.8]} />
            {metal}
          </mesh>
          <mesh position={[x, DESK_TOP - 0.07, -0.45]}>
            <boxGeometry args={[0.04, 0.04, 0.7]} />
            {metal}
          </mesh>
        </group>
      ))}
      <mesh position={[0, DESK_TOP - 0.07, -0.8]}>
        <boxGeometry args={[2.2, 0.05, 0.03]} />
        {metal}
      </mesh>
      {/* desk mat */}
      <RoundedBox args={[1.02, 0.004, 0.4]} radius={0.002} position={[0.12, DESK_TOP + 0.002, -0.24]} receiveShadow>
        <meshStandardMaterial color="#161b24" roughness={0.95} />
      </RoundedBox>
      <mesh position={[0.12, DESK_TOP + 0.0045, -0.04]}>
        <boxGeometry args={[1.0, 0.0005, 0.004]} />
        <meshStandardMaterial color="#2dd4bf" emissive="#2dd4bf" emissiveIntensity={0.35} />
      </mesh>
      <Lamp />
      <Mug />
      <Books />
      <Succulent position={[1.16, DESK_TOP, -0.12]} />
    </group>
  );
}

function Lamp() {
  const lampOn = useStore((s) => s.lampOn);
  const toggleLamp = useStore((s) => s.toggleLamp);
  const power = useStore((s) => s.power);
  const light = useRef<THREE.SpotLight>(null);
  const bulb = useRef<THREE.MeshStandardMaterial>(null);
  const target = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(-0.62, DESK_TOP, -0.2);
    return o;
  }, []);
  const quality = useStore((s) => s.quality);

  useFrame((_, dt) => {
    const on = lampOn ? Math.min(1, power * 1.4) : 0;
    if (light.current) easing.damp(light.current, "intensity", on * 5.5, 0.25, dt);
    if (bulb.current) easing.damp(bulb.current, "emissiveIntensity", on * 6, 0.25, dt);
  });

  const metal = <meshStandardMaterial color="#e6e1d8" roughness={0.35} metalness={0.4} />;
  return (
    <Interactive id="lamp" label={lampOn ? "Turn lamp off" : "Turn lamp on"} onSelect={toggleLamp} labelPosition={[-0.9, DESK_TOP + 0.5, -0.16]} lift={0}>
      <group position={[-1.12, DESK_TOP, -0.16]}>
        <mesh position={[0, 0.012, 0]} castShadow>
          <cylinderGeometry args={[0.085, 0.095, 0.024, 40]} />
          {metal}
        </mesh>
        {/* lower arm */}
        <group rotation-z={-0.35}>
          <mesh position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.009, 0.009, 0.38, 12]} />
            {metal}
          </mesh>
          <mesh position={[0, 0.39, 0]}>
            <sphereGeometry args={[0.018, 16, 16]} />
            {metal}
          </mesh>
          {/* upper arm */}
          <group position={[0, 0.39, 0]} rotation-z={-1.55}>
            <mesh position={[0, 0.17, 0]} castShadow>
              <cylinderGeometry args={[0.008, 0.008, 0.34, 12]} />
              {metal}
            </mesh>
            {/* head */}
            <group position={[0, 0.34, 0]} rotation-z={2.15}>
              <mesh castShadow>
                <cylinderGeometry args={[0.035, 0.075, 0.11, 32, 1, true]} />
                <meshStandardMaterial color="#e6e1d8" roughness={0.35} metalness={0.4} side={THREE.DoubleSide} />
              </mesh>
              <mesh position={[0, -0.03, 0]}>
                <sphereGeometry args={[0.028, 16, 16]} />
                <meshStandardMaterial ref={bulb} color="#fff3d6" emissive="#ffc27a" emissiveIntensity={0} toneMapped={false} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
      <primitive object={target} />
      <spotLight
        ref={light}
        position={[-0.67, DESK_TOP + 0.24, -0.16]}
        target={target}
        angle={0.75}
        penumbra={0.8}
        distance={3}
        decay={2}
        color="#ffbf73"
        intensity={0}
        castShadow={quality === "high"}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
    </Interactive>
  );
}

function steamTexture() {
  const { canvas, ctx } = createCanvas(64, 64);
  const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  g.addColorStop(0, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return canvasTexture(canvas);
}

function Mug() {
  const puffs = useRef<THREE.Group>(null);
  const tex = useMemo(() => steamTexture(), []);
  const reduced = useStore((s) => s.reducedMotion);
  const burst = useRef(0);
  useFrame((state, dt) => {
    burst.current = Math.max(0, burst.current - dt * 0.6);
    const g = puffs.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    g.children.forEach((c, i) => {
      const life = ((t * 0.32 + i / g.children.length) % 1 + 1) % 1;
      c.position.set(Math.sin(t * 0.9 + i * 2.1) * 0.012 * life, 0.11 + life * 0.18, Math.cos(t * 0.7 + i) * 0.01 * life);
      const s = 0.03 + life * 0.07 * (1 + burst.current);
      c.scale.setScalar(s);
      const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
      m.opacity = reduced ? 0 : Math.sin(life * Math.PI) * (0.22 + burst.current * 0.35);
    });
  });
  return (
    <Interactive id="mug" label="Coffee ☕" onSelect={() => (burst.current = 1)} labelPosition={[-0.48, DESK_TOP + 0.3, -0.4]}>
      <group position={[-0.48, DESK_TOP, -0.4]}>
        <mesh position={[0, 0.048, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.038, 0.034, 0.096, 40, 1, true]} />
          <meshStandardMaterial color="#e9e4dc" roughness={0.3} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.002, 0]}>
          <cylinderGeometry args={[0.034, 0.034, 0.004, 40]} />
          <meshStandardMaterial color="#e9e4dc" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.085, 0]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.036, 40]} />
          <meshStandardMaterial color="#2b170c" roughness={0.15} />
        </mesh>
        {/* handle: a vertical half-ring on the mug's side, attached at both ends */}
        <mesh position={[0.036, 0.05, 0]} rotation-z={-Math.PI / 2} castShadow>
          <torusGeometry args={[0.024, 0.006, 14, 28, Math.PI]} />
          <meshStandardMaterial color="#e9e4dc" roughness={0.3} />
        </mesh>
        <group ref={puffs}>
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh key={i}>
              <planeGeometry args={[1, 1]} />
              <meshBasicMaterial map={tex} transparent depthWrite={false} opacity={0} />
            </mesh>
          ))}
        </group>
      </group>
    </Interactive>
  );
}

function Books() {
  const books = [
    { w: 0.17, h: 0.025, d: 0.24, c: "#1f4e5f", r: 0.08 },
    { w: 0.16, h: 0.03, d: 0.23, c: "#7c2d12", r: -0.05 },
    { w: 0.15, h: 0.022, d: 0.21, c: "#d6c7a1", r: 0.14 },
  ];
  let y = DESK_TOP;
  return (
    <group position={[-1.1, 0, -0.46]}>
      {books.map((b, i) => {
        const pos: [number, number, number] = [0, y + b.h / 2, 0];
        y += b.h;
        return (
          <RoundedBox key={i} args={[b.w, b.h, b.d]} radius={0.003} position={pos} rotation-y={b.r} castShadow receiveShadow>
            <meshStandardMaterial color={b.c} roughness={0.8} />
          </RoundedBox>
        );
      })}
    </group>
  );
}

export function Succulent({ position }: { position: [number, number, number] }) {
  const leaves = useMemo(() => {
    const out: { r: number; tilt: number; s: number; y: number }[] = [];
    for (let ring = 0; ring < 3; ring++) {
      const n = 6 + ring * 2;
      for (let i = 0; i < n; i++) out.push({ r: (i / n) * Math.PI * 2 + ring * 0.4, tilt: 0.5 + ring * 0.35, s: 1 - ring * 0.25, y: 0.07 + ring * 0.008 });
    }
    return out;
  }, []);
  return (
    <group position={position}>
      <mesh position={[0, 0.03, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.038, 0.06, 24]} />
        <meshStandardMaterial color="#c75b39" roughness={0.8} />
      </mesh>
      {leaves.map((l, i) => (
        <group key={i} position={[0, l.y, 0]} rotation-y={l.r}>
          <mesh rotation-x={l.tilt} position={[0, 0.012, 0.012]} scale={[0.012 * l.s, 0.03 * l.s, 0.007 * l.s]} castShadow>
            <sphereGeometry args={[1, 10, 10]} />
            <meshStandardMaterial color={i % 3 ? "#6f9e7b" : "#88b394"} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Keeps a ref'd object's world matrix fresh for lights that target it. */
export function useTargetUpdate(obj: THREE.Object3D) {
  useEffect(() => {
    obj.updateMatrixWorld();
  }, [obj]);
}
