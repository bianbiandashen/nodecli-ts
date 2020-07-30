// edit by bianbian
/**
 * 获取请求参数中间件
 * 可以使用ctx.params获取get或post请求参数
 */
import { Middleware } from 'midway';
const regularStr = /\'|\\|\?|"|<|>|\|/
// 不走校验的接口放到数组中
const arr = [
  'capturePicForRefPic',
  'downReportPdf',
  'urlToBase64',
  'questionManage/getQuestionList/search',
  'task/taskList/search',
  'patrolObj/search',
  'api/v1/appApi/patrolObj/search',
  '/inspectionObjectView/inspection/query',
  '/aiEvent/candidate/query',
  '/inspectionConclusion/online/add'
]
function formatChar (data = {}) {
  let switchData = true
  Object.values(data).forEach(res => {
    if (typeof res === 'string') {
      if (regularStr.test(res)) {
        switchData = false
      }
    } else if (typeof res === 'object' && res !== null && !Array.isArray(res)) {
      // todo数组这边还是有问题只能对是对象的且不是数组的校验
      switchData = formatChar(res)
    }
  })
  return switchData
}
export default function params(): Middleware {
  return async (ctx, next) => {
    console.log('decodeCommonBase64String', ctx.req.headers.userid)
    ctx.params = Object.assign({}, ctx.query, ctx.request.body)
    const onOff = arr.every(v => ctx.url.indexOf(v) < 0)
    if (formatChar(ctx.params) === false && onOff) {
      // throw new Error(ctx.__('middleware.requestParamsHasEspecialWord'))
    }

    // 全局对所有的 header 的userid 做base64 的加密服务
    //edit by bian 
    // ctx.req.headers.userid =
    //   ctx.req.headers.userid && ctx.app.decodeCommonBase64String(ctx.req.headers.userid)
    await next()
  }
}
