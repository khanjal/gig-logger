import { NgModule } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { TripsTableSimpleComponent } from './components/trips-table-simple/trips-table-simple.component';
import { HeaderComponent } from './header/header.component';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';

@NgModule({
    declarations: [
        HeaderComponent,
        TripsTableSimpleComponent
    ],
    imports: [
        CommonModule,
        MatIconModule,
        MatTableModule,
        MatToolbarModule,
        RouterModule
    ],
    exports: [
        HeaderComponent, 
        TripsTableSimpleComponent
    ],
    providers: [],
    bootstrap: []
})
export class SharedModule { }
