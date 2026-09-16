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
      // document.baseURI (no window.location.origin) porque en GitHub Pages la
      // app vive en una subruta (https://usuario.github.io/repo/), no en la raíz
      // del dominio; el <base href> lo fija Angular en build con --base-href.
      // El resultado hay que darlo de alta como SPA redirect URI en Entra ID.
      redirectUri: document.baseURI,
      postLogoutRedirectUri: document.baseURI,
      // 'query' en vez del default 'fragment': con hash-routing (withHashLocation,
      // necesario en GitHub Pages) la respuesta de login en el fragmento (#code=...)
      // chocaría con las rutas de Angular (#/listings/123).
      OIDCOptions: { responseMode: 'query' },
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
