const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// three r18x 의 CJS 빌드(three.cjs)는 첫 줄에서 Node 전용 process.emitWarning 을 호출해
// RN 에서 "undefined is not a function" 으로 죽는다. R3F native 가 require('three') 로
// 불러도 ESM 빌드 하나로 통일한다(인스턴스 중복도 방지).
const threeModule = path.resolve(__dirname, 'node_modules/three/build/three.module.js');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'three') {
    return { type: 'sourceFile', filePath: threeModule };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
