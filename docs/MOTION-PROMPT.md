# 앱 모션·인터랙션 프롬프트 (React Native + Reanimated)

화면이 "툭" 나타나지 않고, 누르면 쫀득하고, 상태가 바뀔 때 부드럽게 넘어가게 만드는 공통 규칙.
레퍼런스: heysatya_ 의 앱 디자인 몽타주 영상(X, 2026-11-11). 태엽 앱 전 화면에 적용해 실기기에서 확인한 수치다.

사용법: 새 앱·새 화면 프롬프트 끝에 **아래 블록을 그대로 붙인다.**

```
[모션·인터랙션 규칙 — 모든 화면에 기본 적용]
스택: react-native-reanimated (layout animation + shared value), expo-haptics.
공용 파일을 먼저 만들고 모든 화면이 재사용한다:
  components/motion.ts, components/PressableScale.tsx, components/RollingNumber.tsx

1. 화면 진입 — 순차 등장
   - 요소마다 순서 번호 i 를 매기고 entering = FadeInDown.delay(120 + i*70).springify().damping(18).stiffness(160)
     .withInitialValues({ opacity: 0, transform: [{ translateY: 14 }] })
   - 화면의 주인공(3D 오브젝트, 큰 이미지)은 Keyframe 으로 scale 0.9 → 1, translateY 10 → 0,
     650ms, easing bezier(0.2, 0.9, 0.2, 1)
   - 아이콘·칩 같은 작은 반복 요소는 ZoomIn.delay(420 + i*50).springify().damping(14)

2. 게이지·눈금·차트 — 쓸리듯 채우기
   - 한 번에 뜨지 않게 reveal shared value 를 withDelay(250, withTiming(1, 900ms, bezier(0.3,0.7,0.2,1))) 로 올리고
     눈금 i 의 opacity = clamp((reveal*(N+6) - i) / 6, 0, 1)  (6 = 번지는 폭)
   - 진행률 호는 strokeDasharray = 길이, strokeDashoffset = 길이*(1-p) 를 useAnimatedProps 로.
     값이 바뀌면 withSpring(p, { damping: 20, stiffness: 90 }) 로 따라가게

3. 버튼 — 스프링 눌림 + 햅틱
   - PressableScale: onPressIn 에 scale withSpring(0.96, { damping: 15, stiffness: 400, mass: 0.6 }) + Haptics.selectionAsync(),
     onPressOut 에 1 로 복귀. 작은 텍스트 버튼·칩은 0.92
   - 비활성 ↔ 활성 전환은 색을 바로 바꾸지 말고 shared value 0↔1 을 withTiming(240ms) 로,
     interpolateColor 로 배경(#E6E6E6→#111)과 글자색(#AAA→#FFF)을 같이

4. 숫자 — 롤링
   - 값이 바뀌면 이전 숫자는 위로 빠지고(opacity 1→0, translateY 0→-0.6·lineHeight)
     새 숫자는 아래에서 올라온다(반대). 180ms, easing out/in cubic.
   - key={value} 인 Animated.Text 에 entering/exiting Keyframe, 높이 = lineHeight 인 overflow hidden 컨테이너,
     폭은 보이지 않는 같은 Text 로 잡는다
   - 버튼 안 숫자("4분 동안 열기")도 같은 컴포넌트로

5. 상태 변화 피드백
   - 최대치·완료 같은 순간엔 한 번 튕기기: withSequence(withTiming(1.08, 120ms), withSpring(1, { damping: 8 }))
   - 진행 중 표시 점은 숨 쉬듯: withRepeat(withSequence(opacity 0.3/700ms, 1/700ms), -1)
   - 리셋·취소는 툭 끊지 말고 되감기: 값을 withTiming(0, 520ms, bezier(0.4,0,0.2,1)) 로.
     되감는 중에 사용자가 다시 잡으면 cancelAnimation 으로 그 자리에서 이어가게

6. 탭바 — 미끄러지는 알약
   - 선택 탭 뒤 흰 알약을 translateX withSpring(index*칸폭, { damping: 18, stiffness: 220 }) 로 이동,
     탭 버튼도 PressableScale(0.9)

7. 화면 전환
   - 모달성 화면(입력·설정)은 fade_from_bottom, 분위기가 바뀌는 화면(밝음→어두움)은 fade
   - 되돌아가면 안 되는 화면은 gestureEnabled: false

[함정]
- entering 레이아웃 애니메이션과 useAnimatedStyle 의 transform 을 같은 View 에 주면
  "Property transform may be overwritten" 경고가 난다. 바깥 Animated.View 에 entering, 안쪽에 animated style 로 나눌 것.
- 매 프레임 바뀌는 값(각도, 진행률)은 setState 하지 말고 shared value + useAnimatedProps/useAnimatedStyle 로.
  JS 로 넘길 일(햅틱, 표시 숫자)은 값이 "바뀔 때만" scheduleOnRN(옛 runOnJS) 으로.
- 수치·타이밍은 components/motion.ts 한 곳에 모아 두고 화면에서는 이름으로만 쓴다.

[검증]
- 진입 직후 0.3초 시점 캡처와 완료 후 캡처를 나란히 보여줘서 순차 등장·쓸림이 실제로 도는지 확인.
- 누름·롤링·되감기는 실기기 녹화로 확인(시뮬레이터 X).
```
