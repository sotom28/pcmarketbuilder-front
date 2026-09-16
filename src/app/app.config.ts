import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import {
  MSAL_GUARD_CONFIG,
  MSAL_INSTANCE,
  MSAL_INTERCEPTOR_CONFIG,
  MsalBroadcastService,
  MsalGuard,
  MsalInterceptor,
  MsalService,
} from '@azure/msal-angular';

import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';
import { MSALGuardConfigFactory, MSALInstanceFactory, MSALInterceptorConfigFactory } from './core/auth/msal.factory';
import { identityHeadersInterceptor } from './core/interceptors/identity-headers.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withHashLocation: GitHub Pages no puede reescribir rutas del lado del
    // servidor, así que /listings/123 pasaría a dar 404 al recargar. Con hash
    // (/#/listings/123) todo el ruteo queda del lado del cliente sin necesidad
    // de configurar el servidor.
    provideRouter(routes, withHashLocation()),
    provideHttpClient(withInterceptors([identityHeadersInterceptor]), withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true },
    { provide: MSAL_INSTANCE, useFactory: MSALInstanceFactory },
    { provide: MSAL_GUARD_CONFIG, useFactory: MSALGuardConfigFactory },
    { provide: MSAL_INTERCEPTOR_CONFIG, useFactory: MSALInterceptorConfigFactory },
    MsalService,
    MsalGuard,
    MsalBroadcastService,
    provideAppInitializer(() => {
      const msalService = inject(MsalService);
      inject(AuthService); // fuerza la creación temprana para no perder el primer evento de login
      return msalService.instance.initialize().then(() => {
        msalService.handleRedirectObservable().subscribe();
      });
    }),
  ],
};
