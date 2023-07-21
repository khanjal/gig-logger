using System.ComponentModel;

public enum HeaderEnum {
    [Description("Start Address")]
    AddressStart,

    [Description("End Address")]
    AddressEnd,

    [Description("Curr Amt")]
    AmountCurrent,

    [Description("$/Day")]
    AmountPerDay,

    [Description("$/Time")]
    AmountPerTime,

    [Description("$/Trip")]
    AmountPerTrip,

    [Description("Average")]
    Average,

    [Description("Bonus")]
    Bonus,

    [Description("Cash")]
    Cash,

    [Description("Date")]
    Date,

    [Description("Begin")]
    DateBegin,

    [Description("End")]
    DateEnd,

    [Description("Day")]
    Day,

    [Description("Days")]
    Days,

    [Description("Dist")]
    Distance,

    [Description("Dropoff")]
    Dropoff,

    [Description("Duration")]
    Duration,

    [Description("Key")]
    Key,

    [Description("Month")]
    Month,

    [Description("Name")]
    Name,
    
    [Description("Note")]
    Note,

    [Description("#")]
    Number,

    [Description("# Days")]
    NumberOfDays,

    [Description("Odo End")]
    OdometerEnd,

    [Description("Odo Start")]
    OdometerStart,
    
    [Description("Order #")]
    OrderNumber,

    [Description("Pay")]
    Pay,

    [Description("Pickup")]
    Pickup,

    [Description("Place")]
    Place,

    [Description("Region")]
    Region,


    [Description("Service")]
    Service,

    [Description("S Bonus")]
    ShiftBonus,

    
    [Description("S Cash")]
    ShiftCash,

    [Description("S Miles")]
    ShiftDistance,

    [Description("S Pay")]
    ShiftPay,

    [Description("S Tips")]
    ShiftTip,

    [Description("S Trip")]
    ShiftTrips,

    [Description("Active")]
    TimeActive,

    [Description("End")]
    TimeEnd,

    [Description("O")]
    TimeOmit,

    [Description("Begin")]
    TimeStart,

    [Description("Time")]
    TimeTotal,

    [Description("Tip")]
    Tip,

    [Description("Tips")]
    Tips,

    [Description("Total")]
    Total,

    [Description("Trips")]
    Trips,
    
    [Description("Trips/Day")]
    TripsPerDay,

    [Description("Trips/Hour")]
    TripsPerHour,

    [Description("Type")]
    Type,
    
    [Description("End Unit")]
    UnitEnd,

    [Description("Visits")]
    Visits,
    
    [Description("Year")]
    Year,
}