using GigRaptorService.Attributes;
using GigRaptorService.Models;
using GigRaptorService.Services;
using Microsoft.AspNetCore.Mvc;

namespace GigRaptorService.Controllers;

[Route("[controller]")]
public class PlacesController : ControllerBase
{
    private readonly IGooglePlacesService _placesService;
    private readonly ILogger<PlacesController> _logger;

    public PlacesController(IGooglePlacesService placesService, ILogger<PlacesController> logger)
    {
        _placesService = placesService;
        _logger = logger;
    }

    [HttpPost("autocomplete")]
    [RateLimitFilter(10, 60, ApiType.GooglePlaces)] // 10 requests per minute per user for Google Places API
    public async Task<IActionResult> GetAutocomplete([FromBody] PlacesAutocompleteRequest request)
    {
        try
        {
            _logger.LogInformation("Received autocomplete request: Query='{Query}', SearchType='{SearchType}', Country='{Country}', UserId='{UserId}'", 
                request?.Query, request?.SearchType, request?.Country, request?.UserId);

            if (string.IsNullOrWhiteSpace(request?.Query))
            {
                _logger.LogWarning("Autocomplete request rejected: Query parameter is required");
                return BadRequest("Query parameter is required");
            }

            // Get userId from HttpContext.Items (set by RateLimitFilterAttribute)
            var userId = HttpContext.Items["AuthenticatedUserId"]?.ToString() ?? request.UserId;

            if (string.IsNullOrWhiteSpace(userId))
            {
                _logger.LogWarning("Autocomplete request rejected: User identification is required");
                return BadRequest("User identification is required");
            }

            _logger.LogInformation("Processing autocomplete request for user {UserId} with query '{Query}', searchType '{SearchType}', country '{Country}'", 
                userId, request.Query, request.SearchType ?? "default", request.Country ?? "US");

            var results = await _placesService.GetAutocompleteAsync(
                request.Query, 
                userId,
                request.SearchType, 
                request.Country,
                request.UserLatitude,
                request.UserLongitude);

            _logger.LogInformation("Autocomplete request completed for user {UserId}. Returned {ResultCount} results", 
                userId, results?.Count ?? 0);

            return Ok(results);
        }
        catch (QuotaExceededException ex)
        {
            var userId = HttpContext.Items["AuthenticatedUserId"]?.ToString() ?? request.UserId;
            _logger.LogWarning("Quota exceeded for user {UserId}: {Message}", userId, ex.Message);
            return StatusCode(429, new { error = "API quota exceeded", message = ex.Message });
        }
        catch (Exception ex)
        {
            var userId = HttpContext.Items["AuthenticatedUserId"]?.ToString() ?? request.UserId;
            _logger.LogError(ex, "Error processing autocomplete request for user {UserId}", userId);
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    [HttpPost("details")]
    [RateLimitFilter(20, 60, ApiType.GooglePlaces)] // 20 requests per minute per user for Google Places API
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

            _logger.LogInformation("Processing place details request for user {UserId} with placeId '{PlaceId}'", 
                userId, request.PlaceId);

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
            return StatusCode(429, new { error = "API quota exceeded", message = ex.Message });
        }
        catch (Exception ex)
        {
            var userId = HttpContext.Items["AuthenticatedUserId"]?.ToString() ?? request.UserId;
            _logger.LogError(ex, "Error processing place details request for user {UserId}", userId);
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    [HttpGet("usage/{userId}")]
    [RateLimitFilter(5, 60, ApiType.GooglePlaces)] // 5 requests per minute per user for Google Places API
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
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }
}
