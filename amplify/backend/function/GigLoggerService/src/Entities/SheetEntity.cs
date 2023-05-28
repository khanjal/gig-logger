using System.Collections.Generic;

public class SheetEntity {
    public List<AddressEntity> Addresses { get; set; }
    public List<NameEntity> Names { get; set; }
    public List<PlaceEntity> Places { get; set; }
    public List<ServiceEntity> Services { get; set; }
    public List<ShiftEntity> Shifts { get; set; }
    public List<TripEntity> Trips { get; set; }
    public List<WeekdayEntity> Weekdays { get; set; }
}