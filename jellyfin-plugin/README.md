# Jellyfin Interactive Video Plugin

A Jellyfin plugin that enables interactive video playback for choose-your-own-adventure content like Black Mirror: Bandersnatch.

## Features

- **Interactive Choice Points**: Pause video and present choices to users with countdown timers
- **Keyboard & Remote Control**: Navigate choices using arrow keys, Enter, and space bar
- **Persistent State**: Remembers user choices and viewing progress
- **Fullscreen Support**: Press 'F' to toggle fullscreen mode
- **Choice Analytics**: Records user choices for debugging and analytics
- **Web-based Player**: Works in any modern web browser
- **Jellyfin Integration**: Uses Jellyfin's streaming infrastructure

## Supported Content

Currently optimized for **Black Mirror: Bandersnatch** with support for these video files:

- `Black.Mirror.Bandersnatch.2018.720p.WEB-DL.x264.DUAL.mkv`
- `Black.Mirror.Bandersnatch.2018.MULTi.1080p.NF.WEB-DL.x264-NSP.mkv`
- `Black.Mirror.Bandersnatch.2018.MULTi.720p.NF.WEB-DL.x264-NSP.mkv`

**Note**: The video file must contain all possible scenes (duration: 5:12:14) and be the complete Bandersnatch release.

## Installation

### Method 1: Plugin Repository (Recommended)
1. Open Jellyfin Admin Dashboard
2. Go to **Plugins** → **Repositories**
3. Add the plugin repository URL
4. Install "Interactive Video Player" from the catalog

### Method 2: Manual Installation
1. Download the latest release from the releases page
2. Extract the plugin files to your Jellyfin plugins directory:
   - **Windows**: `%PROGRAMDATA%\Jellyfin\Server\plugins\`
   - **Linux**: `/var/lib/jellyfin/plugins/`
   - **Docker**: `<jellyfin_config>/plugins/`
3. Restart Jellyfin server
4. The plugin should appear in **Admin Dashboard** → **Plugins**

### Method 3: Build from Source
```bash
# Clone the repository
git clone https://github.com/jellyfin/jellyfin-plugin-interactivevideo.git
cd jellyfin-plugin-interactivevideo/jellyfin-plugin

# Build the plugin
dotnet build --configuration Release

# Copy to Jellyfin plugins directory
cp bin/Release/net6.0/Jellyfin.Plugin.InteractiveVideo.dll /var/lib/jellyfin/plugins/
```

## Configuration

1. Go to **Jellyfin Admin Dashboard** → **Plugins** → **Interactive Video Player**
2. Configure the following settings:

### Settings

- **Enable Interactive Video Player**: Toggle plugin on/off
- **Default Choice Timeout**: How long users have to make choices (5-30 seconds)
- **Show Debug Information**: Enable console logging for troubleshooting
- **Custom Metadata Path**: Path to custom interactive metadata files (optional)

## Usage

### Basic Usage

1. **Add Video**: Import your Bandersnatch video file to Jellyfin library
2. **Access Player**: Navigate to `/InteractiveVideo/Player/{ItemId}` in your browser
3. **Watch & Choose**: Use arrow keys or click to make choices during interactive moments

### Keyboard Controls

- **F**: Toggle fullscreen
- **Space**: Play/pause (when not in choice mode)
- **R**: Restart video
- **Arrow Keys**: Navigate between choices
- **Enter**: Select highlighted choice

### Getting the Item ID

To find the Item ID for a video:
1. Go to the video in Jellyfin web interface
2. Look at the URL: `/web/index.html#!/details?id={ItemId}`
3. Use that ID in the interactive player URL

### Example URLs

```
# Direct player access
http://jellyfin.local:8096/InteractiveVideo/Player/a1b2c3d4e5f6

# Metadata endpoint (for debugging)
http://jellyfin.local:8096/InteractiveVideo/Metadata/a1b2c3d4e5f6
```

## How It Works

### Architecture

1. **Server-side Plugin** (C#): Provides REST API endpoints for metadata and player page
2. **Interactive Metadata**: JSON files containing choice points, segments, and branching logic
3. **Client-side Player** (JavaScript): Handles video playback, choice detection, and user interaction
4. **Jellyfin Streaming**: Uses standard Jellyfin video streaming with seeking for branching

### Data Flow

1. User navigates to interactive player page
2. Plugin serves HTML/JavaScript player
3. Player loads interactive metadata from plugin API
4. Video streams through Jellyfin's standard video API
5. JavaScript monitors playback time and triggers choices
6. User selections are recorded and affect subsequent branching

### Choice Points

The plugin uses timestamp-based choice detection:

```json
{
  "cereal_choice": {
    "startTimeMs": 134800,
    "description": "Choose Cereal",
    "choices": ["Sugar Puffs", "Frosties"],
    "timeout": 10000,
    "defaultChoice": 0
  }
}
```

## Browser Compatibility

**Recommended**: Chrome/Chromium browsers for best performance

**Supported**:
- Chrome/Chromium 80+
- Firefox 75+
- Safari 13+
- Edge 80+

**Note**: Some smart TV browsers may have limited functionality.

## Troubleshooting

### Common Issues

**Video won't load**:
- Verify the video file is properly imported in Jellyfin
- Check that Direct Play is enabled for the video format
- Ensure the item ID is correct

**Choices not appearing**:
- Enable debug mode in plugin configuration
- Check browser console for error messages
- Verify the video matches supported Bandersnatch files

**Seeking/jumping issues**:
- Ensure video is playing in Direct Play mode (not transcoded)
- Check browser console for JavaScript errors
- Try refreshing the page

### Debug Mode

Enable debug mode in plugin settings to see:
- Choice point detection logs
- Segment transitions
- User interaction events
- Error messages

### Browser Console

Open browser developer tools (F12) to see debug information:

```javascript
// Check player state
window.debugPlayer.getState()

// Reset all choices and progress
window.debugPlayer.reset()

// Manually toggle fullscreen
window.debugPlayer.toggleFullscreen()
```

## Development

### Project Structure

```
jellyfin-plugin/
├── Api/                          # REST API controllers
│   └── InteractiveVideoController.cs
├── Configuration/                # Admin configuration page
│   └── configPage.html
├── Web/                         # Client-side assets
│   ├── player.html              # Main interactive player page
│   ├── interactive-player.js    # Core player logic
│   └── bandersnatch-metadata.json # Interactive metadata
├── Plugin.cs                   # Main plugin class
├── PluginConfiguration.cs      # Configuration model
└── Jellyfin.Plugin.InteractiveVideo.csproj
```

### Extending for Other Content

To add support for other interactive videos:

1. Create metadata JSON files following the established format
2. Update the API controller to serve different metadata based on content detection
3. Modify the choice text translations as needed

### API Endpoints

- `GET /InteractiveVideo/Player/{itemId}` - Interactive player page
- `GET /InteractiveVideo/Metadata/{itemId}` - Interactive metadata JSON
- `GET /InteractiveVideo/Assets/{filename}` - Static assets (JS/CSS)
- `POST /InteractiveVideo/Choice/{itemId}` - Record user choice

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Based on the original [BandersnatchInteractive](https://github.com/mehotkhan/BandersnatchInteractive) project
- Inspired by Netflix's interactive video technology
- Built for the Jellyfin media server ecosystem

## Support

- **Issues**: Report bugs or feature requests on GitHub
- **Documentation**: See the [wiki](../../wiki) for detailed guides
- **Community**: Join the Jellyfin Discord or forums

---

**Disclaimer**: This plugin is for educational and personal use only. Ensure you have proper rights to any interactive video content you use with this plugin. 