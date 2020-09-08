/* eslint-disable no-proto */

const Sequelize = require('sequelize')
const Exception = require('../Exception')

module.exports = {
  Transactional (target, key, descriptor) {
    // target 是方法的上下文  value  descriptor.value 是方法本身 装饰器就是一段反射的代码 不用每个方法来回写 看着简洁
    // 反射 就是方法当参数调用 js 天生就支持反射
    // const func = descriptor.value
    descriptor.value = async function (...args) {
      let transaction
      let topLayer
      try {
        if (
          args.length >= 1 &&
          args[args.length - 1] &&
          args[args.length - 1].__proto__ &&
          args[args.length - 1].__proto__.constructor &&
          args[args.length - 1].__proto__.constructor.toString().match(/class\s(\w*)/) &&
          args[args.length - 1].__proto__.constructor.toString().match(/class\s(\w*)/)[1] ===
            'Transaction'
        ) {
          transaction = args[args.length - 1]
          topLayer = false
        } else {
     
          transaction = await this.ctx.app.model.transaction({ autocommit: true })
          topLayer = true
        }
        // this.ctx.app.hikLogger.debug(
        //   '创建一个事务==============================================='
        // )
      } catch (e) {
        console.log('错误日志',e)
        throw new Error(e)
      }
      // idle in transaction
      try {

        //midway 中由于需要 获取 ioc 的容器 因此需要绑定this

        target = Object.assign({},this)

        // 传入app,如果需要可以继续传入ctx等,由于调用位置的关系,target内部的this无法获得所在class
        // target.app = this.ctx.app
        // target.ctx = this.ctx
        target.query = async function (modelName, queryName, params) {
          this.ctx.hikLogger.debug('debug: -------modelName', modelName)
          this.ctx.hikLogger.debug('debug: -------queryName', queryName)
          this.ctx.hikLogger.debug('debug: -------params', params)
          // console.log('capitalizecapitalize', this.ctx)
          // console.log('debug: -------modelName', modelName)
          // console.log('debug: -------queryName', queryName)
          // console.log('debug: -------params', params)
          const appId = this.ctx.header.appid || 'eris'
          if (appId === undefined || appId === '') {
    
            throw new Error(this.ctx.__('core.requestHeaderDefectappId'))
            
          }
          // 注入app供使用
   
          // this.ctx.app.model[modelName + this.ctx.app.capitalize(appId)].query.app = this.ctx.app
        
          // 执行,跳入modelcapitalize
          try {
    
            return await this.ctx.app.model[modelName + this.ctx.app.capitalize(appId)].query[queryName](
              params,
              transaction,
              modelName + this.ctx.app.capitalize(appId)
            )
          } catch (e) {
            throw new Error(
              e.message +
                ';;modelName:' +
                modelName +
                this.ctx.app.capitalize(appId) +
                ';;queryName:' +
                queryName
            )
          }
        }
        // 传入transaction,用于手动commit
        target.transaction = transaction
        if (!topLayer) {
          args.splice(args.length - 1, 1)
        }

     
        // 判断是否手动commit
        if (!transaction.finished && topLayer) {
          await transaction.commit()
        }
  
      } catch (e) {
        // 回滚操作在异常捕获中统一处理,在service中手动throw错误也会在此处捕获,错误码默认500
        throw new Exception(e.message, (e.code = 500), transaction)
      }
    }
  },
   Model (target, key, descriptor) {
  const func = descriptor.value
  // console.log('func+++++++',func)
  descriptor.value = async function (args, upperTransaction, modelName) {

    console.log('target',target)
    const transaction = upperTransaction
    try {
  
      // console.log('func+++++++111',this.ctx)
      // console.log('func+++++++222',this.ctx.app)
      target.app = this.app

      // 箭头方法继承this
      // 直接sql操作数据库
      target.query = async (queryString, opt:{ transaction?: any}={}) => {

        // 向opt中注入transaction
        opt.transaction = transaction
        // 执行查询
        const result = await this.app.model.query(queryString, opt)
        return result
      }
      target.create = async (params, opt:{ transaction?: any}={}) => {
        opt.transaction = transaction
        const result = await this.app.model[modelName].create(params, opt)
        return result
      }
      // conditions example  { where: {uuid: *** }}
      target.update = async (updateField, opt:{ transaction?: any}={}) => {
        opt.transaction = transaction
        const result = await this.app.model[modelName].update(updateField, opt)
        return result
      }
      target.findAndCountAll = async (params, opt:{ transaction?: any}={} ) => {
        opt.transaction = transaction
        const result = await this.app.model[modelName].findAndCountAll(params,  opt)
        return result
      }
      target.findAll = async (params, opt:{ transaction?: any}={}) => {
        opt.transaction = transaction
        const result = await this.app.model[modelName].findAll(params, opt)
        return result
      }
      target.findOne = async (params, opt:{ transaction?: any}={}) => {
        opt.transaction = transaction
        const result = await this.app.model[modelName].findOne(params, opt)
        return result
      }
      // conditions example  { where: {uuid: *** }}
      target.destroy = async (params, opt:{ transaction?: any}={}) => {
        opt.transaction = transaction
        const result = await this.app.model[modelName].destroy(params, opt)
        return result
      }
      target.count = async (params, opt:{ transaction?: any}={}) => {
        opt.transaction = transaction
        const result = await this.app.model[modelName].count(params, opt)
        return result
      }
      target.bulkCreate = async (params, opt:{ transaction?: any}={}) => {
        if (Array.isArray(params)) {
          opt.transaction = transaction
          const result = await this.app.model[modelName]
            .bulkCreate(params, opt)
            .catch(Sequelize.ConnectionError, () => {
              transaction.rollback()
            })
          return result
        }
        throw new Exception('事务回滚', 500, transaction)
      }

      // 执行方法
      const result = await func.apply(target, args)

      return result
    } catch (e) {
      throw new Exception(e.message, 500, transaction)
    }
  }
}
}
