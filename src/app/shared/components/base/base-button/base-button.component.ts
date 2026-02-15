import { Component, EventEmitter, Input, Output, ElementRef, Renderer2, AfterViewChecked, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';

export type ButtonVariant = 'primary' | 'secondary' | 'outlined' | 'danger' | 'icon';
export type ButtonSize = 'sm' | 'md' | 'lg';

// Fab styles
export type FabStyle = 'regular' | 'mini' | 'micro';

@Component({
  selector: 'app-base-button',
  standalone: true,
  imports: [CommonModule, MatIcon],
  templateUrl: './base-button.component.html',
  styleUrl: './base-button.component.scss'
})
/**
 * BaseButtonComponent
 *
 * Reusable button used across the app. Supports styling variants, sizes,
 * icon placement, FAB (floating action button) modes including `mini` and
 * `extended`, loading state, full-width behavior, and no-background mode
 * for minimal icon buttons in input fields.
 *
 * Important: boolean inputs must be passed with property binding
 * (e.g. `[fab]="true"`) to avoid string/boolean coercion issues in templates.
 *
 * Examples (use specialized base components):
 * - Mini FAB toggle:
 *   <app-base-fab
 *     fabStyle="mini"
 *     [variant]="'secondary'"
 *     [icon]="'drive_eta'"
 *     (clicked)="toggle()">
 *   </app-base-fab>
 * - Extended FAB with label:
 *   <app-base-extended-fab [icon]="'add'">New</app-base-extended-fab>
 * - Icon-only button with loading spinner:
 *   <app-base-icon variant="icon" [loading]="isLoading"></app-base-icon>
 * - No background icon button (for input fields):
 *   <app-base-fab
 *     fabStyle="mini"
 *     [noBackground]="true"
 *     matSuffix
 *     (clicked)="clear()"
 *     [icon]="'clear'"
 *     [iconColor]="'var(--error-500)'"></app-base-fab>
 *
 * Emits `clicked` when activated (unless `disabled` or `loading`).
 */
export class BaseButtonComponent {
  /** Button variant style */
  @Input() variant: ButtonVariant = 'primary';

  /** Button size */
  @Input() size: ButtonSize = 'md';

  /** Icon name (Material icon) */
  @Input() icon?: string;

  /** Icon position (left/right) */
  @Input() iconPosition: 'left' | 'right' = 'left';

  /** Icon color (CSS color value or CSS variable) */
  @Input() iconColor?: string;

  /** Render as a floating action button (circular) */
  /**
   * Render as a floating action button (circular). Use `[fab]="true"`.
   */
  @Input() fab: boolean = false;

  /** Fab style: regular or mini */
  @Input() fabStyle: FabStyle = 'regular';

  /** Extended fab shows label next to icon */
  @Input() extended: boolean = false;

  /** Disabled state */
  @Input() disabled = false;

  /** Loading state - shows spinner and disables button */
  @Input() loading = false;

  /** Native button type ('button' | 'submit' | 'reset') forwarded to native element */
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  /** Full width button */
  @Input() fullWidth = false;

  /** No background - transparent button with minimal hover effect */
  @Input() noBackground = false;

  /** Click event emitter */
  @Output() clicked = new EventEmitter<void>();

  private resizeHandler = () => this.updateIconOnlyClass();

  constructor(private el: ElementRef, private renderer: Renderer2) {
    window.addEventListener('resize', this.resizeHandler);
  }

  ngAfterViewChecked(): void {
    this.updateIconOnlyClass();
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeHandler);
  }

  private updateIconOnlyClass(): void {
    const host: HTMLElement = this.el.nativeElement as HTMLElement;
    const contentEl = host.querySelector('.btn-text') as HTMLElement | null;
    const hasIcon = !!this.icon;

    let hasVisibleText = false;
    if (contentEl) {
      const text = contentEl.textContent?.trim() ?? '';
      if (!text) {
        hasVisibleText = false;
      } else if (this.loading) {
        hasVisibleText = false;
      } else if (this.fab && !this.extended) {
        hasVisibleText = false;
      } else {
        hasVisibleText = true;
      }
    }

    const innerBtn = host.querySelector('button') as HTMLElement | null;
    if (innerBtn) {
      if (hasIcon && !hasVisibleText) {
        this.renderer.addClass(innerBtn, 'btn-icon-only');
      } else {
        this.renderer.removeClass(innerBtn, 'btn-icon-only');
      }
    }
  }

  onButtonClick(): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit();
    }
  }

  get buttonClasses(): string {
    const classes = [
      'app-base-button',
      `btn-${this.variant}`,
      `btn-${this.size}`,
      this.fab ? 'btn-fab' : '',
      this.fab && this.fabStyle === 'mini' ? 'btn-mini' : '',
      this.fab && this.fabStyle === 'micro' ? 'btn-micro' : '',
      this.extended ? 'btn-extended' : '',
      this.disabled ? 'btn-disabled' : '',
      this.loading ? 'btn-loading' : '',
      this.fullWidth ? 'btn-full-width' : '',
      this.noBackground ? 'btn-no-background' : ''
    ];
    return classes.filter(c => c).join(' ');
  }
}
