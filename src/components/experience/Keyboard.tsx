"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useStore } from "@/lib/store";
import { DESK_TOP } from "./Desk";

const U = 0.019; // key pitch in metres
const CAP = 0.0172;

// 60% layout: widths in units per row
const ROWS: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
  [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5],
  [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25],
  [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.75],
  [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 1.25],
];

type Key = { x: number; z: number; w: number; color: THREE.Color; row: number };

const CREAM = new THREE.Color("#e9e3d6");
const GREY = new THREE.Color("#8f96a3");
const TEAL = new THREE.Color("#2dd4bf");
const AMBER = new THREE.Color("#f59e0b");
const DARK = new THREE.Color("#2b303b");

function buildKeys(): Key[] {
  const keys: Key[] = [];
  const width = 15 * U;
  ROWS.forEach((row, r) => {
    let x = -width / 2;
    row.forEach((w, i) => {
      let color = CREAM;
      const last = i === row.length - 1;
      if (r === 0 && i === 0) color = AMBER; // Esc
      else if (r === 2 && last) color = TEAL; // Enter
      else if (r === 4 && w > 6) color = DARK; // Space
      else if (w > 1 || r === 4) color = GREY; // modifiers
      keys.push({ x: x + (w * U) / 2, z: (r - 2) * U, w, color, row: r });
      x += w * U;
    });
  });
  return keys;
}

const KEYS = buildKeys();

export function Keyboard() {
  const keys = KEYS;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const pressRef = useRef(new Float32Array(KEYS.length));
  const next = useRef(0);
  const geo = useMemo(() => new RoundedBoxGeometry(1, 1, 1, 2, 0.18), []);
  const dummyRef = useRef(new THREE.Object3D());

  useLayoutEffect(() => {
    keys.forEach((k, i) => mesh.current!.setColorAt(i, k.color));
    mesh.current!.instanceColor!.needsUpdate = true;
  }, [keys]);

  useFrame((state, dt) => {
    const press = pressRef.current;
    const dummy = dummyRef.current;
    const { phase, reducedMotion } = useStore.getState();
    const t = state.clock.elapsedTime;
    // idle "someone is typing" rhythm once the scene is live
    if (phase === "explore" && !reducedMotion && t > next.current) {
      const i = Math.floor(Math.random() * keys.length);
      press[i] = 1;
      next.current = t + 0.06 + Math.random() * (Math.random() < 0.15 ? 0.6 : 0.12);
    }
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      press[i] = Math.max(0, press[i] - dt * 9);
      const tilt = (k.row - 2) * 0.0012; // sculpted rows
      dummy.position.set(k.x, 0.018 + tilt - press[i] * 0.0045, k.z);
      dummy.scale.set(k.w * U - (U - CAP), 0.011, CAP);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    }
    mesh.current!.instanceMatrix.needsUpdate = true;
  });

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (e.instanceId !== undefined) pressRef.current[e.instanceId] = 1;
  };

  return (
    <group position={[0, DESK_TOP, -0.25]} rotation-x={0.035}>
      {/* case */}
      <RoundedBox args={[15 * U + 0.022, 0.018, 5 * U + 0.022]} radius={0.006} smoothness={3} position={[0, 0.009, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#232833" roughness={0.4} metalness={0.6} />
      </RoundedBox>
      {/* underglow */}
      <mesh position={[0, 0.0015, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[15 * U + 0.05, 5 * U + 0.05]} />
        <meshBasicMaterial color="#2dd4bf" transparent opacity={0.12} depthWrite={false} toneMapped={false} />
      </mesh>
      <instancedMesh ref={mesh} args={[geo, undefined, keys.length]} castShadow onPointerMove={onMove}>
        <meshStandardMaterial roughness={0.55} />
      </instancedMesh>
    </group>
  );
}
