import {
  IPublicClientApplication,
  InteractionType,
  LogLevel,
  PublicClientApplication,
  BrowserCacheLocation,
} from '@azure/msal-browser';
import { MsalGuardConfiguration, MsalInterceptorConfiguration } from '@azure/msal-angular';
import { environment } from '../../../environments/environment';

const { clientId, tenantId } = environment.msal;

export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      // Se calcula en runtime (en vez de fijarlo en environment.*.ts) para que el
      // mismo build funcione en localhost y detrás de CloudFront sin volver a
      // compilar; el redirect URI resultante debe estar dado de alta como SPA
      // redirect URI en el App Registration de Entra ID.
      redirectUri: window.location.origin,
      postLogoutRedirectUri: window.location.origin,
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
    },
    system: {
      loggerOptions: {
        loggerCallback: (level, message, containsPii) => {
          if (containsPii) return;
          switch (level) {
            case LogLevel.Error:
              console.error(message);
              return;
            case LogLevel.Warning:
              console.warn(message);
              return;
          }
        },
      },
    },
  });
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: {
      scopes: ['openid', 'profile', 'email'],
    },
  };
}

// Solo los endpoints que requieren identidad quedan "protegidos": MsalInterceptor
// intentará adquirir el token (y forzará login interactivo si hace falta) nada
// más que para estas rutas. El catálogo público (categorías, listings) no debe
// disparar un login. Mientras el BFF no valide JWT (ver ms-user/SecurityConfig.java),
// esto deja el puente listo para cuando el API Gateway empiece a exigir el Bearer token.
export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string> | null>();
  protectedResourceMap.set(`${environment.bffBaseUrl}/users/me`, ['openid', 'profile', 'email']);
  protectedResourceMap.set(`${environment.bffBaseUrl}/users/sync`, ['openid', 'profile', 'email']);

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap,
  };
}
