using System.ComponentModel;

public enum Sheet {
    [Description("Addresses")]
    Addresses,

    [Description("Names")]
    Names,

    [Description("Places")]
    Places,

    [Description("Services")]
    Services,

    [Description("Shifts")]
    Shifts,

    [Description("Trips")]
    Trips,

    [Description("Weekdays")]
    Weekdays,
}