import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SessionRefreshService } from './shared/session-refresh.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
})
export class AppComponent {
  constructor() {
    inject(SessionRefreshService).start();
  }
}
