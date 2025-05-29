using GigRaptorService.Middlewares;

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
                          "sheet-id"
                      );
            });
        });

        services.AddControllers();
        services.AddScoped<Filters.RequireSheetIdFilter>();
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

        app.UseWhen(
            context => context.Request.Path.StartsWithSegments("/sheets", StringComparison.OrdinalIgnoreCase),
            appBuilder => appBuilder.UseMiddleware<TokenRefreshMiddleware>()
        );


        app.UseEndpoints(endpoints =>
        {
            endpoints.MapControllers();
            endpoints.MapGet("/", async context =>
            {
                await context.Response.WriteAsync("Welcome to running ASP.NET Core on AWS Lambda");
            });
        });
    }
}
