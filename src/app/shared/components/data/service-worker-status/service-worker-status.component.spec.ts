import { ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestingImports, commonTestingProviders } from '../../../../../test-harness';
import { ServiceWorkerStatusComponent } from './service-worker-status.component';

describe('ServiceWorkerStatusComponent', () => {
  let component: ServiceWorkerStatusComponent;
  let fixture: ComponentFixture<ServiceWorkerStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...commonTestingImports, ServiceWorkerStatusComponent],
      providers: [...commonTestingProviders]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiceWorkerStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
