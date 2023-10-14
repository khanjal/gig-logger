import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { QuickComponent } from './pages/quick/quick.component';
import { LoginComponent } from './pages/login/login.component';
import { SetupComponent } from './pages/sheet-setup/setup.component';
import { DefaultSheetGuard } from '@guards/default-sheet/default-sheet.guard';
import { CalculatorComponent } from './pages/calculator/calculator.component';
import { StatsComponent } from './pages/stats/stats.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'calculator', component: CalculatorComponent },
  { path: 'login', component: LoginComponent },
  { path: 'quick', component: QuickComponent, canActivate: [DefaultSheetGuard] },
  { path: 'setup', component: SetupComponent },
  { path: 'stats', component: StatsComponent, canActivate: [DefaultSheetGuard] },
  // { path: 'shifts', component: ShiftsComponent, canActivate: [AuthGuardService]  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
