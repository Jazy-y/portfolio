"use client";

import { Html, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { CultureGoApp } from "@/components/cultureGo/CultureGoApp";
import { projects } from "@/content/profile";
import { useStore } from "@/lib/store";
import { Interactive } from "./Interactive";
import { PHONE_APP_PX, PHONE_POS, PHONE_SCREEN, PHONE_SIZE } from "./showcaseLayout";

const SLUG = "food-culture-guide";
const { w: W, h: H, d: D } = PHONE_SIZE;
/** World units per CSS pixel of the app, so 380 px fill the phone screen. */
const APP_SCALE = (PHONE_SCREEN.w * 40) / PHONE_APP_PX.w;

/**
 * Food Culture Guide showcase: a phone rises from the desk, turns to face the
 * camera and its screen switches on with the interactive CultureGo recreation.
 * The phone stays perfectly still once it has arrived, so the app is easy to use.
 */
export function PhoneShowcase() {
  const show = useStore((s) => s.section === "projects" && s.phase === "explore" && projects[s.projectIndex]?.showcase === "phone");
  const focus = useStore((s) => s.focus);
  const reduced = useStore((s) => s.reducedMotion);
  const group = useRef<THREE.Group>(null);
  const anim = useRef({ t: 0 });
  // `present` keeps the phone out of the scene (and out of raycasts) while hidden
  const [present, setPresent] = useState(false);
  const [screenOn, setScreenOn] = useState(false);

  useEffect(() => {
    const a = anim.current;
    const tween = show
      ? gsap.to(a, {
          t: 1,
          duration: reduced ? 0.01 : 1.5,
          delay: reduced ? 0 : 0.45,
          ease: "power3.out",
          onStart: () => setPresent(true),
          onComplete: () => setScreenOn(true),
        })
      : gsap.to(a, {
          t: 0,
          duration: reduced ? 0.01 : 0.5,
          ease: "power2.in",
          onStart: () => setScreenOn(false),
          onComplete: () => setPresent(false),
        });
    return () => {
      tween.kill();
    };
  }, [show, reduced]);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const t = anim.current.t;
    const inv = 1 - t;
    g.position.set(PHONE_POS[0], PHONE_POS[1] - inv * 0.26, PHONE_POS[2]);
    // rises while turning from its back to face the camera
    g.rotation.set(-inv * 0.35, inv * Math.PI * 1.05, inv * 0.12);
    g.scale.setScalar(0.55 + 0.45 * t);
  });

  const open = () => {
    const st = useStore.getState();
    if (st.canFocus) st.setFocus(true);
    else st.setDemo(SLUG);
  };

  if (!present) return null;

  const body = <meshStandardMaterial color="#1b1e24" roughness={0.28} metalness={0.85} />;
  return (
    <group ref={group}>
      <Interactive id="phone-demo" label="Try the app →" onSelect={open} labelPosition={[0, H / 2 + 0.05, 0]} lift={0} enabled={!focus && screenOn}>
        {/* titanium frame and glass */}
        <RoundedBox args={[W, H, D]} radius={0.012} smoothness={4} castShadow>
          {body}
        </RoundedBox>
        <mesh position={[0, 0, D / 2 + 0.0004]}>
          <planeGeometry args={[PHONE_SCREEN.w, PHONE_SCREEN.h]} />
          <meshPhysicalMaterial color="#05070a" roughness={0.12} metalness={0.2} clearcoat={1} clearcoatRoughness={0.05} />
        </mesh>
        {/* side buttons */}
        <mesh position={[W / 2 + 0.0012, 0.07, 0]}>
          <boxGeometry args={[0.003, 0.04, 0.006]} />
          {body}
        </mesh>
        <mesh position={[-W / 2 - 0.0012, 0.09, 0]}>
          <boxGeometry args={[0.003, 0.022, 0.006]} />
          {body}
        </mesh>
        <mesh position={[-W / 2 - 0.0012, 0.055, 0]}>
          <boxGeometry args={[0.003, 0.022, 0.006]} />
          {body}
        </mesh>
        {/* camera island on the back */}
        <RoundedBox args={[0.06, 0.06, 0.006]} radius={0.012} position={[-0.038, H / 2 - 0.045, -D / 2 - 0.002]}>
          <meshStandardMaterial color="#2a2e36" roughness={0.3} metalness={0.7} />
        </RoundedBox>
        {[
          [-0.052, H / 2 - 0.031],
          [-0.024, H / 2 - 0.059],
          [-0.052, H / 2 - 0.059],
        ].map(([x, y]) => (
          <mesh key={`${x}${y}`} position={[x, y, -D / 2 - 0.0055]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.0095, 0.0095, 0.003, 24]} />
            <meshStandardMaterial color="#090b0f" roughness={0.1} metalness={0.4} />
          </mesh>
        ))}
      </Interactive>

      {screenOn && (
        <Html
          transform
          position={[0, 0, D / 2 + 0.0008]}
          scale={APP_SCALE}
          zIndexRange={[10, 0]}
          pointerEvents={focus ? "auto" : "none"}
        >
          <div
            className="cg-phone-screen"
            style={{ width: PHONE_APP_PX.w, height: PHONE_APP_PX.h }}
            aria-label="Interactive recreation of the CultureGo app"
          >
            <CultureGoApp />
            {/* dynamic-island style cut-out */}
            <div className="cg-island" aria-hidden />
          </div>
        </Html>
      )}
    </group>
  );
}
