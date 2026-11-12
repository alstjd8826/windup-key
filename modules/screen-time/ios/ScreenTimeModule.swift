import ExpoModulesCore
import FamilyControls
import ManagedSettings
import SwiftUI

/// 앱 이름·번들 ID 는 앱에서 읽을 수 없어서, 선택한 토큰을 시스템 Label 로만 그릴 수 있다.
public class ScreenTimeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ScreenTime")

    /// base64(JSON) 로 직렬화된 FamilyActivitySelection 의 앱·카테고리 개수
    Function("selectionCounts") { (selection: String) -> [String: Int] in
      guard let s = decodeSelection(selection) else {
        return ["applications": 0, "categories": 0, "webDomains": 0]
      }
      return [
        "applications": s.applicationTokens.count,
        "categories": s.categoryTokens.count,
        "webDomains": s.webDomainTokens.count,
      ]
    }

    View(AppIconsView.self) {
      Prop("selection") { (view: AppIconsView, value: String?) in
        view.model.selection = value.flatMap(decodeSelection)
      }
      Prop("maxCount") { (view: AppIconsView, value: Int?) in
        view.model.maxCount = value ?? 6
      }
      Prop("iconSize") { (view: AppIconsView, value: Double?) in
        view.model.iconSize = CGFloat(value ?? 36)
      }
      Prop("spacing") { (view: AppIconsView, value: Double?) in
        view.model.spacing = CGFloat(value ?? 14)
      }
    }
  }
}

/// react-native-device-activity 와 같은 형식(JSONEncoder → base64). 깨진 값이면 nil (강제 언래핑 크래시 방지)
func decodeSelection(_ str: String) -> FamilyActivitySelection? {
  guard let data = Data(base64Encoded: str) else { return nil }
  return try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
}

final class AppIconsModel: ObservableObject {
  @Published var selection: FamilyActivitySelection?
  @Published var maxCount: Int = 6
  @Published var iconSize: CGFloat = 36
  @Published var spacing: CGFloat = 14
}

struct AppIconsRow: SwiftUI.View {
  @ObservedObject var model: AppIconsModel

  var body: some SwiftUI.View {
    let apps = Array(model.selection?.applicationTokens ?? []).prefix(model.maxCount)
    let remaining = max(model.maxCount - apps.count, 0)
    let cats = Array(model.selection?.categoryTokens ?? []).prefix(remaining)

    HStack(spacing: model.spacing) {
      ForEach(Array(apps), id: \.self) { token in
        Label(token)
          .labelStyle(.iconOnly)
          .scaleEffect(model.iconSize / 28)
          .frame(width: model.iconSize, height: model.iconSize)
      }
      ForEach(Array(cats), id: \.self) { token in
        Label(token)
          .labelStyle(.iconOnly)
          .scaleEffect(model.iconSize / 28)
          .frame(width: model.iconSize, height: model.iconSize)
      }
      Spacer(minLength: 0)
    }
  }
}

class AppIconsView: ExpoView {
  let model = AppIconsModel()
  private var host: UIHostingController<AppIconsRow>?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    let host = UIHostingController(rootView: AppIconsRow(model: model))
    host.view.backgroundColor = .clear
    addSubview(host.view)
    self.host = host
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    host?.view.frame = bounds
  }
}
