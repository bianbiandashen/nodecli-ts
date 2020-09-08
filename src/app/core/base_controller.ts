const fs = require('fs')

/**
 * BaseController
 */
export class BaseController {
  ctx
  get user () {
    return this.ctx.session.user
  }
  // 下载文件
  async downloadFile (data : {name: string, filePath: string }) { 
    this.ctx.attachment(data.name)
    this.ctx.set('Content-Type', 'application/octet-stream')
    this.ctx.body = fs.createReadStream(data.filePath)
  }
  // 操作成功针对外部接口已经是{code data msg}结构
  async successItms (data: { code: any, data: object, msg: string}) {
    this.ctx.status = 200
    this.ctx.body = {
      code: data.code,
      data: data.data,
      msg: data.msg
    }
  }
  // 操作成功
  async success (data = {}) {
    this.ctx.status = 200
    this.ctx.body = {
      code: '0',
      data,
      msg: 'success'
    }
  }
  async formSuccess (data = {}) {

    this.ctx.status = 200
    this.ctx.body = JSON.stringify({
      code: '0',
      data,
      msg: 'success'
    })
  }
  // 操作失败，相关错误码
  async fail (msg, errorCode = '') {
    this.ctx.body = {
      success: false,
      msg,
      errorCode
    }
  }
  // @author
  // 未发现的
  notFound (msg) {
    msg = msg || 'not found'
    this.ctx.throw(404, msg)
  }
  // 写入操作日志
  operateLog (
    moduleId,
    objectType,
    objectName,
    action,
    actionDetail,
    actionMessageId,
    result
  ) {
    const { ctx } = this
    const { app } = ctx
    const operateLog = app.hikOperatelog.get(ctx)
    console.log('operatelog')
    console.log(operateLog)
    if (operateLog) {
      operateLog
        .setIgnore(false)
        .setModuleId(moduleId)
        .setObjectType(objectType)
        .setObjectName(objectName)
        .setAction(action)
        .setActionDetail(JSON.stringify(actionDetail) || null)
        .setActionMessageId(actionMessageId)
        .setActionMultiLang('1')
        .setTerminalType('0')
        .setResult(result)
        .setUserId((this.ctx.session && this.ctx.session.cas && this.ctx.session.cas.userinfo && this.ctx.session.cas.userinfo.split('&&')[0]) || 'admin')
        .setUserName(null)// this.ctx.session.cas.userinfo.split('&&')[0]
    }
  }
}
