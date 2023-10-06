import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Components
import { GoogleAddressComponent } from './components/google-address/google-address.component';
import { TripsTableGroupComponent } from './components/trips-table-group/trips-table-group.component';
import { AddressDialogComponent } from './components/address-dialog/address-dialog.component';
import { ConfirmDialogComponent } from '@components/confirm-dialog/confirm-dialog.component';
import { CurrentAverageComponent } from '@components/current-average/current-average.component';
import { TripsQuickViewComponent } from '@components/trips-quick-view/trips-quick-view.component';
import { ProfileComponent } from '@components/profile/profile.component';
import { TripsTableSimpleComponent } from '@components/trips-table-simple/trips-table-simple.component';
import { HeaderComponent } from './header/header.component';

// Directives
import { FocusScrollDirective } from '@directives/focus-scroll/focus-scroll.directive';

// Pipes
import { NoSecondsPipe } from '@pipes/no-seconds.pipe';
import { ShortAddressPipe } from '@pipes/short-address.pipe';
import { TruncatePipe } from '@pipes/truncate.pipe';

import { JwtHelperService, JWT_OPTIONS } from '@auth0/angular-jwt';
import { TripsTableBasicComponent } from './components/trips-table-basic/trips-table-basic.component';

@NgModule({
    declarations: [
        CurrentAverageComponent,
        HeaderComponent,
        ProfileComponent,
        TripsQuickViewComponent,
        NoSecondsPipe,
        TruncatePipe,
        ShortAddressPipe,
        ConfirmDialogComponent,
        FocusScrollDirective,
        AddressDialogComponent,
        GoogleAddressComponent,
        TripsTableBasicComponent,
        TripsTableGroupComponent,
        TripsTableSimpleComponent
    ],
    imports: [
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatTableModule,
        MatToolbarModule,
        ReactiveFormsModule,
        RouterModule
    ],
    exports: [
        CurrentAverageComponent,
        HeaderComponent,
        NoSecondsPipe,
        ShortAddressPipe,
        TripsTableBasicComponent,
        TripsTableGroupComponent,
        TripsTableSimpleComponent,
        TripsQuickViewComponent,
        TruncatePipe,
        FocusScrollDirective
    ],
    providers: [
        { provide: JWT_OPTIONS, useValue: JWT_OPTIONS },
        JwtHelperService
    ],
    bootstrap: []
})
export class SharedModule { }
