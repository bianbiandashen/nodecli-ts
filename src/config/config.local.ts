export const development = {
  watchDirs: [
    'app',
    'lib',
    'service',
    'config',
    'app.ts',
    'agent.ts',
    'interface.ts',
  ],
  overrideDefault: true,
};

export const joiSwagger = {
  title: 'Api平台',
  version: 'v1.0.0',
  description: '开发环境文档',
  test:true,
  swaggerOptions: {
    securityDefinitions: {
      apikey: {
        type: 'apiKey',
        name: 'servertoken',
        in: 'header'
      }
    }
  }
};