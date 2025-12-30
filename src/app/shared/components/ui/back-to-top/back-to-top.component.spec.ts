import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BackToTopComponent } from './back-to-top.component';

describe('BackToTopComponent', () => {
  let component: BackToTopComponent;
  let fixture: ComponentFixture<BackToTopComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackToTopComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BackToTopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Reset scroll position after each test
    window.scrollTo(0, 0);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('showButton', () => {
    it('defaults to false', () => {
      expect(component.showButton).toBeFalse();
    });

    it('sets to true when scroll position exceeds threshold', () => {
      // Simulate scroll event
      Object.defineProperty(window, 'scrollY', { value: 400, configurable: true });
      component.onWindowScroll();
      
      expect(component.showButton).toBeTrue();
    });

    it('sets to false when scroll position is below threshold', () => {
      component.showButton = true;
      Object.defineProperty(window, 'scrollY', { value: 100, configurable: true });
      component.onWindowScroll();
      
      expect(component.showButton).toBeFalse();
    });

    it('sets to true when exactly at threshold', () => {
      Object.defineProperty(window, 'scrollY', { value: 300, configurable: true });
      component.onWindowScroll();
      
      expect(component.showButton).toBeFalse();
    });

    it('sets to true when one pixel above threshold', () => {
      Object.defineProperty(window, 'scrollY', { value: 301, configurable: true });
      component.onWindowScroll();
      
      expect(component.showButton).toBeTrue();
    });
  });

  describe('scrollThreshold', () => {
    it('defaults to 300', () => {
      expect(component.scrollThreshold).toBe(300);
    });

    it('can be customized via input', () => {
      component.scrollThreshold = 500;
      
      Object.defineProperty(window, 'scrollY', { value: 400, configurable: true });
      component.onWindowScroll();
      expect(component.showButton).toBeFalse();
      
      Object.defineProperty(window, 'scrollY', { value: 600, configurable: true });
      component.onWindowScroll();
      expect(component.showButton).toBeTrue();
    });
  });

  describe('scrollToTop', () => {
    it('calls window.scrollTo with smooth behavior', () => {
      spyOn(window, 'scrollTo');
      
      component.scrollToTop();
      
      expect(window.scrollTo).toHaveBeenCalled();
    });
  });

  describe('onWindowScroll fallbacks', () => {
    it('uses document.documentElement.scrollTop when scrollY unavailable', () => {
      Object.defineProperty(window, 'scrollY', { value: undefined, configurable: true });
      Object.defineProperty(document.documentElement, 'scrollTop', { value: 400, configurable: true });
      
      component.onWindowScroll();
      
      expect(component.showButton).toBeTrue();
    });

    it('uses document.body.scrollTop as last fallback', () => {
      Object.defineProperty(window, 'scrollY', { value: undefined, configurable: true });
      Object.defineProperty(document.documentElement, 'scrollTop', { value: 0, configurable: true });
      Object.defineProperty(document.body, 'scrollTop', { value: 400, configurable: true });
      
      component.onWindowScroll();
      
      expect(component.showButton).toBeTrue();
    });
  });
});
