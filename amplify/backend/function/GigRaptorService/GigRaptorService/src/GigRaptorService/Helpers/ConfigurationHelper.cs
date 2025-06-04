using System.Reflection;

namespace GigRaptorService.Helpers;

public static class ConfigurationHelper
{
    private static IConfigurationRoot _configuration = new ConfigurationBuilder().Build(); // TODO: See if there is a better way to handle this.
    public static void GetConfiguration()
    {
        _configuration = new ConfigurationBuilder()
                            .AddEnvironmentVariables() // For GitHub Action Secrets
                            .AddUserSecrets(Assembly.GetExecutingAssembly(), true) // For Local User Secrets
                            .Build();
    }

    public static Dictionary<string, string> GetGoogleOAuth()
    {
        GetConfiguration();
        var parameters = new Dictionary<string, string>
        {
            { "clientId", _configuration["google_oauth:client_id"] ?? "" },
            { "clientSecret", _configuration["google_oauth:client_secret"] ?? "" }
        };

        return parameters;
    }
}
