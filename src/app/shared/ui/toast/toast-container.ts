import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ToastService, type ToastType } from './toast.service';

const TONE: Record<ToastType, string> = {
  success: 'border-green-700 bg-green-600 text-white',
  error: 'border-red-800 bg-red-700 text-white',
  info: 'border-[#0b1f3a] bg-[#0b1f3a] text-white',
};

/** Pilha de toasts no canto superior direito. Coloque uma única vez no template raiz. */
@Component({
  selector: 'app-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast-container.html',
})
export class ToastContainer {
  protected readonly toast = inject(ToastService);
  protected readonly tone = TONE;
}
