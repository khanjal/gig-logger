import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BaseButtonComponent } from './base-button.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('BaseButtonComponent', () => {
  let component: BaseButtonComponent;
  let fixture: ComponentFixture<BaseButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BaseButtonComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(BaseButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Button Variants', () => {
    it('should apply primary variant class', () => {
      component.variant = 'primary';
      expect(component.buttonClasses).toContain('btn-primary');
    });

    it('should apply secondary variant class', () => {
      component.variant = 'secondary';
      expect(component.buttonClasses).toContain('btn-secondary');
    });

    it('should apply outlined variant class', () => {
      component.variant = 'outlined';
      expect(component.buttonClasses).toContain('btn-outlined');
    });

    it('should apply danger variant class', () => {
      component.variant = 'danger';
      expect(component.buttonClasses).toContain('btn-danger');
    });

    it('should apply icon variant class', () => {
      component.variant = 'icon';
      expect(component.buttonClasses).toContain('btn-icon');
    });
  });

  describe('Button Sizes', () => {
    it('should apply small size class', () => {
      component.size = 'sm';
      expect(component.buttonClasses).toContain('btn-sm');
    });

    it('should apply medium size class by default', () => {
      expect(component.buttonClasses).toContain('btn-md');
    });

    it('should apply large size class', () => {
      component.size = 'lg';
      expect(component.buttonClasses).toContain('btn-lg');
    });
  });

  describe('Button States', () => {
    it('should apply disabled class when disabled', () => {
      component.disabled = true;
      expect(component.buttonClasses).toContain('btn-disabled');
    });

    it('should apply loading class when loading', () => {
      component.loading = true;
      expect(component.buttonClasses).toContain('btn-loading');
    });

    it('should apply full-width class when fullWidth is true', () => {
      component.fullWidth = true;
      expect(component.buttonClasses).toContain('btn-full-width');
    });
  });

  describe('Click Events', () => {
    it('should emit clicked event when button is clicked', () => {
      spyOn(component.clicked, 'emit');
      component.onButtonClick();
      expect(component.clicked.emit).toHaveBeenCalled();
    });

    it('should not emit clicked event when disabled', () => {
      spyOn(component.clicked, 'emit');
      component.disabled = true;
      component.onButtonClick();
      expect(component.clicked.emit).not.toHaveBeenCalled();
    });

    it('should not emit clicked event when loading', () => {
      spyOn(component.clicked, 'emit');
      component.loading = true;
      component.onButtonClick();
      expect(component.clicked.emit).not.toHaveBeenCalled();
    });
  });

  describe('Label rendering and icon-only detection', () => {
    it('renders label when provided via input', () => {
      component.label = 'My Label';
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const text = el.querySelector('.btn-text') as HTMLElement;
      expect(text).toBeTruthy();
      expect(text.textContent?.trim()).toBe('My Label');
    });

    it('does not add btn-icon-only when icon and visible label present', () => {
      component.icon = 'edit';
      component.label = 'Visible';
      fixture.detectChanges();
      const contentEl = fixture.nativeElement.querySelector('.btn-text') as HTMLElement;
      // Simulate visible rendering by providing a non-empty client rects
      (contentEl as any).getClientRects = () => [{ width: 10 }];
      // call update directly to avoid timing issues
      (component as any).updateIconOnlyClass();
      const btn = fixture.nativeElement.querySelector('button') as HTMLElement;
      expect(btn.classList.contains('btn-icon-only')).toBeFalse();
    });

    it('adds btn-icon-only when icon present but no visible text', () => {
      component.icon = 'edit';
      component.label = undefined;
      fixture.detectChanges();
      // Ensure no projected text exists
      const contentEl = fixture.nativeElement.querySelector('.btn-text') as HTMLElement;
      // Simulate hidden by returning empty rects
      (contentEl as any).getClientRects = () => [];
      (component as any).updateIconOnlyClass();
      const btn = fixture.nativeElement.querySelector('button') as HTMLElement;
      expect(btn.classList.contains('btn-icon-only')).toBeTrue();
    });
  });
});
