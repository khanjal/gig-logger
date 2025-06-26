using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Text.Json;
using GigRaptorService.Helpers;

namespace GigRaptorService.Attributes
{
    /// <summary>
    /// API types for rate limiting
    /// </summary>
    public enum ApiType
    {
        Default,
        GooglePlaces,
        Sheets,
        Files
    }

    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
    public class RateLimitFilterAttribute : Attribute, IAsyncActionFilter
    {
        private readonly int _limit;
        private readonly int _durationInSeconds;
        private readonly ApiType _apiType;
        private static readonly IMemoryCache _cache = new MemoryCache(new MemoryCacheOptions());

        public RateLimitFilterAttribute(int limit, int durationInSeconds, ApiType apiType = ApiType.Default)
        {
            _limit = limit;
            _durationInSeconds = durationInSeconds;
            _apiType = apiType;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            // Check if rate limiting is enabled
            var configuration = context.HttpContext.RequestServices.GetService<IConfiguration>();
            if (configuration != null && !FeatureFlags.IsRateLimitingEnabled(configuration))
            {
                // Rate limiting is disabled, but still extract user ID for logging purposes
                var userId = await GetUserIdAsync(context.HttpContext);
                if (!string.IsNullOrWhiteSpace(userId))
                {
                    context.HttpContext.Items["AuthenticatedUserId"] = userId;
                }
                await next();
                return;
            }

            var rateLimitUserId = await GetUserIdAsync(context.HttpContext);

            if (string.IsNullOrWhiteSpace(rateLimitUserId))
            {
                context.HttpContext.Response.StatusCode = 401;
                await context.HttpContext.Response.WriteAsync("User authentication is required for rate limiting.");
                return;
            }

            // Store the userId in HttpContext.Items so it can be accessed by the controller
            context.HttpContext.Items["AuthenticatedUserId"] = rateLimitUserId;

            var cacheKey = $"{rateLimitUserId}:{_apiType}:{context.ActionDescriptor.DisplayName}";
            var requestCount = _cache.Get<int>(cacheKey);

            if (requestCount >= _limit)
            {
                context.HttpContext.Response.StatusCode = 429;
                await context.HttpContext.Response.WriteAsync($"Rate limit exceeded for {_apiType} API. User: {rateLimitUserId.Substring(0, Math.Min(8, rateLimitUserId.Length))}***");
                return;
            }

            _cache.Set(cacheKey, requestCount + 1, TimeSpan.FromSeconds(_durationInSeconds));
            await next();
        }

        private async Task<string> GetUserIdAsync(HttpContext context)
        {
            // Priority 1: Try to get userId from JWT token
            var tokenUserId = GetUserIdFromToken(context);
            if (!string.IsNullOrWhiteSpace(tokenUserId))
                return tokenUserId;
            
            // Priority 2: Try UserId header (set by frontend)
            var headerUserId = context.Request.Headers["UserId"].ToString();
            if (!string.IsNullOrWhiteSpace(headerUserId))
                return headerUserId;
            
            // Priority 3: Try to extract from request body (for JSON payloads)
            var bodyUserId = await GetUserIdFromRequestBodyAsync(context);
            if (!string.IsNullOrWhiteSpace(bodyUserId))
                return bodyUserId;
            
            return string.Empty;
        }

        private async Task<string> GetUserIdFromRequestBodyAsync(HttpContext context)
        {
            try
            {
                // Only check JSON requests
                if (!context.Request.ContentType?.Contains("application/json") == true)
                    return string.Empty;

                context.Request.EnableBuffering(); // Allow multiple reads
                var body = await new StreamReader(context.Request.Body).ReadToEndAsync();
                context.Request.Body.Position = 0; // Reset position for controller

                if (string.IsNullOrEmpty(body))
                    return string.Empty;

                // Try to parse JSON and look for userId field
                using var doc = JsonDocument.Parse(body);
                if (doc.RootElement.TryGetProperty("userId", out var userIdElement))
                {
                    return userIdElement.GetString() ?? string.Empty;
                }
            }
            catch (Exception ex)
            {
                // Log error but don't fail the request
                System.Diagnostics.Debug.WriteLine($"Error parsing request body for userId: {ex.Message}");
            }

            return string.Empty;
        }

        private string GetUserIdFromToken(HttpContext context)
        {
            try
            {
                // Get the Bearer token
                var authHeader = context.Request.Headers["Authorization"].ToString();
                if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
                    return string.Empty;
                    
                var token = authHeader.Substring("Bearer ".Length).Trim();
                
                // Parse the JWT to extract user ID
                var handler = new JwtSecurityTokenHandler();
                if (!handler.CanReadToken(token)) return string.Empty;
                
                var jwt = handler.ReadJwtToken(token);
                
                // Try to get user ID from various possible claims
                // Google typically uses 'sub' or 'email' as identifiers
                return jwt.Claims.FirstOrDefault(c => c.Type == "sub")?.Value ?? 
                       jwt.Claims.FirstOrDefault(c => c.Type == "email")?.Value ?? 
                       jwt.Claims.FirstOrDefault(c => c.Type == "user_id")?.Value ??
                       string.Empty;
            }
            catch
            {
                // If there's any error parsing the token, just return empty
                return string.Empty;
            }
        }
    }
}
