import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { QuickComponent } from './pages/quick/quick.component';
import { ShiftsComponent } from './pages/shifts/shifts.component';
import { AuthGuardService } from './shared/services/auth-guard.service';
import { LoginComponent } from './pages/login/login.component';
import { SetupComponent } from './pages/sheet-setup/setup.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'quick', component: QuickComponent },
  { path: 'setup', component: SetupComponent },
  // { path: 'shifts', component: ShiftsComponent, canActivate: [AuthGuardService]  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
