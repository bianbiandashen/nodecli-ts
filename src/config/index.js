#!/usr/bin/env node

const i18nTools = require('./i18nTools')
const program = require('commander')
const chalk = require('chalk')
program
  .version('0.0.1')
  .command('i18n-jsToJson')
  .description(chalk.blue('开发态多语言转JSON格式命令'))
  .action(function (dir, cmd) {
    i18nTools.run()
  })
program.parse(process.argv)


program.on('--help', () => {
  console.info('  命令列表:')
  console.info('')
  console.info(' 使用命令行  node index i18n-jsToJson', chalk.blue('   目录下js语言包转成json文件'))
})

if (!program.args.length) program.help()
