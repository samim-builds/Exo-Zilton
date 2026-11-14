"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CHAPTERS, easeInQuad, easeOutCubic, grindPhase, innerY, lerp, mulberry32, seg } from "./timeline";

type SpiceType = {
  name: string;
  count: number;
  geometry: () => THREE.BufferGeometry;
  scale: [number, number, number];
  color: string;
  roughness: number;
  /** Radius used to sit the seed on the bowl surface. */
  size: number;
};

const TYPES: SpiceType[] = [
  {
    name: "peppercorn",
    count: 46,
    geometry: () => new THREE.IcosahedronGeometry(1, 2),
    scale: [0.045, 0.045, 0.045],
    color: "#231a14",
    roughness: 0.85,
    size: 0.045,
  },
  {
    name: "cardamom",
    count: 14,
    geometry: () => new THREE.SphereGeometry(1, 14, 10),
    scale: [0.045, 0.075, 0.045],
    color: "#8c9a58",
    roughness: 0.7,
    size: 0.045,
  },
  {
    name: "cumin",
    count: 60,
    geometry: () => new THREE.CapsuleGeometry(1, 3, 3, 6),
    scale: [0.014, 0.014, 0.014],
    color: "#8a6a3d",
    roughness: 0.9,
    size: 0.015,
  },
  {
    name: "chilli",
    count: 3,
    geometry: () => new THREE.CapsuleGeometry(1, 5, 4, 10),
    scale: [0.05, 0.05, 0.05],
    color: "#8f1d12",
    roughness: 0.5,
    size: 0.05,
  },
  {
    name: "cinnamon",
    count: 2,
    geometry: () => new THREE.CylinderGeometry(1, 1, 8, 12, 1, true),
    scale: [0.05, 0.05, 0.05],
    color: "#7a4527",
    roughness: 0.8,
    size: 0.05,
  },
];

type Seed = {
  start: THREE.Vector3;
  rest: THREE.Vector3;
  dropAt: number;
  crushAt: number;
  spin: THREE.Euler;
  restRotation: THREE.Euler;
};

function makeSeeds(count: number, rand: () => number, size: number): Seed[] {
  const [spiceStart, spiceEnd] = CHAPTERS.spices;
  return Array.from({ length: count }, () => {
    // Settle in a loose pile, denser toward the centre of the bowl.
    const r = Math.pow(rand(), 0.7) * 0.6;
    const a = rand() * Math.PI * 2;
    const pile = (1 - r / 0.6) * 0.12 * rand();
    const rest = new THREE.Vector3(Math.cos(a) * r, innerY(r) + size + pile, Math.sin(a) * r);
    const start = new THREE.Vector3(
      (rand() - 0.5) * 0.7,
      4.2 + rand() * 1.6,
      (rand() - 0.5) * 0.7,
    );
    return {
      start,
      rest,
      dropAt: lerp(spiceStart + 0.005, spiceEnd - 0.08, rand()),
      crushAt: lerp(CHAPTERS.grind[0] + 0.07, CHAPTERS.powder[0] + 0.1, rand()),
      spin: new THREE.Euler(rand() * 9, rand() * 9, rand() * 9),
      restRotation: new THREE.Euler(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI),
    };
  });
}

function SpiceInstances({ type, seed, progress }: { type: SpiceType; seed: number; progress: { current: number } }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => type.geometry(), [type]);
  const seeds = useMemo(() => makeSeeds(type.count, mulberry32(seed), type.size), [type, seed]);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const p = progress.current;
    const swirl = grindPhase(p) * 0.12;

    seeds.forEach((s, i) => {
      const fall = seg(p, s.dropAt, s.dropAt + 0.07);
      const crush = easeInQuad(seg(p, s.crushAt, s.crushAt + 0.08));
      const visible = fall > 0 && crush < 1;

      if (!visible) {
        dummy.scale.setScalar(0);
      } else {
        const lateral = easeOutCubic(fall);
        let x = lerp(s.start.x, s.rest.x, lateral);
        let z = lerp(s.start.z, s.rest.z, lateral);
        let y = lerp(s.start.y, s.rest.y, easeInQuad(fall));
        if (fall > 0.82) y += Math.sin(((fall - 0.82) / 0.18) * Math.PI) * 0.06;

        // Swept around by the pestle once grinding starts.
        if (swirl > 0) {
          const cos = Math.cos(swirl);
          const sin = Math.sin(swirl);
          [x, z] = [x * cos - z * sin, x * sin + z * cos];
          y += Math.sin(swirl * 6 + i) * 0.008 * (1 - crush);
        }
        dummy.position.set(x, y, z);

        const tumble = 1 - fall;
        dummy.rotation.set(
          s.restRotation.x + s.spin.x * tumble + swirl,
          s.restRotation.y + s.spin.y * tumble,
          s.restRotation.z + s.spin.z * tumble,
        );
        const shrink = 1 - crush;
        dummy.scale.set(type.scale[0] * shrink, type.scale[1] * shrink, type.scale[2] * shrink);
      }
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, type.count]} castShadow frustumCulled={false}>
      <meshStandardMaterial color={type.color} roughness={type.roughness} />
    </instancedMesh>
  );
}

export function Spices({ progress }: { progress: { current: number } }) {
  return (
    <group>
      {TYPES.map((type, i) => (
        <SpiceInstances key={type.name} type={type} seed={1337 + i * 97} progress={progress} />
      ))}
    </group>
  );
}
