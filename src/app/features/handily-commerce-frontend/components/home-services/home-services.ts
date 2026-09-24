import { ChangeDetectionStrategy, Component, output } from '@angular/core';

import { Button, Card } from '@shared';

@Component({
  selector: 'app-home-services',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Card],
  templateUrl: './home-services.html',
})
export class HomeServices {
  readonly requestLead = output<MouseEvent>();
}
