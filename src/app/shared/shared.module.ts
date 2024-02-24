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
import { AddressInputComponent } from '@inputs/address-input/address-input.component';
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
import { CustomRangePanelComponent } from './components/custom-calendar-header/custom-range-panel/custom-range-panel.component';
import { CustomCalendarHeaderComponent } from './components/custom-calendar-header/custom-calendar-header.component';
import { LoadModalComponent } from './components/load-modal/load-modal.component';
import { SaveModalComponent } from './components/save-modal/save-modal.component';
import { PipesModule } from '@pipes/pipes.module';
import { SearchInputComponent } from '@inputs/search-input/search-input.component';


@NgModule({
    declarations: [
        CurrentAverageComponent,
        HeaderComponent,
        ProfileComponent,
        TripsQuickViewComponent,
        ConfirmDialogComponent,
        FocusScrollDirective,
        AddressDialogComponent,
        GoogleAddressComponent,
        TripsTableBasicComponent,
        TripsTableGroupComponent,
        TripsTableSimpleComponent,
        CustomRangePanelComponent,
        CustomCalendarHeaderComponent,
        LoadModalComponent,
        SaveModalComponent
    ],
    exports: [
        AddressInputComponent,
        CurrentAverageComponent,
        HeaderComponent,
        PipesModule,
        SearchInputComponent,
        TripsTableBasicComponent,
        TripsTableGroupComponent,
        TripsTableSimpleComponent,
        TripsQuickViewComponent,
        FocusScrollDirective
    ],
    imports: [
        AddressInputComponent,
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatTableModule,
        MatToolbarModule,
        PipesModule,
        ReactiveFormsModule,
        RouterModule,
        SearchInputComponent
    ],
    providers: [
        { provide: JWT_OPTIONS, useValue: JWT_OPTIONS },
        JwtHelperService
    ],
    bootstrap: []
})
export class SharedModule { }
