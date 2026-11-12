# 태엽 (windup-key)

태엽 열쇠를 감아야 SNS 를 쓸 수 있는 앱. 1바퀴 = 1분.

## 실행

```bash
npm install
npx expo prebuild --platform ios
npx expo start --dev-client
```

## ⚠️ 앱 잠금(Screen Time)은 실기기 전용

- `modules/screen-time` 는 FamilyControls / ManagedSettings / DeviceActivity 를 쓰고, **iOS 시뮬레이터에서는 동작하지 않는다.**
- iOS 시뮬레이터는 3D(환경맵·MSAA) 렌더링도 불안정해서 시뮬레이터에선 자동으로 끈다. 크롬 질감은 실기기로 확인할 것.
- 확장 프로그램 3개(`ActivityMonitorExtension`, `ShieldConfiguration`, `ShieldAction`)와 App Group(`group.com.darby.windupkey`)은
  `react-native-device-activity` config plugin 이 prebuild 때 만든다(`targets/` 폴더).
- 개발 빌드는 개인 팀(`M45QFAAT7S`)의 Family Controls (Development) 로 서명된다.
- **TestFlight·스토어 배포에는 Apple 의 Family Controls (Distribution) 승인이 필요하다.**
  아래 번들 ID 4개 각각 [신청 폼](https://developer.apple.com/contact/request/family-controls-distribution)을 따로 제출해야 한다.
  - `com.darby.windupkey`
  - `com.darby.windupkey.ActivityMonitorExtension`
  - `com.darby.windupkey.ShieldAction`
  - `com.darby.windupkey.ShieldConfiguration`

## 15분 미만 해제 구간

`DeviceActivitySchedule` 은 15분 미만이면 `intervalTooShort` 로 실패한다. 이 앱은 1~30분이라
시작을 과거로 당겨 길이를 맞춘다(`modules/screen-time/src/schedule.ts`):
`intervalStart = now - max(15 - N, 0)분`, `intervalEnd = now + N분`.
다시 잠그는 건 앱이 꺼져 있어도 되도록 DeviceActivityMonitor 익스텐션의 `intervalDidEnd` 가 한다.
