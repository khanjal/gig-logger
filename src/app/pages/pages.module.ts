import { NgModule } from '@angular/core';
import { HomeComponent } from './home/home.component';
import { ShiftsComponent } from './shifts/shifts.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';

@NgModule({
  declarations: [
    HomeComponent,
    ShiftsComponent
  ],
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: []
})
export class PagesModule { }
