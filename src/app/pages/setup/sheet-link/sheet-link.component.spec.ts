import { ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestingImports, commonTestingProviders } from '@test-harness';
import { SheetLinkComponent } from './sheet-link.component';

describe('SheetLinkComponent', () => {
  let component: SheetLinkComponent;
  let fixture: ComponentFixture<SheetLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...commonTestingImports, SheetLinkComponent],
      providers: [...commonTestingProviders]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SheetLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
