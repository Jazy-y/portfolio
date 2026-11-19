"use client";

import { Html } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useRef, type ReactNode } from "react";
import * as THREE from "three";
import { easing } from "maath";
import { useStore } from "@/lib/store";

type Props = {
  id: string;
  label: string;
  onSelect: () => void;
  children: ReactNode;
  /** Where the hover label appears, relative to the group. */
  labelPosition?: [number, number, number];
  /** How much the object lifts on hover (metres). */
  lift?: number;
  enabled?: boolean;
};

/**
 * Hover + click behaviour shared by every clickable object in the scene:
 * a small lift, a pointer cursor and a floating label.
 */
export function Interactive({ id, label, onSelect, children, labelPosition = [0, 0.25, 0], lift = 0.012, enabled = true }: Props) {
  const ref = useRef<THREE.Group>(null);
  const hovered = useStore((s) => s.hovered === id);
  const setHovered = useStore((s) => s.setHovered);
  const explore = useStore((s) => s.phase === "explore");
  const active = enabled && explore;

  useFrame((_, dt) => {
    if (!ref.current) return;
    easing.damp(ref.current.position, "y", hovered && active ? lift : 0, 0.15, dt);
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    if (!active) return;
    e.stopPropagation();
    setHovered(id);
    document.body.style.cursor = "pointer";
  };
  const out = () => {
    if (useStore.getState().hovered === id) setHovered(null);
    document.body.style.cursor = "";
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    if (!active) return;
    e.stopPropagation();
    onSelect();
  };

  return (
    <group onPointerOver={over} onPointerOut={out} onClick={click}>
      <group ref={ref}>{children}</group>
      {hovered && active && (
        <Html position={labelPosition} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
          <div className="scene-label">{label}</div>
        </Html>
      )}
    </group>
  );
}
