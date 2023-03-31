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
import { ProfileComponent } from './components/profile/profile.component';
import { SocialLoginModule } from '@abacritt/angularx-social-login';
import { JwtHelperService, JWT_OPTIONS } from '@auth0/angular-jwt';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
    declarations: [
        HeaderComponent,
        ProfileComponent,
        TripsTableSimpleComponent,
        TripsQuickViewComponent,
        TruncatePipe
    ],
    imports: [
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatTableModule,
        MatToolbarModule,
        RouterModule,
        SocialLoginModule
    ],
    exports: [
        HeaderComponent,
        TripsTableSimpleComponent,
        TripsQuickViewComponent
    ],
    providers: [
        { provide: JWT_OPTIONS, useValue: JWT_OPTIONS },
        JwtHelperService
    ],
    bootstrap: []
})
export class SharedModule { }
