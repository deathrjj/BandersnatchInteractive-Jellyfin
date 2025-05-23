using System;
using System.Collections.Generic;
using System.Globalization;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Common.Plugins;
using MediaBrowser.Model.Plugins;
using MediaBrowser.Model.Serialization;

namespace Jellyfin.Plugin.InteractiveVideo
{
    /// <summary>
    /// The main plugin class for Interactive Video Player.
    /// </summary>
    public class InteractiveVideoPlugin : BasePlugin<PluginConfiguration>, IHasWebPages
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="InteractiveVideoPlugin"/> class.
        /// </summary>
        /// <param name="applicationPaths">Instance of the <see cref="IApplicationPaths"/> interface.</param>
        /// <param name="xmlSerializer">Instance of the <see cref="IXmlSerializer"/> interface.</param>
        public InteractiveVideoPlugin(IApplicationPaths applicationPaths, IXmlSerializer xmlSerializer)
            : base(applicationPaths, xmlSerializer)
        {
            Instance = this;
        }

        /// <inheritdoc />
        public override string Name => "Interactive Video Player";

        /// <inheritdoc />
        public override Guid Id => Guid.Parse("42d83eb8-b6b2-4b1b-b3d9-0c2f2b3b5a6c");

        /// <summary>
        /// Gets the current plugin instance.
        /// </summary>
        public static InteractiveVideoPlugin? Instance { get; private set; }

        /// <inheritdoc />
        public IEnumerable<PluginPageInfo> GetPages()
        {
            return new[]
            {
                new PluginPageInfo
                {
                    Name = this.Name,
                    EmbeddedResourcePath = string.Format(CultureInfo.InvariantCulture, "{0}.Configuration.configPage.html", GetType().Namespace)
                }
            };
        }
    }
} 