import { Component } from '@angular/core';
import { HandilyCommerceFrontend } from '@features/handily-commerce-frontend/handily-commerce-frontend';

@Component({
  selector: 'app-root',
  imports: [HandilyCommerceFrontend],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
