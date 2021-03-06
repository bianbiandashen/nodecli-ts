import { Application } from 'midway'
import openApi, { document } from './decorator/openApi'
export default (app: Application) => {
    app.beforeStart(async () => {

        // global.process.env.PORT = app.config.cluster.listen.port || 9297

        console.log("app.config.cluster.listen.port",app.config.cluster.listen.port)
        
        const openApi1 = await openApi(app, {
            /**
             * 是否开启 swagger ui
             */
            enable: true,
            /**
             * swagger ui 路由前缀
             */
            routerPrefix: '/patrolengine-app/swagger-ui',
        
            /**
             * swagger ui version
             */
            swaggerUiVersion: '3.30.2',
        })
        console.log("openApi进入了===",openApi1)
        /**
         * open api 文档配置
         */
        document
            .setTitle('hikvision openApi -by bianlian')
            .setVersion(process.env.npm_package_version)
            .setDescription('支持基于 interface 的验证')
            .setSecuritySchemes({
                ApiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'authorization',
                },
            })
    })
}
