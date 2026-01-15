# MacPipe GUI
<p align="center">
  <strong>A modern GUI for Steam Content Deployment</strong>
</p>

<p align="center">
  Simplify your Steam game deployment process with an intuitive interface for managing SteamPipe builds and VDF configurations.
</p>

<p align="center">
  <b>Now available for macOS (Swift) and Windows/macOS/Linux (Electron)!</b>
</p>

---
<div align="center">
  <h3>Modern UI & More Controls</h3>
  <img src="https://raw.githubusercontent.com/sakne/MacPipeGUI/assets/screenshots/ImageSheet.png" alt="MacPipe GUI Screenshots" width="90%"/>
</div>

---

# 📦 Available Versions

| Version | Platform | Technology | Status |
|---------|----------|------------|--------|
| **MacPipeGUI** | macOS | Swift/SwiftUI | ✅ Stable |
| **MacPipeGUI Multi** | Windows, macOS, Linux | Electron/React | ✅ Stable |

---

# Features

- **Profile Management**: Create and manage multiple app deployment profiles
- **VDF Generation**: Automatically generate app build and depot VDF files
- **Steam Integration**: Seamless integration with SteamCMD and ContentBuilder
- **Secure Credentials**: OS keychain storage for Steam login credentials
- **Build Runner**: Execute builds directly from the GUI with real-time console output
- **Auto-Updates**: Automatic update checks and installation (Electron version)
- **Steam Guard Support**: Desktop notifications for mobile authenticator prompts
- **Modern UI**: Clean interface built with SwiftUI (macOS) or React (Cross-platform)

---

# Getting Started

## Prerequisites

Before using MacPipe GUI, you need:

1. **Steamworks SDK**: Download from [Steamworks Partner Site](https://partner.steamgames.com/)
2. **SteamCMD**: The Steam command-line client
3. **ContentBuilder**: Located in the Steamworks SDK (`sdk/tools/ContentBuilder`)

### For Swift Version (macOS only)
4. **Xcode 15.0+** (for compilation)
5. **macOS 13.0+** (Ventura or later)

### For Electron Version (Cross-platform)
4. **Node.js 18+**
5. **npm** or **pnpm**

---

# Installation

## Electron Version (Windows/macOS/Linux) - Recommended

### Option 1: Download Pre-built Binary
1. Download the latest release from the [Releases](../../releases) page
   - **Windows**: Download `.exe` installer
   - **macOS**: Download `.dmg` file
   - **Linux**: Download `.AppImage` file
2. Run the installer or application
3. The app will auto-update when new versions are available

### Option 2: Build from Source
```bash
cd "MacPipeGUI Electron"
npm install
npm run build
```

Built files will be in the `release/` folder.

### Development Mode
```bash
cd "MacPipeGUI Electron"
npm install
npm run dev
```

---

## Swift Version (macOS only)

### Option 1: Download Pre-built Binary
1. Download the latest release from the [Releases](../../releases) page
2. Open the DMG file and drag MacPipe GUI to your Applications folder
3. Launch the app

### Option 2: Build from Source
See the [Building Swift Version](#-building-swift-version) section below.

---

# How to Use

## 1. Configure Steam Settings

> [!NOTE]
> Ensure you have your Steamworks SDK and ContentBuilder set up before proceeding.

First, set up your Steam tools and credentials:

1. Open MacPipe GUI
2. Go to the **Steam** / **Settings** tab
3. Configure the following:
   - **Content Builder Path**: Browse to your Steamworks SDK ContentBuilder folder
     - Example: `C:\SteamSDK\tools\ContentBuilder` or `/Users/yourname/steamworks_sdk/tools/ContentBuilder`
   - **Steam Username**: Your Steam account username
   - **Steam Password**: Your Steam account password (stored securely in OS keychain)
   - Toggle **Remember Password** if you want to save credentials

## 2. Create a Deployment Profile

Create a profile for your game or app:

1. Go to the **Profiles** tab
2. Click the **+** button to create a new profile
3. Fill in the required information:
   - **App Name**: Your game/app name
   - **App ID**: Your Steam App ID (from Steamworks)
   - **Description**: Build description
   
   **For each depot, add:**
   - **Depot Name**: Name of the depot
   - **Depot ID**: Your depot ID(s)
   - **Content Root**: Path to your build files

## 3. Run a Build

Deploy your content to Steam:

1. Select a profile from the list
2. Go to the **Build** tab
3. Review the build configuration
4. Click **Run** to start the build process
5. Monitor the build progress in the console output
6. Approve Steam Guard prompts on your mobile device if required

## 4. Managing Profiles

- **Edit**: Select a profile and click the edit icon to modify details
- **Delete**: Select a profile and click the trash icon to remove it
- **Search**: Use the search bar to filter profiles by name or App ID

---

# 🛠 Building Swift Version

## Requirements

- macOS 13.0 (Ventura) or later
- Xcode 15.0 or later
- Swift 5.9 or later

## Build Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/sakne/MacPipeGUI.git
   cd MacPipeGUI
   ```
   
2. **Open the project in Xcode**
   ```bash
   open MacPipeGUI.xcodeproj
   ```

3. **Configure signing** (if needed)
   - Select the project in the navigator
   - Go to **Signing & Capabilities**
   - Select your development team or use "Sign to Run Locally"

4. **Build the project**
   - Select **Product > Build** (⌘B)
   - Or select **Product > Run** (⌘R) to build and launch

5. **Create a release build** (optional)
   - Select **Product > Archive**
   - In the Organizer window, click **Distribute App**
   - Choose **Copy App** for a standalone .app file
   - Or choose **Developer ID** to notarize for distribution

## Build Configuration

The project uses the following configuration:
- **Minimum Deployment Target**: macOS 13.0
- **Architecture**: Universal (Apple Silicon + Intel)
- **Framework**: SwiftUI
- **Build System**: Xcode New Build System

---

# 🛠 Building Electron Version

## Requirements

- Node.js 18 or later
- npm or pnpm

## Build Steps

1. **Navigate to Electron folder**
   ```bash
   cd "MacPipeGUI Electron"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build for your platform**
   ```bash
   # Windows
   npm run build:win
   
   # macOS
   npm run build:mac
   
   # Linux
   npm run build:linux
   
   # All platforms
   npm run build
   ```

4. Built files will be in the `release/` folder

---

# Configuration Files

## Swift Version
- **Profiles**: `~/Library/Application Support/com.saknedev.MacPipeGUI/profiles.json`
- **Settings**: `~/Library/Application Support/com.saknedev.MacPipeGUI/config.json`
- **Credentials**: macOS Keychain (if "Remember Password" is enabled)

## Electron Version
- **Settings & Profiles**: Stored in OS-specific app data folder
  - Windows: `%APPDATA%/macpipegui-multi/`
  - macOS: `~/Library/Application Support/macpipegui-multi/`
  - Linux: `~/.config/macpipegui-multi/`
- **Credentials**: OS Keychain (Windows Credential Manager, macOS Keychain, Linux Secret Service)

---

# Troubleshooting

## Build Fails with "steamcmd not found"
- Ensure the ContentBuilder path is correctly set in Settings
- Verify that `steamcmd.exe` (Windows) or `steamcmd.sh` (macOS/Linux) exists in the builder directory

## Authentication Errors
- Check that your Steam username and password are correct
- If using Steam Guard, approve the login on your mobile device
- Check for desktop notifications prompting for authentication
- Try disabling "Remember Password" and entering credentials manually

## VDF Generation Issues
- Ensure all required fields in the profile are filled out
- Check that Content Root path exists and contains your build files
- Verify Depot ID matches your Steamworks configuration

## Console Output Not Updating (Electron)
- The app reads from SteamCMD log files for real-time output
- Console updates every 200ms while a build is running

## App Won't Launch (Swift)
- Check that you're running macOS 13.0 or later
- If you built from source, ensure proper code signing
- Try right-clicking and selecting "Open" if Gatekeeper blocks the app

---

# Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development Guidelines

- Follow Swift/TypeScript naming conventions
- Write descriptive commit messages
- Test your changes thoroughly
- Update documentation for new features

---
# Support

If you find this tool helpful, please consider:
- Giving it a star ⭐ on GitHub
- Checking out my game [Coffie Simulator](https://store.steampowered.com/app/3453530/Coffie_Simulator) on Steam
- Sharing it with other developers

---

# License

This project is licensed under the **GPL-3.0** - see the [LICENSE](LICENSE) file for details.

---


<p align="center">Made with ❤️ by SakneDev</p>
