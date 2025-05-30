import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { TripComponent } from './pages/trips/trips.component';
import { SetupComponent } from './pages/setup/setup.component';
import { canActivateSheet } from '@guards/default-sheet/default-sheet.guard';
import { CalculatorComponent } from './pages/calculator/calculator.component';
import { StatsComponent } from './pages/stats/stats.component';
import { ShiftsComponent } from './pages/shifts/shifts.component';
import { TermsComponent } from './pages/terms/terms.component';
import { PolicyComponent } from './pages/policy/policy.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'calculator', component: CalculatorComponent },
  { path: 'policy', component: PolicyComponent },
  { path: 'trips', component: TripComponent, canActivate: [canActivateSheet] },
  { path: 'setup', component: SetupComponent },
  { path: 'shifts', component: ShiftsComponent, canActivate: [canActivateSheet] },
  { path: 'stats', component: StatsComponent, canActivate: [canActivateSheet] },
  { path: 'terms', component: TermsComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
