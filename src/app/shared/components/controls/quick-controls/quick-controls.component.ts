import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule, MatSlideToggleChange } from '@angular/material/slide-toggle';
import { ThemePreference } from '@services/theme.service';
import { BaseButtonComponent } from '@components/base';

@Component({
  selector: 'app-quick-controls',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatSlideToggleModule, BaseButtonComponent],
  templateUrl: './quick-controls.component.html',
  styleUrl: './quick-controls.component.scss'
})
export class QuickControlsComponent {
  @Input() hasUnsavedChanges = false;
  @Input() status: 'idle' | 'syncing' | 'success' | 'error' | 'disabled' = 'idle';
  @Input() autoSaveEnabled = false;
  @Input() themePreference: ThemePreference = 'system';
  @Output() save = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();
  @Output() autoSaveToggle = new EventEmitter<boolean>();
  @Output() themeChange = new EventEmitter<ThemePreference>();

  private themeCycle: ThemePreference[] = ['light', 'dark', 'system'];

  onThemeCycle(): void {
    const currentIndex = this.themeCycle.indexOf(this.themePreference);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % this.themeCycle.length;
    const nextTheme = this.themeCycle[nextIndex];
    this.themeChange.emit(nextTheme);
  }

  onSaveClick(): void {
    if (this.status === 'syncing') return;
    this.save.emit();
  }

  onRefreshClick(): void {
    if (this.status === 'syncing') return;
    this.refresh.emit();
  }

  onAutoSaveToggle(event: MatSlideToggleChange): void {
    this.autoSaveToggle.emit(event.checked);
  }

  onThemeSelect(theme: ThemePreference, event: MouseEvent): void {
    event.stopPropagation();
    this.themeChange.emit(theme);
  }
}
