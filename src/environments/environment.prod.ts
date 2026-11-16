export const environment = {
  production: true,
  bffBaseUrl: 'http://localhost:4000/api',
  cognito: {
    region: 'us-east-1',
    userPoolId: 'us-east-1_GiUdp9djL',
    clientId: '4h6pi8s7p34cttlqhqngcf57ui',
    domain: 'https://us-east-1giudp9djl.auth.us-east-1.amazoncognito.com',
    redirectUri: 'http://localhost:4200',
    postLogoutRedirectUri: 'http://localhost:4200',
  },
  msal: {
    clientId: '6c2342af-22f6-4de8-a545-2a3b04e7d1ff',
    tenantId: '35365687-614a-481c-8b8b-b4debee24880',
    redirectUri: 'https://localhost:4200',
    postLogoutRedirectUri: 'https://localhost:4200',
    signUpAuthority: '',
  },
};
