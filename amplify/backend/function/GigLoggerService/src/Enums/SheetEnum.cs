using System.ComponentModel;

public enum SheetEnum {

    // Core
    [Description("Shifts")]
    SHIFTS,

    [Description("Trips")]
    TRIPS,

    // Auxillary
    [Description("Addresses")]
    ADDRESSES,

    [Description("Names")]
    NAMES,

    [Description("Places")]
    PLACES,

    [Description("Regions")]
    REGIONS,

    [Description("Services")]
    SERVICES,

    [Description("Types")]
    TYPES,

    // Period stats
    [Description("Daily")]
    DAILY,

    [Description("Monthly")]
    MONTHLY,

    [Description("Weekdays")]
    WEEKDAYS,

    [Description("Weekly")]
    WEEKLY,

    [Description("Yearly")]
    YEARLY,
}