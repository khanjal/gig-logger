using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using System.Text;
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
        private const string RefreshTokenCookieName = "RG_REFRESH";
        private const string AccessTokenCookieName = "access_token";

        public RateLimitFilterAttribute(int limit, int durationInSeconds, ApiType apiType = ApiType.Default)
        {
            _limit = limit;
            _durationInSeconds = durationInSeconds;
            _apiType = apiType;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            // Get the three key identifiers
            var userId = await GetUserIdAsync(context.HttpContext);
            var accessToken = GetAccessToken(context.HttpContext);
            var refreshToken = GetRefreshToken(context.HttpContext);

            // User authentication is still required for basic operation
            if (string.IsNullOrWhiteSpace(userId))
            {
                context.HttpContext.Response.StatusCode = 401;
                await context.HttpContext.Response.WriteAsync("User authentication is required for rate limiting.");
                return;
            }

            // Store the userId in HttpContext.Items so it can be accessed by the controller
            context.HttpContext.Items["AuthenticatedUserId"] = userId;

            string actionName = context.ActionDescriptor.DisplayName ?? "Unknown";
            
            // Check each identifier independently for rate limits
            bool isLimited = false;
            string limitedBy = string.Empty;

            // 1. Check user ID based rate limit
            if (!isLimited && !string.IsNullOrEmpty(userId))
            {
                var userIdKey = $"userId:{userId}:{_apiType}:{actionName}";
                var userIdCount = _cache.Get<int>(userIdKey);
                if (userIdCount >= _limit)
                {
                    isLimited = true;
                    limitedBy = "user ID";
                }
                else
                {
                    _cache.Set(userIdKey, userIdCount + 1, TimeSpan.FromSeconds(_durationInSeconds));
                }
            }

            // 2. Check access token based rate limit
            if (!isLimited && !string.IsNullOrEmpty(accessToken))
            {
                // Use a hash of part of the token to avoid storing full tokens
                var accessTokenHash = CreateHash(accessToken.Substring(0, Math.Min(50, accessToken.Length)));
                var accessTokenKey = $"token:{accessTokenHash}:{_apiType}:{actionName}";
                var accessTokenCount = _cache.Get<int>(accessTokenKey);
                
                if (accessTokenCount >= _limit)
                {
                    isLimited = true;
                    limitedBy = "access token";
                }
                else
                {
                    _cache.Set(accessTokenKey, accessTokenCount + 1, TimeSpan.FromSeconds(_durationInSeconds));
                }
            }

            // 3. Check refresh token based rate limit
            if (!isLimited && !string.IsNullOrEmpty(refreshToken))
            {
                // Use a hash of part of the token to avoid storing full tokens
                var refreshTokenHash = CreateHash(refreshToken.Substring(0, Math.Min(50, refreshToken.Length)));
                var refreshTokenKey = $"refresh:{refreshTokenHash}:{_apiType}:{actionName}";
                var refreshTokenCount = _cache.Get<int>(refreshTokenKey);
                
                if (refreshTokenCount >= _limit)
                {
                    isLimited = true;
                    limitedBy = "refresh token";
                }
                else
                {
                    _cache.Set(refreshTokenKey, refreshTokenCount + 1, TimeSpan.FromSeconds(_durationInSeconds));
                }
            }

            // If any of the identifiers have reached their limit, return 429
            if (isLimited)
            {
                context.HttpContext.Response.StatusCode = 429;
                await context.HttpContext.Response.WriteAsync($"Rate limit exceeded for {_apiType} API.");
                return;
            }

            // Optionally apply DynamoDB/distributed rate limiting if feature flag is enabled
            var configuration = context.HttpContext.RequestServices.GetService<IConfiguration>();
            if (configuration != null && FeatureFlags.IsRateLimitingEnabled(configuration))
            {
                // TODO: Add DynamoDB/distributed rate limiting logic here
                // If limit exceeded, return 429 and do not call next()
            }

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

        private string GetAccessToken(HttpContext context)
        {
            try
            {
                // First check Authorization header
                var authHeader = context.Request.Headers["Authorization"].ToString();
                if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer "))
                {
                    return authHeader.Substring("Bearer ".Length).Trim();
                }
                
                // Then check for access_token cookie
                var accessTokenCookie = context.Request.Cookies[AccessTokenCookieName];
                if (!string.IsNullOrEmpty(accessTokenCookie))
                {
                    return accessTokenCookie;
                }
                
                return string.Empty;
            }
            catch
            {
                return string.Empty;
            }
        }

        private string GetRefreshToken(HttpContext context)
        {
            try
            {
                var refreshToken = context.Request.Cookies[RefreshTokenCookieName];
                return refreshToken ?? string.Empty;
            }
            catch
            {
                return string.Empty;
            }
        }

        private string CreateHash(string input)
        {
            using var sha = SHA256.Create();
            var hashBytes = sha.ComputeHash(Encoding.UTF8.GetBytes(input));
            return Convert.ToBase64String(hashBytes);
        }
    }
}
