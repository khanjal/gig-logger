using System.ComponentModel;

public enum SheetEnum {

    // Core

    [Description("Shifts")]
    Shifts,

    [Description("Trips")]
    Trips,

    // Ancilary
    [Description("Addresses")]
    Addresses,

    [Description("Names")]
    Names,

    [Description("Places")]
    Places,

    [Description("Regions")]
    Regions,

    [Description("Services")]
    Services,

    [Description("Types")]
    Types,

    // Stats

    [Description("Daily")]
    Daily,

    [Description("Monthly")]
    Monthly,

    [Description("Weekdays")]
    Weekdays,

    [Description("Weekly")]
    Weekly,

    [Description("Yearly")]
    Yearly,
}