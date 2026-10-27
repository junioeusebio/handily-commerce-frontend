import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

import { Button } from '@shared';

@Component({
  selector: 'app-home-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, Button],
  templateUrl: './home-nav.html',
})
export class HomeNav {
  readonly leadOpen = input(false);
  readonly requestLead = output<MouseEvent>();
}
