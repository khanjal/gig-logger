import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthGoogleService } from '@services/auth-google.service';

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
  constructor(protected authService: AuthGoogleService) {}

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  signInWithGoogle() {
    this.authService.login();
  }

  signOut() {
    this.authService.logout();
  }
}
