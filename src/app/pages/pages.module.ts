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
import { MAT_SNACK_BAR_DEFAULT_OPTIONS, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { QuickComponent } from './quick/quick.component';
import { SharedModule } from '../shared/shared.module';
import { QuickFormComponent } from './quick/quick-form/quick-form.component';
import { LoginComponent } from './login/login.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { SheetsComponent } from './sheets/sheets.component';
import { SheetSetupComponent } from './sheet-setup/sheet-setup.component';
import { SheetSetupFormComponent } from './sheet-setup/sheet-setup-form/sheet-setup-form.component';
import { SheetSetupTableComponent } from './sheet-setup/sheet-setup-table/sheet-setup-table.component';
import { MatCardModule } from '@angular/material/card';

@NgModule({
  declarations: [
    HomeComponent,
    QuickComponent,
    QuickFormComponent,
    ShiftsComponent,
    LoginComponent,
    SheetsComponent,
    SheetSetupComponent,
    SheetSetupFormComponent,
    SheetSetupTableComponent
  ],
  imports: [
    CommonModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatListModule,
    MatIconModule,
    MatInputModule,
    MatSnackBarModule,
    MatTableModule,
    ReactiveFormsModule,
    ScrollingModule,
    SharedModule,
  ],
  providers: [
      {provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: {duration: 2500}}
  ],
  bootstrap: []
})
export class PagesModule { }
