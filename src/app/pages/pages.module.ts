import { NgModule } from '@angular/core';
import { HomeComponent } from './home/home.component';
import { ShiftsComponent } from './shifts/shifts.component';
import { ReactiveFormsModule } from '@angular/forms';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';
import { QuickComponent } from './quick/quick.component';

@NgModule({
  declarations: [
    HomeComponent,
    QuickComponent,
    ShiftsComponent
  ],
  imports: [
    CommonModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatSelectModule,
    MatListModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  providers: [],
  bootstrap: []
})
export class PagesModule { }
