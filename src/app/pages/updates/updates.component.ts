import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { UpdatesService } from '@services/updates.service';

import type { IUpdateEntry } from '@interfaces/update.interface';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-updates',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatDividerModule, MatIconModule],
  templateUrl: './updates.component.html',
  styleUrl: './updates.component.scss'
})
export class UpdatesComponent implements OnInit {
  updates = signal<IUpdateEntry[]>([]);
  private destroyRef = inject(DestroyRef);

  constructor(private updatesService: UpdatesService) { }

  ngOnInit(): void {
    this.updatesService.getUpdates()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((updates: IUpdateEntry[]) => {
        this.updates.set(updates);
      });
  }
}
