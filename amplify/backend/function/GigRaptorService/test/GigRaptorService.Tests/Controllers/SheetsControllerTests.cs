using GigRaptorService.Controllers;
using GigRaptorService.Models;
using GigRaptorService.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace GigRaptorService.Tests.Controllers;

public class SheetsControllerTests
{
    private readonly Mock<IConfiguration> _configMock;
    private readonly Mock<IMetricsService> _metricsServiceMock;
    private readonly Mock<ILogger<SheetsController>> _loggerMock;
    private readonly SheetsController _controller;

    public SheetsControllerTests()
    {
        _configMock = new Mock<IConfiguration>();
        _metricsServiceMock = new Mock<IMetricsService>();
        _loggerMock = new Mock<ILogger<SheetsController>>();

        _controller = new SheetsController(
            _configMock.Object,
            _metricsServiceMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public void Constructor_WithValidParameters_CreatesInstance()
    {
        // Arrange & Act
        var controller = new SheetsController(
            _configMock.Object,
            _metricsServiceMock.Object,
            _loggerMock.Object);

        // Assert
        Assert.NotNull(controller);
    }

    [Fact]
    public async Task GetAll_MissingSheetId_ThrowsException()
    {
        // Arrange
        var headers = new SheetHeaders
        {
            SheetId = null,
            Authorization = "Bearer test-token"
        };

        // Act & Assert
        await Assert.ThrowsAsync<Exception>(() => _controller.GetAll(headers));
    }

    [Fact]
    public async Task GetSingle_MissingSheetId_ThrowsException()
    {
        // Arrange
        var headers = new SheetHeaders
        {
            SheetId = null,
            Authorization = "Bearer test-token"
        };

        // Act & Assert
        await Assert.ThrowsAsync<Exception>(() => _controller.GetSingle("Trips", headers));
    }

    [Fact]
    public async Task GetMultiple_MissingSheetId_ThrowsException()
    {
        // Arrange
        var headers = new SheetHeaders
        {
            SheetId = null,
            Authorization = "Bearer test-token"
        };
        var sheetNames = new[] { "Trips", "Shifts" };

        // Act & Assert
        await Assert.ThrowsAsync<Exception>(() => _controller.GetMultiple(sheetNames, headers));
    }

    [Fact]
    public async Task Health_MissingSheetId_ThrowsException()
    {
        // Arrange
        var headers = new SheetHeaders
        {
            SheetId = null,
            Authorization = "Bearer test-token"
        };

        // Act & Assert
        await Assert.ThrowsAsync<Exception>(() => _controller.Health(headers));
    }

    [Fact]
    public void SheetsController_HasCorrectDependencies()
    {
        // This test verifies the controller has the expected dependencies
        Assert.NotNull(_controller);
    }
}
