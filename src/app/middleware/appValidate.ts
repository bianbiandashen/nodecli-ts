// edit by bianbian
/**
 * 获取请求参数中间件
 * 可以使用ctx.params获取get或post请求参数
 */
import { Middleware } from 'midway';
<<<<<<< HEAD
const hikIdentify = require('hikidentify');
=======
const hikIdentify = require('../../hikidentify/hikidentify/index');
>>>>>>> 2db8c7dc19290909326dc3ef26c4b686c5727c1f
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
