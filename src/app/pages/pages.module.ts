import { NgModule } from '@angular/core';
import { HomeComponent } from './home/home.component';
import { ShiftsComponent } from './shifts/shifts.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { QuickComponent } from './quick/quick.component';
import { SharedModule } from '../shared/shared.module';
import { QuickFormComponent } from './quick/quick-form/quick-form.component';
import { GoogleLoginProvider, GoogleSigninButtonModule, SocialAuthServiceConfig } from '@abacritt/angularx-social-login';

@NgModule({
  declarations: [
    HomeComponent,
    QuickComponent,
    ShiftsComponent,
    QuickFormComponent
  ],
  imports: [
    CommonModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatListModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    ReactiveFormsModule,
    SharedModule,
    GoogleSigninButtonModule
  ],
  providers: [
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
          autoLogin: false,
          providers: [
          {
              id: GoogleLoginProvider.PROVIDER_ID,
              provider: new GoogleLoginProvider('1037406003641-06neo4a41bh84equ3tafo5dgl2ftvopm.apps.googleusercontent.com'),
          },
      ],
      } as SocialAuthServiceConfig,
  },
  ],
  bootstrap: []
})
export class PagesModule { }
