import {
  IPublicClientApplication,
  InteractionType,
  LogLevel,
  PublicClientApplication,
  BrowserCacheLocation,
} from '@azure/msal-browser';
import { MsalGuardConfiguration, MsalInterceptorConfiguration, ProtectedResourceScopes } from '@azure/msal-angular';
import { environment } from '../../../environments/environment';

const { clientId, tenantId, apiScope } = environment.msal;

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
      // apiScope acá para que el consentimiento se pida en el mismo login.
      scopes: ['openid', 'profile', 'email', apiScope],
    },
  };
}

// Solo los endpoints que requieren identidad quedan "protegidos": MsalInterceptor
// adjunta el Bearer (access token de apiScope) nada más que a estas rutas, y el
// BFF lo valida contra el JWKS de Entra (ver bff-pcmarketbuilder/src/auth/verifyToken.ts).
// Las lecturas del catálogo (GET /listings, /categories) siguen siendo públicas
// y no deben disparar un login, por eso /listings se protege por método HTTP.
export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const writes: ProtectedResourceScopes[] = ['POST', 'PUT', 'PATCH', 'DELETE'].map((httpMethod) => ({
    httpMethod,
    scopes: [apiScope],
  }));

  const protectedResourceMap = new Map<string, Array<string | ProtectedResourceScopes> | null>();
  protectedResourceMap.set(`${environment.bffBaseUrl}/users/me`, [apiScope]);
  protectedResourceMap.set(`${environment.bffBaseUrl}/users/sync`, [apiScope]);
  protectedResourceMap.set(`${environment.bffBaseUrl}/listings`, writes);
  protectedResourceMap.set(`${environment.bffBaseUrl}/listings/*`, writes);

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap,
  };
}
