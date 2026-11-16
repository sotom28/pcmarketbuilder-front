/**
 * Al cerrar sesión, Microsoft devuelve al usuario a `postLogoutRedirectUri` agregando `?state=<estado del logout>`.
 * MSAL guarda la URL donde empieza un login (`request.origin`) y, al volver de Microsoft, la compara y navega hacia
 * ella. Si esa URL trae el `?state=` del logout, MSAL mezcla ese valor con el `state` del login y rechaza la
 * respuesta con `state_mismatch`, aunque Microsoft haya devuelto el `state` correcto (reproducido en el navegador).
 *
 * Se quita el parámetro nada más cargar la página, antes de que MSAL o el usuario inicien un login. La app no usa
 * `state` en la query para nada propio; el `state` de una respuesta de login de Entra viaja en el hash (#), que no se
 * toca.
 *
 * Excepción: Cognito responde en la query (`?code=…&state=…`). Si trae `code` es una respuesta de login que la
 * librería OIDC aún no procesó, y borrarle el `state` impide completar el inicio de sesión. El logout de Microsoft
 * nunca trae `code`, así que en ese caso no se toca nada.
 */
export function stripLogoutState(win: Window = window): void {
  try {
    const url = new URL(win.location.href);
    if (!url.searchParams.has('state') || url.searchParams.has('code')) return;
    url.searchParams.delete('state');
    win.history.replaceState(win.history.state, '', url.pathname + url.search + url.hash);
  } catch {
    // sin History API no hay nada que limpiar
  }
}
