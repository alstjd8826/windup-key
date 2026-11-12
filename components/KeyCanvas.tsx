import { Canvas, useThree } from '@react-three/fiber/native';
import * as Device from 'expo-device';
import { useCallback, useEffect, useRef } from 'react';
import { useAnimatedReaction, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

import WindupKey, { KEY_WIDTH } from './WindupKey';

const FOV = 30;
const TILT = (15 * Math.PI) / 180; // 정면에서 15° 위

type Props = {
  rotation: SharedValue<number>;
  /** 캔버스 폭 대비 열쇠 폭 비율 */
  widthRatio: number;
  background?: string;
};

/** drei <Environment> 대신 RoomEnvironment + PMREM 으로 환경맵 생성 */
function Env({ background }: { background: string }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    scene.background = new THREE.Color(background);
    // iOS 시뮬레이터의 소프트웨어 GL 렌더러(GLRendererFloat)는 PMREM 렌더 중
    // 네이티브 크래시한다. 시뮬레이터에선 환경맵 없이 조명만으로 미리보기한다.
    if (!Device.isDevice) return;

    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04).texture;
    scene.environment = env;
    room.dispose();
    pmrem.dispose();
    return () => {
      scene.environment = null;
      env.dispose();
    };
  }, [gl, scene, background]);

  return null;
}

/** 열쇠가 캔버스 폭의 widthRatio 가 되도록 카메라 거리 조절 */
function CameraRig({ widthRatio }: { widthRatio: number }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  useEffect(() => {
    const aspect = size.width / size.height;
    const visibleWidthPerUnit = 2 * Math.tan(((FOV / 2) * Math.PI) / 180) * aspect;
    const dist = KEY_WIDTH / (widthRatio * visibleWidthPerUnit);
    camera.fov = FOV;
    camera.position.set(0, dist * Math.sin(TILT), dist * Math.cos(TILT));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, size, widthRatio]);

  return null;
}

const IS_SIM = !Device.isDevice;

export default function KeyCanvas({ rotation, widthRatio, background = '#F5F5F5' }: Props) {
  // 시뮬레이터(demand 렌더)에서는 회전값이 바뀔 때 직접 다시 그리라고 알려야 한다
  const invalidateRef = useRef<(() => void) | null>(null);
  const invalidate = useCallback(() => invalidateRef.current?.(), []);
  useAnimatedReaction(
    () => rotation.value,
    (v, prev) => {
      if (IS_SIM && v !== prev) scheduleOnRN(invalidate);
    },
  );

  return (
    <Canvas
      style={{ flex: 1 }}
      camera={{ fov: FOV, near: 0.1, far: 100 }}
      // 시뮬레이터 소프트웨어 GL 은 MSAA 합성(gldMergeScanlines2x2)에서도 멈추거나 크래시한다
      gl={{ antialias: !IS_SIM }}
      // 시뮬레이터는 매 프레임 그리면 GL 큐가 밀려 화면이 안 나온다 → 필요할 때만 렌더
      frameloop={IS_SIM ? 'demand' : 'always'}
      onCreated={({ gl, invalidate: inv }) => {
        invalidateRef.current = () => inv();
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      <Env background={background} />
      {IS_SIM && (
        // 시뮬레이터 전용 대체 조명 (실기기는 환경맵만 사용)
        <>
          <hemisphereLight args={['#ffffff', '#888888', 2]} />
          <directionalLight position={[3, 4, 5]} intensity={3} />
          <directionalLight position={[-4, 2, -3]} intensity={1.5} />
        </>
      )}
      <CameraRig widthRatio={widthRatio} />
      <WindupKey rotation={rotation} />
    </Canvas>
  );
}
