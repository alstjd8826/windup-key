import { useMemo } from 'react';
import * as THREE from 'three';

import { materials } from './materials';

const W = 1.6;
const H = 1.3;
const R = 0.26;
const DEPTH = 0.5;
const BEVEL = 0.07;

function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** 열쇠 구멍: 원 + 아래로 넓어지는 사다리꼴 */
function keyhole() {
  const s = new THREE.Shape();
  s.absarc(0, 0.06, 0.13, -Math.PI * 0.32, Math.PI * 1.32, false);
  s.lineTo(-0.1, -0.32);
  s.lineTo(0.1, -0.32);
  s.closePath();
  return s;
}

/** 자물쇠: 둥근 사각 압출 몸통(금) + 반원 고리(크롬) + 열쇠 구멍 */
export default function Padlock() {
  const { body, hole, arc, leg, mats } = useMemo(() => {
    const body = new THREE.ExtrudeGeometry(roundedRect(W, H, R), {
      depth: DEPTH,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: BEVEL,
      bevelSegments: 5,
      curveSegments: 24,
    });
    body.translate(0, 0, -DEPTH / 2);
    const hole = new THREE.ExtrudeGeometry(keyhole(), { depth: 0.03, bevelEnabled: false, curveSegments: 32 });
    return {
      body,
      hole,
      arc: new THREE.TorusGeometry(0.52, 0.11, 32, 64, Math.PI),
      leg: new THREE.CylinderGeometry(0.11, 0.11, 0.5, 32),
      mats: { body: materials.gold(), shackle: materials.chrome(), hole: materials.darkMetal() },
    };
  }, []);

  const top = H / 2;
  const arcY = top + 0.42;

  return (
    <group>
      <mesh geometry={body} material={mats.body} />
      <mesh geometry={hole} material={mats.hole} position={[0, -0.08, DEPTH / 2 + BEVEL - 0.01]} />
      <mesh geometry={arc} material={mats.shackle} position={[0, arcY, 0]} />
      <mesh geometry={leg} material={mats.shackle} position={[-0.52, arcY - 0.25, 0]} />
      <mesh geometry={leg} material={mats.shackle} position={[0.52, arcY - 0.25, 0]} />
    </group>
  );
}
