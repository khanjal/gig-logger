using Amazon.S3;
using Amazon.S3.Model;
using RaptorSheets.Gig.Entities;
using System.Text.Json;

namespace GigRaptorService.Services;

/// <summary>
/// Service for handling S3 operations related to storing large SheetEntity objects
/// </summary>
public interface IS3Service
{
    /// <summary>
    /// Uploads a SheetEntity to S3 and returns the URL
    /// </summary>
    Task<string> UploadSheetEntityToS3Async(SheetEntity sheetEntity, string sheetId, string requestType);
    
    /// <summary>
    /// Gets the byte size of a SheetEntity
    /// </summary>
    long GetSheetEntitySize(SheetEntity sheetEntity);
    
    /// <summary>
    /// Checks if a SheetEntity exceeds the size threshold
    /// </summary>
    bool ExceedsSizeThreshold(SheetEntity sheetEntity);
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
    
    public Task<string> UploadSheetEntityToS3Async(SheetEntity sheetEntity, string sheetId, string requestType)
    {
        return _lazyS3Service.Value.UploadSheetEntityToS3Async(sheetEntity, sheetId, requestType);
    }
    
    public long GetSheetEntitySize(SheetEntity sheetEntity)
    {
        return _lazyS3Service.Value.GetSheetEntitySize(sheetEntity);
    }
    
    public bool ExceedsSizeThreshold(SheetEntity sheetEntity)
    {
        return _lazyS3Service.Value.ExceedsSizeThreshold(sheetEntity);
    }
}

public class S3Service : IS3Service
{
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName;
    private readonly IConfiguration _configuration;
    private readonly JsonSerializerOptions _jsonOptions;

    // Size limit for direct responses (6MB)
    public const int SizeThresholdInBytes = 6 * 1024 * 1024;

    public S3Service(IConfiguration configuration)
    {
        _configuration = configuration;
        _bucketName = _configuration["AWS:S3:BucketName"] ?? "raptor-sheets-data";
        _s3Client = new AmazonS3Client();
        
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        };
    }

    /// <summary>
    /// Uploads a SheetEntity to S3 and returns the presigned URL that's valid for 1 hour
    /// </summary>
    public async Task<string> UploadSheetEntityToS3Async(SheetEntity sheetEntity, string sheetId, string requestType)
    {
        // Create a unique key for the object
        string key = $"sheets/{sheetId}/{requestType}/{Guid.NewGuid()}.json";
        
        // Serialize the SheetEntity to JSON
        string jsonContent = JsonSerializer.Serialize(sheetEntity, _jsonOptions);
        
        // Upload to S3
        var putRequest = new PutObjectRequest
        {
            BucketName = _bucketName,
            Key = key,
            ContentBody = jsonContent,
            ContentType = "application/json"
        };
        
        await _s3Client.PutObjectAsync(putRequest);
        
        // Generate a presigned URL that's valid for 1 hour
        var urlRequest = new GetPreSignedUrlRequest
        {
            BucketName = _bucketName,
            Key = key,
            Expires = DateTime.UtcNow.AddHours(1)
        };
        
        return _s3Client.GetPreSignedURL(urlRequest);
    }

    /// <summary>
    /// Gets the approximate byte size of a SheetEntity
    /// </summary>
    public long GetSheetEntitySize(SheetEntity sheetEntity)
    {
        // Use serialization to get the approximate size
        string json = JsonSerializer.Serialize(sheetEntity, _jsonOptions);
        return json.Length;
    }
    
    /// <summary>
    /// Checks if a SheetEntity exceeds the size threshold
    /// </summary>
    public bool ExceedsSizeThreshold(SheetEntity sheetEntity)
    {
        if (sheetEntity == null)
            return false;
            
        // Check message count first as a quick check
        if (sheetEntity.Messages != null && sheetEntity.Messages.Count > 100)
        {
            return true;
        }
        
        // For more accurate check, use actual size calculation
        return GetSheetEntitySize(sheetEntity) > SizeThresholdInBytes;
    }
}