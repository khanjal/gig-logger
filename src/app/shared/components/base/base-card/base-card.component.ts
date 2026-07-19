import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-base-card',
  standalone: true,
  imports: [CommonModule, MatIcon],
  templateUrl: './base-card.component.html',
  styleUrl: './base-card.component.scss'
})
export class BaseCardComponent {
/**
 * BaseCardComponent
 *
 * Lightweight card container used for consistent surfaces across the app.
 *
 * Inputs:
 * - `title`, `subtitle`, `titleIcon` : header content
 * - `variant` : visual style ('default' | 'elevated' | 'outlined')
 * - `padding` : controls internal padding ('sm' | 'md' | 'lg')
 *
 * Example:
 * <app-base-card title="Location" [titleIcon]="'location_on'" variant="elevated" padding="md">
 *   <!-- content -->
 * </app-base-card>
 */
  /** Card title */
  @Input() public title?: string;

  /** Icon to display in title (Material icon name) */
  @Input() public titleIcon?: string;

  /** Subtitle text */
  @Input() public subtitle?: string;

  /** Variant: default, elevated, outlined, warning */
  @Input() public variant: 'default' | 'elevated' | 'outlined' | 'warning' = 'default';

  /** Padding size: sm, md, lg */
  @Input() public padding: 'sm' | 'md' | 'lg' = 'md';
}
