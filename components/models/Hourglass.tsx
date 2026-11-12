import { useMemo } from 'react';
import * as THREE from 'three';

import { materials } from './materials';

const HALF = 1.2; // 유리 절반 높이

/** 유리 단면: 위아래 볼록, 가운데 잘록 */
function glassProfile() {
  const pts: THREE.Vector2[] = [];
  const N = 48;
  for (let i = 0; i <= N; i++) {
    const y = -HALF + (2 * HALF * i) / N;
    const t = Math.abs(y) / HALF; // 0(목) → 1(끝)
    const r = 0.07 + 0.62 * Math.pow(Math.sin(Math.PI * Math.min(t, 0.97)), 0.75) + 0.18 * t * t;
    pts.push(new THREE.Vector2(r, y));
  }
  return pts;
}

/** 모래시계: 유리 회전체 + 나무 받침(모따기 회전체) + 황동 기둥 + 모래 */
export default function Hourglass() {
  const { glass, cap, post, sandBottom, sandTop, stream, mats } = useMemo(() => {
    const capProfile = [
      [0, -0.1],
      [0.98, -0.1],
      [1.04, -0.05],
      [1.04, 0.05],
      [0.98, 0.1],
      [0, 0.1],
    ].map(([x, y]) => new THREE.Vector2(x, y));

    const bottom = [
      [0, -1.12],
      [0.62, -1.12],
      [0.5, -0.95],
      [0.28, -0.72],
      [0, -0.58],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const top = [
      [0, 0.12],
      [0.3, 0.42],
      [0.55, 0.62],
      [0, 0.62],
    ].map(([x, y]) => new THREE.Vector2(x, y));

    const glassMat = materials.glass();
    return {
      glass: new THREE.LatheGeometry(glassProfile(), 96),
      cap: new THREE.LatheGeometry(capProfile, 96),
      post: new THREE.CylinderGeometry(0.05, 0.05, 2.5, 24),
      sandBottom: new THREE.LatheGeometry(bottom, 64),
      sandTop: new THREE.LatheGeometry(top, 64),
      stream: new THREE.CylinderGeometry(0.018, 0.018, 0.7, 12),
      mats: { glass: glassMat, wood: materials.wood(), brass: materials.brass(), sand: materials.sand() },
    };
  }, []);

  const capY = HALF + 0.1;

  return (
    <group>
      <mesh geometry={cap} material={mats.wood} position={[0, capY, 0]} />
      <mesh geometry={cap} material={mats.wood} position={[0, -capY, 0]} />
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
        return <mesh key={i} geometry={post} material={mats.brass} position={[Math.cos(a) * 0.86, 0, Math.sin(a) * 0.86]} />;
      })}
      <mesh geometry={sandBottom} material={mats.sand} />
      <mesh geometry={sandTop} material={mats.sand} />
      <mesh geometry={stream} material={mats.sand} position={[0, -0.25, 0]} />
      {/* 유리는 투명이라 마지막에 그린다 */}
      <mesh geometry={glass} material={mats.glass} renderOrder={10} />
    </group>
  );
}
