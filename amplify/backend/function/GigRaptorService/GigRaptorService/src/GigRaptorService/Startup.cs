using GigRaptorService.Middlewares;
using GigRaptorService.Services;
using Microsoft.AspNetCore.ResponseCompression;
using System.IO.Compression;
using Amazon.S3;
using Amazon.Extensions.NETCore.Setup;

namespace GigRaptorService;

public class Startup
{
    public Startup(IConfiguration configuration)
    {
        Configuration = configuration;
    }

    public IConfiguration Configuration { get; }

    public void ConfigureServices(IServiceCollection services)
    {
        var allowedOrigins = new[]
        {
            "https://localhost:4200",
            "https://gig-test.raptorsheets.com",
            "https://gig.raptorsheets.com"
        };

        services.AddCors(options =>
        {
            options.AddPolicy("AllowSpecificOrigins", policy =>
            {
                policy.WithOrigins(allowedOrigins)
                      .AllowCredentials()
                      .AllowAnyHeader()
                      .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                      .WithExposedHeaders(
                          "Content-Type",
                          "X-Amz-Date",
                          "Authorization",
                          "X-Api-Key",
                          "X-Amz-Security-Token",
                          "sheet-id",
                          "ACCESS_TOKEN"
                      );
            });
        });

        // Add response compression services
        services.AddResponseCompression(options =>
        {
            options.EnableForHttps = true;
            options.Providers.Add<BrotliCompressionProvider>();
            options.Providers.Add<GzipCompressionProvider>();
            // Optionally, restrict to certain MIME types
            options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(new[] { "application/json" });
        });

        services.Configure<BrotliCompressionProviderOptions>(opts =>
        {
            opts.Level = CompressionLevel.Fastest;
        });
        services.Configure<GzipCompressionProviderOptions>(opts =>
        {
            opts.Level = CompressionLevel.Fastest;
        });

        services.AddControllers();
        services.AddScoped<Filters.RequireSheetIdFilter>();
        services.AddScoped<GoogleOAuthService>();
        
        // Register LazyS3Service instead of S3Service to improve cold start time
        services.AddScoped<IS3Service, LazyS3Service>();

        services.AddHttpClient();

        // Register AWS services with default options
        // This helps with credentials and region configuration for all AWS services
        var awsOptions = Configuration.GetAWSOptions();
        
        // Set specific region to match updateLambda.bat
        awsOptions.Region = Amazon.RegionEndpoint.USEast1;
        
        // Bucket name should be set via environment variables - not setting a default
        // The S3Service will throw an exception if AWS:S3:BucketName is not configured
        
        // Add AWS default options first
        services.AddDefaultAWSOptions(awsOptions);
        
        // Then add the AWS S3 service with proper configuration
        services.AddAWSService<IAmazonS3>();
        
        // Configure S3 client options
        services.Configure<AmazonS3Config>(options =>
        {
            options.ForcePathStyle = true;
            options.RegionEndpoint = Amazon.RegionEndpoint.USEast1;
        });
        
        // Add logging
        services.AddLogging(builder =>
        {
            builder.AddConsole();
            builder.AddDebug();
        });
    }

    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        if (env.IsDevelopment())
        {
            app.UseDeveloperExceptionPage();
        }

        app.UseHttpsRedirection();
        app.UseRouting();
        app.UseCors("AllowSpecificOrigins");
        app.UseAuthorization();

        // Use response compression middleware
        app.UseResponseCompression();

        app.UseWhen(
            context => context.Request.Path.StartsWithSegments("/sheets", StringComparison.OrdinalIgnoreCase),
            appBuilder => appBuilder.UseMiddleware<TokenRefreshMiddleware>()
        );

        app.UseEndpoints(endpoints =>
        {
            endpoints.MapControllers();
        });
    }
}
