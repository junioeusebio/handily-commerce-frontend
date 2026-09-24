import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Card } from '@shared';

@Component({
  selector: 'app-home-about',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card],
  templateUrl: './home-about.html',
})
export class HomeAbout {}
