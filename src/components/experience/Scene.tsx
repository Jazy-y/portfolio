"use client";

import { AdaptiveDpr, Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Section } from "@/content/profile";
import { useStore } from "@/lib/store";
import { CameraRig, INTRO_START } from "./CameraRig";
import { Desk } from "./Desk";
import { Keyboard } from "./Keyboard";
import { Monitors } from "./Monitors";
import { Peripherals } from "./Peripherals";
import { Room } from "./Room";
import { Pinboard, SkillsHologram, TimelineWall } from "./WallFeatures";

type Props = {
  section: Section;
  mobile: boolean;
  onNavigate: (s: Section) => void;
  onReady: () => void;
};

export default function Scene({ section, mobile, onNavigate, onReady }: Props) {
  const quality = useStore((s) => s.quality);
  const setQuality = useStore((s) => s.setQuality);
  const high = quality === "high";
  return (
    <Canvas
      shadows={high}
      dpr={high ? [1, 1.75] : [0.85, 1.25]}
      camera={{ fov: mobile ? 50 : 38, near: 0.05, far: 40, position: INTRO_START.pos }}
      gl={{ antialias: !high, powerPreference: "high-performance", alpha: false }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
      onPointerMissed={() => useStore.getState().setHovered(null)}
      aria-hidden
    >
      <color attach="background" args={["#05070c"]} />
      <fog attach="fog" args={["#05070c", 5.5, 13]} />
      <PerformanceMonitor onDecline={() => setQuality("low")} flipflops={2} />
      <AdaptiveDpr pixelated={false} />
      <Suspense fallback={null}>
        <Lights />
        <Room />
        <Desk />
        <Keyboard />
        <Monitors section={section} go={onNavigate} />
        <Peripherals go={onNavigate} />
        <Pinboard go={onNavigate} />
        <TimelineWall go={onNavigate} />
        <SkillsHologram section={section} go={onNavigate} />
        <Environment resolution={128} frames={1}>
          <Lightformer form="rect" intensity={1.2} color="#8fb0ff" position={[-5, 2, 0]} rotation-y={Math.PI / 2} scale={[4, 2, 1]} />
          <Lightformer form="rect" intensity={0.6} color="#2dd4bf" position={[0, 1.5, -3]} scale={[4, 1, 1]} />
          <Lightformer form="ring" intensity={0.8} color="#ffc27a" position={[2, 3, 3]} scale={1.5} />
        </Environment>
        <ReadySignal onReady={onReady} />
      </Suspense>
      <CameraRig section={section} mobile={mobile} />
      {high && (
        <EffectComposer multisampling={2}>
          <Bloom mipmapBlur luminanceThreshold={0.95} luminanceSmoothing={0.2} intensity={0.55} radius={0.7} />
          <Vignette offset={0.3} darkness={0.6} />
        </EffectComposer>
      )}
    </Canvas>
  );
}

function Lights() {
  const amb = useRef<THREE.AmbientLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const led = useRef<THREE.PointLight>(null);
  const moonTarget = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const p = useStore.getState().power;
    if (amb.current) amb.current.intensity = 0.05 + p * 0.12;
    if (hemi.current) hemi.current.intensity = 0.08 + p * 0.22;
    if (led.current) led.current.intensity = p * 1.6;
  });
  return (
    <>
      <ambientLight ref={amb} color="#9fb4ff" />
      <hemisphereLight ref={hemi} args={["#6b7cff", "#1a1210", 0.1]} />
      {/* moonlight through the window: present before the room powers on */}
      <primitive object={moonTarget} position={[0, 0.8, -0.5]} />
      <directionalLight
        position={[-6, 3.2, 0.4]}
        target={moonTarget}
        intensity={0.9}
        color="#9db7ff"
        castShadow={false}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-bias={-0.0005}
      />
      {/* teal bias light behind the monitors */}
      <pointLight ref={led} position={[0, 1.05, -1.0]} color="#2dd4bf" distance={1.8} decay={2} intensity={0} />
    </>
  );
}

/** Tells the UI the first frame has rendered (scene compiled and ready). */
function ReadySignal({ onReady }: { onReady: () => void }) {
  const { gl, scene, camera } = useThree();
  const done = useRef(false);
  const compiled = useRef(false);
  useEffect(() => {
    // Compile every shader before the intro starts (asynchronously where the
    // driver supports it), so the cinematic does not stall mid-animation.
    let alive = true;
    gl.compileAsync(scene, camera)
      .catch(() => gl.compile(scene, camera))
      .finally(() => {
        if (alive) compiled.current = true;
      });
    return () => {
      alive = false;
    };
  }, [gl, scene, camera]);
  useFrame(() => {
    if (done.current || !compiled.current) return;
    done.current = true;
    // wait two more frames so textures are uploaded too
    requestAnimationFrame(() => requestAnimationFrame(() => onReady()));
  });
  return null;
}
