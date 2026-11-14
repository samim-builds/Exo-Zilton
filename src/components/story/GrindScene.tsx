"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import type { MotionValue } from "framer-motion";
import * as THREE from "three";
import { Mortar } from "./Mortar";
import { Pestle } from "./Pestle";
import { Spices } from "./Spices";
import { Powder } from "./Powder";
import { CHAPTERS, easeOutCubic, sampleVec3, type Keyframe, type Vec3 } from "./timeline";

type Shot = { at: number; position: Vec3; target: Vec3; pan: number };

// `pan` slides the whole shot sideways on wide screens so the copy has room on the left.
const SHOTS: Shot[] = [
  { at: 0, position: [0, 2.3, 7.8], target: [0, 1.1, 0], pan: 0 },
  { at: CHAPTERS.spices[0], position: [0, 3.3, 6.2], target: [0, 0.55, 0], pan: -1.1 },
  { at: CHAPTERS.grind[0], position: [0.4, 3.9, 4.9], target: [0, 0.5, 0], pan: -1 },
  { at: CHAPTERS.powder[0], position: [0.3, 4.4, 3.8], target: [0, 0.45, 0], pan: -0.9 },
  // High angle wide enough to show the pestle lying beside the mortar.
  { at: CHAPTERS.reveal[0] + 0.05, position: [1.0, 7.0, 3.6], target: [0.9, 0.2, 0.45], pan: -1.5 },
  { at: CHAPTERS.finale[0], position: [3.0, 3.0, 6.5], target: [0.45, -0.1, 0], pan: 0 },
  { at: 1, position: [2.8, 2.8, 6.1], target: [0.45, -0.2, 0], pan: 0 },
];

const POSITION_FRAMES: Keyframe<Vec3>[] = SHOTS.map((s) => ({ at: s.at, value: s.position }));
const TARGET_FRAMES: Keyframe<Vec3>[] = SHOTS.map((s) => ({ at: s.at, value: s.target }));
const PAN_FRAMES: Keyframe<Vec3>[] = SHOTS.map((s) => ({ at: s.at, value: [s.pan, 0, 0] }));

type SmoothProgress = { current: number };

/** Eases the raw scroll value so the scene glides instead of stepping with the wheel. */
function ProgressDriver({ source, smoothRef }: { source: MotionValue<number>; smoothRef: SmoothProgress }) {
  useFrame((_, delta) => {
    const target = source.get();
    smoothRef.current += (target - smoothRef.current) * Math.min(1, delta * 6);
    if (Math.abs(target - smoothRef.current) < 0.0001) smoothRef.current = target;
  });
  return null;
}

// Fraction of the screen height to slide the frame on portrait screens (+ = scene moves up).
const PORTRAIT_SHIFT: Keyframe<Vec3>[] = [
  { at: 0, value: [-0.12, 0, 0] },
  { at: CHAPTERS.spices[0], value: [0.2, 0, 0] },
  { at: CHAPTERS.reveal[1], value: [0.2, 0, 0] },
  { at: CHAPTERS.finale[0] + 0.04, value: [0.06, 0, 0] },
];

const BASE_FOV = 32;
// Shots are composed for landscape; below this aspect ratio, widen the vertical FOV
// so portrait phones keep the same horizontal framing instead of cropping the mortar.
const MIN_FRAMED_ASPECT = 1.3;

function CameraRig({ progress, wide }: { progress: SmoothProgress; wide: boolean }) {
  const getState = useThree((s) => s.get);
  const size = useThree((s) => s.size);
  const aspect = size.width / size.height;

  const shift = useRef(Number.NaN);

  useEffect(() => {
    const camera = getState().camera as THREE.PerspectiveCamera;
    if (wide) camera.clearViewOffset();
    shift.current = Number.NaN;
    return () => camera.clearViewOffset();
  }, [getState, size, wide]);

  useFrame((state) => {
    const camera = state.camera as THREE.PerspectiveCamera;
    const fov =
      aspect >= MIN_FRAMED_ASPECT
        ? BASE_FOV
        : THREE.MathUtils.radToDeg(
            2 * Math.atan((Math.tan(THREE.MathUtils.degToRad(BASE_FOV / 2)) * MIN_FRAMED_ASPECT) / aspect),
          );
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    const p = progress.current;
    const pos = sampleVec3(POSITION_FRAMES, p);
    const target = sampleVec3(TARGET_FRAMES, p);
    const pan = wide ? sampleVec3(PAN_FRAMES, p)[0] : 0;

    camera.position.set(pos[0] + pan, pos[1], pos[2]);

    // Portrait: slide the rendered frame per chapter so the mortar clears the copy.
    if (!wide) {
      const next = sampleVec3(PORTRAIT_SHIFT, p)[0];
      if (Math.abs(next - shift.current) > 0.001 || Number.isNaN(shift.current)) {
        shift.current = next;
        camera.setViewOffset(size.width, size.height, 0, size.height * next, size.width, size.height);
      }
    }
    camera.lookAt(target[0] + pan, target[1], target[2]);
  });
  return null;
}

/** Time-based entrance on first load: the mortar rises out of the dark. */
function Entrance({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const start = useRef<number | null>(null);
  useFrame(({ clock }) => {
    if (!group.current) return;
    start.current ??= clock.elapsedTime;
    const t = easeOutCubic(Math.min(1, (clock.elapsedTime - start.current) / 1.8));
    group.current.position.y = (1 - t) * -0.6;
    group.current.scale.setScalar(0.92 + 0.08 * t);
  });
  return <group ref={group}>{children}</group>;
}

function StudioLights() {
  return (
    <>
      <ambientLight intensity={0.18} />
      <directionalLight position={[4, 7, 3]} intensity={2.4} color="#fff4e6" />
      {/* Burnished-bronze rim light from behind */}
      <directionalLight position={[-5, 3, -5]} intensity={3.2} color="#c9965a" />
      <directionalLight position={[5, 1.5, -3]} intensity={0.8} color="#8fa6c9" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[0, 6, 1]} rotation-x={Math.PI / 2} scale={[8, 4, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#ffe7c7" position={[-5, 2, 2]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} />
        <Lightformer form="rect" intensity={0.9} color="#c9965a" position={[4, 1.5, -4]} rotation-y={-Math.PI / 3} scale={[6, 1.5, 1]} />
        <Lightformer form="ring" intensity={0.6} position={[2, 3, 5]} scale={2} />
      </Environment>
    </>
  );
}

export type GrindSceneProps = {
  progress: MotionValue<number>;
  active: boolean;
  compact: boolean;
};

export default function GrindScene({ progress, active, compact }: GrindSceneProps) {
  const smoothRef = useRef(progress.get());

  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={compact ? [1, 1.5] : [1, 2]}
      camera={{ fov: 32, near: 0.1, far: 50, position: [0, 1.9, 6.4] }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      aria-hidden="true"
    >
      <ProgressDriver source={progress} smoothRef={smoothRef} />
      <CameraRig progress={smoothRef} wide={!compact} />
      <StudioLights />
      <Entrance>
        <Mortar />
        <Spices progress={smoothRef} />
        <Powder progress={smoothRef} grains={compact ? 1800 : 4500} />
      </Entrance>
      <Pestle progress={smoothRef} />
      <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={9} blur={2.6} far={3} resolution={compact ? 256 : 512} color="#000000" />
    </Canvas>
  );
}
