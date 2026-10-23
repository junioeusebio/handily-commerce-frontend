import { Component } from '@angular/core';
import { HandilyCommerceFrontend } from '@features/handily-commerce-frontend/handily-commerce-frontend';
import { ToastContainer } from '@shared';

@Component({
  selector: 'app-root',
  imports: [HandilyCommerceFrontend, ToastContainer],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
