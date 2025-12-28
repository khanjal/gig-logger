import { ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestingImports, commonTestingProviders } from '@test-harness';
import { SheetCreateComponent } from './sheet-create.component';

describe('SheetCreateComponent', () => {
  let component: SheetCreateComponent;
  let fixture: ComponentFixture<SheetCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...commonTestingImports, SheetCreateComponent],
      providers: [...commonTestingProviders]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SheetCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
