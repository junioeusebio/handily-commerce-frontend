import { Component } from '@angular/core';
import { HelloWorld } from '@features/hello-world/hello-world';

@Component({
  selector: 'app-root',
  imports: [HelloWorld],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
