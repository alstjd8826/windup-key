import * as THREE from 'three';

/**
 * RoomEnvironment(PMREM) 환경맵을 전제로 맞춘 재질 프리셋.
 * 금속은 환경맵이 없으면 검게 보인다 — 회색 플라스틱처럼 보이면 환경맵부터 의심.
 */
export const materials = {
  chrome: () =>
    new THREE.MeshPhysicalMaterial({ color: '#E8E8E8', metalness: 1, roughness: 0.15, clearcoat: 0.3, envMapIntensity: 1.2 }),
  brushedAluminum: () =>
    new THREE.MeshPhysicalMaterial({ color: '#D6D8DB', metalness: 1, roughness: 0.38, envMapIntensity: 1.1 }),
  darkMetal: () =>
    new THREE.MeshPhysicalMaterial({ color: '#2A2B2E', metalness: 0.9, roughness: 0.3, clearcoat: 0.5, envMapIntensity: 1 }),
  gold: () =>
    new THREE.MeshPhysicalMaterial({ color: '#E8C26A', metalness: 1, roughness: 0.22, clearcoat: 0.4, envMapIntensity: 1.3 }),
  brass: () =>
    new THREE.MeshPhysicalMaterial({ color: '#C9A15A', metalness: 1, roughness: 0.3, envMapIntensity: 1.1 }),
  /** transmission 은 모바일 GL 에서 비싸고 불안정해서, 투명도 + 클리어코트로 유리를 흉내 낸다 */
  glass: () =>
    new THREE.MeshPhysicalMaterial({
      color: '#FFFFFF',
      metalness: 0,
      roughness: 0.05,
      transparent: true,
      opacity: 0.22,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      envMapIntensity: 1.6,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  wood: () => new THREE.MeshPhysicalMaterial({ color: '#8A5A3B', metalness: 0, roughness: 0.6, clearcoat: 0.25 }),
  sand: () => new THREE.MeshStandardMaterial({ color: '#E3C38F', metalness: 0, roughness: 0.95 }),
  enamelRed: () =>
    new THREE.MeshPhysicalMaterial({ color: '#C8323C', metalness: 0.1, roughness: 0.25, clearcoat: 1, envMapIntensity: 1 }),
};

export type MaterialName = keyof typeof materials;
