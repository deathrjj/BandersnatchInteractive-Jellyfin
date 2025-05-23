# Jellyfin Interactive Video Plugin - Summary

## What This Plugin Does

This plugin converts the standalone BandersnatchInteractive player into a Jellyfin plugin that enables interactive video playback for choose-your-own-adventure content. It specifically supports Black Mirror: Bandersnatch with its branching narrative structure.

## Key Features Implemented

1. **Jellyfin Integration**: Uses Jellyfin's streaming API for video delivery
2. **Interactive Choice System**: Pauses video at decision points and presents user choices
3. **Persistent State**: Tracks user choices and viewing progress using localStorage
4. **Remote-friendly Controls**: Keyboard navigation for TV remotes and smart TV browsers
5. **Admin Configuration**: Plugin settings accessible through Jellyfin's admin panel
6. **RESTful API**: Clean API endpoints for metadata and player delivery

## File Structure Created

```
jellyfin-plugin/
├── plugin.xml                           # Plugin manifest
├── Jellyfin.Plugin.InteractiveVideo.csproj  # C# project file
├── Plugin.cs                            # Main plugin class
├── PluginConfiguration.cs               # Configuration model
├── README.md                            # Comprehensive documentation
├── build.sh                             # Build script
├── Api/
│   └── InteractiveVideoController.cs    # REST API endpoints
├── Configuration/
│   └── configPage.html                  # Admin configuration UI
└── Web/
    ├── player.html                      # Interactive player page
    ├── interactive-player.js            # Core interactive logic
    └── bandersnatch-metadata.json       # Simplified metadata
```

## How It Differs from the Original

### Original BandersnatchInteractive
- Standalone HTML page requiring manual video file selection
- Drag-and-drop interface for local files
- Full 750KB bandersnatch.js with complete Netflix metadata
- Client-side only with no server integration

### Jellyfin Plugin Version
- Integrated into Jellyfin server architecture
- Uses Jellyfin's video streaming infrastructure
- RESTful API for metadata and player delivery
- Simplified metadata optimized for key choice points
- Server-side configuration and choice analytics
- Compatible with Jellyfin's authentication and user management

## Technical Implementation

### Server Side (C#)
- **Plugin.cs**: Main plugin entry point extending BasePlugin
- **InteractiveVideoController.cs**: API controller with endpoints:
  - `GET /InteractiveVideo/Player/{itemId}` - Player page
  - `GET /InteractiveVideo/Metadata/{itemId}` - Interactive metadata
  - `POST /InteractiveVideo/Choice/{itemId}` - Choice recording
- **PluginConfiguration.cs**: Settings management

### Client Side (JavaScript)
- **JellyfinInteractivePlayer**: Main player class managing:
  - Video streaming via Jellyfin APIs
  - Choice detection based on timestamps
  - User interaction handling
  - State persistence via localStorage
  - Keyboard/remote control support

### Integration Points
- Uses Jellyfin's video streaming: `/Videos/{itemId}/stream`
- Embedded as plugin resources for seamless delivery
- Leverages Jellyfin's authentication system
- Configurable via standard plugin configuration interface

## Usage Workflow

1. User installs plugin and adds Bandersnatch video to Jellyfin library
2. User navigates to `/InteractiveVideo/Player/{ItemId}`
3. Plugin serves HTML player page with embedded JavaScript
4. Player loads metadata and sets up video streaming URL
5. Video plays using Jellyfin's streaming with interactive overlay
6. At choice points, video pauses and presents options
7. User selections are recorded and playback continues

## Future Enhancement Possibilities

1. **Full Segment Mapping**: Implement complete branching logic from original
2. **Multiple Content Support**: Extend beyond Bandersnatch to other interactive content
3. **UI Integration**: Add "Play Interactive" buttons to Jellyfin's video detail pages
4. **Advanced Analytics**: Detailed choice tracking and viewing statistics
5. **Subtitle Support**: Multi-language subtitle integration
6. **Custom Themes**: Configurable UI themes matching Jellyfin's design

## Testing the Plugin

To test with the current Bandersnatch file (3.3GB, 720p):

1. Build the plugin: `cd jellyfin-plugin && ./build.sh`
2. Copy DLL to Jellyfin plugins directory
3. Restart Jellyfin server
4. Get the Bandersnatch video's Item ID from Jellyfin
5. Navigate to: `http://jellyfin-server:8096/InteractiveVideo/Player/{ItemId}`

## Development Notes

- Plugin targets .NET 6.0 and Jellyfin 10.8.0+
- Web assets are embedded as resources for distribution
- Simplified metadata focuses on key choice points for demo purposes
- Full metadata integration would require processing the original 750KB+ JSON files
- Currently implements basic choice detection; full segment jumping needs enhancement

This plugin successfully demonstrates the feasibility of interactive video in Jellyfin and provides a foundation for more comprehensive implementations. 