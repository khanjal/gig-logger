import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { QuickComponent } from './pages/quick/quick.component';
import { ShiftsComponent } from './pages/shifts/shifts.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'quick', component: QuickComponent },
  { path: 'shifts', component: ShiftsComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
