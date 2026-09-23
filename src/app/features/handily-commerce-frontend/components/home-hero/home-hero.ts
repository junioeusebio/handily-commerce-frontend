import { ChangeDetectionStrategy, Component, output } from '@angular/core';

import { Button } from '@shared';

@Component({
  selector: 'app-home-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button],
  templateUrl: './home-hero.html',
})
export class HomeHero {
  readonly requestLead = output<MouseEvent>();
}
