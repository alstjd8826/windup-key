import { useFrame } from '@react-three/fiber/native';
import { useMemo, useRef } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import * as THREE from 'three';

type Props = {
  /** Y축 회전(rad). 화면 좌표 기준 시계 방향 누적값 */
  rotation: SharedValue<number>;
  /** 화면 평면에서 기울이기(rad, +면 시계 방향). 홈 화면에서 비스듬히 놓을 때 */
  tilt?: number;
};

// ── 치수 (단위: three 월드 유닛) ────────────────────────────
const LOBE_R = 0.5; // 손잡이 원 반지름
const LOBE_GAP = 1.0; // 두 원 중심 간격
const WAIST = 0.28; // 손잡이 허리 절반 높이
const DEPTH = 0.15;
const BEVEL = 0.03;
const DISH_R = 0.3; // 오목한 원판 반지름
const DISH_SAG = 0.05; // 오목한 깊이

const NECK_R = 0.08;
const NECK_LEN = 0.3;
const SHAFT_R = 0.12;
const SHAFT_LEN = 0.9;
const SOCKET_R = 0.15;
const SOCKET_LEN = 0.24;

// 손잡이 중심 y. 전체 높이의 중간이 원점에 오도록 맞춘 값
const HANDLE_Y = 0.55;
const NECK_TOP = HANDLE_Y - WAIST + 0.04; // 허리에 살짝 파묻히게
const SHAFT_TOP = NECK_TOP - NECK_LEN;
const SHAFT_BOTTOM = SHAFT_TOP - SHAFT_LEN;

/** 두 원을 오목한 필렛으로 이은 땅콩 모양 외곽선 */
function makeHandleShape() {
  const cx = LOBE_GAP / 2;
  // 두 원에 외접하면서 허리 높이가 WAIST 가 되는 필렛 원
  // cx² + yc² = (r + rf)², yc = rf + WAIST
  const rf = (cx * cx + WAIST * WAIST - LOBE_R * LOBE_R) / (2 * (LOBE_R - WAIST));
  const yc = rf + WAIST;
  const a = Math.atan2(yc, -cx); // 오른쪽 원에서 위 필렛과 만나는 각도
  const b = Math.PI - a; // 왼쪽 원 기준 대칭 각도

  const s = new THREE.Shape();
  s.absarc(cx, 0, LOBE_R, a, -a, true); // 오른쪽 원
  s.absarc(0, -yc, rf, b, Math.PI - b, false); // 아래 필렛(오목)
  s.absarc(-cx, 0, LOBE_R, -b, b, true); // 왼쪽 원
  s.absarc(0, yc, rf, -Math.PI + b, -b, false); // 위 필렛(오목)

  for (const x of [-cx, cx]) {
    const hole = new THREE.Path();
    hole.absarc(x, 0, DISH_R, 0, Math.PI * 2, true);
    s.holes.push(hole);
  }
  return s;
}

/** 구멍을 메우는 양면 오목 디스크 (Lathe → Z축 정렬) */
function makeDishGeometry(halfDepth: number) {
  const pts = [
    new THREE.Vector2(0, halfDepth - DISH_SAG),
    ...Array.from({ length: 12 }, (_, i) => {
      const t = (i + 1) / 12;
      const r = DISH_R * t;
      return new THREE.Vector2(r, halfDepth - DISH_SAG * (1 - t * t));
    }),
    new THREE.Vector2(DISH_R, -halfDepth),
    ...Array.from({ length: 12 }, (_, i) => {
      const t = 1 - (i + 1) / 12;
      const r = DISH_R * t;
      return new THREE.Vector2(r, -(halfDepth - DISH_SAG * (1 - t * t)));
    }),
  ];
  const g = new THREE.LatheGeometry(pts, 48);
  g.rotateX(Math.PI / 2); // 회전축 Y → Z
  return g;
}

export default function WindupKey({ rotation, tilt = 0 }: Props) {
  const group = useRef<THREE.Group>(null);

  const { handle, dish, material } = useMemo(() => {
    const handle = new THREE.ExtrudeGeometry(makeHandleShape(), {
      depth: DEPTH,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: BEVEL,
      bevelSegments: 4,
      curveSegments: 48,
    });
    handle.translate(0, 0, -DEPTH / 2); // 두께 중심을 회전축에

    const dish = makeDishGeometry(DEPTH / 2 + BEVEL * 0.6);

    const material = new THREE.MeshPhysicalMaterial({
      color: '#E8E8E8',
      metalness: 1.0,
      roughness: 0.15,
      clearcoat: 0.3,
      envMapIntensity: 1.2,
    });
    return { handle, dish, material };
  }, []);

  useFrame(() => {
    if (group.current) group.current.rotation.y = rotation.value;
  });

  const cx = LOBE_GAP / 2;

  return (
    <group rotation={[0, 0, -tilt]}>
    <group ref={group}>
      {/* 손잡이 */}
      <group position={[0, HANDLE_Y, 0]}>
        <mesh geometry={handle} material={material} />
        <mesh geometry={dish} material={material} position={[-cx, 0, 0]} />
        <mesh geometry={dish} material={material} position={[cx, 0, 0]} />
      </group>

      {/* 목 */}
      <mesh material={material} position={[0, NECK_TOP - NECK_LEN / 2, 0]}>
        <cylinderGeometry args={[NECK_R, NECK_R, NECK_LEN, 32]} />
      </mesh>

      {/* 축 */}
      <mesh material={material} position={[0, SHAFT_TOP - SHAFT_LEN / 2, 0]}>
        <cylinderGeometry args={[SHAFT_R, SHAFT_R, SHAFT_LEN, 48]} />
      </mesh>

      {/* 끝의 육각 소켓 */}
      <mesh material={material} position={[0, SHAFT_BOTTOM + SOCKET_LEN / 2 - 0.02, 0]}>
        <cylinderGeometry args={[SOCKET_R, SOCKET_R, SOCKET_LEN, 6]} />
      </mesh>
    </group>
    </group>
  );
}

/** 카메라 거리 계산용 열쇠 폭(베벨 포함) */
export const KEY_WIDTH = LOBE_GAP + LOBE_R * 2 + BEVEL * 2;
