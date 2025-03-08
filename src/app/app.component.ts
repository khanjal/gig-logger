import { Component } from '@angular/core';
import { HeaderComponent } from './shared/header/header.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: true,
    imports: [HeaderComponent]
})
export class AppComponent {
  title = 'gig-worker';
}
