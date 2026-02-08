import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthGoogleService } from '@services/auth-google.service';
import { BaseRectButtonComponent, BaseCardComponent } from '@components/base';

const MODULES: any[] = [
  CommonModule,
  FormsModule,
  ReactiveFormsModule,
  BaseRectButtonComponent,
  BaseCardComponent,
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

  constructor(protected authService: AuthGoogleService) {}

  async ngOnInit() {
    // Check authentication state (this may trigger a refresh)
    this.isAuthenticated = await this.authService.isAuthenticated();
  }

  signInWithGoogle() {
    this.authService.login();
  }

  async signOut() {
    await this.authService.logout();
    window.location.reload();
  }
}
