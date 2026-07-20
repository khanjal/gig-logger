import type { OnInit, Type} from '@angular/core';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthGoogleService } from '@services/auth-google.service';
import { BaseRectButtonComponent, BaseCardComponent } from '@components/base';

const MODULES: Type<unknown>[] = [
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
export class LoginComponent implements OnInit {
  protected authService = inject(AuthGoogleService);

  public isAuthenticated = false;

  public async ngOnInit() {
    // Check authentication state (this may trigger a refresh)
    this.isAuthenticated = await this.authService.canSync();
  }

  public signInWithGoogle() {
    this.authService.login();
  }

  public async signOut() {
    await this.authService.logout();
    window.location.reload();
  }
}
