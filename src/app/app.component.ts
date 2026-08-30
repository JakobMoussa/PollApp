import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * The root component of the application.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'poll-app';
}
