import { ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestingImports, commonTestingProviders } from '@test-harness';
import { DataSyncModalComponent } from './data-sync-modal.component';

describe('DataSyncModalComponent', () => {
  let component: DataSyncModalComponent;
  let fixture: ComponentFixture<DataSyncModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...commonTestingImports, DataSyncModalComponent],
      providers: [...commonTestingProviders]
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
