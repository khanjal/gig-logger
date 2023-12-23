import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadModalComponent } from './load-modal.component';

describe('LoadModalComponent', () => {
  let component: LoadModalComponent;
  let fixture: ComponentFixture<LoadModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoadModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoadModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
