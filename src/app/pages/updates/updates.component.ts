import type { OnInit} from '@angular/core';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UpdatesService } from '@services/updates.service';

import type { IUpdateDetail, IUpdateEntry, UpdateCategory } from '@interfaces/sync/update.interface';
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
  private updatesService = inject(UpdatesService);

  public updates = signal<IUpdateEntry[]>([]);
  private destroyRef = inject(DestroyRef);

  public ngOnInit(): void {
    this.updatesService.getUpdates()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((updates: IUpdateEntry[]) => {
        this.updates.set(updates);
      });
  }

  public getCategoryIcon(category: UpdateCategory): string {
    const icons: Record<UpdateCategory, string> = {
      feature: 'new_releases',
      fix: 'build',
      improvement: 'trending_up',
      upgrade: 'system_update_alt',
      maintenance: 'tune'
    };
    return icons[category];
  }

  public trackByEntryDate(index: number, entry: IUpdateEntry): string | number {
    return entry?.date ?? index;
  }

  public trackByUpdateTitle(index: number, update: IUpdateDetail): string | number {
    return update?.title ?? index;
  }

  public trackByChange(index: number, change: string): string | number {
    return change ?? index;
  }

  public trackByPage(index: number, page: string): string | number {
    return page ?? index;
  }
}
