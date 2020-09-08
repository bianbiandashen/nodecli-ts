const fs = require('fs')
const chalk = require('chalk')
const path = require('path')

module.exports = {

  clearDir (path) {
    try {
      let files = []
      if (fs.existsSync(path)) {
        files = fs.readdirSync(path)
        for (const file of files) {
          const curPath = `${path}/${file}`
          fs.statSync(curPath).isDirectory()
            ? this.clearDir(curPath)
            : fs.unlinkSync(curPath)
        }
        fs.rmdirSync(path)
      }
    } catch (err) {
      console.error(err)
      console.error(chalk.red('清除失败！'))
    }
  },

  getI18nDev (devPath, langs) {
    console.info(chalk.blue('正在获取src/i18n下的开发态的所有语言...'))
    try {
      const files = fs.readdirSync(devPath)
      for (const file of files) {
        const filePath = path.resolve(devPath, file)
        if (!fs.statSync(filePath).isDirectory()) continue
        const lang = require(filePath)
        if (!lang) continue
        langs[file] = lang
      }
      console.info(chalk.green('获取开发态多语言成功！'))
    } catch (err) {
      console.error(chalk.red('获取开发态多语言失败！'))
    }
  }
}
