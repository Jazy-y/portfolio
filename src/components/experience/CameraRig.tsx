"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import type { Section } from "@/content/profile";
import { useStore } from "@/lib/store";

type Shot = { pos: [number, number, number]; look: [number, number, number] };

/**
 * On phones the bottom half is covered by the hero text or the content sheet,
 * so the camera aims ~15° below the subject to place it in the upper half.
 */
function mobileShot(pos: [number, number, number], subject: [number, number, number]): Shot {
  const dx = subject[0] - pos[0];
  const dz = subject[2] - pos[2];
  const dist = Math.hypot(dx, dz);
  return { pos, look: [subject[0], subject[1] - dist * 0.27, subject[2]] };
}

/**
 * Camera framings per section. Desktop framings leave room for the content
 * panel; mobile framings keep the subject in the upper half above the sheet.
 */
export const SHOTS: Record<"desktop" | "mobile", Record<Section, Shot>> = {
  desktop: {
    home: { pos: [0.75, 1.52, 1.85], look: [-0.15, 1.02, -0.6] },
    about: { pos: [-1.38, 1.62, 0.32], look: [-1.32, 1.6, -1.2] },
    projects: { pos: [0.42, 1.17, 1.12], look: [0.4, 1.1, -0.72] },
    skills: { pos: [1.22, 1.46, 1.36], look: [1.17, 1.1, -0.1] },
    experience: { pos: [1.5, 1.56, 0.42], look: [1.48, 1.48, -1.2] },
    contact: { pos: [-0.3, 1.32, 0.66], look: [-0.38, 0.8, -0.18] },
  },
  mobile: {
    home: mobileShot([0.45, 1.8, 3.2], [0.0, 1.0, -0.6]),
    about: mobileShot([-1.72, 1.55, 0.65], [-1.72, 1.6, -1.2]),
    projects: mobileShot([0.0, 1.18, 1.2], [0.0, 1.14, -0.72]),
    skills: mobileShot([0.78, 1.35, 1.4], [0.78, 1.14, -0.1]),
    experience: mobileShot([1.82, 1.5, 0.75], [1.82, 1.42, -1.2]),
    contact: mobileShot([-0.55, 1.4, 0.8], [-0.62, 0.8, -0.15]),
  },
};

export const INTRO_START: Shot = { pos: [3.1, 2.35, 4.4], look: [0.2, 1.0, -0.6] };

const v = (a: [number, number, number]) => new THREE.Vector3(...a);
const lookEase = gsap.parseEase("power2.inOut");

type RigState = {
  curve: THREE.CatmullRomCurve3 | null;
  progress: { t: number };
  lookFrom: THREE.Vector3;
  lookTo: THREE.Vector3;
  base: THREE.Vector3;
  look: THREE.Vector3;
  parallax: THREE.Vector2;
  intro: gsap.core.Timeline | null;
  move: gsap.core.Tween | null;
  introPlayed: boolean;
  lastKey: string;
  aspect: number;
  mobile: boolean;
};

export function CameraRig({ section, mobile }: { section: Section; mobile: boolean }) {
  const pointer = useThree((st) => st.pointer);
  const phase = useStore((s) => s.phase);
  const reduced = useStore((s) => s.reducedMotion);
  const setPower = useStore((s) => s.setPower);
  const setPhase = useStore((s) => s.setPhase);

  const rig = useRef<RigState>({
    curve: null,
    progress: { t: 1 },
    lookFrom: v(INTRO_START.look),
    lookTo: v(INTRO_START.look),
    base: v(INTRO_START.pos),
    look: v(INTRO_START.look),
    parallax: new THREE.Vector2(),
    intro: null,
    move: null,
    introPlayed: false,
    lastKey: "",
    aspect: 0,
    mobile: false,
  });

  /** Arc from the current camera position to `shot`; progress starts at 0. */
  const prepare = (shot: Shot) => {
    const s = rig.current;
    const from = s.base.clone();
    const to = v(shot.pos);
    const mid = from.clone().lerp(to, 0.5);
    // lift and pull the midpoint toward the viewer so the path never cuts through the desk or walls
    mid.y += 0.18 + from.distanceTo(to) * 0.08;
    mid.z = Math.max(mid.z, 0.55) + 0.15;
    s.curve = new THREE.CatmullRomCurve3([from, mid, to], false, "centripetal");
    s.lookFrom.copy(s.look);
    s.lookTo.copy(v(shot.look));
    s.progress.t = 0;
  };

  const flyTo = (shot: Shot, duration: number) => {
    const s = rig.current;
    s.move?.kill();
    prepare(shot);
    if (duration <= 0) {
      s.progress.t = 1;
      return;
    }
    s.move = gsap.to(s.progress, { t: 1, duration, ease: "power3.inOut" });
  };

  // Intro: slow dolly in while the room powers on.
  useEffect(() => {
    const s = rig.current;
    if (phase !== "intro" || s.introPlayed) return;
    s.introPlayed = true;
    const shot = SHOTS[mobile ? "mobile" : "desktop"][section];
    s.lastKey = `${section}-${mobile}`;
    if (reduced) {
      flyTo(shot, 0);
      setPower(1);
      setPhase("explore");
      return;
    }
    prepare(shot);
    const power = { p: 0 };
    const tl = gsap.timeline({ onComplete: () => setPhase("explore") });
    tl.to(s.progress, { t: 1, duration: 3.6, ease: "power2.inOut" }, 0);
    tl.to(power, { p: 1, duration: 2.6, ease: "power1.inOut", onUpdate: () => setPower(power.p) }, 0.7);
    s.intro = tl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // "Skip intro": the UI switches to explore while the timeline still runs.
  useEffect(() => {
    const s = rig.current;
    if (phase === "explore" && s.intro?.isActive()) {
      s.intro.progress(1);
      setPower(1);
    }
  }, [phase, setPower]);

  // Section changes after the intro.
  useEffect(() => {
    const s = rig.current;
    if (phase !== "explore") return;
    const key = `${section}-${mobile}`;
    if (s.lastKey === key) return;
    s.lastKey = key;
    flyTo(SHOTS[mobile ? "mobile" : "desktop"][section], reduced ? 0 : 1.7);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, mobile, phase]);

  useEffect(() => {
    const s = rig.current;
    return () => {
      s.intro?.kill();
      s.move?.kill();
    };
  }, []);

  useFrame((frame, dt) => {
    const s = rig.current;

    // Keep the horizontal field of view constant so compositions hold on any aspect ratio.
    const aspect = frame.size.width / Math.max(1, frame.size.height);
    if (aspect !== s.aspect || mobile !== s.mobile) {
      s.aspect = aspect;
      s.mobile = mobile;
      const cam = frame.camera as THREE.PerspectiveCamera;
      const hfov = mobile ? 62 : 63; // degrees — a 38° vertical FOV at 16:9
      const vfov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(hfov / 2)) / aspect));
      cam.fov = THREE.MathUtils.clamp(vfov, 34, mobile ? 78 : 66);
      cam.updateProjectionMatrix();
    }
    const t = Math.min(1, s.progress.t);
    if (s.curve) s.base.copy(s.curve.getPoint(t));
    s.look.lerpVectors(s.lookFrom, s.lookTo, lookEase(t));

    // subtle mouse parallax, strongest on the wide shot
    const strength = reduced || mobile ? 0 : section === "home" ? 1 : 0.45;
    const k = 1 - Math.exp(-dt * 3);
    s.parallax.x += (pointer.x * strength - s.parallax.x) * k;
    s.parallax.y += (pointer.y * strength - s.parallax.y) * k;

    frame.camera.position.set(s.base.x + s.parallax.x * 0.08, s.base.y + s.parallax.y * 0.05, s.base.z);
    frame.camera.lookAt(s.look);
  });

  return null;
}
