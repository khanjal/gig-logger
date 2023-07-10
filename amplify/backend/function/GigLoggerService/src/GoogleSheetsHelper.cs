using System;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Services;
using Google.Apis.Sheets.v4;

public class GoogleSheetsHelper
{
    public SheetsService Service { get; set; }
    const string APPLICATION_NAME = "GroceryStore";
    static readonly string[] Scopes = { SheetsService.Scope.Spreadsheets };
    public GoogleSheetsHelper()
    {
        InitializeService();
    }
    private void InitializeService()
    {
        var credential = GetCredentialsFromEnvironment();
        Service = new SheetsService(new BaseClientService.Initializer()
        {
            HttpClientInitializer = credential,
            ApplicationName = APPLICATION_NAME
        });
    }
    private GoogleCredential GetCredentialsFromEnvironment()
    {
        JsonCredentialParameters credentials = new JsonCredentialParameters();
        credentials.Type = Environment.GetEnvironmentVariable("CREDENTIAL_TYPE");
        credentials.PrivateKey = Environment.GetEnvironmentVariable("CREDENTIAL_KEY");
        credentials.ClientEmail = Environment.GetEnvironmentVariable("CREDENTIAL_EMAIL");
        
        GoogleCredential credential;
        credential = GoogleCredential.FromJsonParameters(credentials);

        return credential;
    }
}