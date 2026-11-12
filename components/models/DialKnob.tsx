import { useMemo } from 'react';
import * as THREE from 'three';

import { materials } from './materials';

/** 볼륨 다이얼: 회전체(Lathe) 몸통 + 둘레 홈 36개 + 빨간 표시선 + 눈금판 */
export default function DialKnob() {
  const { body, plate, ridge, tick, mark, mats } = useMemo(() => {
    // (반지름, 높이) 단면 → Y축 회전
    const profile = [
      [0, 0.0],
      [1.0, 0.0],
      [1.02, 0.05],
      [1.0, 0.16],
      [0.86, 0.2],
      [0.82, 0.24],
      [0.8, 0.86],
      [0.76, 0.94],
      [0.7, 0.98],
      [0.35, 0.985],
      [0, 0.96], // 윗면 가운데가 살짝 오목
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const body = new THREE.LatheGeometry(profile, 96);
    body.computeVertexNormals();

    return {
      body,
      plate: new THREE.CylinderGeometry(1.45, 1.5, 0.08, 96),
      ridge: new THREE.BoxGeometry(0.05, 0.56, 0.07),
      tick: new THREE.BoxGeometry(0.04, 0.02, 0.18),
      mark: new THREE.BoxGeometry(0.07, 0.03, 0.42),
      mats: {
        knob: materials.brushedAluminum(),
        plate: materials.darkMetal(),
        accent: materials.enamelRed(),
        tick: materials.chrome(),
      },
    };
  }, []);

  const ridges = 36;
  const ticks = 11; // -135° ~ +135°

  return (
    <group>
      <mesh geometry={plate} material={mats.plate} position={[0, -0.04, 0]} />
      {Array.from({ length: ticks }, (_, i) => {
        const a = (-135 + (270 / (ticks - 1)) * i) * (Math.PI / 180);
        const r = 1.25;
        return (
          <mesh
            key={`t${i}`}
            geometry={tick}
            material={mats.tick}
            position={[Math.sin(a) * r, 0.01, -Math.cos(a) * r]}
            rotation={[0, -a, 0]}
          />
        );
      })}
      <mesh geometry={body} material={mats.knob} />
      {Array.from({ length: ridges }, (_, i) => {
        const a = (i / ridges) * Math.PI * 2;
        const r = 0.8;
        return (
          <mesh
            key={`r${i}`}
            geometry={ridge}
            material={mats.knob}
            position={[Math.cos(a) * r, 0.55, Math.sin(a) * r]}
            rotation={[0, -a, 0]}
          />
        );
      })}
      <mesh geometry={mark} material={mats.accent} position={[0, 0.99, -0.42]} />
    </group>
  );
}
