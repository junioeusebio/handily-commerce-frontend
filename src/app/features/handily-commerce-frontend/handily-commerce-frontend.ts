import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, retry } from 'rxjs';

import { APP_VERSION } from '@core';
import { ApiStatusService } from '@domains';

import { HomeAbout } from './components/home-about/home-about';
import { HomeBanner } from './components/home-banner/home-banner';
import { HomeFaq } from './components/home-faq/home-faq';
import { HomeFooter } from './components/home-footer/home-footer';
import { HomeHero } from './components/home-hero/home-hero';
import { HomeNav } from './components/home-nav/home-nav';
import { HomeServices } from './components/home-services/home-services';
import { HomeSolutions } from './components/home-solutions/home-solutions';
import { HomeTestimonials } from './components/home-testimonials/home-testimonials';
import { LeadDialog } from './components/lead-dialog/lead-dialog';

@Component({
  selector: 'app-handily-commerce-frontend',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HomeNav,
    HomeHero,
    HomeAbout,
    HomeServices,
    HomeSolutions,
    HomeBanner,
    HomeTestimonials,
    HomeFaq,
    HomeFooter,
    LeadDialog,
  ],
  templateUrl: './handily-commerce-frontend.html',
  styleUrl: './handily-commerce-frontend.scss',
})
export class HandilyCommerceFrontend implements OnInit {
  private readonly apiStatus = inject(ApiStatusService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly leadDialog = viewChild.required(LeadDialog);

  protected readonly feVersion = APP_VERSION;
  /** `—` while loading, API version string on success, `erro` on failure. */
  protected readonly apiVersionLabel = signal('—');
  /** `—` while loading, `ok` when ping succeeds, `erro` on failure. */
  protected readonly apiStatusLabel = signal('—');
  protected readonly leadOpen = signal(false);
  protected readonly contactEmail = 'ajksys@protonmail.com';

  ngOnInit(): void {
    this.loadApiVersion();
    this.loadPingStatus();
  }

  protected openLead(event?: Event): void {
    this.leadDialog().openFrom(event);
  }

  protected closeLead(): void {
    this.leadDialog().close();
  }

  protected onLeadSubmitted(payload: {
    nome: string;
    contato: string;
    solicitacao: string;
  }): void {
    const subject = encodeURIComponent(`Orçamento Handily — ${payload.nome}`);
    const body = encodeURIComponent(
      `Nome: ${payload.nome}\nContato: ${payload.contato}\n\nSolicitação:\n${payload.solicitacao}`,
    );
    window.location.href = `mailto:${this.contactEmail}?subject=${subject}&body=${body}`;
    this.closeLead();
  }

  private loadApiVersion(): void {
    this.apiStatus
      .apiVersion()
      .pipe(
        retry({ count: 2 }),
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((body) => {
        if (body?.version) {
          this.apiVersionLabel.set(body.version);
        } else {
          this.apiVersionLabel.set('erro');
        }
      });
  }

  private loadPingStatus(): void {
    this.apiStatus
      .ping()
      .pipe(
        retry({ count: 2 }),
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((body) => {
        if (body?.status === 'ok') {
          this.apiStatusLabel.set('ok');
        } else {
          this.apiStatusLabel.set('erro');
        }
      });
  }
}
