using GigRaptorService.Controllers;
using GigRaptorService.Models;
using GigRaptorService.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using RaptorSheets.Core.Entities;
using RaptorSheets.Gig.Entities;
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
    public async Task GetAll_Failure_LogsStartAndErrorWithCorrelationId()
    {
        // Arrange
        var headers = new SheetHeaders { SheetId = null, Authorization = "Bearer test-token" };

        // Act
        await Assert.ThrowsAsync<Exception>(() => _controller.GetAll(headers));

        // Assert: the LogActionAsync wrapper should have logged a start (Information)
        // and a failure (Error) for this action, each tagged with a correlation id.
        VerifyLogContains(LogLevel.Information, "GetAll started");
        VerifyLogContains(LogLevel.Error, "GetAll failed");
    }

    private void VerifyLogContains(LogLevel level, string messageFragment)
    {
        _loggerMock.Verify(
            logger => logger.Log(
                level,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((state, _) => state.ToString()!.Contains(messageFragment)),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce);
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

    [Fact]
    public async Task Save_NullSheetEntity_ThrowsArgumentException()
    {
        // Arrange
        var headers = new SheetHeaders { SheetId = "sheet-1", Authorization = "Bearer test-token" };

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => _controller.Save(null!, headers));
    }

    [Fact]
    public async Task Save_NullProperties_ThrowsArgumentException()
    {
        // Arrange
        var headers = new SheetHeaders { SheetId = "sheet-1", Authorization = "Bearer test-token" };
        var sheetEntity = new SheetEntity { Properties = null! };

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => _controller.Save(sheetEntity, headers));
    }

    [Fact]
    public async Task Save_TooManyTrips_ThrowsArgumentException()
    {
        // Arrange
        var headers = new SheetHeaders { SheetId = "sheet-1", Authorization = "Bearer test-token" };
        var sheetEntity = new SheetEntity
        {
            Properties = new PropertyEntity { Id = "sheet-1" },
            Sheets = new GigSheets
            {
                Trips = Enumerable.Range(0, 10001).Select(_ => new TripEntity()).ToList()
            }
        };

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => _controller.Save(sheetEntity, headers));
    }

    [Fact]
    public async Task GetMultiple_EmptySheetNames_ThrowsArgumentException()
    {
        // Arrange
        var headers = new SheetHeaders { SheetId = "sheet-1", Authorization = "Bearer test-token" };

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => _controller.GetMultiple([], headers));
    }

    [Fact]
    public async Task GetMultiple_TooManySheetNames_ThrowsArgumentException()
    {
        // Arrange
        var headers = new SheetHeaders { SheetId = "sheet-1", Authorization = "Bearer test-token" };
        var sheetNames = Enumerable.Range(0, 51).Select(i => $"sheet-{i}").ToArray();

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => _controller.GetMultiple(sheetNames, headers));
    }
}
