"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { projects, type Section } from "@/content/profile";
import { useStore } from "@/lib/store";
import { DESK_TOP } from "./Desk";
import { Interactive } from "./Interactive";
import { CodePainter, MainPainter, ScreenPainter, TerminalPainter } from "./painters";

/** Each screen wakes up at a different point of the intro's power ramp. */
function screenPower(power: number, start: number) {
  return THREE.MathUtils.clamp((power - start) / (1 - start) * 1.15, 0, 1);
}

type MonitorProps = {
  painter: ScreenPainter;
  size: [number, number];
  position: [number, number, number];
  rotationY?: number;
  powerStart: number;
  standHeight: number;
};

function Monitor({ painter, size, position, rotationY = 0, powerStart, standHeight }: MonitorProps) {
  const [w, h] = size;
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((state) => {
    const p = screenPower(useStore.getState().power, powerStart);
    painter.update(state.clock.elapsedTime, p);
    // keep screens slightly above 1.0 so bloom catches them subtly
    if (mat.current) mat.current.color.setScalar(0.9 + p * 0.25);
  });
  useEffect(() => () => painter.texture.dispose(), [painter]);
  const shell = <meshStandardMaterial color="#0d1015" roughness={0.38} metalness={0.55} />;
  return (
    <group position={position} rotation-y={rotationY}>
      <RoundedBox args={[w + 0.03, h + 0.03, 0.028]} radius={0.008} smoothness={3} castShadow>
        {shell}
      </RoundedBox>
      {/* back housing */}
      <RoundedBox args={[w * 0.55, h * 0.55, 0.04]} radius={0.01} position={[0, -0.01, -0.03]} castShadow>
        {shell}
      </RoundedBox>
      <mesh position={[0, 0, 0.0145]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial ref={mat} map={painter.texture} toneMapped={false} />
      </mesh>
      {/* stand */}
      <mesh position={[0, -standHeight / 2, -0.06]} castShadow>
        <boxGeometry args={[0.035, standHeight, 0.02]} />
        {shell}
      </mesh>
      <RoundedBox args={[0.2, 0.01, 0.14]} radius={0.004} position={[0, -standHeight, -0.06]} castShadow receiveShadow>
        {shell}
      </RoundedBox>
      {/* power LED */}
      <mesh position={[w / 2 - 0.02, -h / 2 - 0.008, 0.0146]}>
        <circleGeometry args={[0.0025, 12]} />
        <meshBasicMaterial color="#2dd4bf" toneMapped={false} />
      </mesh>
    </group>
  );
}

export function Monitors({ section, go }: { section: Section; go: (s: Section) => void }) {
  const code = useMemo(() => new CodePainter(400, 660, 15), []);
  const term = useMemo(() => new TerminalPainter(640, 376, 12), []);
  const main = useMemo(() => new MainPainter(1280, 540, 24), []);
  const projectIndex = useStore((s) => s.projectIndex);
  const glow = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    main.setProject(section === "projects" ? projects[projectIndex] : null, state.clock.elapsedTime);
    if (glow.current) glow.current.intensity = useStore.getState().power * 0.9;
  });

  const centerY = DESK_TOP + 0.38;
  return (
    <group>
      <Interactive id="monitor-main" label="View projects →" onSelect={() => go("projects")} labelPosition={[0, centerY + 0.3, -0.7]} lift={0}>
        <Monitor painter={main} size={[1.0, 0.42]} position={[0, centerY, -0.72]} powerStart={0.35} standHeight={0.375} />
      </Interactive>
      <Interactive id="monitor-left" label="View projects →" onSelect={() => go("projects")} labelPosition={[-0.82, DESK_TOP + 0.72, -0.6]} lift={0}>
        <Monitor painter={code} size={[0.34, 0.56]} position={[-0.83, DESK_TOP + 0.42, -0.6]} rotationY={0.42} powerStart={0.2} standHeight={0.415} />
      </Interactive>
      <Interactive id="monitor-right" label="View projects →" onSelect={() => go("projects")} labelPosition={[0.82, DESK_TOP + 0.55, -0.6]} lift={0}>
        <Monitor painter={term} size={[0.56, 0.33]} position={[0.83, DESK_TOP + 0.3, -0.6]} rotationY={-0.42} powerStart={0.5} standHeight={0.295} />
      </Interactive>
      <pointLight ref={glow} position={[0, centerY, -0.42]} color="#9ff7ea" distance={1.6} decay={2} intensity={0} />
    </group>
  );
}
