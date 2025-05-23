# BandersnatchInteractive - Jellyfin Plugin

An interactive video player plugin for Jellyfin that enables choice-based navigation and branching storylines for Black Mirror: Bandersnatch.

> **Forked from**: [mehotkhan/BandersnatchInteractive](https://github.com/mehotkhan/BandersnatchInteractive)  
> This repository extends the original standalone HTML5 player to work as a native Jellyfin plugin.

## ✨ Features

- �� **Full Interactive Playbook**: Complete choice-based navigation with branching storylines
- ⌨️ **Keyboard Controls**: All original controls plus new speed control features
- 📺 **Jellyfin Integration**: Native plugin that streams directly from your Jellyfin server
- 🎯 **Choice Management**: Visual choice overlays with countdown timers
- 📝 **Subtitle Support**: Integrated English subtitles with toggle functionality
- 🎮 **Speed Control**: Stepped playbook speed (0.25x to 4x) with instant reset
- 💾 **State Persistence**: Remembers your choices and progress across sessions
- 🏪 **Plugin Repository**: Easy installation via Jellyfin's plugin repository system

## 🎮 Keyboard Controls

| Key | Function |
|-----|----------|
| `F` | Toggle fullscreen |
| `R` | Restart video |
| `Space` | Play/pause (when not choosing) |
| `←` `→` | Navigate choices OR jump between segments |
| `↑` `↓` | Speed up/slow down playbook |
| `0` | Reset speed to 1.0x |
| `Enter` | Select highlighted choice |
| `S` | Toggle subtitles |

## 🛠️ Requirements

- **Jellyfin Server**: Version 10.8.0 or later
- **.NET SDK**: Version 6.0 or later (for building from source)
- **Video File**: Black Mirror Bandersnatch (5:12:14 duration)
  - Tested with: `Black.Mirror.Bandersnatch.2018.720p.WEB-DL.x264.DUAL.mkv`
- **Browser**: Chrome/Chromium (recommended)

## 🚀 Installation

### Option 1: Plugin Repository (Recommended)

1. **Add Plugin Repository**:
   - Open Jellyfin Admin Dashboard
   - Navigate to **Plugins** → **Repositories** 
   - Click the **+** button to add a repository
   - **Repository Name**: `BandersnatchInteractive-Jellyfin`
   - **Repository URL**: `https://raw.githubusercontent.com/deathrjj/BandersnatchInteractive-Jellyfin/master/manifest.json`
   - Click **Save**

2. **Install Plugin**:
   - Go to **Plugins** → **Catalog**
   - Find **Interactive Video Player** 
   - Click **Install**
   - Restart Jellyfin server when prompted

3. **Usage**:
   - Navigate to: `https://your-jellyfin-server/InteractiveVideo/Player/{ItemId}`
   - Replace `{ItemId}` with your Bandersnatch video's Item ID

### Option 2: Download Release

1. Download the latest release from [Releases](https://github.com/deathrjj/BandersnatchInteractive-Jellyfin/releases)
2. Extract the plugin files
3. Copy to your Jellyfin plugins directory:
   - **Linux**: `/var/lib/jellyfin/plugins/InteractiveVideo/`
   - **macOS**: `~/.local/share/jellyfin/plugins/InteractiveVideo/`
   - **Windows**: `%PROGRAMDATA%\Jellyfin\Server\plugins\InteractiveVideo\`
4. Restart Jellyfin server
5. Navigate to: `https://your-jellyfin-server/InteractiveVideo/Player/{ItemId}`

### Option 3: Build from Source

1. **Clone the repository**:
   ```bash
   git clone https://github.com/deathrjj/BandersnatchInteractive-Jellyfin.git
   cd BandersnatchInteractive-Jellyfin
   ```

2. **Install .NET SDK** (if not already installed):
   ```bash
   # macOS (via Homebrew)
   brew install dotnet

   # Linux (Ubuntu/Debian)
   sudo apt-get update
   sudo apt-get install -y dotnet-sdk-6.0

   # Windows - Download from https://dotnet.microsoft.com/download
   ```

3. **Build the plugin**:
   ```bash
   cd jellyfin-plugin
   chmod +x build.sh
   ./build.sh
   ```

4. **Install the built plugin**:
   ```bash
   # The build script creates a 'plugin' folder in the root directory
   # Copy its contents to your Jellyfin plugins directory
   cp -r ../plugin/* /var/lib/jellyfin/plugins/InteractiveVideo/
   ```

5. **Restart Jellyfin server**

## 📖 Usage

### Finding Your Item ID

1. Open Jellyfin web interface
2. Navigate to your Bandersnatch video
3. Look at the URL: `/web/index.html#!/details?id={ItemId}`
4. Copy the Item ID from the URL

### Accessing the Interactive Player

Navigate to: `https://your-jellyfin-server/InteractiveVideo/Player/{ItemId}`

Replace `{ItemId}` with your Bandersnatch video's Item ID.

### First Time Setup

1. The video will load automatically from Jellyfin
2. Click the play button when prompted (browser autoplay policy)
3. Use keyboard controls to navigate
4. Press `S` to toggle English subtitles
5. Enjoy the interactive experience!

## 🎯 How It Works

The plugin integrates with Jellyfin's streaming infrastructure while adding interactive capabilities:

- **Video Streaming**: Uses Jellyfin's native video streaming (`/Videos/{itemId}/stream`)
- **Interactive Metadata**: Embedded JSON defines choice points and branching logic
- **Choice Detection**: Monitors video timeline for predefined decision moments
- **Segment Jumping**: Seamlessly transitions between different story paths
- **State Management**: Tracks user choices and viewing progress

## 🏗️ Project Structure

```
BandersnatchInteractive-Jellyfin/
├── .github/workflows/           # GitHub Actions for automated releases
├── jellyfin-plugin/             # Jellyfin plugin source code
│   ├── Api/                     # REST API controllers
│   ├── Web/                     # Frontend assets (HTML, JS, CSS)
│   ├── Configuration/           # Plugin configuration
│   ├── build.sh                 # Build script
│   └── *.cs                     # C# source files
├── plugin/                      # Built plugin output (created by build)
├── assets/                      # Original BandersnatchInteractive assets
├── subtitle/                    # Subtitle files (multiple languages)
├── manifest.json                # Plugin repository manifest
├── build.yaml                   # Plugin metadata
└── README.md                    # This file
```

## 🔧 Development

### Building

```bash
cd jellyfin-plugin
./build.sh
```

### Debugging

The plugin includes extensive console logging. Open browser developer tools to see:
- Choice timing and selection
- Keyboard event handling
- Video segment transitions
- Subtitle loading status

### API Endpoints

- `GET /InteractiveVideo/Player/{itemId}` - Interactive player page
- `GET /InteractiveVideo/Metadata/{itemId}` - Choice/segment metadata
- `GET /InteractiveVideo/Subtitles/{language}` - Subtitle files
- `POST /InteractiveVideo/Choice/{itemId}` - Record user choices

## 📝 Version History

### v1.1.0 (Latest)
- **Enhanced Repository Structure**: Proper `manifest.json` support for Jellyfin plugin repositories
- **Automated Releases**: GitHub Actions workflow for automatic plugin building and manifest updates
- **Improved Installation**: Can now be installed via Jellyfin's native plugin repository system
- **Repository URL**: `https://raw.githubusercontent.com/deathrjj/BandersnatchInteractive-Jellyfin/master/manifest.json`

### v1.0.0
- **Initial Release**: Full interactive video support with choice-based navigation
- **Complete Keyboard Controls**: F/R/Space/Arrows/0/Enter/S functionality
- **Speed Management**: 0.25x to 4x playbook with instant reset
- **Embedded Subtitles**: English subtitle support with toggle
- **State Persistence**: localStorage-based choice tracking
- **Plugin Size**: 315KB with all dependencies

## 📝 Differences from Original

This Jellyfin plugin extends the original BandersnatchInteractive project with:

- **Jellyfin Integration**: Native plugin architecture vs standalone HTML page
- **Server Streaming**: Video served by Jellyfin vs local file drag-and-drop
- **Enhanced Controls**: Additional keyboard shortcuts and speed control
- **Subtitle Integration**: Embedded subtitles vs external VTT files
- **Plugin Management**: Installable via Jellyfin plugin repositories
- **Automated Distribution**: GitHub Actions for releases and manifest updates

## 🙏 Credits

- **Original Project**: [mehotkhan/BandersnatchInteractive](https://github.com/mehotkhan/BandersnatchInteractive)
- **Based on**: [joric/bandersnatch](https://github.com/joric/bandersnatch)
- **Enhanced by**: [CyberShadow](https://github.com/CyberShadow)
- **Jellyfin Integration**: [deathrjj](https://github.com/deathrjj)

## ⚖️ License

This project is released into the public domain under the Unlicense, same as the original BandersnatchInteractive project.

## 🐛 Issues & Support

If you encounter issues:

1. Check that your Bandersnatch video file has the correct duration (5:12:14)
2. Verify the plugin is properly installed and Jellyfin has been restarted
3. Check browser console for error messages
4. Open an issue on [GitHub Issues](https://github.com/deathrjj/BandersnatchInteractive-Jellyfin/issues)

## 🚀 Future Enhancements

- Support for additional interactive content
- Multiple language subtitle support
- Plugin configuration UI
- Choice analytics and statistics
- Mobile device optimization
- Community-driven interactive content library
