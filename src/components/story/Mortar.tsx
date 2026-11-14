"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { BOWL, innerY } from "./timeline";

const SEGMENTS = 96;

function outerProfile(): THREE.Vector2[] {
  // Foot → flared body → rolled rim, traced from bottom centre outwards.
  return [
    [0, 0],
    [0.78, 0],
    [0.9, 0.015],
    [0.96, 0.06],
    [0.98, 0.14],
    [1.02, 0.26],
    [1.1, 0.46],
    [1.18, 0.68],
    [1.24, 0.86],
    [1.26, 0.95],
    [1.25, 1.0],
    [1.21, 1.03],
    [BOWL.rimRadius + 0.04, 1.025],
    [BOWL.rimRadius, BOWL.rimHeight],
  ].map(([x, y]) => new THREE.Vector2(x, y));
}

function innerProfile(): THREE.Vector2[] {
  const points: THREE.Vector2[] = [];
  for (let i = 0; i <= 32; i++) {
    const r = BOWL.rimRadius * (1 - i / 32);
    points.push(new THREE.Vector2(Math.max(r, 0.0001), innerY(r)));
  }
  return points;
}

export function Mortar() {
  const [outer, inner] = useMemo(
    () => [
      new THREE.LatheGeometry(outerProfile(), SEGMENTS),
      new THREE.LatheGeometry(innerProfile(), SEGMENTS),
    ],
    [],
  );

  return (
    <group>
      <mesh geometry={outer} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#f3efe7"
          roughness={0.32}
          clearcoat={0.35}
          clearcoatRoughness={0.45}
          sheen={0.3}
          sheenColor="#fff6e8"
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Unglazed bisque interior: matte, slightly warmer */}
      <mesh geometry={inner} receiveShadow>
        <meshStandardMaterial color="#e7dfcf" roughness={0.97} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
