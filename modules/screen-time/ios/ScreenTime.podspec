Pod::Spec.new do |s|
  s.name           = 'ScreenTime'
  s.version        = '1.0.0'
  s.summary        = '선택한 앱 아이콘(Label(token)) 네이티브 뷰'
  s.author         = ''
  s.homepage       = 'https://example.invalid'
  s.platforms      = { :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'FamilyControls', 'ManagedSettings', 'SwiftUI'

  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = '**/*.{h,m,swift}'
end
