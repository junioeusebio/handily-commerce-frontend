import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';

import { provideAppEnvironment } from '@core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAppEnvironment(),
  ],
};
