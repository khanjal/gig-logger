using System.Collections.Generic;

public class SheetEntity {
    public List<AddressEntity> Addresses { get; set; } = new List<AddressEntity>();
    public List<NameEntity> Names { get; set; } = new List<NameEntity>();
    public List<PlaceEntity> Places { get; set; } = new List<PlaceEntity>();
    public List<ServiceEntity> Services { get; set; } = new List<ServiceEntity>();
    public List<ShiftEntity> Shifts { get; set; } = new List<ShiftEntity>();
    public List<TripEntity> Trips { get; set; } = new List<TripEntity>();
    public List<WeekdayEntity> Weekdays { get; set; } = new List<WeekdayEntity>();
    public List<string> Errors { get; set; } = new List<string>();
}