using MediaBrowser.Model.Plugins;

namespace Jellyfin.Plugin.InteractiveVideo
{
    /// <summary>
    /// Plugin configuration class for Interactive Video Player.
    /// </summary>
    public class PluginConfiguration : BasePluginConfiguration
    {
        /// <summary>
        /// Gets or sets a value indicating whether the plugin is enabled.
        /// </summary>
        public bool IsEnabled { get; set; } = true;

        /// <summary>
        /// Gets or sets the default choice timeout in seconds.
        /// </summary>
        public int DefaultChoiceTimeoutSeconds { get; set; } = 10;

        /// <summary>
        /// Gets or sets a value indicating whether to show debug information.
        /// </summary>
        public bool ShowDebugInfo { get; set; } = false;

        /// <summary>
        /// Gets or sets the path to custom interactive metadata files.
        /// </summary>
        public string MetadataPath { get; set; } = string.Empty;
    }
} 