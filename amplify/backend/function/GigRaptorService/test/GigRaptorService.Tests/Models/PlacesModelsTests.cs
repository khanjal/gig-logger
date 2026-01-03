using GigRaptorService.Models;
using Xunit;

namespace GigRaptorService.Tests.Models;

public class PlacesModelsTests
{
    [Fact]
    public void PlacesAutocompleteRequest_DefaultValues_AreSet()
    {
        // Arrange & Act
        var request = new PlacesAutocompleteRequest();

        // Assert
        Assert.Equal(string.Empty, request.Query);
        Assert.Equal("address", request.SearchType);
        Assert.Equal(string.Empty, request.UserId);
        Assert.Equal("US", request.Country);
        Assert.Null(request.UserLatitude);
        Assert.Null(request.UserLongitude);
    }

    [Fact]
    public void PlacesAutocompleteRequest_CanSetAllProperties()
    {
        // Arrange & Act
        var request = new PlacesAutocompleteRequest
        {
            Query = "123 Main St",
            SearchType = "establishment",
            UserId = "user-123",
            Country = "CA",
            UserLatitude = 40.7128,
            UserLongitude = -74.0060
        };

        // Assert
        Assert.Equal("123 Main St", request.Query);
        Assert.Equal("establishment", request.SearchType);
        Assert.Equal("user-123", request.UserId);
        Assert.Equal("CA", request.Country);
        Assert.Equal(40.7128, request.UserLatitude);
        Assert.Equal(-74.0060, request.UserLongitude);
    }

    [Fact]
    public void PlaceDetailsRequest_CanSetProperties()
    {
        // Arrange & Act
        var request = new PlaceDetailsRequest
        {
            PlaceId = "place-xyz",
            UserId = "user-456"
        };

        // Assert
        Assert.Equal("place-xyz", request.PlaceId);
        Assert.Equal("user-456", request.UserId);
    }

    [Fact]
    public void SheetCreationRequest_DefaultNameIsEmpty()
    {
        // Arrange & Act
        var request = new SheetCreationRequest();

        // Assert
        Assert.Equal(string.Empty, request.Name);
    }

    [Fact]
    public void AutocompleteResult_CanSetAllProperties()
    {
        // Arrange
        var placeDetails = new PlaceDetails { PlaceId = "123" };

        // Act
        var result = new AutocompleteResult
        {
            Place = "Central Park",
            Address = "New York, NY",
            PlaceDetails = placeDetails
        };

        // Assert
        Assert.Equal("Central Park", result.Place);
        Assert.Equal("New York, NY", result.Address);
        Assert.Same(placeDetails, result.PlaceDetails);
    }

    [Fact]
    public void PlaceDetails_AllPropertiesAreNullable()
    {
        // Arrange & Act
        var details = new PlaceDetails();

        // Assert
        Assert.Null(details.PlaceId);
        Assert.Null(details.Name);
        Assert.Null(details.FormattedAddress);
        Assert.Null(details.AddressComponents);
        Assert.Null(details.Geometry);
    }

    [Fact]
    public void GoogleAddressComponent_DefaultValues_AreSet()
    {
        // Arrange & Act
        var component = new GoogleAddressComponent();

        // Assert
        Assert.Equal(string.Empty, component.LongText);
        Assert.Equal(string.Empty, component.ShortText);
        Assert.NotNull(component.Types);
        Assert.Empty(component.Types);
    }

    [Fact]
    public void GoogleAddressComponent_CanSetAllProperties()
    {
        // Arrange & Act
        var component = new GoogleAddressComponent
        {
            LongText = "New York",
            ShortText = "NY",
            Types = new List<string> { "locality", "political" }
        };

        // Assert
        Assert.Equal("New York", component.LongText);
        Assert.Equal("NY", component.ShortText);
        Assert.Equal(2, component.Types.Count);
        Assert.Contains("locality", component.Types);
        Assert.Contains("political", component.Types);
    }

    [Fact]
    public void LocationInfo_CanSetCoordinates()
    {
        // Arrange & Act
        var location = new LocationInfo
        {
            Lat = 40.7128,
            Lng = -74.0060
        };

        // Assert
        Assert.Equal(40.7128, location.Lat);
        Assert.Equal(-74.0060, location.Lng);
    }

    [Fact]
    public void GeometryInfo_HasLocationProperty()
    {
        // Arrange & Act
        var geometry = new GeometryInfo
        {
            Location = new LocationInfo { Lat = 1.0, Lng = 2.0 }
        };

        // Assert
        Assert.NotNull(geometry.Location);
        Assert.Equal(1.0, geometry.Location.Lat);
        Assert.Equal(2.0, geometry.Location.Lng);
    }

    [Fact]
    public void QuotaExceededException_DefaultConstructor_HasDefaultMessage()
    {
        // Arrange & Act
        var exception = new QuotaExceededException();

        // Assert
        Assert.Equal("API quota exceeded for user", exception.Message);
    }

    [Fact]
    public void QuotaExceededException_CustomMessage_IsSet()
    {
        // Arrange & Act
        var exception = new QuotaExceededException("Custom quota message");

        // Assert
        Assert.Equal("Custom quota message", exception.Message);
    }

    [Fact]
    public void UserApiUsage_DefaultValues_AreSet()
    {
        // Arrange & Act
        var usage = new UserApiUsage();

        // Assert
        Assert.Equal(string.Empty, usage.UserId);
        Assert.Equal(0, usage.MonthlyQuota);
        Assert.Equal(0, usage.CurrentUsage);
        Assert.Equal("Free", usage.Tier);
        Assert.Equal(default(DateTime), usage.LastRequestTime);
    }

    [Fact]
    public void UserApiUsage_CanSetAllProperties()
    {
        // Arrange
        var now = DateTime.UtcNow;

        // Act
        var usage = new UserApiUsage
        {
            UserId = "user-789",
            MonthlyQuota = 1000,
            CurrentUsage = 150,
            Tier = "Premium",
            LastRequestTime = now
        };

        // Assert
        Assert.Equal("user-789", usage.UserId);
        Assert.Equal(1000, usage.MonthlyQuota);
        Assert.Equal(150, usage.CurrentUsage);
        Assert.Equal("Premium", usage.Tier);
        Assert.Equal(now, usage.LastRequestTime);
    }
}
