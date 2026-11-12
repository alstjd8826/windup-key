# 태엽 감기 앱 — React Native 구현 프롬프트 모음

레퍼런스: https://x.com/yuichirohonda_/status/2120481894022439239
(태엽 열쇠를 돌려야 SNS를 쓸 수 있는 앱. 1바퀴에 1분)

`reference-frames.jpg`(원본 영상 프레임 10장) 는 저작권 때문에 이 저장소에 넣지 않았습니다. 레퍼런스 링크의 영상을 직접 캡처해 쓰세요.
1단계·4단계에는 꼭 같이 첨부하세요.

## 사용 순서

| 순서 | 프롬프트 | 결과물 |
|---|---|---|
| 0 | 공통 전제 | 모든 단계 맨 앞에 붙이는 블록 |
| 1 | 열쇠 렌더링 | 크롬 열쇠 정적 화면 |
| 2 | 감기 제스처 | 원 그리기로 회전, 1바퀴 = 1분 |
| 3 | 감기 화면 UI | 호 게이지, 숫자, 버튼 |
| 4 | 타이머 화면 | 어두운 카운트다운 화면 |
| 5 | 홈 화면 | 오늘 쓴 시간, 탭바 |
| 6 | 앱 잠금 (Screen Time) | 실제 SNS 차단/해제 |
| 부록 A | GLB 모델로 교체 | 외부 3D 모델로 열쇠 교체 |
| 부록 B | 문제 생길 때 | 증상별로 고쳐 달라는 프롬프트 |

한 번에 여러 단계를 넣지 말고, 단계마다 검증 결과를 확인한 뒤 다음 단계로 넘어가세요.

---

## 0. 공통 전제 (모든 단계 맨 앞에 붙이기)

```
Expo(SDK 최신, dev client) + TypeScript로 "태엽 감기" 앱을 만든다.

[스택 고정 — 다른 라이브러리로 바꾸지 말 것]
- 3D: three, @react-three/fiber/native, expo-gl
- 제스처: react-native-gesture-handler (Gesture.Pan)
- 애니메이션: react-native-reanimated (shared value)
- 게이지/도형: react-native-svg
- 햅틱: expo-haptics
- 네비게이션: expo-router

[RN에서 알려진 함정 — 반드시 지킬 것]
- drei의 <Environment preset> 은 네이티브에서 CDN 로딩이 불안정하니 쓰지 말 것.
  대신 three/examples 의 RoomEnvironment + PMREMGenerator 로 scene.environment 를 만들 것.
- 제스처는 <Canvas> 위에 절대배치한 투명 View 에 GestureDetector 로 붙일 것
  (Canvas 자체 터치 이벤트 사용 금지).
- 회전값은 reanimated shared value 에 두고, useFrame 안에서 .value 를 읽어
  mesh.rotation 에 반영할 것. 매 프레임 setState 금지.
- 햅틱 등 JS 함수 호출은 worklet 에서 runOnJS 로.

[라우팅 구조 — 처음부터 이 모양으로 고정, 단계마다 파일 위치를 옮기지 말 것]
app/
  _layout.tsx          루트 Stack (GestureHandlerRootView 포함, 헤더 숨김)
  (tabs)/
    _layout.tsx        하단 탭: 홈 / 잠금 / 설정
    index.tsx          홈 (5단계)
    lock.tsx           잠금 (6단계 전까지 빈 화면)
    settings.tsx       설정 (빈 화면)
  wind.tsx             감기 화면 — 탭 없는 풀스크린 (3단계)
  timer.tsx            타이머 화면 — 탭 없는 풀스크린, 뒤로가기 제스처 막기 (4단계)
아직 안 만든 화면은 파일을 만들지 말 것. 단, 5단계 전까지는 (tabs) 대신
app/index.tsx 하나만 두고 <Redirect href="/wind" /> 로 감기 화면을 띄운다.

[상태 모델 — 4단계에서 만들고 이후 단계는 이 필드만 쓸 것]
stores/usage.ts (zustand + AsyncStorage persist)
- dailyCapMin: number          하루 상한(기본 60)
- todayUnlockedMin: number     오늘 푼 시간. 타이머 시작 시 +N, 멈추기 시 안 쓴 분만큼 -
- lastResetDate: string        YYYY-MM-DD. 앱 진입·포그라운드 복귀 때 날짜가 바뀌었으면 todayUnlockedMin = 0
- session: { endsAt: number; minutes: number } | null   진행 중인 타이머
- 파생값: todayLeftMin = max(dailyCapMin - todayUnlockedMin, 0)
  ("오늘 잔여"는 따로 저장하지 않고 이 파생값으로 계산한다)

[작업 원칙]
- 이번 단계 범위 밖의 화면·기능은 만들지 말 것.
- 끝나면 iOS 시뮬레이터에서 직접 실행해 [검증] 항목을 확인하고, 스크린샷이나 녹화 결과를 첨부할 것.
  확인하지 못한 항목은 "미확인"이라고 명시할 것.
```

---

## 1단계: 열쇠 렌더링

```
[목표] 크롬 태엽 열쇠가 예쁘게 보이는 정적 화면만 만든다. 제스처 없음.
첨부한 reference-frames.jpg 의 열쇠 비율과 질감을 참고할 것.

[모델 — 외부 파일 없이 기본 지오메트리 조합, components/WindupKey.tsx]
- 손잡이: 원 두 개(반지름 0.5, 중심 간격 1.0)를 이어 붙인 땅콩 모양을
  Shape → ExtrudeGeometry(depth 0.15, bevel 0.03, bevelSegments 4)로.
  각 원 가운데는 살짝 오목하게(얕은 구면 디스크를 겹쳐 표현해도 됨).
- 목: 손잡이 아래 원기둥(반지름 0.08, 길이 0.3).
- 축: 원기둥(반지름 0.12, 길이 0.9) + 끝에 육각 소켓(CylinderGeometry radialSegments 6).
- 전체 그룹의 회전축은 세로(Y축). 피벗이 축 중심에 오도록 정렬.
- props: rotation(SharedValue<number>) — 이번 단계에서는 0 고정.

[재질·조명]
- MeshPhysicalMaterial: color #E8E8E8, metalness 1.0, roughness 0.15,
  clearcoat 0.3, envMapIntensity 1.2.
- scene.environment = RoomEnvironment(PMREM). 배경 #F5F5F5.
- 바닥 그림자는 생략.

[카메라·레이아웃]
- PerspectiveCamera fov 30, 정면에서 약 15° 위에서 내려다봄.
- 열쇠는 화면 상단 45% 영역 중앙, 화면 폭의 약 45% 크기.

[검증]
- 시뮬레이터 스크린샷 첨부.
- 크롬 반사가 안 보이고 회색 플라스틱처럼 보이면 환경맵이 적용 안 된 것이니,
  원인을 찾아 고친 뒤 다시 찍을 것.
```

---

## 2단계: 감기 제스처

```
[목표] 1단계 화면에 "원 그리며 감기" 제스처를 붙인다. hooks/useWindGesture.ts 로 분리.

[각도 계산 — 전부 worklet]
- 열쇠의 화면상 중심 좌표 (cx, cy) 는 onLayout 으로 구해 shared value 에 저장.
- Pan onBegin: prevAngle = atan2(y - cy, x - cx).
- Pan onUpdate: angle 을 다시 구하고 Δθ = angle - prevAngle 를 (-π, π] 로 정규화
  (±π 경계를 넘을 때 값이 튀지 않게). prevAngle = angle.
- 시계 방향(화면 좌표 기준 Δθ > 0)만 누적: total += max(Δθ, 0). 반시계는 무시(래칫).
- 중심에서 40pt 이내 터치는 각도가 불안정하니 무시하고 prevAngle 만 갱신.

[반영]
- 열쇠 Y축 회전 = total (useFrame 에서 읽기). 손을 떼면 관성 없이 즉시 정지.
- minutes = floor(total / 2π), 최대 30. 30 도달 시 total 을 30 * 2π 에 고정.
- 훅은 { gesture, total, minutes, reset } 을 반환.

[햅틱]
- 30° 지날 때마다 Haptics.impactAsync(Light).
- 1바퀴 완성(minutes 증가) 시 Haptics.impactAsync(Medium).
- 최대치 도달 시 Haptics.notificationAsync(Warning) 한 번.

[검증]
- 화면에 디버그 텍스트(total°, minutes)를 임시로 띄워서 확인.
- 화면 중앙 근처에서 시계 방향 원 3바퀴 → minutes 3.
- 반시계로 돌리면 변화 없음.
- 중심 바로 위에서 문질러도 값이 튀지 않음.
- 확인 후 디버그 텍스트는 __DEV__ 조건으로 감출 것.
```

---

## 3단계: 감기 화면 UI

```
[목표] 감은 양을 게이지·숫자·버튼에 연결해 감기 화면(app/wind.tsx)을 완성한다.

[호 게이지 — react-native-svg]
- 열쇠 오른쪽에 반지름 140 정도의 반원 호(위 -90° → 아래 +90°).
- 눈금 60개(5개마다 긴 눈금), 색 #CFCFCF.
- 현재 바퀴 진행률 (total % 2π) / 2π 만큼 진한 선(#111)으로 채움.
  useAnimatedProps 로 strokeDashoffset 갱신.

[숫자]
- 열쇠 아래 "+N" (fontSize 72, fontWeight 200) + 오른쪽 아래 작은 "min".
- N 이 바뀔 때 위로 밀려 올라가는 롤링 전환(reanimated, 180ms).
- 아래 안내 문구 2줄(회색 13pt):
  "1바퀴에 1분 / 1분이 안 되는 나머지는 버려집니다".

[버튼]
- N = 0: 연회색 비활성 "사용".
- N > 0: 검정 배경 흰 글씨 "N분 사용". 누르면 /timer?minutes=N 으로 이동.
- 그 아래 텍스트 버튼 "그만두기" → 누적값 리셋. router.canGoBack() 이면 뒤로,
  아니면(5단계 전에는 돌아갈 화면이 없음) 리셋만 한다.
- 이 단계에서 /timer 는 아직 없으니 버튼은 이동 대신 console.log 로 minutes 만 찍어도 된다.
- 상단 왼쪽에 작은 타이틀 "사용 시간".

[검증]
- 4바퀴 감는 동안 게이지가 매 바퀴 0→100% 반복, 숫자 +0→+4 롤링,
  버튼 문구가 "4분 사용"으로 바뀌는 것을 녹화로 확인
  (xcrun simctl io booted recordVideo out.mp4).
```

---

## 4단계: 타이머 화면

```
[목표] "N분 사용"을 누른 뒤의 어두운 카운트다운 화면(app/timer.tsx)을 만든다.
첨부한 reference-frames.jpg 아래 줄 왼쪽 3장이 이 화면이다.

[레이아웃 — 배경 #000, 글씨 흰색]
- 상단: 1단계 열쇠를 작게(화면 폭 30%) 정면으로. 남은 시간에 비례해
  초당 아주 천천히 반시계로 풀리는 회전(태엽이 풀리는 느낌).
- 가운데: "M:SS" (fontSize 88, fontWeight 200, tabular-nums). 아래 작은 "remaining".
- 그 아래: 가로 눈금자(react-native-svg). 왼쪽 0, 오른쪽 N:00 라벨.
  남은 비율만큼 눈금을 흰색, 나머지를 #444 로.
- "Unlocked apps" 라벨 + 앱 아이콘 6개 가로 나열(6단계 전까지는 플레이스홀더 원).
- 하단 안내 문구 2줄(회색 12pt):
  "시간이 되면 자동으로 다시 잠깁니다. / 중간에 멈추면 남은 시간은 오늘 잔여로 돌아갑니다."
- 맨 아래 흰 배경 검정 글씨 버튼 "멈추기".

[동작]
- 시작 시각(Date.now())을 저장하고 남은 시간은 매번 (종료시각 - 현재)로 계산
  (setInterval 누적 방식 금지: 백그라운드 갔다 오면 틀어짐).
  표시 갱신은 1초 interval 로 하되, 값은 매번 endsAt - Date.now() 로 다시 계산.
- 상태는 0단계 [상태 모델] 의 stores/usage.ts 를 이 단계에서 만든다.
- 진입 시: session = { endsAt: now + N분, minutes: N }, todayUnlockedMin += N.
- 0이 되면 Haptics Success, session = null 후 이전 화면으로(5단계 전에는 /wind 로 replace).
- "멈추기": 안 쓴 시간을 분 단위로 내림한 만큼 todayUnlockedMin 에서 빼고(= 오늘 한도로 돌려줌),
  session = null 후 같은 방식으로 나간다.
- 앱을 껐다 켰을 때 session 이 남아 있고 endsAt 이 미래면 /timer 로 복귀,
  지났으면 session = null (이 복귀 로직은 app/_layout.tsx 에).
- 3단계 감기 화면의 최대치를 min(30, todayLeftMin) 으로 연결하고,
  todayLeftMin 이 0이면 "오늘 한도를 다 썼습니다" 안내와 함께 감기 비활성.

[검증]
- 1분으로 시작해 앱을 백그라운드에 20초 뒀다가 돌아왔을 때 시간이 맞게 줄어 있는지.
- 3분으로 시작해 2분 30초 남기고 "멈추기" → todayUnlockedMin 이 3 → 1 (2분 반환, 30초는 버림).
- 30초 남기고 "멈추기" → 반환 0분, todayUnlockedMin 그대로.
- 타이머 중 앱을 완전히 종료했다가 다시 켜면 타이머 화면으로 돌아오는지.
```

---

## 5단계: 홈 화면

```
[목표] 홈 화면과 하단 탭을 만든다. 0단계 [라우팅 구조] 대로
임시 app/index.tsx(Redirect)를 지우고 app/(tabs)/ 를 만든다. wind·timer 파일은 옮기지 말 것.
첨부한 reference-frames.jpg 아래 줄 맨 오른쪽이 이 화면이다.

[레이아웃 — 배경 #F5F5F5]
- 상단 작은 상태 칩: session 이 없으면 "● 잠김", 있으면 "● 사용 중 M:SS".
  (6단계에서 "● 잠김 · 앱 N개" 로 바뀔 자리. 지금은 앱 수 없이.)
- 가운데: 1단계 열쇠(감기 화면보다 약간 크게, 비스듬히 30° 기울여 놓기)
  + 오른쪽 호 게이지(todayUnlockedMin / dailyCapMin 비율).
- 그 아래: "오늘 푼 시간" 라벨, 큰 숫자 todayUnlockedMin + "min".
- 안내 문구: "'사용'을 누르고 쓸 만큼 태엽을 감으세요."
- 검정 버튼 "사용" → router.push('/wind'). session 이 있으면 대신 "사용 중" 버튼 → /timer.
- 하단 탭 3개: 홈 / 잠금 / 설정(아이콘 + 작은 라벨). 잠금·설정은 빈 화면으로.
- 3·4단계의 "5단계 전에는 ~" 임시 분기(뒤로 갈 곳 없음, /wind replace)를
  홈 기준으로 정리: 그만두기·타이머 종료 모두 홈으로 돌아온다.

[검증]
- 홈(0) → 감기 3분 → 타이머 → 2분 30초 남기고 멈추기 → 홈 "오늘 푼 시간" 1, 게이지도 1/60.
- 탭바가 감기·타이머 화면에서는 보이지 않는지.
```

---

## 6단계: 앱 잠금 (Screen Time)

```
[목표] 실제로 SNS 앱을 잠그고, 타이머 동안만 풀리게 한다.
네이티브 코드는 modules/screen-time 로컬 Expo 모듈로 분리하고, 3D·제스처 코드는 건드리지 말 것.
UI 는 아래 [JS API] 의 "연결" 항목만 손댄다.

[먼저 조사하고 보고할 것 — 코드 쓰기 전에]
- react-native-device-activity 같은 기존 라이브러리가 아래 요구사항을 충족하는지,
  최근 유지보수 상태와 Expo SDK 호환 여부를 확인해 쓸지 직접 만들지 제안할 것.

[요구사항 — iOS 16+]
- FamilyControls: AuthorizationCenter.shared.requestAuthorization(for: .individual).
- 잠글 앱 선택: FamilyActivityPicker 를 띄우고 결과(FamilyActivitySelection)를
  App Group UserDefaults 에 저장. (앱 이름·번들ID는 앱에서 못 읽으니
  아이콘 표시는 Label(token) 기반 네이티브 뷰로.)
- 잠금: ManagedSettingsStore().shield.applications = 선택한 토큰.
- 해제: 타이머 시작 시 shield 해제 + DeviceActivityCenter 로 N분 뒤 끝나는 스케줄 등록.
- ⚠️ DeviceActivitySchedule 은 길이가 15분 미만이면 startMonitoring 이
  intervalTooShort 로 실패한다. 이 앱은 1~30분이라 그대로 쓰면 대부분 깨진다.
  → 시작을 과거로 당겨 길이를 맞출 것: intervalStart = now - max(15 - N, 0)분,
    intervalEnd = now + N분 (DateComponents 는 초 단위까지 채울 것).
  → 등록 전 같은 이름의 기존 모니터링은 stopMonitoring 으로 지울 것.
  → 이 우회가 실제로 N분 뒤 intervalDidEnd 를 부르는지 실기기에서 반드시 확인.
    안 되면 몰래 JS 타이머로 바꾸지 말고, 관찰한 동작을 보고하고 대안
    (DeviceActivityEvent threshold, warningTime 등)을 제안할 것.
- 재잠금: DeviceActivityMonitor 앱 익스텐션의 intervalDidEnd 에서 shield 다시 적용
  (앱이 꺼져 있어도 다시 잠겨야 하므로 JS 타이머에 의존하지 말 것).
- 멈추기: 4단계 "멈추기" 에서 stopMonitoring + 즉시 shield 재적용(lockNow).
  타이머가 0이 됐을 때도 lockNow 를 한 번 더 불러서 익스텐션 지연에 대비할 것.
- 커스텀 차단 화면(ShieldConfiguration 익스텐션): 흰 배경, 열쇠 이미지,
  "태엽을 감아야 열립니다" 문구.

[빌드 설정 — config plugin 으로]
- entitlement com.apple.developer.family-controls
- App Group (메인 앱 + 두 익스텐션 공유)
- 익스텐션 타깃 2개: DeviceActivityMonitor, ShieldConfiguration
- 시뮬레이터에서는 동작하지 않으므로 실기기 검증 필요하다는 점을 README 에 명시.

[JS API]
- requestAuthorization(), pickApps(), getSelectedAppsCount(),
  unlockFor(minutes), lockNow(), isLocked()
- 연결: 잠금 탭(app/(tabs)/lock.tsx)에 권한 요청·앱 선택 버튼과 선택한 앱 아이콘,
  홈 상태 칩을 "● 잠김 · 앱 N개"(getSelectedAppsCount)로,
  타이머 화면의 플레이스홀더 원 6개를 선택한 앱 아이콘(Label(token) 네이티브 뷰)으로 교체.

[검증 — 실기기]
- 인스타그램 선택 → 잠김 확인 → 1분 감고 사용 → 열림 → 앱 종료한 채 1분 대기 → 다시 잠김.
- 3분 감고 사용 → 1분 뒤 멈추기 → 바로 잠기는지.
- 15분 이상(예: 16분)도 같은 경로로 열리고 제때 잠기는지(우회 분기 양쪽 확인).
- 주의: 배포용 빌드에는 Apple 에 Family Controls 배포 entitlement 를 따로 신청해야 한다.
  개발 빌드로만 검증하고, 신청 필요 여부를 결과 보고에 적을 것.
```

---

## 부록 A: GLB 모델로 교체

procedural 열쇠 모양이 계속 어색할 때 씁니다. Spline이나 Blender에서 `.glb` 를 뽑아 `assets/models/key.glb` 에 넣은 뒤:

```
components/WindupKey.tsx 의 기본 도형 조합을 assets/models/key.glb 로드로 교체한다.

- expo-asset + @react-three/drei/native 의 useGLTF 로 로드. metro.config.js 의
  assetExts 에 glb 추가.
- 로드한 모든 Mesh 의 material 을 1단계와 같은 MeshPhysicalMaterial 로 덮어쓸 것
  (모델에 들어 있는 재질은 무시).
- 모델의 피벗이 축 중심이 아니면 Box3 로 중심을 구해 그룹 안에서 오프셋 보정.
  회전축은 Y축 유지.
- props 와 외부 인터페이스(rotation SharedValue)는 그대로 유지해서
  2~5단계 코드는 수정할 필요가 없게 할 것.
- 로딩 중에는 Suspense fallback 으로 아무것도 그리지 말 것(깜빡임 방지).
```

---

## 부록 B: 문제 생길 때 붙이는 프롬프트

증상에 맞는 블록을 그대로 붙이세요.

**열쇠가 회색 플라스틱처럼 보임**
```
열쇠가 크롬이 아니라 무광 회색으로 보인다. scene.environment 가 실제로 설정됐는지,
PMREMGenerator 를 renderer(gl) 로 만들었는지, material.envMapIntensity 가 0이 아닌지,
toneMapping 이 ACESFilmic 이고 outputColorSpace 가 SRGB 인지 순서대로 확인하고 고쳐라.
고친 뒤 전/후 스크린샷을 나란히 보여줄 것.
```

**돌리다가 열쇠가 갑자기 튐**
```
원을 그리며 돌릴 때 특정 위치(대개 왼쪽, ±180° 지점)에서 회전이 크게 튄다.
Δθ 정규화가 (-π, π] 로 제대로 되는지, 중심 근처 데드존이 동작하는지 확인하고,
onUpdate 에서 Δθ 를 console.log 로 찍어 원인을 보여준 뒤 고쳐라.
```

**제스처가 아예 안 먹음**
```
드래그해도 열쇠가 안 돈다. GestureHandlerRootView 가 앱 루트에 있는지,
제스처 오버레이 View 가 Canvas 위에 있고 pointerEvents 가 막혀 있지 않은지,
Canvas 가 터치를 가로채고 있지 않은지 확인하고 고쳐라.
```

**프레임이 끊김**
```
감을 때 프레임이 끊긴다. 회전 경로에 React state 업데이트(setState, 리렌더)가 끼어 있는지
찾아서 전부 shared value + useFrame 으로 바꿔라. 숫자 롤링도 minutes 가 바뀔 때만
runOnJS 로 갱신하고, 매 프레임 runOnJS 호출은 없앨 것.
Canvas 의 dpr 은 [1, 2] 로 제한하고, ExtrudeGeometry 세그먼트 수도 줄여볼 것.
```

**햅틱이 너무 많거나 안 옴**
```
햅틱이 몰아서 오거나 아예 안 온다. 30° 경계 판정을 floor(total / (π/6)) 값이
바뀔 때만 한 번 호출하도록 바꾸고, 실기기에서 확인할 것(시뮬레이터는 햅틱 없음).
```
