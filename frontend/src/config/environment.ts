interface EnvironmentConfig {
  SIGNALR_HUB_URL: string;
  // Add other environment-specific variables here as needed
}

/*
const developmentConfig: EnvironmentConfig = {
  SIGNALR_HUB_URL: 'http://localhost:5079/gamehub',
};

const productionConfig: EnvironmentConfig = {
  SIGNALR_HUB_URL: process.env.REACT_APP_SIGNALR_HUB_URL || 'https://your-production-domain.com/gamehub',
};

// No staging env, so this is just localhost
const stagingConfig: EnvironmentConfig = {
  SIGNALR_HUB_URL: 'http://localhost:5079/gamehub',
};
*/

const getEnvironmentConfig = (): EnvironmentConfig => {
  console.log('Environment variables:', {
    NODE_ENV: process.env.NODE_ENV,
    REACT_APP_ENV: process.env.REACT_APP_ENV,
    REACT_APP_SIGNALR_HUB_URL: process.env.REACT_APP_SIGNALR_HUB_URL,
    all: process.env // see all environment variables
  });

  return {
    SIGNALR_HUB_URL: (process.env.REACT_APP_SIGNALR_HUB_URL || 'http://localhost:5079/gamehub')
  }
  /*
  switch (process.env.REACT_APP_ENV) {
    case 'production':
      return productionConfig;
    case 'staging':
      return stagingConfig;
    default:
      return developmentConfig;
  }
  */
};

export const environment = getEnvironmentConfig();