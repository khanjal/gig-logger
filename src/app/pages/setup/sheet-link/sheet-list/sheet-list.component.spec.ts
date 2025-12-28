import { ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestingImports, commonTestingProviders } from '@test-harness';
import { SheetListComponent } from './sheet-list.component';

describe('SheetListComponent', () => {
  let component: SheetListComponent;
  let fixture: ComponentFixture<SheetListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...commonTestingImports, SheetListComponent],
      providers: [...commonTestingProviders]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SheetListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
