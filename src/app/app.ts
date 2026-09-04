import { Component } from '@angular/core';
import { HandilyWorld } from '@features/handily-world/handily-world';

@Component({
  selector: 'app-root',
  imports: [HandilyWorld],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
