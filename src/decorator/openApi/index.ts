/**
 * open api 文档生成
 */
export * from './controller'
export * from './paramGetter'
import _document from './document'
import { Config, config, setConfig } from './config'
import { Application } from 'midway'
import init from './init'

export const document = _document()

export default function(app: Application, cfg?: Config) {
    if (cfg) {
        setConfig(cfg)
    }

    init(app)

    // 启用 swagger UI
    if (config.enable) {
        console.log('启用 swagger UI11',config.routerPrefix)
        app.get(config.routerPrefix, app.generateController('openApiUi.index'))
        console.log('启用 swagger UI222',app.generateController('openApiUi.index'))
        app.get(config.routerPrefix + '/api.json', app.generateController('openApiUi.json'))
    }
    console.log('openAPI [ok]')
}