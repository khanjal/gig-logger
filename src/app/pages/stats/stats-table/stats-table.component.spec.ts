import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatsTableComponent } from './stats-table.component';

describe('ServiceStatsComponent', () => {
  let component: StatsTableComponent;
  let fixture: ComponentFixture<StatsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [StatsTableComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(StatsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('precomputes totals and averages when items change', () => {
    component.name = 'Services';
    component.items = [
      {
        name: 'A',
        trips: 2,
        distance: 10,
        pay: 20,
        tip: 3,
        bonus: 1,
        total: 24,
        cash: 2,
        amountPerTime: 12,
        amountPerTrip: 12,
        amountPerDistance: 2.4,
      } as any,
      {
        name: 'B',
        trips: 3,
        distance: 8,
        pay: 15,
        tip: 2,
        bonus: 0,
        total: 17,
        cash: 1,
        amountPerTime: 8,
        amountPerTrip: 0,
        amountPerDistance: 2.125,
      } as any
    ];

    component.ngOnChanges({ items: {} as any, name: {} as any });

    expect(component.lowerCaseName).toBe('services');
    expect(component.totals.trips).toBe(5);
    expect(component.totals.distance).toBe(18);
    expect(component.totals.total).toBe(41);
    expect(component.averages.amountPerTime).toBe(10);
    expect(component.averages.amountPerTrip).toBe(12);
    expect(component.averages.amountPerDistance).toBeCloseTo(2.2625, 4);
  });
});
