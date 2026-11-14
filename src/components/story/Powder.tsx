"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CHAPTERS, easeInOutCubic, innerY, mulberry32, seg } from "./timeline";

const MOUND_RADIUS = 0.72;
const MOUND_HEIGHT = 0.16;

// Warm masala palette: pepper, cumin, chilli, cardamom, cinnamon.
const PALETTE = ["#3a2a1f", "#8a6a3d", "#a0522d", "#b5432a", "#9aa064", "#7a4527", "#c08a4e"].map(
  (c) => new THREE.Color(c),
);

/** Height of the powder pile above the bowl surface at radius r, when fully ground. */
function pileHeight(r: number) {
  const t = Math.min(1, r / MOUND_RADIUS);
  return MOUND_HEIGHT * (1 - t * t);
}

// Each vertex stores its height on the bowl surface (`base`) and its pile height when
// fully ground (`lift`) in userData; growth interpolates between them.
function withGrowth<T extends THREE.BufferGeometry>(geometry: T, base: Float32Array, lift: Float32Array): T {
  geometry.userData.base = base;
  geometry.userData.lift = lift;
  return geometry;
}

function setGrowth(geometry: THREE.BufferGeometry, grow: number) {
  const base = geometry.userData.base as Float32Array;
  const lift = geometry.userData.lift as Float32Array;
  const pos = geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < lift.length; i++) {
    pos.setY(i, base[i] + lift[i] * grow);
  }
  pos.needsUpdate = true;
}

function moundGeometry(): THREE.LatheGeometry {
  const profile: THREE.Vector2[] = [];
  for (let i = 0; i <= 24; i++) {
    profile.push(new THREE.Vector2(Math.max(MOUND_RADIUS * (1 - i / 24), 0.0001), 0));
  }
  const geometry = new THREE.LatheGeometry(profile, 64);
  // Darken toward the rim of the pile so it reads as a soft heap, not a disc.
  const colors = new Float32Array(geometry.attributes.position.count * 3);
  const centreColor = new THREE.Color("#8a6238");
  const edgeColor = new THREE.Color("#5e4129");
  const tmp = new THREE.Color();
  for (let i = 0; i < geometry.attributes.position.count; i++) {
    const r = Math.hypot(geometry.attributes.position.getX(i), geometry.attributes.position.getZ(i));
    tmp.copy(centreColor).lerp(edgeColor, Math.pow(r / MOUND_RADIUS, 3));
    colors.set([tmp.r, tmp.g, tmp.b], i * 3);
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const pos = geometry.attributes.position as THREE.BufferAttribute;
  const base = new Float32Array(pos.count);
  const lift = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    const r = Math.hypot(pos.getX(i), pos.getZ(i));
    base[i] = innerY(r) + 0.004;
    lift[i] = pileHeight(r);
  }
  return withGrowth(geometry, base, lift);
}

function grainGeometry(grains: number): THREE.BufferGeometry {
  const rand = mulberry32(42);
  const positions = new Float32Array(grains * 3);
  const colors = new Float32Array(grains * 3);
  const base = new Float32Array(grains);
  const lift = new Float32Array(grains);
  // Sorted centre-out so the draw range grows the pile from the middle. A sparse
  // ring of grains beyond the mound feathers its edge into the bowl.
  const radii = Array.from({ length: grains }, () =>
    rand() < 0.85 ? Math.sqrt(rand()) * MOUND_RADIUS : MOUND_RADIUS + Math.pow(rand(), 1.8) * 0.22,
  ).sort((a, b) => a - b);
  radii.forEach((r, i) => {
    const a = rand() * Math.PI * 2;
    positions[i * 3] = Math.cos(a) * r;
    positions[i * 3 + 2] = Math.sin(a) * r;
    base[i] = innerY(r) + 0.006 + rand() * 0.012;
    lift[i] = pileHeight(r);
    const c = PALETTE[Math.floor(rand() * PALETTE.length)].clone().offsetHSL(0, 0, (rand() - 0.5) * 0.08);
    colors.set([c.r, c.g, c.b], i * 3);
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return withGrowth(geometry, base, lift);
}

export function Powder({ progress, grains }: { progress: { current: number }; grains: number }) {
  const mound = useRef<THREE.Mesh>(null);
  const grainPoints = useRef<THREE.Points>(null);
  const dust = useRef<THREE.Points>(null);
  const lastGrow = useRef(-1);

  const moundGeo = useMemo(() => moundGeometry(), []);
  const grainGeo = useMemo(() => grainGeometry(grains), [grains]);

  // Aromatic dust that drifts up out of the bowl while grinding.
  const dustGeo = useMemo(() => {
    const rand = mulberry32(7);
    const count = Math.round(grains / 12);
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = Math.sqrt(rand()) * 0.6;
      const a = rand() * Math.PI * 2;
      positions.set([Math.cos(a) * r, innerY(r) + rand() * 1.2, Math.sin(a) * r], i * 3);
      speeds[i] = 0.08 + rand() * 0.15;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.userData.speeds = speeds;
    return geometry;
  }, [grains]);

  useFrame((_, delta) => {
    const p = progress.current;
    const grow = easeInOutCubic(seg(p, CHAPTERS.grind[0] + 0.1, CHAPTERS.powder[1]));

    if (Math.abs(grow - lastGrow.current) > 0.0005 && mound.current && grainPoints.current) {
      lastGrow.current = grow;
      setGrowth(mound.current.geometry, grow);
      setGrowth(grainPoints.current.geometry, grow);
      grainPoints.current.geometry.setDrawRange(0, Math.floor(grains * grow));
      // Fade the solid pile in under the grains so it reads as a dusting first.
      mound.current.visible = grow > 0.01;
      (mound.current.material as THREE.MeshStandardMaterial).opacity = Math.min(1, grow * 2.5);
    }

    if (dust.current) {
      const material = dust.current.material as THREE.PointsMaterial;
      const fadeIn = seg(p, CHAPTERS.grind[0] + 0.08, CHAPTERS.powder[0]);
      const fadeOut = 1 - seg(p, CHAPTERS.reveal[0], CHAPTERS.reveal[1]);
      material.opacity = 0.35 * fadeIn * fadeOut;
      dust.current.visible = material.opacity > 0.01;

      if (dust.current.visible) {
        const geometry = dust.current.geometry;
        const pos = geometry.attributes.position as THREE.BufferAttribute;
        const speeds = geometry.userData.speeds as Float32Array;
        for (let i = 0; i < speeds.length; i++) {
          let y = pos.getY(i) + speeds[i] * delta;
          if (y > 1.9) y = innerY(0.3) + 0.05;
          pos.setY(i, y);
        }
        pos.needsUpdate = true;
      }
    }
  });

  return (
    <group>
      <mesh ref={mound} geometry={moundGeo} receiveShadow visible={false}>
        <meshStandardMaterial vertexColors roughness={1} side={THREE.DoubleSide} transparent opacity={0} />
      </mesh>
      <points ref={grainPoints} geometry={grainGeo} frustumCulled={false}>
        <pointsMaterial size={0.022} vertexColors sizeAttenuation />
      </points>
      <points ref={dust} geometry={dustGeo} frustumCulled={false} visible={false}>
        <pointsMaterial size={0.012} color="#e3c9a0" transparent opacity={0} depthWrite={false} sizeAttenuation />
      </points>
    </group>
  );
}
