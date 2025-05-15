namespace GigRaptorService;

public class Startup
{
    public Startup(IConfiguration configuration)
    {
        Configuration = configuration;
    }

    public IConfiguration Configuration { get; }

    // This method gets called by the runtime. Use this method to add services to the container
    public void ConfigureServices(IServiceCollection services)
    {
        //services.AddCors(option =>
        //{
        //    option.AddDefaultPolicy(builder =>
        //    {
        //        builder.WithOrigins("http://www.localhost:4200");
        //        builder.AllowAnyOrigin();
        //        builder.AllowAnyHeader();
        //        builder.AllowAnyMethod();
        //    });
        //});
        var allowedOrigins = new[] { "https://localhost:4200", "https://gig-test.raptorsheets.com", "https://gig.raptorsheets.com" };        
        services.AddCors(options =>
        {
            options.AddPolicy("AllowSpecificOrigins", policy =>
            {
                policy.WithOrigins(allowedOrigins)
                     .AllowCredentials()
                     .AllowAnyHeader()
                     .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                     .WithExposedHeaders("Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token", "sheet-id");
            });
        });

        services.AddControllers();
        services.AddScoped<Filters.RequireSheetIdFilter>();
    }

    // This method gets called by the runtime. Use this method to configure the HTTP request pipeline
    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        if (env.IsDevelopment())
        {
            app.UseDeveloperExceptionPage();
        }        app.UseHttpsRedirection();        
        app.UseRouting();
        app.UseCors("AllowSpecificOrigins");

        app.UseAuthorization();

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