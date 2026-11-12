import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

type P = { color: string; size?: number };

/** 홈: 과녁 */
export function HomeIcon({ color, size = 22 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={8.5} stroke={color} strokeWidth={1.8} fill="none" />
      <Circle cx={12} cy={12} r={3.5} fill={color} />
    </Svg>
  );
}

/** 잠금: 자물쇠 */
export function LockIcon({ color, size = 22 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Rect x={5.5} y={10.5} width={13} height={9.5} rx={2.2} fill={color} />
    </Svg>
  );
}

/** 설정: 슬라이더 */
export function SettingsIcon({ color, size = 22 }: P) {
  const rows = [
    { y: 7, k: 15 },
    { y: 12, k: 9 },
    { y: 17, k: 13 },
  ];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {rows.map((r) => (
        <Line key={r.y} x1={4} y1={r.y} x2={20} y2={r.y} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      ))}
      {rows.map((r) => (
        <Circle key={`k${r.y}`} cx={r.k} cy={r.y} r={2.2} fill="#F5F5F5" stroke={color} strokeWidth={1.6} />
      ))}
    </Svg>
  );
}
