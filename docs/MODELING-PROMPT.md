# 3D 오브젝트 모델링 프롬프트 (React Native + R3F)

외부 3D 파일 없이 **기본 도형 조합 + 재질 프리셋 + 환경맵**으로 크롬·금속·유리 느낌의 오브젝트를 만드는 프롬프트.
태엽 열쇠를 만들면서 실기기에서 검증한 규칙을 일반화했다. 같은 프롬프트로 다이얼·자물쇠·모래시계·메달을 만들었다(README 갤러리).

사용법: **A(공통 블록)** 를 맨 앞에 붙이고, **B(오브젝트 블록)** 의 `[ ]` 를 채워서 이어 붙인다. 레퍼런스 이미지가 있으면 같이 첨부.

---

## A. 공통 블록 (매번 그대로)

```
Expo(SDK 최신, dev client) + TypeScript 에서 3D 오브젝트 하나를 코드로 모델링한다.
외부 모델 파일(.glb) 없이 three 기본 지오메트리 조합으로만 만든다.

[스택]
- three, @react-three/fiber/native, expo-gl
- 회전값 등 애니메이션 값은 react-native-reanimated shared value 에 두고 useFrame 에서 .value 를 읽는다. 매 프레임 setState 금지.

[모델링 규칙]
- 부품마다 "어떤 도형으로 만들지"를 먼저 정하고 치수를 상수로 뺀다. 도형 선택 기준:
  - 납작한 판 모양(윤곽이 있는 것)   → Shape → ExtrudeGeometry(depth, bevelEnabled, bevelSize/Thickness, bevelSegments 4~5)
    - 구멍은 Shape.holes 에 Path 로. 오목한 면은 구멍을 뚫고 LatheGeometry 렌즈로 메운다
    - 두 원을 잇는 땅콩·잘록한 윤곽은 두 원에 외접하는 필렛 원을 계산해 absarc 로 잇는다
  - 축 대칭(손잡이, 병, 노브, 동전 테두리) → (반지름, 높이) 단면 점 목록 → LatheGeometry(점, 96)
    - 단면은 수식으로 만들어도 된다 (예: r = a + b·sin(πt)^p)
  - 고리·손잡이 아치             → TorusGeometry(R, tube, 32, 64, 호 각도)
  - 막대·기둥·축                → CylinderGeometry, 육각 소켓은 radialSegments 6
  - 반복 장식(홈, 눈금, 리벳)    → 각도 루프로 같은 지오메트리를 여러 메시로 배치(rotation 을 바깥 방향으로)
  - 양각(별, 로고)              → Shape → ExtrudeGeometry 를 표면에 살짝 띄워 올린다
- ExtrudeGeometry 는 z 0~depth 로 생기니 translate(0,0,-depth/2) 로 두께 중심을 맞춘다.
- 지오메트리·재질은 useMemo 로 한 번만 만든다.
- 회전축(피벗)이 필요하면 그룹을 두 겹으로: 바깥 그룹 = 기울기(tilt), 안쪽 그룹 = 회전.

[재질 프리셋 — MeshPhysicalMaterial]
- 크롬        color #E8E8E8, metalness 1, roughness 0.15, clearcoat 0.3, envMapIntensity 1.2
- 브러시드 알루미늄 color #D6D8DB, metalness 1, roughness 0.38
- 금          color #E8C26A, metalness 1, roughness 0.22, clearcoat 0.4, envMapIntensity 1.3
- 황동        color #C9A15A, metalness 1, roughness 0.3
- 어두운 금속  color #2A2B2E, metalness 0.9, roughness 0.3, clearcoat 0.5
- 에나멜(색)  metalness 0.1, roughness 0.25, clearcoat 1
- 나무        color #8A5A3B, metalness 0, roughness 0.6, clearcoat 0.25
- 유리        transmission 쓰지 말 것(모바일 GL 에서 비싸고 불안정).
              transparent, opacity 0.22, roughness 0.05, clearcoat 1, envMapIntensity 1.6, DoubleSide, depthWrite false,
              메시에 renderOrder 를 크게 줘서 마지막에 그린다

[조명·환경]
- drei 의 <Environment preset> 은 네이티브에서 CDN 로딩이 불안정하니 쓰지 말 것.
- three/examples 의 RoomEnvironment + PMREMGenerator(gl).fromScene(room, 0.04).texture 를 scene.environment 로.
- gl.toneMapping = ACESFilmicToneMapping, gl.outputColorSpace = SRGBColorSpace.
- 금속은 환경맵이 반사돼야 금속으로 보인다. 별도 조명은 필요 없다.

[카메라·배치]
- PerspectiveCamera fov 30, 정면에서 15~18° 위.
- 모델 바운딩 박스 중심을 원점으로 옮기고, 바운딩 구 반지름으로 카메라 거리를 계산해
  "캔버스 짧은 변의 X%" 를 채우게 한다 (회전해도 안 잘림).
- 기본 각도는 정면이 아니라 3/4 (yaw -0.3 ~ -0.5 rad) 가 입체감이 좋다.

[RN 에서 실제로 밟은 함정 — 반드시 지킬 것]
- three r18x 의 CJS 빌드(three.cjs)는 첫 줄에서 Node 전용 process.emitWarning 을 불러 RN 에서
  "undefined is not a function" 으로 죽는다. metro.config.js 의 resolver.resolveRequest 에서
  'three' 를 node_modules/three/build/three.module.js 로 고정할 것.
- iOS 시뮬레이터의 GL 은 소프트웨어 렌더러라 PMREM·MSAA 에서 네이티브 크래시하거나 빈 화면이 된다.
  expo-device 의 Device.isDevice 가 false 면 환경맵·antialias 를 끄고 frameloop="demand" 로.
  크롬 질감은 반드시 실기기에서 확인할 것.
- @react-three/fiber/native 는 expo-asset, expo-file-system 을 peer 로 요구한다.

[검증]
- 실기기 스크린샷을 첨부한다.
- 회색 플라스틱처럼 보이면 환경맵이 안 붙은 것: scene.environment, PMREM 을 gl 로 만들었는지,
  envMapIntensity, toneMapping/outputColorSpace 를 순서대로 확인하고 고친 뒤 다시 찍을 것.
```

---

## B. 오브젝트 블록 (채워서 붙이기)

```
[목표] [오브젝트 이름] 을 components/models/[이름].tsx 로 만든다. 정적으로 천천히 도는 턴테이블에 띄운다.
[레퍼런스] (있으면 이미지 첨부) [어떤 비율·질감을 참고할지 한 줄]

[부품 — 각 부품마다 도형·치수·재질]
- [부품1]: [도형] ([치수]), 재질 [프리셋]
- [부품2]: ...
- [반복 장식]: [개수]개를 [반지름] 둘레에 [방향]으로
- [양각/음각]: ...

[배치]
- 전체 높이 기준 [위/아래] 정렬, 캔버스 짧은 변의 [80]% 를 채움, 기본 yaw [-0.4] rad.

[검증] 실기기 스크린샷. [이 물건에서 특히 볼 점 — 예: 유리가 뒤 부품을 가리지 않는지]
```

### 채운 예시 1 — 볼륨 다이얼

```
[목표] 볼륨 다이얼을 components/models/DialKnob.tsx 로 만든다.
[부품]
- 몸통: LatheGeometry. 단면 (r,h) = (0,0)(1.0,0)(1.02,0.05)(1.0,0.16)(0.86,0.2)(0.82,0.24)(0.8,0.86)(0.76,0.94)(0.7,0.98)(0.35,0.985)(0,0.96)
        — 아래 치마, 위는 가운데가 살짝 오목. 재질 브러시드 알루미늄
- 둘레 홈: BoxGeometry(0.05, 0.56, 0.07) 36개를 반지름 0.8, 높이 0.55 에 바깥 방향으로. 같은 재질
- 표시선: Box(0.07, 0.03, 0.42) 를 윗면 앞쪽에. 재질 빨간 에나멜
- 눈금판: Cylinder(1.45, 1.5, 0.08) 어두운 금속 + 눈금 11개(-135°~+135°)를 반지름 1.25 에 크롬으로
[배치] 짧은 변의 92%, yaw -0.4
```

### 채운 예시 2 — 자물쇠

```
[목표] 자물쇠를 components/models/Padlock.tsx 로 만든다.
[부품]
- 몸통: 둥근 사각 Shape(1.6×1.3, 모서리 0.26, quadraticCurveTo) → Extrude(depth 0.5, bevel 0.07, segments 5). 금
- 고리: Torus(0.52, 0.11, 32, 64, π) 를 몸통 위 0.42 에 + 양쪽 다리 Cylinder(0.11, h 0.5). 크롬
- 열쇠 구멍: 원(r 0.13, absarc -0.32π~1.32π) + 아래로 넓어지는 사다리꼴 Shape → Extrude(0.03). 어두운 금속, 앞면에 살짝 띄움
[배치] 짧은 변의 85%, yaw -0.5
```

### 채운 예시 3 — 모래시계

```
[목표] 모래시계를 components/models/Hourglass.tsx 로 만든다.
[부품]
- 유리: Lathe. y ∈ [-1.2, 1.2] 을 48등분, t=|y|/1.2, r = 0.07 + 0.62·sin(π·min(t,0.97))^0.75 + 0.18·t². 유리 프리셋, renderOrder 10
- 받침 2개: 모따기 단면 Lathe (0,-0.1)(0.98,-0.1)(1.04,-0.05)(1.04,0.05)(0.98,0.1)(0,0.1) 를 y=±1.3 에. 나무
- 기둥 3개: Cylinder(0.05, h 2.5) 를 반지름 0.86, 120° 간격. 황동
- 모래: 아래 더미 Lathe (0,-1.12)(0.62,-1.12)(0.5,-0.95)(0.28,-0.72)(0,-0.58), 위 깔때기 Lathe (0,0.12)(0.3,0.42)(0.55,0.62)(0,0.62),
        가운데 떨어지는 줄기 Cylinder(0.018, h 0.7). 모래 재질(roughness 0.95)
[검증] 유리를 마지막에 그려 안쪽 모래가 보이는지
```

### 채운 예시 4 — 메달

```
[목표] 메달을 components/models/Medal.tsx 로 만든다.
[부품]
- 원판: 테두리가 솟은 단면 Lathe (0,-0.1)(1.0,-0.1)(1.07,-0.06)(1.07,0.06)(1.0,0.11)(0.9,0.11)(0.86,0.06)(0,0.06)
        → rotateX(π/2) 로 세워 z 가 앞면. 금
- 별: 5각 별 Shape(외곽 0.58, 안쪽 0.25) → Extrude(0.05, bevel 0.03) 를 앞면 z 0.06 에. 황동
- 고리: Torus(0.15, 0.045) 를 원판 위. 금
- 리본: Box(0.38, 1.3, 0.03) 두 장을 ±0.32 rad 기울여 V 자로. 빨간 에나멜
[배치] 짧은 변의 85%, yaw -0.35
```

---

## 부록 — 증상별 고쳐 달라는 프롬프트

**모델이 아예 안 보임 / 빈 화면**
```
캔버스가 비어 있다. 먼저 맨 GLView 에 clearColor 빨강을 찍어 GL 자체가 되는지 보고,
되면 R3F 최소 장면(파란 박스)으로, 그다음 환경맵 → 재질 → 지오메트리 순으로 하나씩 되돌려 원인을 좁혀라.
시뮬레이터라면 크래시 리포트(~/Library/Logs/DiagnosticReports)의 스택이 GLRendererFloat 인지부터 확인.
```

**작게 나옴 / 잘림**
```
모델이 화면에 비해 작거나 회전할 때 잘린다. Box3 로 중심을 원점에 맞추고,
바운딩 구 반지름 / (채울 비율 × tan(fov/2)) 로 카메라 거리를 다시 계산해라. 가로가 좁으면 aspect 도 반영.
```

**유리가 뒤를 가림 / 이상하게 겹침**
```
투명 유리가 안쪽 부품을 가린다. 유리 재질에 depthWrite false, side DoubleSide 를 주고
메시 renderOrder 를 가장 크게 해서 마지막에 그려라.
```
