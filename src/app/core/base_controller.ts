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
<<<<<<< HEAD
=======

  /*
  * 生成pdf
  */
  async createHtmlToPdf (arr = [], pdfOptions = {}) {
    const { ctx } = this
    const { app } = ctx
    let browser
    try {
    // 在linux服务器下，组件安装脚本会复制chrome运行文件到./bin/chrome-linux下，所以，启动需要指定运行文件。
      browser = await puppeteer.launch({
        executablePath: './bin/chrome-linux/chrome',
        args: [ '--no-sandbox' ]
      })
    } catch (err) {
      browser = await puppeteer.launch({ args: [ '--no-sandbox' ] })
    }
    const [ page ] = await browser.pages()
    for (let options of arr) {
      options = Object.assign({ filename: new Date().toLocaleString() }, options)
      const { type } = options
      ctx.set({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename=${querystring.escape(options.filename)}.pdf`
      })

      if (options.url) {
        await page.goto(options.url)
      } else if (options.html) {
        await page.setContent(options.html)
      }
      const body = await page.$('body')
      const clientHeight = await body.evaluate(node => node.clientHeight)
      const buffer = await page.pdf(Object.assign({
        width: 794,
        height: clientHeight + 140,
        margin: {
          top: 60,
          bottom: 60
        },
        printBackground: true
      }, pdfOptions))
      const ws = fs.createWriteStream(path.resolve(`${app.config.static.report}/${type || 'statistics'}`, `${options.filename}.pdf`))
      ws.write(buffer, 'UTF8')
      ws.end()
      ws.on('finish', function () {
        console.log('写入完成。')
      })
      ws.on('error', function (err) {
        console.log(err.stack)
      })
    }
    console.log('程序执行完毕')
    browser.close()
  }
  /**
   * 将html转成pdf导出
   * @author fanzhuohua
   * @param {*} options 参数
   * @param {*} pdfOptions 导出pdf的参数
   * @example
   *  1. 通过完整的html字符串，导出pdf
   *  await this.htmlToPdf({ filename: '导出文件名', html: '<html>...</html>' }, ?{})
   *  2. 通过模板渲染（nunjucks），导出pdf
   *  await this.htmlToPdf({
   *    filename: '导出文件名',
   *    html: await this.ctx.renderView('test.nj', { message: 'Hello World!' }) }, ?{})
   *  3. 通过访问url，导出pdf
   *  await this.htmlToPdf({ filename: '导出文件名', url: 'https://www.baidu.com' }, ?{})
   */
  async htmlToPdf (options:{ filename: string, url: string,  html: string}, pdfOptions = {}) {
    const { ctx } = this

    options = Object.assign({ filename: new Date().toLocaleString() }, options)

    ctx.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename=${querystring.escape(options.filename)}.pdf`
    })

    let browser

    try {
      // 在linux服务器下，组件安装脚本会复制chrome运行文件到./bin/chrome-linux下，所以，启动需要指定运行文件。
      browser = await puppeteer.launch({
        executablePath: './bin/chrome-linux/chrome',
        args: [ '--no-sandbox' ]
      })
    } catch (err) {
      browser = await puppeteer.launch({ args: [ '--no-sandbox' ] })
    }

    const [ page ] = await browser.pages()

    if (options.url) {
      await page.goto(options.url)
    } else if (options.html) {
      await page.setContent(options.html)
    }

    const body = await page.$('body')
    const clientHeight = await body.evaluate(node => node.clientHeight)
    const buffer = await page.pdf(Object.assign({
      width: 794,
      height: clientHeight + 140,
      margin: {
        top: 60,
        bottom: 60
      },
      printBackground: true
    }, pdfOptions))
    ctx.body = buffer
    browser.close()
  }
>>>>>>> 2db8c7dc19290909326dc3ef26c4b686c5727c1f
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
