import { Component, OnInit, OnDestroy } from '@angular/core';
import { HeaderComponent } from './shared/header/header.component';
import { CommonModule } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatButton } from '@angular/material/button';
import { Subscription } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, CommonModule, MatProgressSpinner, MatButton],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'raptor-gig';
  isLoading = true;
  hasError = false;
  private routerSubscription?: Subscription;

  constructor(private router: Router) {}

  ngOnInit() {
    // Hide loading state after a shorter timeout
    setTimeout(() => {
      this.isLoading = false;
    }, 3000); // Reduced to 3 seconds

    // Listen for navigation events to hide loading
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        // Add small delay to ensure smooth transition
        setTimeout(() => {
          this.isLoading = false;
        }, 100);
      });

    // Hide loading state immediately if page is already loaded
    if (document.readyState === 'complete') {
      this.isLoading = false;
    } else {
      window.addEventListener('load', () => {
        this.isLoading = false;
      });
    }
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  onHeaderError() {
    this.hasError = true;
    this.isLoading = false;
  }

  private _reloadWindow: () => void = () => window.location.reload();

  // Exposed to tests so we can avoid spying on the non-configurable
  // `window.location.reload` in constrained environments.
  setReloadFn(fn: () => void) {
    this._reloadWindow = fn;
  }

  reload() {
    this._reloadWindow();
  }
}
