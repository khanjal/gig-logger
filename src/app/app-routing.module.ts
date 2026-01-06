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
import { canActivateAuth } from '@guards/auth-guard.service';
import { ExpensesComponent } from './pages/expenses/expenses.component';
import { MetricsComponent } from './pages/metrics/metrics.component';
import { DiagnosticsComponent } from './pages/diagnostics/diagnostics.component';
import { SearchComponent } from './pages/search/search.component';
import { UpdatesComponent } from './pages/updates/updates.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'calculator', component: CalculatorComponent },
  { path: 'policy', component: PolicyComponent },
  { path: 'updates', component: UpdatesComponent },
  { path: 'search', component: SearchComponent, canActivate: [canActivateSheet, canActivateAuth] },
  { path: 'trips', component: TripComponent, canActivate: [canActivateSheet, canActivateAuth] },
  { path: 'trips/edit/:id', component: TripComponent, canActivate: [canActivateSheet, canActivateAuth] },
  { path: 'setup', component: SetupComponent },
  { path: 'shifts', component: ShiftsComponent, canActivate: [canActivateSheet, canActivateAuth] },
  { path: 'shifts/edit/:id', component: ShiftsComponent, canActivate: [canActivateSheet, canActivateAuth] },
  { path: 'stats', component: StatsComponent, canActivate: [canActivateSheet, canActivateAuth] },
  { path: 'terms', component: TermsComponent},
  { path: 'expenses', component: ExpensesComponent, canActivate: [canActivateSheet, canActivateAuth] },
  { path: 'metrics', component: MetricsComponent },
  { path: 'diagnostics', component: DiagnosticsComponent, canActivate: [canActivateSheet, canActivateAuth] },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
