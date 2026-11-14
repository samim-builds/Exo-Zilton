"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CHAPTERS, grindPhase, innerY, lerp, sampleVec3, seg, easeInOutCubic, type Keyframe, type Vec3 } from "./timeline";

const HEAD_HEIGHT = 0.62;
const HANDLE_LENGTH = 1.7;

function headProfile(): THREE.Vector2[] {
  return [
    [0, 0],
    [0.12, 0.008],
    [0.22, 0.05],
    [0.29, 0.13],
    [0.31, 0.24],
    [0.28, 0.36],
    [0.21, 0.48],
    [0.15, 0.57],
    [0.14, HEAD_HEIGHT],
  ].map(([x, y]) => new THREE.Vector2(x, y));
}

function handleProfile(): THREE.Vector2[] {
  return [
    [0.135, 0],
    [0.12, 0.25],
    [0.125, 0.9],
    [0.15, 1.45],
    [0.15, 1.6],
    [0.12, 1.68],
    [0.0001, HANDLE_LENGTH],
  ].map(([x, y]) => new THREE.Vector2(x, y));
}

function beechTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#d6b487";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Fine straight grain running along the handle (canvas y → handle length).
  for (let i = 0; i < 140; i++) {
    const x = Math.random() * canvas.width;
    ctx.strokeStyle = `rgba(${150 + Math.random() * 30}, ${100 + Math.random() * 25}, ${60 + Math.random() * 20}, ${0.08 + Math.random() * 0.18})`;
    ctx.lineWidth = 0.6 + Math.random() * 2.2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    for (let y = 0; y <= canvas.height; y += 16) {
      ctx.lineTo(x + Math.sin(y * 0.03 + i) * 3, y);
    }
    ctx.stroke();
  }
  // Beech's characteristic small flecks.
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = `rgba(160, 105, 60, ${0.15 + Math.random() * 0.2})`;
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1.5, 3 + Math.random() * 4);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

// Pestle tip position (world) outside the grinding chapters.
const TIP_FRAMES: Keyframe<Vec3>[] = [
  { at: 0, value: [2.4, 4.6, -0.4] },
  { at: CHAPTERS.grind[0], value: [2.4, 4.6, -0.4] },
  { at: CHAPTERS.grind[0] + 0.05, value: [0.32, innerY(0.32) + 0.04, 0] },
  { at: CHAPTERS.powder[1], value: [0.32, innerY(0.32) + 0.04, 0] },
  { at: CHAPTERS.reveal[0] + 0.07, value: [1.6, 0.31, 1.0] },
  { at: CHAPTERS.finale[0], value: [1.6, 0.31, 1.0] },
  { at: CHAPTERS.finale[0] + 0.06, value: [0.2, innerY(0.2) + 0.03, 0.12] },
];

const TAU = Math.PI * 2;
const wrap = (a: number) => ((a % TAU) + TAU) % TAU;
// Lying on the table, handle running diagonally away from the viewer (+x, -z).
const LAY_YAW = 3.93;
// Resting in the bowl for the finale, handle leaning over the back-right rim.
const REST_YAW = 3.78;
// Yaw at the end of grinding, unwrapped next to LAY_YAW so the lerp takes the short way.
const GRIND_END_YAW = (() => {
  const end = wrap(Math.PI - grindPhase(CHAPTERS.powder[1]));
  return end - LAY_YAW > Math.PI ? end - TAU : end - LAY_YAW < -Math.PI ? end + TAU : end;
})();

export function Pestle({ progress }: { progress: { current: number } }) {
  const group = useRef<THREE.Group>(null);
  const [head, handle, wood] = useMemo(
    () => [
      new THREE.LatheGeometry(headProfile(), 64),
      new THREE.LatheGeometry(handleProfile(), 48),
      beechTexture(),
    ],
    [],
  );

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const p = progress.current;

    const tip = sampleVec3(TIP_FRAMES, p);

    // While grinding, orbit the tip around the bowl floor with a pressing bob.
    const grinding = seg(p, CHAPTERS.grind[0] + 0.05, CHAPTERS.powder[1]);
    const inBowl = grinding > 0 && grinding < 1;
    const phase = grindPhase(p);
    if (inBowl) {
      const radius = lerp(0.34, 0.22, grinding);
      tip[0] = Math.cos(phase) * radius;
      tip[2] = Math.sin(phase) * radius;
      tip[1] = innerY(radius) + 0.035 + Math.abs(Math.sin(phase * 2)) * 0.03;
    }
    g.position.set(tip[0], tip[1], tip[2]);

    // Orientation: hanging tilted on entry, leaning toward the rim while grinding,
    // lying on the table during the reveal, resting in the bowl for the finale.
    const enter = easeInOutCubic(seg(p, CHAPTERS.grind[0], CHAPTERS.grind[0] + 0.05));
    const lay = easeInOutCubic(seg(p, CHAPTERS.reveal[0], CHAPTERS.reveal[0] + 0.07));
    const rest = easeInOutCubic(seg(p, CHAPTERS.finale[0], CHAPTERS.finale[0] + 0.06));

    // With order YXZ, tiltZ leans the handle toward -x and yaw θ swings that lean
    // to (-cosθ, sinθ) in the xz-plane; θ = π − φ points it outward at angle φ.
    let tiltX = lerp(0.2, 0, enter);
    let tiltZ = lerp(0.9, 0.42, enter);
    let yaw = inBowl ? Math.PI - phase : lerp(Math.PI - 0.4, Math.PI, enter);
    if (lay > 0) {
      tiltZ = lerp(0.42, Math.PI / 2 - 0.06, lay);
      tiltX = 0;
      yaw = lerp(GRIND_END_YAW, LAY_YAW, lay);
    }
    if (rest > 0) {
      tiltZ = lerp(Math.PI / 2 - 0.06, 0.92, rest);
      yaw = lerp(LAY_YAW, REST_YAW, rest);
    }
    g.rotation.set(tiltX, yaw, tiltZ, "YXZ");
  });

  return (
    <group ref={group}>
      <mesh geometry={head} castShadow>
        <meshPhysicalMaterial color="#f1ece3" roughness={0.55} clearcoat={0.15} clearcoatRoughness={0.6} />
      </mesh>
      <mesh geometry={handle} position={[0, HEAD_HEIGHT - 0.02, 0]} castShadow>
        <meshStandardMaterial map={wood} roughness={0.6} color="#f2dcc0" />
      </mesh>
    </group>
  );
}
