/**
 * @Author: bianbian
 * @Date:   2020 8 6
 * @Desc:   转化中文开发态语言为json格式
 */
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

module.exports = {
  lang: {}, // 多语言数据
  devPath: '../locale/dev/i18n.js', // js的统一expports文件所在位置
  staticPath: `${path.join(__dirname)}`, //  js


  run () {
    this.setI18nStatic()
  },

  setI18nStatic () {
    console.info(chalk.blue('正在创建config/locale/zh_CN下的中文静态多语言...'))
    try {
      if (!fs.existsSync(`${path.join(__dirname, '../locale')}/zh_CN`)) {
        console.info(chalk.blue('正在创建local下的存放json的文件夹'), `${path.join(__dirname, '../locale')}/zh_CN`)
        fs.mkdirSync(`${path.join(__dirname, '../locale')}/zh_CN`)
      }
      console.info(chalk.blue('开始导出json'), `${path.join(__dirname, '../locale')}/zh_CN`)
      // fs.writeFileSync(`${path.join(__dirname)}/i18Json/README.md`, '')
      fs.writeFileSync(`${path.join(__dirname, '../locale')}/zh_CN/translate.json`, JSON.stringify(require(this.devPath), null, 2))
      console.info(chalk.green('多语言json导出成功，请前往地址查看：', `${path.join(__dirname, '../locale')}/zh_CN`))
    } catch (err) {
      console.error(err)
      console.info(chalk.red('创建静态中文失败！'))
    }
  }


}
