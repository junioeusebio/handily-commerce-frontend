import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Button } from '@shared';

@Component({
  selector: 'app-home-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button],
  templateUrl: './home-footer.html',
})
export class HomeFooter {
  readonly feVersion = input.required<string>();
  readonly apiVersionLabel = input.required<string>();
  readonly apiStatusLabel = input.required<string>();
  readonly contactEmail = input('ajksys@protonmail.com');
  readonly requestLead = output<MouseEvent>();
}
