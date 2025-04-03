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
import { SearchInputComponent } from '@inputs/search-input/search-input.component';

// Misc
import { JwtHelperService, JWT_OPTIONS } from '@auth0/angular-jwt';
import { TripsTableBasicComponent } from '@components/trips-table-basic/trips-table-basic.component';
import { CustomRangePanelComponent } from '@components/custom-calendar-header/custom-range-panel/custom-range-panel.component';
import { CustomCalendarHeaderComponent } from '@components/custom-calendar-header/custom-calendar-header.component';
import { DataSyncModalComponent } from '@components/data-sync-modal/data-sync-modal.component';
import { PipesModule } from '@pipes/pipes.module';
import { ShiftsQuickViewComponent } from '@components/shifts-quick-view/shifts-quick-view.component';
import { ShiftTripsTableComponent } from '@components/shift-trips-table/shift-trips-table.component';
import { MatMenuModule } from '@angular/material/menu';
import { TripFormComponent } from '@components/trip-form/trip-form.component';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { NgxMatTimepickerModule } from 'ngx-mat-timepicker';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ServiceWorkerStatusComponent } from '@components/service-worker-status/service-worker-status.component';

@NgModule({
    declarations: [
        CurrentAverageComponent,
        HeaderComponent,
        ProfileComponent,
        TripsQuickViewComponent,
        ConfirmDialogComponent,
        AddressDialogComponent,
        GoogleAddressComponent,
        ShiftsQuickViewComponent,
        ShiftTripsTableComponent,
        TripFormComponent,
        TripsTableBasicComponent,
        TripsTableGroupComponent,
        TripsTableSimpleComponent,
        CustomRangePanelComponent,
        CustomCalendarHeaderComponent,
        DataSyncModalComponent
    ],
    exports: [
        CurrentAverageComponent,
        HeaderComponent,
        SearchInputComponent,
        ServiceWorkerStatusComponent,
        ShiftsQuickViewComponent,
        ShiftTripsTableComponent,
        TripFormComponent,
        TripsTableBasicComponent,
        TripsTableGroupComponent,
        TripsTableSimpleComponent,
        TripsQuickViewComponent,
        PipesModule
    ],
    imports: [
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatExpansionModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatMenuModule,
        MatSelectModule,
        MatSlideToggleModule,
        MatTableModule,
        MatToolbarModule,
        NgxMatTimepickerModule,
        PipesModule,
        ReactiveFormsModule,
        RouterModule,
        SearchInputComponent,
        ServiceWorkerStatusComponent,
        PipesModule
],
    providers: [
        { provide: JWT_OPTIONS, useValue: JWT_OPTIONS },
        JwtHelperService
    ],
    bootstrap: []
})
export class SharedModule { }
