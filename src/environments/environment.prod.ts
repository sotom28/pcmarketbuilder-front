export const environment = {
  production: false,
  // Se llama al BFF a través del API Gateway (URL fija, HTTPS con certificado
  // valido) en vez de la IP pública del BFF directamente, que cambia en cada
  // redeploy y requería un certificado autofirmado (ver terraform/ en
  // product-service para la configuración del API Gateway).
  bffBaseUrl: 'https://teoxgxmoji.execute-api.us-east-1.amazonaws.com/aws/api',
  apiGatewayUrl: 'https://teoxgxmoji.execute-api.us-east-1.amazonaws.com/aws',
  msal: {
    clientId: '6c2342af-22f6-4de8-a545-2a3b04e7d1ff',
    tenantId: '35365687-614a-481c-8b8b-b4debee24880',
    // Scope propio expuesto en Entra ID (App registration → Expose an API).
    // Con él, el access token trae aud = esta app y el BFF lo puede validar;
    // con solo openid/profile/email el token sería para Microsoft Graph.
    apiScope: 'api://6c2342af-22f6-4de8-a545-2a3b04e7d1ff/access_as_user',
  },
};
