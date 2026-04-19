import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UpdatesService } from '@services/updates.service';

import type { IUpdateEntry, UpdateCategory } from '@interfaces/update.interface';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-updates',
  standalone: true,
  imports: [MatCardModule, MatDividerModule, MatIconModule],
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

  getCategoryIcon(category: UpdateCategory): string {
    const icons: Record<UpdateCategory, string> = {
      feature: 'new_releases',
      fix: 'build',
      improvement: 'trending_up',
      upgrade: 'system_update_alt',
      maintenance: 'tune'
    };
    return icons[category];
  }
}
