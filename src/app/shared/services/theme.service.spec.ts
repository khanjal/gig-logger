import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { LoggerService } from './logger.service';
import { ThemeService } from './theme.service';
import { SESSION_CONSTANTS } from '@constants/session.constants';

type MockMediaQuery = MediaQueryList & { trigger?: (value: boolean) => void };

describe('ThemeService', () => {
  let logger: jasmine.SpyObj<LoggerService>;
  let documentRef: Document;

  const ensureThemeMeta = (): HTMLMetaElement => {
    const existing = document.head.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (existing) {
      return existing;
    }
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
    return meta;
  };

  const mockMatchMedia = (isDark: boolean): MockMediaQuery => {
    const listeners: Array<(event: MediaQueryListEvent) => void> = [];
    const mediaQuery: MockMediaQuery = {
      matches: isDark,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: (listener: (event: MediaQueryListEvent) => void) => listeners.push(listener),
      removeListener: (listener: (event: MediaQueryListEvent) => void) => {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      },
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.push(listener),
      removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      },
      dispatchEvent: () => false,
      trigger: (nextValue: boolean) => {
        Object.defineProperty(mediaQuery, 'matches', { value: nextValue, writable: true });
        listeners.forEach(listener => listener({ matches: nextValue } as MediaQueryListEvent));
      }
    } as MockMediaQuery;

    spyOn(window, 'matchMedia').and.returnValue(mediaQuery);
    return mediaQuery;
  };

  const createService = (): ThemeService => TestBed.inject(ThemeService);

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-theme-preference');

    logger = jasmine.createSpyObj('LoggerService', ['info', 'warn', 'error', 'debug']);

    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: LoggerService, useValue: logger }
      ]
    });

    documentRef = TestBed.inject(DOCUMENT);
  });

  it('applies system preference on init using matchMedia', () => {
    mockMatchMedia(true);
    const service = createService();

    expect(service.activeTheme).toBe('dark');
    expect(documentRef.documentElement.classList.contains('theme-dark')).toBeTrue();
    expect(documentRef.documentElement.getAttribute('data-theme-preference')).toBe('system');
  });

  it('persists and applies explicit dark theme', () => {
    mockMatchMedia(false);
    const service = createService();

    service.setTheme('dark');

    expect(service.activeTheme).toBe('dark');
    expect(localStorage.getItem(SESSION_CONSTANTS.THEME_STORAGE_KEY)).toBe('dark');
    expect(documentRef.documentElement.classList.contains('theme-dark')).toBeTrue();
    expect(documentRef.documentElement.style.colorScheme).toBe('dark');
  });

  it('falls back to light when system does not prefer dark', () => {
    mockMatchMedia(false);
    const service = createService();

    expect(service.activeTheme).toBe('light');
    expect(documentRef.documentElement.classList.contains('theme-light')).toBeTrue();
  });

  it('updates resolved theme when system preference changes', () => {
    const mediaQuery = mockMatchMedia(false);
    const service = createService();

    service.setTheme('system');
    mediaQuery.trigger?.(true);

    expect(service.activeTheme).toBe('dark');
    expect(documentRef.documentElement.classList.contains('theme-dark')).toBeTrue();
  });

  it('updates meta theme color when theme changes', () => {
    mockMatchMedia(false);
    // Ensure meta tag exists and set deterministic CSS vars for test (avoid hardcoded hex)
    ensureThemeMeta();
    document.documentElement.style.setProperty('--meta-theme-dark', 'test-dark');
    document.documentElement.style.setProperty('--meta-theme-light', 'test-light');

    const service = createService();

    service.setTheme('dark');
    const meta = documentRef.head.querySelector('meta[name="theme-color"]');

    // Meta should be updated to a non-empty value for dark
    const darkColor = meta?.getAttribute('content');
    expect(darkColor).toBeTruthy();

    service.setTheme('light');
    const lightColor = meta?.getAttribute('content');
    expect(lightColor).toBeTruthy();
    expect(lightColor).not.toBe(darkColor);
  });

  it('does not throw when theme-color meta tag is missing', () => {
    mockMatchMedia(false);
    document.head.querySelectorAll('meta[name="theme-color"]').forEach(meta => meta.remove());

    const service = createService();

    expect(() => service.setTheme('dark')).not.toThrow();
  });

  it('logs a warning when persisting preference fails', () => {
    mockMatchMedia(false);
    const setItemSpy = spyOn(Storage.prototype, 'setItem').and.throwError('storage unavailable');
    const service = createService();

    service.setTheme('dark');

    expect(setItemSpy).toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });
});
