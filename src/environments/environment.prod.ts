export const environment = {
  production: true,
  // Sin CloudFront disponible (bloqueado en la cuenta de AWS Academy), se llama
  // directo a la IP pública del BFF. Tiene que ser HTTPS (aunque sea con cert
  // autofirmado, ver bff-pcmarketbuilder/src/lib/tls.ts) porque el sitio en S3
  // se sirve por HTTPS y el navegador bloquea llamadas HTTP desde ahí (mixed
  // content). Si la IP del BFF cambia, hay que actualizar esto y recompilar.
  bffBaseUrl: 'https://18.213.192.99:4443/api',
  msal: {
    clientId: '6c2342af-22f6-4de8-a545-2a3b04e7d1ff',
    tenantId: '35365687-614a-481c-8b8b-b4debee24880',
  },
};
