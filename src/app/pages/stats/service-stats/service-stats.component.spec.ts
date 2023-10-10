import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceStatsComponent } from './service-stats.component';

describe('ServiceStatsComponent', () => {
  let component: ServiceStatsComponent;
  let fixture: ComponentFixture<ServiceStatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ServiceStatsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiceStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
