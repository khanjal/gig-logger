using GigRaptorService.Attributes;
using GigRaptorService.Helpers;
using GigRaptorService.Models;
using GigRaptorService.Services;
using Microsoft.AspNetCore.Mvc;

namespace GigRaptorService.Controllers;

[Route("[controller]")]
public class PlacesController : ControllerBase
{
    private readonly IGooglePlacesService _placesService;
    private readonly ILogger<PlacesController> _logger;
    private readonly IMetricsService _metricsService;

    public PlacesController(IGooglePlacesService placesService, ILogger<PlacesController> logger, IMetricsService metricsService)
    {
        _placesService = placesService;
        _logger = logger;
        _metricsService = metricsService;
    }

    [HttpPost("autocomplete")]
    [RateLimitFilter(10, 60, ApiType.GooglePlaces)] // 10 requests per minute per user for Google Places API
    [TrackMetrics("places-autocomplete")]
    public async Task<IActionResult> GetAutocomplete([FromBody] PlacesAutocompleteRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request?.Query))
            {
                _logger.LogWarning("Autocomplete request rejected: Query parameter is required");
                return BadRequest("Query parameter is required");
            }

            // Track query length immediately when we have a valid query
            await _metricsService.TrackCustomMetricAsync("Places.Autocomplete.QueryLength", request.Query.Length);

            // Get userId from HttpContext.Items (set by RateLimitFilterAttribute)
            var userId = HttpContext.Items["AuthenticatedUserId"]?.ToString() ?? request.UserId;

            if (string.IsNullOrWhiteSpace(userId))
            {
                _logger.LogWarning("Autocomplete request rejected: User identification is required");
                return BadRequest("User identification is required");
            }

            var results = await _placesService.GetAutocompleteAsync(
                request.Query, 
                userId,
                request.SearchType, 
                request.Country,
                request.UserLatitude,
                request.UserLongitude);

            _logger.LogInformation("📍 Places search completed, query: '{Query}', results: {ResultCount}", request.Query, results.Count);
            
            return Ok(results);
        }
        catch (QuotaExceededException ex)
        {
            var userId = HttpContext.Items["AuthenticatedUserId"]?.ToString() ?? request?.UserId;
            _logger.LogWarning("Quota exceeded for user {UserId}: {Message}", userId, ex.Message);
            
            await _metricsService.TrackErrorAsync("QuotaExceeded", "places-autocomplete");
            
            return StatusCode(429, new { error = "API quota exceeded", message = ex.Message });
        }
        catch (Exception ex)
        {
            var userId = HttpContext.Items["AuthenticatedUserId"]?.ToString() ?? request?.UserId;
            _logger.LogError(ex, "Error processing autocomplete request for user {UserId}", userId);
            
            await _metricsService.TrackErrorAsync("GeneralError", "places-autocomplete");
            
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    [HttpPost("details")]
    [RateLimitFilter(20, 60, ApiType.GooglePlaces)] // 20 requests per minute per user for Google Places API
    [TrackMetrics("places-details")]
    public async Task<IActionResult> GetPlaceDetails([FromBody] PlaceDetailsRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.PlaceId))
            {
                return BadRequest("PlaceId parameter is required");
            }

            // Get userId from HttpContext.Items (set by RateLimitFilterAttribute)
            var userId = HttpContext.Items["AuthenticatedUserId"]?.ToString() ?? request.UserId;

            if (string.IsNullOrWhiteSpace(userId))
            {
                return BadRequest("User identification is required");
            }

            var result = await _placesService.GetPlaceDetailsAsync(request.PlaceId, userId);

            if (result == null)
            {
                return NotFound("Place not found");
            }

            return Ok(result);
        }
        catch (QuotaExceededException ex)
        {
            var userId = HttpContext.Items["AuthenticatedUserId"]?.ToString() ?? request.UserId;
            _logger.LogWarning("Quota exceeded for user {UserId}: {Message}", userId, ex.Message);
            
            await _metricsService.TrackErrorAsync("QuotaExceeded", "places-details");
            
            return StatusCode(429, new { error = "API quota exceeded", message = ex.Message });
        }
        catch (Exception ex)
        {
            var userId = HttpContext.Items["AuthenticatedUserId"]?.ToString() ?? request.UserId;
            _logger.LogError(ex, "Error processing place details request for user {UserId}", userId);
            
            await _metricsService.TrackErrorAsync("GeneralError", "places-details");
            
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    [HttpGet("usage/{userId}")]
    [RateLimitFilter(5, 60, ApiType.GooglePlaces)] // 5 requests per minute per user for Google Places API
    [TrackMetrics("places-usage")]
    public async Task<IActionResult> GetUsage(string userId)
    {
        try
        {
            // Get authenticated userId from HttpContext.Items (set by RateLimitFilterAttribute)
            var authenticatedUserId = HttpContext.Items["AuthenticatedUserId"]?.ToString();

            // Use the authenticated userId if available, otherwise use the path parameter
            var effectiveUserId = !string.IsNullOrWhiteSpace(authenticatedUserId) ? authenticatedUserId : userId;

            if (string.IsNullOrWhiteSpace(effectiveUserId))
            {
                return BadRequest("User identification is required");
            }

            // This would typically fetch from your user management system
            // For now, return basic quota information
            var usage = new UserApiUsage
            {
                UserId = effectiveUserId,
                MonthlyQuota = 1000, // Free tier default
                CurrentUsage = 0, // Would be fetched from tracking system
                Tier = "Free",
                LastRequestTime = DateTime.UtcNow
            };

            return Ok(usage);
        }
        catch (Exception ex)
        {
            var effectiveUserId = HttpContext.Items["AuthenticatedUserId"]?.ToString() ?? userId;
            _logger.LogError(ex, "Error getting usage for user {UserId}", effectiveUserId);
            
            await _metricsService.TrackErrorAsync("GeneralError", "places-usage");
            
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }
}
