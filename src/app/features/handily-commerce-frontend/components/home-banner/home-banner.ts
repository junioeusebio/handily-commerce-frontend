import { ChangeDetectionStrategy, Component, output } from '@angular/core';

import { Button } from '@shared';

@Component({
  selector: 'app-home-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button],
  templateUrl: './home-banner.html',
})
export class HomeBanner {
  readonly requestLead = output<MouseEvent>();
}
