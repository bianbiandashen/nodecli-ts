import { EggPlugin } from 'midway';
const path = require('path')
const plugin: EggPlugin = {
  sequelize: {
    enable: false,
    path: path.join(__dirname, '../custom_plugin/egg-sequelize')
    // package: 'egg-sequelize'
  },
  hikStartup: {
    enable: true,
    // package: 'egg-hik-startup'
    path: path.join(__dirname, '../custom_plugin/egg-ebg-config')
  },
  // exports.tt = {
  //   enable: true,
  //   package: 'egg-hik-startup'
  //   path: path.join(__dirname, '../custom_plugin/egg-ebg-config'),
  // };
 redis: {
    enable: false,
    package: 'egg-redis'
  },
  consul: {
    enable: true,
    path: path.join(__dirname, '../custom_plugin/egg-hik-consul')
  },
  hikLogger: {
    enable: false,
    package: 'egg-hik-logger',
    path: path.join(__dirname, '../custom_plugin/egg-hik-logger')
  },
  hikTracer: {
    enable: false,
    // package: 'egg-hik-tracer'
    path: path.join(__dirname, '../custom_plugin/egg-hik-tracer')
  },
  hikcas: {
    enable: false,
    // package: 'egg-hik-cas'
    path: path.join(__dirname, '../custom_plugin/egg-hik-cas')
  },
  hikOperatelog: {
    enable: false,
    // package: 'egg-hik-operatelog'
    path: path.join(__dirname, '../custom_plugin/egg-hik-operatelog')
  },
  // exports.sessionRedis = {
  //     enable: true,
  //     package: 'egg-session-redis'
  // };
  
  // exports.validate = {
  //   enable: true,
  //   package: 'egg-validate'
  // };
  
  validatePlus:{
    enable: true,
    package: 'egg-validate-plus'
  },
  
  // exports.static = {
  //   enable: true,
  //   package: 'egg-static'
  // }
  
  passport:{
    enable: true,
    package: 'egg-passport'
  },
  
  // exports.swaggerdoc = {
  //   enable: true,
  //   package: 'egg-swagger-doc'
  // }
  
  nunjucks: {
    enable: true,
    package: 'egg-view-nunjucks'
  },
  // config/plugin.js
  alinode: {
    enable: true,
    package: 'egg-alinode'
  }
  
  
};

export default plugin;

