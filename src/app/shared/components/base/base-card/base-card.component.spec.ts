import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BaseCardComponent } from './base-card.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('BaseCardComponent', () => {
  let component: BaseCardComponent;
  let fixture: ComponentFixture<BaseCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BaseCardComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(BaseCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Card Variants', () => {
    it('should render with default variant by default', () => {
      expect(component.variant).toBe('default');
    });

    it('should accept elevated variant', () => {
      component.variant = 'elevated';
      fixture.detectChanges();
      expect(component.variant).toBe('elevated');
    });

    it('should accept outlined variant', () => {
      component.variant = 'outlined';
      fixture.detectChanges();
      expect(component.variant).toBe('outlined');
    });
  });

  describe('Card Title and Subtitle', () => {
    it('should display title when provided', () => {
      component.title = 'Test Title';
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.card-title')?.textContent).toContain('Test Title');
    });

    it('should not render title when not provided', () => {
      component.title = undefined;
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.card-title')).toBeNull();
    });

    it('should display subtitle when provided', () => {
      component.subtitle = 'Test Subtitle';
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.card-subtitle')?.textContent).toContain('Test Subtitle');
    });

    it('should display title icon when provided', () => {
      component.title = 'Test';
      component.titleIcon = 'check_circle';
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.card-title-icon')).toBeTruthy();
    });
  });

  describe('Card Padding', () => {
    it('should use medium padding by default', () => {
      expect(component.padding).toBe('md');
    });

    it('should accept small padding', () => {
      component.padding = 'sm';
      fixture.detectChanges();
      expect(component.padding).toBe('sm');
    });

    it('should accept large padding', () => {
      component.padding = 'lg';
      fixture.detectChanges();
      expect(component.padding).toBe('lg');
    });
  });

  describe('Content Projection', () => {
    it('should project content into card-content slot', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.card-content')).toBeTruthy();
    });
  });
});
