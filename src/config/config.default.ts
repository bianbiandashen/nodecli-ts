import { EggAppConfig, EggAppInfo, PowerPartial } from 'midway';
const path = require('path')
const moment = require('moment')
export type DefaultConfig = PowerPartial<EggAppConfig>

export default (appInfo: EggAppInfo) => {
  const config = {} as DefaultConfig;

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_{{keys}}';



  config.multipart= {
    fileSize: '50mb',
    mode: 'stream',
    fileExtensions: [ '.csv' ]
  },
  // 我们可以通过下面几种方式修改应用的当前语言（修改后会记录到 locale 这个 Cookie），下次请求直接用设定好的语言。
  // 优先级从高到低：
  // query: /?locale=en-US
  // cookie: locale=zh-TW
  // header: Accept-Language: zh-CN,zh;q=0.5
  // edit by bian
  config.i18n= { defaultLocale: 'zh-CN' },
  config.onerror= {
    all (err, ctx) {
      ctx.hikLogger.error('报错', err.code)
      if (err.transaction) {
        ctx.hikLogger.error('事务发现错误回滚', err.transaction && err.transaction.id)
        if (!err.transaction.finished) {
          err.transaction.rollback()
        }
      }
      ctx.set({ 'Content-Type': 'application/json' })
      ctx.status = 200
      let errMsg
      const regx = /^[\u4e00-\u9fa5]/
      if (err.message.indexOf('connect ECONNREFUSED') >= 0) {
        errMsg = '数据库连接异常'
      } else if (err.message.indexOf('Unexpected token') >= 0) {
        errMsg = '未知服务器错误'
      } else if (!regx.test(err.message)) {
        errMsg = '未知错误，请联系管理员'
      } else {
        errMsg = err.message
      }
      ctx.body = {
        code: err.code || '500',
        msg: errMsg,
        data: null
      }
    }
  },
  config.validatePlus= {
    resolveError (ctx, errors) {
      if (errors.length) {
        ctx.type = 'json'
        ctx.status = 400
        ctx.body = {
          code: 400,
          error: errors,
          message: '参数错误'
        }
      }
    }
  },
  config.cluster= {
    listen: {
      path: '',
      port: 8000,
      hostname: '0.0.0.0'
    }
  },

  // 小程序只能存storage，关闭csrf
  config.security ={csrf: { enable: false }},
  config.componentID = 'patrolengine',
  config.serverName= 'patrolengine-app',
  config.logger= {
    // 为了避免一些插件的调试日志在生产环境打印导致性能问题，生产环境默认禁止打印 DEBUG 级别的日志，如果确实有需求在生产环境打印 DEBUG 日志进行调试，需要打开 allowDebugAtProd 配置项。
    level: 'DEBUG',
    allowDebugAtProd: true,
    dir: '../logs/egg-hik-logger',
    appLogName: 'patrolengine.patrolengine-app.other.log',
    errorLogName: 'patrolengine.patrolengine-app.other.log',
    coreLogName: `${appInfo.baseDir}/logs/patrolengine.patrolengine-app.core.log`,
    agentLogName: `${appInfo.baseDir}/logs/patrolengine.patrolengine-app.agent.log`
  },

  /** 日志指定大小和数量，默认每天切割 **/
  config.logrotator= {
    maxFileSize: 25 * 1024 * 1024,
    maxFiles: 20
  },
  config.consul={
    bicContext: '/bic',
    getComponentIpService: '/bic/svrService/v2/service/{componentId}/{serviceType}',
    cibServerIp: '10.13.69.225',
    cibServerPort: '8001',
    protocol: 'http'
  },
  // config/config.default.js
  // config.alinode= {
  //   enable: false,
  //   // server: 'wss://agentserver.node.aliyun.com:8080',
  //   appid: '84519', // Node.js 性能平台给您的项目生成的 appid
  //   secret: '02ff8c29ef36e2f137989045a38362046815e0b3', // Node.js 性能平台给您的项目生成的 secret
  //   error_log: [
  //     '../../logs/egg-hik-logger/patrolengine.patrolengine-app.error.log',
  //     '../../logs/egg-hik-logger/patrolengine.patrolengine-app.other.log',
  //     '../../logs/egg-hik-logger/patrolengine.patrolengine-app.debug.log'
  //   ],
  //   packages: [ '../package.json' ]
  //   // logdir: '***', // Node.js 性能平台日志输出地址绝对路径，与 NODE_LOG_DIR 保持一致。如：/tmp/，也可以不写
  //   // error_log: [
  //   //   // '您的应用在业务层面产生的异常日志的路径，数组，可选，可配置多个',
  //   //   // '例如：/root/.logs/error.#YYYY#-#MM#-#DD#.log',
  //   //   // '不更改 Egg 默认日志输出路径可不配置本项目',
  //   // ],
  //   // agentidMode: 'IP' // 可选，如果设置，则在实例ID中添加部分IP信息，用于多个实例 hostname 相同的场景（以容器为主）
  // },
  config.static= {
    // 静态化访问前缀,如：`http://127.0.0.1:7001/public/images/logo.png`
    prefix: '/patrolengine-app',
    dir: [
      path.join(appInfo.baseDir, '/app/public/dist'),
      path.join(appInfo.baseDir, '/app/public/assets')
    ], // `String` or `Array:[dir1, dir2, ...]` 静态化目录,可以设置多个静态化目录
    patrolObj: path.join(appInfo.baseDir, '/app/public/patrolObj'),
    report: path.join(appInfo.baseDir, '/app/public/report'),
    outComponent: path.join(appInfo.baseDir, '/app/public/outComponent'),
    dynamic: true, // 如果当前访问的静态资源没有缓存，则缓存静态文件，和`preload`配合使用；
    preload: false,
    maxAge: 31536000, // in prod env, 0 in other envs
    buffer: true // in prod env, false in other envs
  },
  // sequelize
  config.sequelize= {
    dialect: 'postgres', // support: mysql, mariadb, postgres, mssql
    database: 'patrolengine_patrolengine-db', // 数据库名
    host: '10.13.69.225',
    port: 7092,
    username: 'postgres', // 账号
    password: 'LhXQaSzD', // 密码    // 是否自动进行下划线转换（这里是因为DB默认的命名规则是下划线方式，而我们使用的大多数是驼峰方式）
    // underscored: true,
    // 时区，sequelize有很多自动时间的方法，都是和时区相关的，记得设置成东8区（+08:00）
    timezone: '+08:00',
    // poolIdleTimeout: 8000,
    // 如果你在多进程中连接数据库，那么应该为每个进程创建一个实例，但每个进程的连接池应有一个合适的大小，以确保符合最大连接总数
    // 。例如：你希望最大连接池大小为90，并且有三个进程，则每个进程的Sequelize实例的最大连接池大小应为30。
    pool: {
      // 连接池配置
      max: 50, // 最大连接数
      min: 0, // 最小连接数
      acquire: 30000, // 请求超时时间
      idle: 10000 // 断开连接后，连接实例在连接池保持的时间
    },
    logging: true,
    define: {
      createdAt: 'createTime',
      updatedAt: 'updateTime',
      freezeTableName: true,
      underscored: false,
      getterMethods: {
        // createTime () {
        //   const createdTime = this.getDataValue('createTime')
        //   if (createdTime) {
        //     return moment(createdTime).format('YYYY-MM-DD HH:mm:ss')
        //   }
        // },
        // startTime () {
        //   const startTime = this.getDataValue('startTime')
        //   if (startTime) {
        //     return moment(startTime).format('YYYY-MM-DD HH:mm:ss')
        //   }
        // },
        // endTime () {
        //   const endTime = this.getDataValue('endTime')
        //   if (endTime) {
        //     return moment(endTime).format('YYYY-MM-DD HH:mm:ss')
        //   }
        // },
        // updateTime () {
        //   const updateTime = this.getDataValue('updateTime')
        //   if (updateTime) {
        //     return moment(updateTime).format('YYYY-MM-DD HH:mm:ss')
        //   }
        // }
      }
    }
  },

  // redis
  config.redis= {
    client: {
      host: '10.13.69.225',
      port: '7019',
      password: 'IITqDgWs',
      db: '4'
    },
    agent: true
  },
  //   clients: {
  //     default: {
  //       host: '10.19.133.91',
  //       port: '6379',
  //       password: '123456',
  //       db: '0'
  //     },
  //     code: {
  //       host: '10.19.133.91',
  //       port: '6379',
  //       password: '123456',
  //       db: '1'
  //     },
  //     admin: {
  //       host: '10.19.133.91',
  //       port: '6379',
  //       password: '123456',
  //       db: '2'
  //     }
  //   },
  //   agent: true
  // },
  config.bodyParser= {
    jsonLimit: '15mb',
    formLimit: '15mb'
  },
  config.validate= { convert: true },

  // 中间件
  // middleware: ['params', 'appValidate'],
  config.middleware= [ 'params', 'appValidate' ],
  config.appValidate=  {
    appContext: 'appApi'
  },

  config.container ={
    ignore:[
      '**/custom_plugin/**',
      '**.js'
    ]
  },
  // swagger文档
  // config.swaggerdoc= {
  //   dirScanner: './app/controller',
  //   basePath: '/patrolengine-app',
  //   apiInfo: {
  //     title: '巡检引擎应用侧接口文档',
  //     description: '巡检引擎应用侧接口文档，包括bs和app以及对外接口',
  //     version: '1.1.0'
  //   },
  //   schemes: [ 'http', 'https' ],
  //   enableSecurity: false,
  //   routerMap: false,
  //   enable: true
  // },
  config.contextPath= '/patrolengine-app',
  config.hikcas= {
    casUrl: 'http://10.13.69.225/portal/cas/',
    serverLogin: 'login', // '/center/login', // '/portal/ui/login',
    appUrl: 'https://10.13.69.225', // 'http://10.13.69.225:7001'
    appLogin: '/patrolengine-app/test/test/login',
    appHome: '/patrolengine-app',
    casServiceValidateUrl: 'http://10.13.69.225:8001/center_cas/ssoService/v1', // 'https://10.13.69.225/bic/ssoService/v1',
    ignore: [ '/appApi', '/health', '/service/rs', '/questionManage/wad', '/map/wad', '/api/v1' ],
    casLogin: 'http://10.13.69.225/bic/ssoService/v1/casLogin'
  },
  config.session= {
    key: 'patrolengine-app',
    maxAge: 'session', // 设置为session用于关闭浏览器sessionID失效
    sessionStoreMaxAge: 20 * 60 * 1000, // sessionStore中key为sessionID项的过期时间
    httpOnly: true,
    encrypt: true,
    renew: false
  },
  config.customLogger= {
    scheduleLogger: { file: `${appInfo.baseDir}/logs/patrolengine-app/patrolengine.patrolengine-app.schedule.log` },
    hikOperateLogger: {
      file: '../../logs/patrolengine-app/patrolengine.patrolengine-app.business.log',
      formatter: meta => {
        return `${moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ')} - ${meta.message}`
      }
    },
    /** 调用链日志格式化插件配置 **/
    hikDtsLogger: {
      file: '../../logs/patrolengine-app/patrolengine.patrolengine-app.business.log',
      formatter: meta => {
        return `${moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ')} [${meta.pid}] ${meta.message}`
      }
    }
  },
  // config.logInterceptor= {
  //   match (ctx) {
  //     return true
  //   }
  // },
  config.skipTraceUrl= { ignore: [] },
  config.view= {
    defaultViewEngine: 'nunjucks',
    root: [ path.join(appInfo.baseDir, 'app/view') ].join(','),
    mapping: { '.nj': 'nunjucks' }
  }
  return config;
};
