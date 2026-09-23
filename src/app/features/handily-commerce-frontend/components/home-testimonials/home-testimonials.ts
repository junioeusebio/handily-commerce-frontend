import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-home-testimonials',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-testimonials.html',
})
export class HomeTestimonials {}
