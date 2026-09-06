import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-handily-commerce-frontend',
  imports: [],
  templateUrl: './handily-commerce-frontend.html',
  styleUrl: './handily-commerce-frontend.css',
})
export class HandilyCommerceFrontend {
  protected readonly title = signal('Handily Commerce Frontend');
}
