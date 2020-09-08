// edit by bianbian
/**
 * 获取请求参数中间件
 * 可以使用ctx.params获取get或post请求参数
 */
import { Middleware } from 'midway';
const hikIdentify = require('hikidentify');
export default function appValidate(options: any): Middleware {
  return async (ctx, next) => {

    // ctx.url = "/patrolengine-app" + ctx.url
  
    if (ctx.url.indexOf(options.appContext) !== -1) {
      if (!hikIdentify.checkToken(ctx.headers.token)) {
        throw new Error(ctx.__('middleware.tokenMissingOrInvalid'))
      }
    }
    await next();
  }
}
