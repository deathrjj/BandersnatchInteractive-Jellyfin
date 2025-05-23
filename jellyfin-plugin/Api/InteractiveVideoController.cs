using System;
using System.ComponentModel.DataAnnotations;
using System.IO;
using System.Net.Mime;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.InteractiveVideo.Api
{
    /// <summary>
    /// Interactive Video API controller.
    /// </summary>
    [ApiController]
    [Route("InteractiveVideo")]
    public class InteractiveVideoController : ControllerBase
    {
        private readonly ILogger<InteractiveVideoController> _logger;

        /// <summary>
        /// Initializes a new instance of the <see cref="InteractiveVideoController"/> class.
        /// </summary>
        /// <param name="logger">Instance of the <see cref="ILogger{InteractiveVideoController}"/> interface.</param>
        public InteractiveVideoController(ILogger<InteractiveVideoController> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Gets the interactive video player page.
        /// </summary>
        /// <param name="itemId">The media item ID.</param>
        /// <returns>The interactive player HTML page.</returns>
        [HttpGet("Player/{itemId}")]
        [AllowAnonymous]
        [Produces(MediaTypeNames.Text.Html)]
        public async Task<ActionResult> GetPlayerPage([FromRoute, Required] string itemId)
        {
            try
            {
                var assembly = Assembly.GetExecutingAssembly();
                var resourceName = "Jellyfin.Plugin.InteractiveVideo.Web.player.html";
                
                await using var stream = assembly.GetManifestResourceStream(resourceName);
                if (stream == null)
                {
                    return NotFound("Player page not found");
                }

                using var reader = new StreamReader(stream);
                var html = await reader.ReadToEndAsync();
                
                // Replace placeholder with actual item ID
                html = html.Replace("{{ITEM_ID}}", itemId);
                
                return Content(html, "text/html");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error serving interactive player page for item {ItemId}", itemId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Gets the interactive metadata for a specific media item.
        /// </summary>
        /// <param name="itemId">The media item ID.</param>
        /// <returns>The interactive metadata JSON.</returns>
        [HttpGet("Metadata/{itemId}")]
        [AllowAnonymous]
        [Produces(MediaTypeNames.Application.Json)]
        public ActionResult GetInteractiveMetadata([FromRoute, Required] string itemId)
        {
            try
            {
                var assembly = Assembly.GetExecutingAssembly();
                var resourceName = "Jellyfin.Plugin.InteractiveVideo.Web.bandersnatch-metadata.json";
                
                using var stream = assembly.GetManifestResourceStream(resourceName);
                if (stream == null)
                {
                    return NotFound("Metadata not found");
                }

                using var reader = new StreamReader(stream);
                var json = reader.ReadToEnd();
                
                return Content(json, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error serving interactive metadata for item {ItemId}", itemId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Gets static assets for the interactive player.
        /// </summary>
        /// <param name="filename">The asset filename.</param>
        /// <returns>The requested asset.</returns>
        [HttpGet("Assets/{filename}")]
        [AllowAnonymous]
        public ActionResult GetAsset([FromRoute, Required] string filename)
        {
            try
            {
                var assembly = Assembly.GetExecutingAssembly();
                var resourceName = $"Jellyfin.Plugin.InteractiveVideo.Web.{filename}";
                
                using var stream = assembly.GetManifestResourceStream(resourceName);
                if (stream == null)
                {
                    return NotFound("Asset not found");
                }

                var contentType = filename.EndsWith(".js") ? "application/javascript" :
                                filename.EndsWith(".css") ? "text/css" :
                                filename.EndsWith(".vtt") ? "text/vtt" :
                                "application/octet-stream";

                using var reader = new StreamReader(stream);
                var content = reader.ReadToEnd();
                
                return Content(content, contentType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error serving asset {Filename}", filename);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Gets subtitle files for the interactive player.
        /// </summary>
        /// <param name="language">The subtitle language.</param>
        /// <returns>The requested subtitle file.</returns>
        [HttpGet("Subtitles/{language}")]
        [AllowAnonymous]
        [Produces("text/vtt")]
        public ActionResult GetSubtitle([FromRoute, Required] string language)
        {
            try
            {
                var assembly = Assembly.GetExecutingAssembly();
                string resourceName;
                
                // Map language codes to subtitle files
                switch (language.ToLowerInvariant())
                {
                    case "en":
                    case "english":
                        resourceName = "Jellyfin.Plugin.InteractiveVideo.Web.english-subtitles.vtt";
                        break;
                    default:
                        return NotFound($"Subtitle language '{language}' not available");
                }
                
                using var stream = assembly.GetManifestResourceStream(resourceName);
                if (stream == null)
                {
                    return NotFound("Subtitle file not found");
                }

                using var reader = new StreamReader(stream);
                var content = reader.ReadToEnd();
                
                Response.Headers.Add("Content-Type", "text/vtt; charset=utf-8");
                return Content(content, "text/vtt");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error serving subtitle {Language}", language);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Records user choice for analytics or debugging.
        /// </summary>
        /// <param name="itemId">The media item ID.</param>
        /// <param name="choiceData">The choice data.</param>
        /// <returns>Success response.</returns>
        [HttpPost("Choice/{itemId}")]
        [AllowAnonymous]
        [Produces(MediaTypeNames.Application.Json)]
        public ActionResult RecordChoice([FromRoute, Required] string itemId, [FromBody] object choiceData)
        {
            try
            {
                _logger.LogInformation("Choice recorded for item {ItemId}: {ChoiceData}", itemId, choiceData);
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recording choice for item {ItemId}", itemId);
                return StatusCode(500, "Internal server error");
            }
        }
    }
} 