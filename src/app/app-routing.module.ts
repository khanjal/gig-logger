import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { QuickComponent } from './pages/quick/quick.component';
import { LoginComponent } from './pages/login/login.component';
import { SetupComponent } from './pages/sheet-setup/setup.component';
import { DefaultSheetGuard } from '@guards/default-sheet/default-sheet.guard';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'quick', component: QuickComponent, canActivate: [DefaultSheetGuard] },
  { path: 'setup', component: SetupComponent },
  // { path: 'shifts', component: ShiftsComponent, canActivate: [AuthGuardService]  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
