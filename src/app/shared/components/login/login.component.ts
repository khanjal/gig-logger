import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthGoogleService } from '@services/auth-google.service';
import { Subject, takeUntil } from 'rxjs';

const MODULES: any[] = [
  CommonModule,
  MatButtonModule,
  MatIconModule,
  MatFormFieldModule,
  FormsModule,
  ReactiveFormsModule,
];

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MODULES],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  isAuthenticated = false;
  private destroy$ = new Subject<void>();

  constructor(protected authService: AuthGoogleService) {}

  async ngOnInit() {
    // Check authentication state (this may trigger a refresh)
    this.isAuthenticated = await this.authService.isAuthenticated();

    // Subscribe to authentication changes
    this.authService.profile$
      .pipe(takeUntil(this.destroy$))
      .subscribe(profile => {
        this.isAuthenticated = !!profile;
      });
  }

  signInWithGoogle() {
    this.authService.login();
  }

  async signOut() {
    await this.authService.logout();
  }
}
