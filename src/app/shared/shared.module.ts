import { NgModule } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { TripsTableSimpleComponent } from './components/trips-table-simple/trips-table-simple.component';
import { HeaderComponent } from './header/header.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { TruncatePipe } from './pipes/transform.pipe';
import { TripsQuickViewComponent } from './components/trips-quick-view/trips-quick-view.component';
import { LoginComponent } from '../shared/components/login/login.component';
import { GoogleLoginProvider, GoogleSigninButtonModule, SocialAuthServiceConfig, SocialLoginModule } from '@abacritt/angularx-social-login';
import { JwtHelperService, JWT_OPTIONS } from '@auth0/angular-jwt';

@NgModule({
    declarations: [
        HeaderComponent,
        LoginComponent,
        TripsTableSimpleComponent,
        TripsQuickViewComponent,
        TruncatePipe
    ],
    imports: [
        CommonModule,
        MatCardModule,
        MatIconModule,
        MatTableModule,
        MatToolbarModule,
        RouterModule,
        SocialLoginModule,
        GoogleSigninButtonModule
    ],
    exports: [
        HeaderComponent,
        TripsTableSimpleComponent,
        TripsQuickViewComponent
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
        { provide: JWT_OPTIONS, useValue: JWT_OPTIONS },
        JwtHelperService
    ],
    bootstrap: []
})
export class SharedModule { }
