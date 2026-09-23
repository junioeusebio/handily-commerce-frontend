import { ChangeDetectionStrategy, Component, output } from '@angular/core';

import { Button, Card } from '@shared';

@Component({
  selector: 'app-home-solutions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Card],
  templateUrl: './home-solutions.html',
})
export class HomeSolutions {
  readonly requestLead = output<MouseEvent>();
}
