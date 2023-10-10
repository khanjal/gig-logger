import { NgModule } from '@angular/core';
import { HomeComponent } from './home/home.component';
import { ShiftsComponent } from './shifts/shifts.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { QuickComponent } from './quick/quick.component';
import { SharedModule } from '../shared/shared.module';
import { QuickFormComponent } from './quick/quick-form/quick-form.component';
import { LoginComponent } from './login/login.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatCardModule } from '@angular/material/card';
import { SetupComponent } from './sheet-setup/setup.component';
import { SheetAddFormComponent } from './sheet-setup/sheet-add-form/sheet-add-form.component';
import { SheetQuickViewComponent } from './sheet-setup/sheet-quick-view/sheet-quick-view.component';
import { MAT_DIALOG_DATA, MAT_DIALOG_DEFAULT_OPTIONS, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CalculatorComponent } from './calculator/calculator.component';
import { UberCalculatorComponent } from './calculator/uber-calculator/uber-calculator.component';
import { SheetQuotaComponent } from './sheet-setup/sheet-quota/sheet-quota.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {MatExpansionModule} from '@angular/material/expansion';
import { StatsComponent } from './stats/stats.component';
import { ServiceStatsComponent } from './stats/service-stats/service-stats.component';

@NgModule({
  declarations: [
    HomeComponent,
    QuickComponent,
    QuickFormComponent,
    ShiftsComponent,
    LoginComponent,
    SetupComponent,
    SheetAddFormComponent,
    SheetQuickViewComponent,
    CalculatorComponent,
    UberCalculatorComponent,
    SheetQuotaComponent,
    StatsComponent,
    ServiceStatsComponent
  ],
  imports: [
    CommonModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatMenuModule,
    MatSelectModule,
    MatListModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTableModule,
    ReactiveFormsModule,
    ScrollingModule,
    SharedModule
  ],
  exports: [
  ],
  providers: [
      {provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: {duration: 2500}},
      {provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: {hasBackdrop: true}},
      {provide: MAT_DIALOG_DATA, useValue: {}},
      {provide: MatDialogRef, useValue: {}}
  ],
  bootstrap: []
})
export class PagesModule { }
