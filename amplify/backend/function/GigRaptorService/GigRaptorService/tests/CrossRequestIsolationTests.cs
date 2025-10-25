using System.Net.Http;
using System.Threading.Tasks;
using Xunit;
using Microsoft.AspNetCore.Mvc.Testing;
using GigRaptorService;

namespace GigRaptorService.Tests
{
    public class CrossRequestIsolationTests : IClassFixture<WebApplicationFactory<Startup>>
    {
        private readonly WebApplicationFactory<Startup> _factory;

        public CrossRequestIsolationTests(WebApplicationFactory<Startup> factory)
        {
            _factory = factory;
        }

        private HttpClient CreateClient(string token)
        {
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {token}");
            return client;
        }

        [Fact]
        public async Task ConcurrentRequests_DoNotLeakUserData()
        {
            var client1 = CreateClient("token-user1");
            var client2 = CreateClient("token-user2");
            var sheetId1 = "sheetA";
            var sheetId2 = "sheetB";

            var task1 = client1.GetAsync($"/sheets/{sheetId1}");
            var task2 = client2.GetAsync($"/sheets/{sheetId2}");

            var responses = await Task.WhenAll(task1, task2);

            var response1 = await responses[0].Content.ReadAsStringAsync();
            var response2 = await responses[1].Content.ReadAsStringAsync();

            Assert.Contains(sheetId1, response1);
            Assert.Contains(sheetId2, response2);
            Assert.DoesNotContain(sheetId2, response1);
            Assert.DoesNotContain(sheetId1, response2);
        }

        [Fact]
        public async Task SheetManager_IsolationBetweenRequests()
        {
            var client1 = CreateClient("token-user1");
            var client2 = CreateClient("token-user2");
            var sheetId1 = "sheetA";
            var sheetId2 = "sheetB";

            var saveTask1 = client1.PutAsync($"/sheets", new StringContent($"{{\"properties\":{{\"id\":\"{sheetId1}\"}}}}"));
            var saveTask2 = client2.PutAsync($"/sheets", new StringContent($"{{\"properties\":{{\"id\":\"{sheetId2}\"}}}}"));

            var responses = await Task.WhenAll(saveTask1, saveTask2);

            var response1 = await responses[0].Content.ReadAsStringAsync();
            var response2 = await responses[1].Content.ReadAsStringAsync();

            Assert.Contains(sheetId1, response1);
            Assert.Contains(sheetId2, response2);
            Assert.DoesNotContain(sheetId2, response1);
            Assert.DoesNotContain(sheetId1, response2);
        }

        [Fact]
        public async Task TokenRefreshMiddleware_IsolationBetweenUsers()
        {
            var client1 = CreateClient("expired-token-user1");
            var client2 = CreateClient("expired-token-user2");
            client1.DefaultRequestHeaders.Add("Cookie", "RG_REFRESH=refresh-token-user1");
            client2.DefaultRequestHeaders.Add("Cookie", "RG_REFRESH=refresh-token-user2");

            var task1 = client1.GetAsync("/sheets/all");
            var task2 = client2.GetAsync("/sheets/all");

            var responses = await Task.WhenAll(task1, task2);

            var accessToken1 = responses[0].Headers.Contains("ACCESS_TOKEN") ? responses[0].Headers.GetValues("ACCESS_TOKEN").ToString() : string.Empty;
            var accessToken2 = responses[1].Headers.Contains("ACCESS_TOKEN") ? responses[1].Headers.GetValues("ACCESS_TOKEN").ToString() : string.Empty;

            Assert.NotEqual(accessToken1, accessToken2);
        }
    }
}
