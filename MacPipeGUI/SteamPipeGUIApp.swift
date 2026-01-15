import SwiftUI
import Sparkle

// Sparkle Updater Controller
final class UpdaterController: ObservableObject {
    let updaterController: SPUStandardUpdaterController
    
    init() {
        // Create the updater controller
        updaterController = SPUStandardUpdaterController(
            startingUpdater: true,
            updaterDelegate: nil,
            userDriverDelegate: nil
        )
    }
    
    func checkForUpdates() {
        updaterController.updater.checkForUpdates()
    }
}

@main
struct SteamPipeBuilderApp: App {
    @StateObject private var appState = AppState()
    @StateObject private var updaterController = UpdaterController()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .environmentObject(updaterController)
                .onReceive(NotificationCenter.default.publisher(for: NSApplication.willTerminateNotification)) { _ in
                    appState.saveAll()
                }
        }
        .commands {
            CommandGroup(after: .appInfo) {
                CheckForUpdatesView(updater: updaterController.updaterController.updater)
            }
        }
    }
}

// SwiftUI View for Check for Updates menu item
struct CheckForUpdatesView: View {
    @ObservedObject private var checkForUpdatesViewModel: CheckForUpdatesViewModel
    private let updater: SPUUpdater
    
    init(updater: SPUUpdater) {
        self.updater = updater
        self.checkForUpdatesViewModel = CheckForUpdatesViewModel(updater: updater)
    }
    
    var body: some View {
        Button("Check for Updates…", action: updater.checkForUpdates)
            .disabled(!checkForUpdatesViewModel.canCheckForUpdates)
    }
}

// ViewModel for tracking update availability
final class CheckForUpdatesViewModel: ObservableObject {
    @Published var canCheckForUpdates = false
    
    init(updater: SPUUpdater) {
        updater.publisher(for: \.canCheckForUpdates)
            .assign(to: &$canCheckForUpdates)
    }
}
