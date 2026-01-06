import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SyncStatusIndicatorComponent } from '@components/sync/sync-status-indicator/sync-status-indicator.component';

@Component({
  selector: 'app-quick-controls',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatMenuModule, MatButtonModule, MatTooltipModule, SyncStatusIndicatorComponent],
  templateUrl: './quick-controls.component.html',
  styleUrl: './quick-controls.component.scss'
})
export class QuickControlsComponent { }
