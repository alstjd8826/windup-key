import { Canvas, useFrame, useThree } from '@react-three/fiber/native';
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import * as THREE from 'three';

import { Env } from '../KeyCanvas';

const FOV = 30;
const ELEVATION = (18 * Math.PI) / 180; // 정면에서 18° 위

type Props = {
  children: ReactNode;
  /** 캔버스 짧은 변 대비 모델이 차지할 비율 */
  fill?: number;
  /** 턴테이블 회전 속도(rad/s). 0이면 정지 */
  spin?: number;
  /** 정지 시 기본 각도(rad) */
  yaw?: number;
  background?: string;
};

/** 자식 모델의 바운딩 박스를 재서 화면 중앙에 맞추고, 천천히 돌린다 */
function Turntable({ children, fill, spin, yaw }: Required<Omit<Props, 'background'>>) {
  const outer = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  useLayoutEffect(() => {
    if (!inner.current) return;
    // 중심을 원점으로
    const box = new THREE.Box3().setFromObject(inner.current);
    const center = box.getCenter(new THREE.Vector3());
    inner.current.position.sub(center);
    // 회전해도 잘리지 않게 바운딩 구 기준으로 거리 계산
    const radius = box.getBoundingSphere(new THREE.Sphere()).radius;
    const aspect = size.width / size.height;
    const vFov = (FOV * Math.PI) / 180;
    const fitH = radius / (fill * Math.tan(vFov / 2));
    const fitW = radius / (fill * Math.tan(vFov / 2) * aspect);
    const dist = Math.max(fitH, fitW);
    camera.fov = FOV;
    camera.position.set(0, dist * Math.sin(ELEVATION), dist * Math.cos(ELEVATION));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, size, fill]);

  useFrame((_, dt) => {
    if (outer.current) outer.current.rotation.y += spin * dt;
  });

  return (
    <group ref={outer} rotation={[0, yaw, 0]}>
      <group ref={inner}>{children}</group>
    </group>
  );
}

export default function ModelStage({ children, fill = 0.62, spin = 0.35, yaw = -0.5, background = '#F5F5F5' }: Props) {
  return (
    <Canvas
      style={{ flex: 1 }}
      camera={{ fov: FOV, near: 0.05, far: 200 }}
      gl={{ antialias: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      <Env background={background} />
      <Turntable fill={fill} spin={spin} yaw={yaw}>
        {children}
      </Turntable>
    </Canvas>
  );
}
