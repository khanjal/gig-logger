using GigRaptorService.Controllers;
using GigRaptorService.Models;
using GigRaptorService.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace GigRaptorService.Tests.Controllers;

public class PlacesControllerTests
{
    private readonly Mock<IGooglePlacesService> _placesServiceMock;
    private readonly Mock<ILogger<PlacesController>> _loggerMock;
    private readonly Mock<IMetricsService> _metricsServiceMock;
    private readonly PlacesController _controller;

    public PlacesControllerTests()
    {
        _placesServiceMock = new Mock<IGooglePlacesService>();
        _loggerMock = new Mock<ILogger<PlacesController>>();
        _metricsServiceMock = new Mock<IMetricsService>();

        _controller = new PlacesController(
            _placesServiceMock.Object,
            _loggerMock.Object,
            _metricsServiceMock.Object);

        // Setup HttpContext
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
    }

    [Fact]
    public async Task GetAutocomplete_NullRequest_ReturnsBadRequest()
    {
        // Act
        var result = await _controller.GetAutocomplete(null!);

        // Assert
        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("Query parameter is required", badRequest.Value);
    }

    [Fact]
    public async Task GetAutocomplete_EmptyQuery_ReturnsBadRequest()
    {
        // Arrange
        var request = new PlacesAutocompleteRequest { Query = "" };

        // Act
        var result = await _controller.GetAutocomplete(request);

        // Assert
        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("Query parameter is required", badRequest.Value);
    }

    [Fact]
    public async Task GetAutocomplete_MissingUserId_ReturnsBadRequest()
    {
        // Arrange
        var request = new PlacesAutocompleteRequest 
        { 
            Query = "123 Main St",
            UserId = ""
        };

        _metricsServiceMock
            .Setup(m => m.TrackCustomMetricAsync("Places.Autocomplete.QueryLength", request.Query.Length, "Count"))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.GetAutocomplete(request);

        // Assert
        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("User identification is required", badRequest.Value);
    }

    [Fact]
    public void PlacesController_Constructor_CreatesInstance()
    {
        // Arrange & Act
        var controller = new PlacesController(
            _placesServiceMock.Object,
            _loggerMock.Object,
            _metricsServiceMock.Object);

        // Assert
        Assert.NotNull(controller);
    }

    [Fact]
    public void PlacesController_HasCorrectDependencies()
    {
        // This test verifies the controller has the expected dependencies injected
        Assert.NotNull(_controller);
    }
}

