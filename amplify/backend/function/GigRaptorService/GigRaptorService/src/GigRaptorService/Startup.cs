using GigRaptorService.Middlewares;
using GigRaptorService.Services;
using Microsoft.AspNetCore.ResponseCompression;
using System.IO.Compression;
using Amazon.S3;
using Amazon.Extensions.NETCore.Setup;
using Amazon.DynamoDBv2;
using System.Threading;

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
        
        // Register GoogleOAuthService as a singleton to reuse across requests
        services.AddSingleton<GoogleOAuthService>();
        
        // Register LazyS3Service as a singleton since it uses lazy initialization
        services.AddSingleton<IS3Service, LazyS3Service>();

        // Register HTTP client factory
        services.AddHttpClient();

        // Register AWS services with default options
        // This helps with credentials and region configuration for all AWS services
        var awsOptions = Configuration.GetAWSOptions();
        
        // Set specific region to match updateLambda.bat
        awsOptions.Region = Amazon.RegionEndpoint.USEast1;
        
        // Add AWS default options first
        services.AddDefaultAWSOptions(awsOptions);
        
        // Use lazy initialization for AWS clients via factory pattern
        services.AddSingleton<IAmazonS3>(sp => 
        {
            var s3Config = new AmazonS3Config
            {
                ForcePathStyle = true,
                RegionEndpoint = Amazon.RegionEndpoint.USEast1
            };
            return new AmazonS3Client(s3Config);
        });
        
        // Add DynamoDB client with lazy initialization
        services.AddSingleton<Lazy<IAmazonDynamoDB>>(sp => 
            new Lazy<IAmazonDynamoDB>(() => 
                new AmazonDynamoDBClient(new AmazonDynamoDBConfig 
                { 
                    RegionEndpoint = Amazon.RegionEndpoint.USEast1 
                }),
                LazyThreadSafetyMode.ExecutionAndPublication
            )
        );
        
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

        // Only apply the token refresh middleware on specific paths
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
