using Amazon.S3;
using Amazon.S3.Model;
using System.Text;

namespace GigRaptorService.Services;

/// <summary>
/// Service for handling S3 operations related to storing large SheetEntity objects
/// </summary>
public interface IS3Service
{
    /// <summary>
    /// Uploads a SheetEntity to S3 and returns the URL
    /// </summary>
    Task<string> UploadSheetEntityToS3Async(string jsonContent, string sheetId, string requestType);
    
    /// <summary>
    /// Gets the byte size of a SheetEntity
    /// </summary>
    long GetSheetEntitySize(string jsonContent);
    
    /// <summary>
    /// Checks if a SheetEntity exceeds the size threshold
    /// </summary>
    bool ExceedsSizeThreshold(string content);
}

/// <summary>
/// Lazy-loaded implementation of IS3Service that only initializes S3 resources when first used
/// </summary>
public class LazyS3Service : IS3Service
{
    private readonly Lazy<S3Service> _lazyS3Service;
    
    public LazyS3Service(IConfiguration configuration)
    {
        _lazyS3Service = new Lazy<S3Service>(() => new S3Service(configuration), LazyThreadSafetyMode.ExecutionAndPublication);
    }
    
    public Task<string> UploadSheetEntityToS3Async(string jsonContent, string sheetId, string requestType)
    {
        return _lazyS3Service.Value.UploadSheetEntityToS3Async(jsonContent, sheetId, requestType);
    }
    
    public long GetSheetEntitySize(string jsonContent)
    {
        return _lazyS3Service.Value.GetSheetEntitySize(jsonContent);
    }
    
    public bool ExceedsSizeThreshold(string jsonContent)
    {
        return _lazyS3Service.Value.ExceedsSizeThreshold(jsonContent);
    }
}

public class S3Service : IS3Service
{
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName;
    private readonly IConfiguration _configuration;
    private readonly ILogger<S3Service>? _logger;
    private readonly int _sizeThresholdInBytes;

    // Default size limit for direct responses (5MB)
    private const int DefaultSizeThresholdInMB = 5;

    public S3Service(IConfiguration configuration, ILogger<S3Service>? logger = null)
    {
        _configuration = configuration;
        _logger = logger;
        
        // Get bucket name from configuration, throw if not found
        _bucketName = _configuration["AWS:S3:BucketName"] 
            ?? throw new InvalidOperationException("S3 bucket name not configured. Please set AWS:S3:BucketName in configuration.");

        // Get size threshold from configuration with default of 5MB
        if (!int.TryParse(_configuration["AWS:S3:SizeThresholdInMB"], out int configuredThreshold))
        {
            configuredThreshold = DefaultSizeThresholdInMB;
        }
        
        // Convert MB to bytes
        _sizeThresholdInBytes = configuredThreshold * 1024 * 1024;
        
        // Configure S3 client with explicit region
        var s3Config = new AmazonS3Config
        {
            RegionEndpoint = Amazon.RegionEndpoint.USEast1,
            ForcePathStyle = true
        };
        
        // Initialize S3 client
        _s3Client = new AmazonS3Client(s3Config);
    }

    /// <summary>
    /// Uploads a SheetEntity to S3 and returns the presigned URL that's valid for 10 minutes
    /// </summary>
    public async Task<string> UploadSheetEntityToS3Async(string jsonContent, string sheetId, string requestType)
    {
        try
        {
            // Create a unique key for the object
            string key = $"sheets/{sheetId}/{requestType}/{Guid.NewGuid()}.json";
            
            // Upload to S3
            var putRequest = new PutObjectRequest
            {
                BucketName = _bucketName,
                Key = key,
                ContentBody = jsonContent,
                ContentType = "application/json"
            };
            
            await _s3Client.PutObjectAsync(putRequest);
            
            // Generate a presigned URL that's valid for 10 minutes
            var urlRequest = new GetPreSignedUrlRequest
            {
                BucketName = _bucketName,
                Key = key,
                Expires = DateTime.UtcNow.AddMinutes(10)
            };
            
            return _s3Client.GetPreSignedURL(urlRequest);
        }
        catch (AmazonS3Exception ex)
        {
            _logger?.LogError(ex, $"S3 Error: Code={ex.ErrorCode}, StatusCode={ex.StatusCode}, Bucket={_bucketName}");
            throw;
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, $"Error uploading to S3: {ex.Message}");
            throw;
        }
    }

    /// <summary>
    /// Gets the accurate byte size of a SheetEntity in UTF-8 encoding
    /// </summary>
    public long GetSheetEntitySize(string jsonContent)
    {
        return Encoding.UTF8.GetByteCount(jsonContent);
    }
    
    /// <summary>
    /// Checks if a SheetEntity exceeds the size threshold
    /// </summary>
    public bool ExceedsSizeThreshold(string jsonContent)
    {
        return GetSheetEntitySize(jsonContent) > _sizeThresholdInBytes;
    }
}