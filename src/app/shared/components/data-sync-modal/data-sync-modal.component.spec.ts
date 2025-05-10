import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataSyncModalComponent } from './data-sync-modal.component';

describe('DataSyncModalComponent', () => {
  let component: DataSyncModalComponent;
  let fixture: ComponentFixture<DataSyncModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [DataSyncModalComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(DataSyncModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
