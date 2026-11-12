import { useMemo } from 'react';
import * as THREE from 'three';

import { materials } from './materials';

function star(outer: number, inner: number, points = 5) {
  const s = new THREE.Shape();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = Math.PI / 2 + (i * Math.PI) / points;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  return s;
}

/** 메달: 테두리가 솟은 회전체 원판(금) + 양각 별 + 고리 + V자 리본 */
export default function Medal() {
  const { disc, starGeo, ring, ribbon, mats } = useMemo(() => {
    // 단면을 Y축으로 돌린 뒤 X축으로 눕혀 정면을 보게 한다
    const profile = [
      [0, -0.1],
      [1.0, -0.1],
      [1.07, -0.06],
      [1.07, 0.06],
      [1.0, 0.11],
      [0.9, 0.11],
      [0.86, 0.06],
      [0, 0.06],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const disc = new THREE.LatheGeometry(profile, 128);
    disc.rotateX(Math.PI / 2);

    const starGeo = new THREE.ExtrudeGeometry(star(0.58, 0.25), {
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 3,
    });

    return {
      disc,
      starGeo,
      ring: new THREE.TorusGeometry(0.15, 0.045, 16, 48),
      ribbon: new THREE.BoxGeometry(0.38, 1.3, 0.03),
      mats: { gold: materials.gold(), star: materials.brass(), ribbon: materials.enamelRed() },
    };
  }, []);

  return (
    <group>
      {/* 디스크는 X축으로 눕혀서 z 가 앞면 */}
      <mesh geometry={disc} material={mats.gold} />
      <mesh geometry={starGeo} material={mats.star} position={[0, 0, 0.06]} />
      <mesh geometry={ring} material={mats.gold} position={[0, 1.2, 0]} />
      <mesh geometry={ribbon} material={mats.ribbon} position={[-0.26, 1.85, -0.04]} rotation={[0, 0, 0.32]} />
      <mesh geometry={ribbon} material={mats.ribbon} position={[0.26, 1.85, -0.06]} rotation={[0, 0, -0.32]} />
    </group>
  );
}
