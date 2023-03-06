import { NgModule } from '@angular/core';
import { HomeComponent } from './home/home.component';
import { ShiftsComponent } from './shifts/shifts.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';

@NgModule({
  declarations: [
    HomeComponent,
    ShiftsComponent
  ],
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: []
})
export class PagesModule { }
