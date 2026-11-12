import { Redirect } from 'expo-router';

// 5단계에서 (tabs) 로 교체될 임시 진입점
export default function Index() {
  return <Redirect href="/wind" />;
}
