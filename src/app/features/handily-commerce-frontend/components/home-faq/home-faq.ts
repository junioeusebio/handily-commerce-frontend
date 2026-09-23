import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-home-faq',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-faq.html',
})
export class HomeFaq {}
