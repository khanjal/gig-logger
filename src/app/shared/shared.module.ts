import { NgModule } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { TripsTableSimpleComponent } from '@components/trips-table-simple/trips-table-simple.component';
import { HeaderComponent } from './header/header.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { TripsQuickViewComponent } from '@components/trips-quick-view/trips-quick-view.component';
import { ProfileComponent } from '@components/profile/profile.component';
import { JwtHelperService, JWT_OPTIONS } from '@auth0/angular-jwt';
import { MatButtonModule } from '@angular/material/button';
import { TruncatePipe } from '@pipes/truncate.pipe';
import { CurrentAverageComponent } from '@components/current-average/current-average.component';
import { NoSecondsPipe } from '@pipes/no-seconds.pipe';
import { ConfirmDialogComponent } from '@components/confirm-dialog/confirm-dialog.component';
import { FocusScrollDirective } from '@directives/focus-scroll/focus-scroll.directive';
import { ShortAddressPipe } from '@pipes/short-address.pipe';
import { TripsTableGroupComponent } from './components/trips-table-group/trips-table-group.component';
import { AddressDialogComponent } from './components/address-dialog/address-dialog.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';

@NgModule({
    declarations: [
        CurrentAverageComponent,
        HeaderComponent,
        ProfileComponent,
        TripsTableSimpleComponent,
        TripsQuickViewComponent,
        NoSecondsPipe,
        TruncatePipe,
        ShortAddressPipe,
        ConfirmDialogComponent,
        FocusScrollDirective,
        TripsTableGroupComponent,
        AddressDialogComponent
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
        TripsTableSimpleComponent,
        TripsTableGroupComponent,
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
