#!/bin/bash

# Jellyfin Interactive Video Plugin Build Script

set -e

echo "Building Jellyfin Interactive Video Plugin..."

# Check if dotnet is installed
if ! command -v dotnet &> /dev/null; then
    echo "Error: .NET SDK is not installed"
    echo "Please install .NET 6.0 SDK or later"
    exit 1
fi

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf bin obj

# Create plugin output directory in root
PLUGIN_DIR="../plugin"
echo "Creating plugin output directory: $PLUGIN_DIR"
mkdir -p "$PLUGIN_DIR"

# Restore NuGet packages
echo "Restoring NuGet packages..."
dotnet restore

# Build the plugin
echo "Building plugin..."
dotnet build --configuration Release --no-restore

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    
    # Copy plugin files to output directory
    echo "Copying plugin files to $PLUGIN_DIR..."
    cp bin/Release/net6.0/Jellyfin.Plugin.InteractiveVideo.dll "$PLUGIN_DIR/"
    cp bin/Release/net6.0/Jellyfin.Plugin.InteractiveVideo.pdb "$PLUGIN_DIR/"
    
    # Create meta.json for Jellyfin plugin repository format
    cat > "$PLUGIN_DIR/meta.json" << EOF
{
  "guid": "42d83eb8-b6b2-4b1b-b3d9-0c2f2b3b5a6c",
  "name": "Interactive Video Player",
  "description": "Interactive video player for Black Mirror: Bandersnatch with choice-based navigation and branching storylines",
  "overview": "Enables interactive video playback with user choices, keyboard shortcuts, and subtitle support. Based on the original BandersnatchInteractive project.",
  "owner": "deathrjj",
  "category": "General",
  "tags": [
    "interactive",
    "video",
    "bandersnatch",
    "choices",
    "player"
  ],
  "versions": [
    {
      "version": "1.0.0.0",
      "changelog": "Initial release with full interactive video support",
      "targetAbi": "10.8.0.0",
      "sourceUrl": "https://github.com/deathrjj/BandersnatchInteractive-Jellyfin/releases/download/v1.0.0/plugin.zip",
      "checksum": "",
      "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)"
    }
  ]
}
EOF
    
    echo ""
    echo "📦 Plugin files created in: $PLUGIN_DIR"
    echo ""
    echo "Plugin contents:"
    ls -la "$PLUGIN_DIR"
    echo ""
    echo "Plugin DLL size: $(ls -lh "$PLUGIN_DIR/Jellyfin.Plugin.InteractiveVideo.dll" | awk '{print $5}')"
    echo ""
    echo "🚀 Installation Instructions:"
    echo "1. Copy the entire 'plugin' folder contents to your Jellyfin plugins directory:"
    echo "   - Linux: /var/lib/jellyfin/plugins/InteractiveVideo/"
    echo "   - macOS: ~/.local/share/jellyfin/plugins/InteractiveVideo/"
    echo "   - Windows: %PROGRAMDATA%\\Jellyfin\\Server\\plugins\\InteractiveVideo\\"
    echo "2. Restart Jellyfin server"
    echo "3. Navigate to: https://your-jellyfin-server/InteractiveVideo/Player/{ItemId}"
    echo ""
    echo "For ItemId, check your Bandersnatch video URL in Jellyfin web interface."
else
    echo "❌ Build failed!"
    exit 1
fi 