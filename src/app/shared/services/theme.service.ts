import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoggerService } from './logger.service';
import { ThemePreference, ResolvedTheme } from '@interfaces/theme.interface';

export { ThemePreference, ResolvedTheme };

export const THEME_STORAGE_KEY = 'rg-theme-preference';
const LIGHT_THEME_COLOR = '#1976d2';
const DARK_THEME_COLOR = '#0b1221';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly preference$ = new BehaviorSubject<ThemePreference>('system');
  private readonly resolved$ = new BehaviorSubject<ResolvedTheme>('light');
  private mediaQuery: MediaQueryList | null = null;
  private readonly documentRef: Document;

  constructor(@Inject(DOCUMENT) documentRef: Document, private logger: LoggerService) {
    this.documentRef = documentRef;
    const initialPreference = this.getStoredPreference() ?? 'system';
    this.applyTheme(initialPreference, false);
  }

  get preferenceChanges(): Observable<ThemePreference> {
    return this.preference$.asObservable();
  }

  get activeTheme$(): Observable<ResolvedTheme> {
    return this.resolved$.asObservable();
  }

  get activeTheme(): ResolvedTheme {
    return this.resolved$.value;
  }

  get currentPreference(): ThemePreference {
    return this.preference$.value;
  }

  setTheme(preference: ThemePreference): void {
    this.applyTheme(preference);
  }

  private applyTheme(preference: ThemePreference, persist = true): void {
    const resolved = this.resolveTheme(preference);
    this.setHtmlClasses(preference, resolved);
    this.updateMetaThemeColor(resolved);

    if (persist) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, preference);
      } catch (error) {
        this.logger.warn('Theme preference could not be persisted', error);
      }
    }

    this.preference$.next(preference);
    this.resolved$.next(resolved);
    this.syncSystemListener(preference);
  }

  private resolveTheme(preference: ThemePreference): ResolvedTheme {
    if (preference === 'dark') {
      return 'dark';
    }

    if (preference === 'light') {
      return 'light';
    }

    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    return 'light';
  }

  private setHtmlClasses(preference: ThemePreference, resolved: ResolvedTheme): void {
    const html = this.documentRef.documentElement;
    html.classList.remove('theme-light', 'theme-dark');
    html.classList.add(resolved === 'dark' ? 'theme-dark' : 'theme-light');
    html.setAttribute('data-theme', resolved);
    html.setAttribute('data-theme-preference', preference);
    html.style.colorScheme = resolved;
  }

  private getStoredPreference(): ThemePreference | null {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    } catch (error) {
      this.logger.warn('Theme preference could not be read', error);
    }
    return null;
  }

  private syncSystemListener(preference: ThemePreference): void {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    if (preference !== 'system') {
      this.detachMediaListener();
      return;
    }

    if (!this.mediaQuery) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.attachMediaListener();
    }
  }

  private attachMediaListener(): void {
    if (!this.mediaQuery) {
      return;
    }

    const handler = this.handleSystemChange;
    if (typeof this.mediaQuery.addEventListener === 'function') {
      this.mediaQuery.addEventListener('change', handler);
    } else if (typeof this.mediaQuery.addListener === 'function') {
      this.mediaQuery.addListener(handler);
    }
  }

  private detachMediaListener(): void {
    if (!this.mediaQuery) {
      return;
    }

    const handler = this.handleSystemChange;
    if (typeof this.mediaQuery.removeEventListener === 'function') {
      this.mediaQuery.removeEventListener('change', handler);
    } else if (typeof this.mediaQuery.removeListener === 'function') {
      this.mediaQuery.removeListener(handler);
    }

    this.mediaQuery = null;
  }

  private handleSystemChange = (): void => {
    if (this.preference$.value !== 'system') {
      return;
    }

    const resolved = this.resolveTheme('system');
    this.setHtmlClasses('system', resolved);
    this.resolved$.next(resolved);
    this.updateMetaThemeColor(resolved);
  };

  private updateMetaThemeColor(resolved: ResolvedTheme): void {
    const meta = this.documentRef.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', resolved === 'dark' ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
    }
  }
}
