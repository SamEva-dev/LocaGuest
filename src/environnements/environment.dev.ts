const resolveEnv = () => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

  if (hostname === 'locaguest.com' || hostname === 'www.locaguest.com') {
    return {
      BASE_AUTH_API: 'https://auth.locaguest.com',
      BASE_LOCAGUEST_API: 'https://api.locaguest.com',
      production: true,
    };
  }

  if (hostname === 'preprod.locaguest.com') {
    return {
      BASE_AUTH_API: 'https://auth.preprod.locaguest.com',
      BASE_LOCAGUEST_API: 'https://api.preprod.locaguest.com',
      production: true,
    };
  }

  if (hostname === 'staging.locaguest.com') {
    return {
      BASE_AUTH_API: 'https://auth.staging.locaguest.com',
      BASE_LOCAGUEST_API: 'https://api.staging.locaguest.com',
      production: false,
    };
  }

  return {
    BASE_AUTH_API: 'https://localhost:8081',
    BASE_LOCAGUEST_API: 'https://localhost:5001',
    production: false,
  };
};

export const environment = resolveEnv();