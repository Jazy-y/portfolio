"use client";

import { RoundedBox, Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useStore } from "@/lib/store";
import { cityTexture, woodTexture } from "./textures";

const WALL = "#141925";
const WALL_ROUGH = 0.92;

export function Room() {
  const quality = useStore((s) => s.quality);
  const city = useMemo(() => cityTexture(), []);
  const floorTex = useMemo(() => {
    const t = woodTexture("#2a1d17", 3);
    t.repeat.set(3, 10);
    t.rotation = Math.PI / 2;
    return t;
  }, []);

  return (
    <group>
      {/* floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0.3, 0, 0.6]} receiveShadow>
        <planeGeometry args={[6, 4.2]} />
        <meshStandardMaterial map={floorTex} color="#8a7a70" roughness={0.75} metalness={0.05} />
      </mesh>

      {/* back wall */}
      <mesh position={[0.25, 1.5, -1.2]} receiveShadow>
        <planeGeometry args={[5.5, 3]} />
        <meshStandardMaterial color={WALL} roughness={WALL_ROUGH} />
      </mesh>
      {/* skirting */}
      <mesh position={[0.25, 0.04, -1.18]}>
        <boxGeometry args={[5.5, 0.08, 0.02]} />
        <meshStandardMaterial color="#0d1018" roughness={0.6} />
      </mesh>

      {/* ceiling and right wall close the room so nothing leaks above or beside it */}
      <mesh position={[0.25, 3, 0.65]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[5.6, 3.8]} />
        <meshStandardMaterial color="#0a0d14" roughness={1} />
      </mesh>
      <mesh position={[2.95, 1.5, 0.65]} rotation-y={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[3.8, 3]} />
        <meshStandardMaterial color={WALL} roughness={WALL_ROUGH} />
      </mesh>
      <LeftWallWithWindow city={city} />
      <SlatWall />
      <Rug />
      <Chair />
      <FloorPlant />
      {quality === "high" && (
        <Sparkles count={70} scale={[2.2, 1.8, 2.4]} position={[-1.3, 1.5, 0]} size={1.6} speed={0.18} opacity={0.35} color="#a5c8ff" />
      )}
    </group>
  );
}

function LeftWallWithWindow({ city }: { city: THREE.Texture }) {
  const x = -2.5;
  const mat = <meshStandardMaterial color={WALL} roughness={WALL_ROUGH} />;
  const frame = <meshStandardMaterial color="#0a0c12" roughness={0.4} metalness={0.6} />;
  return (
    <group>
      <mesh position={[x, 0.425, 0.65]} receiveShadow>
        <boxGeometry args={[0.1, 0.85, 3.7]} />
        {mat}
      </mesh>
      <mesh position={[x, 2.725, 0.65]}>
        <boxGeometry args={[0.1, 0.55, 3.7]} />
        {mat}
      </mesh>
      <mesh position={[x, 1.65, -1.05]}>
        <boxGeometry args={[0.1, 1.6, 0.3]} />
        {mat}
      </mesh>
      <mesh position={[x, 1.65, 1.7]}>
        <boxGeometry args={[0.1, 1.6, 1.6]} />
        {mat}
      </mesh>
      {/* window frame + mullions */}
      {[
        [0, 0.86, 0, 1.84, 0.04],
        [0, 2.44, 0, 1.84, 0.04],
        [0, 1.65, 0, 1.84, 0.025],
      ].map(([, y, , w, t], i) => (
        <mesh key={`h${i}`} position={[x + 0.02, y as number, 0]}>
          <boxGeometry args={[0.07, t as number, w as number]} />
          {frame}
        </mesh>
      ))}
      {[-0.9, 0, 0.9].map((z, i) => (
        <mesh key={`v${i}`} position={[x + 0.02, 1.65, z]}>
          <boxGeometry args={[0.07, 1.6, i === 1 ? 0.025 : 0.04]} />
          {frame}
        </mesh>
      ))}
      {/* sill */}
      <mesh position={[x + 0.1, 0.84, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.22, 0.03, 1.9]} />
        <meshStandardMaterial color="#1c212c" roughness={0.6} />
      </mesh>
      {/* glass with a faint reflection */}
      <mesh position={[x, 1.65, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[1.8, 1.58]} />
        <meshPhysicalMaterial color="#8fb3ff" transparent opacity={0.06} roughness={0.05} metalness={0} />
      </mesh>
      {/* city outside */}
      <mesh position={[-7.5, 1.6, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[14, 7]} />
        <meshBasicMaterial map={city} toneMapped={false} />
      </mesh>
    </group>
  );
}

function SlatWall() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = 27;
  const tex = useMemo(() => {
    const t = woodTexture("#3b2519", 11);
    t.repeat.set(0.15, 1);
    return t;
  }, []);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      m.makeTranslation(-1.3 + i * 0.1, 1.72, -1.17);
      ref.current!.setMatrixAt(i, m);
    }
    ref.current!.instanceMatrix.needsUpdate = true;
  }, []);
  const power = useStore((s) => s.power);
  const led = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((state) => {
    if (led.current) led.current.emissiveIntensity = power * (2.4 + Math.sin(state.clock.elapsedTime * 0.8) * 0.15);
  });
  return (
    <group>
      <instancedMesh ref={ref} args={[undefined, undefined, count]} castShadow receiveShadow>
        <boxGeometry args={[0.062, 1.5, 0.035]} />
        <meshStandardMaterial map={tex} color="#c79c7a" roughness={0.7} />
      </instancedMesh>
      {/* backing panel */}
      <mesh position={[0, 1.72, -1.19]}>
        <planeGeometry args={[2.72, 1.52]} />
        <meshStandardMaterial color="#0b0d12" roughness={1} />
      </mesh>
      {/* bias-light strip behind the monitors */}
      <mesh position={[0, 0.98, -1.145]}>
        <boxGeometry args={[2.5, 0.012, 0.01]} />
        <meshStandardMaterial ref={led} color="#0a2a28" emissive="#2dd4bf" emissiveIntensity={0} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Rug() {
  return (
    <group position={[0.35, 0.003, 0.25]}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[1.35, 64]} />
        <meshStandardMaterial color="#1a2230" roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.002}>
        <ringGeometry args={[1.18, 1.22, 64]} />
        <meshStandardMaterial color="#2b3b4f" roughness={1} />
      </mesh>
    </group>
  );
}

function Chair() {
  const fabric = <meshStandardMaterial color="#20242e" roughness={0.95} />;
  const metal = <meshStandardMaterial color="#2c313b" roughness={0.35} metalness={0.8} />;
  return (
    <group position={[1.62, 0, 0.42]} rotation-y={-1.05}>
      {Array.from({ length: 5 }).map((_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <group key={i} rotation-y={a}>
            <mesh position={[0.17, 0.07, 0]} castShadow>
              <boxGeometry args={[0.34, 0.035, 0.05]} />
              {metal}
            </mesh>
            <mesh position={[0.33, 0.03, 0]} castShadow>
              <sphereGeometry args={[0.03, 12, 12]} />
              <meshStandardMaterial color="#0d0f14" roughness={0.5} />
            </mesh>
          </group>
        );
      })}
      <mesh position={[0, 0.27, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.03, 0.38, 16]} />
        {metal}
      </mesh>
      <RoundedBox args={[0.52, 0.09, 0.5]} radius={0.04} smoothness={4} position={[0, 0.5, 0]} castShadow receiveShadow>
        {fabric}
      </RoundedBox>
      <RoundedBox args={[0.5, 0.66, 0.08]} radius={0.04} smoothness={4} position={[0, 0.92, 0.25]} rotation-x={-0.12} castShadow>
        {fabric}
      </RoundedBox>
      <mesh position={[0, 0.66, 0.24]} rotation-x={-0.12}>
        <boxGeometry args={[0.06, 0.24, 0.03]} />
        {metal}
      </mesh>
      {[-0.28, 0.28].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.62, 0.02]} castShadow>
            <boxGeometry args={[0.04, 0.2, 0.04]} />
            {metal}
          </mesh>
          <RoundedBox args={[0.07, 0.03, 0.28]} radius={0.012} position={[x, 0.73, 0]} castShadow>
            {fabric}
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}

function leafGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.09, 0.05, 0.11, 0.2, 0, 0.32);
  s.bezierCurveTo(-0.11, 0.2, -0.09, 0.05, 0, 0);
  const g = new THREE.ShapeGeometry(s, 10);
  return g;
}

function FloorPlant() {
  const geo = useMemo(() => leafGeometry(), []);
  const group = useRef<THREE.Group>(null);
  const leaves = useMemo(() => {
    const out: { pos: [number, number, number]; rot: [number, number, number]; s: number }[] = [];
    for (let i = 0; i < 16; i++) {
      const a = i * 2.4;
      const h = 0.55 + (i % 5) * 0.12;
      out.push({ pos: [Math.cos(a) * 0.05, h, Math.sin(a) * 0.05], rot: [-0.9 + (i % 3) * 0.2, a, 0], s: 0.9 + (i % 4) * 0.15 });
    }
    return out;
  }, []);
  useFrame((state) => {
    if (group.current) group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.6) * 0.015;
  });
  return (
    // in the corner, clear of the line of sight to the timeline cards
    <group position={[2.62, 0, -0.45]}>
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.17, 0.13, 0.4, 32]} />
        <meshStandardMaterial color="#d8d2c4" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.395, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.01, 32]} />
        <meshStandardMaterial color="#2a1c12" roughness={1} />
      </mesh>
      <group ref={group}>
        {leaves.map((l, i) => (
          <group key={i} position={l.pos} rotation={l.rot}>
            <mesh position={[0, -0.12, 0]}>
              <cylinderGeometry args={[0.004, 0.006, 0.3, 6]} />
              <meshStandardMaterial color="#2f5a2a" />
            </mesh>
            <mesh geometry={geo} scale={l.s} castShadow>
              <meshStandardMaterial color={i % 2 ? "#2f6b3a" : "#3b7d45"} side={THREE.DoubleSide} roughness={0.6} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
