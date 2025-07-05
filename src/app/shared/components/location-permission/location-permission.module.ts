import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocationPermissionComponent } from './location-permission.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@NgModule({
  declarations: [LocationPermissionComponent],
  imports: [CommonModule, MatButtonModule, MatCardModule],
  exports: [LocationPermissionComponent]
})
export class LocationPermissionModule {}
