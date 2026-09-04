import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-handily-world',
  imports: [],
  templateUrl: './handily-world.html',
  styleUrl: './handily-world.css',
})
export class HandilyWorld {
  protected readonly title = signal('Handily World');
}
