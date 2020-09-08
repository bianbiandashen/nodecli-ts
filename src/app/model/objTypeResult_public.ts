'use strict'

module.exports = app => {
  const { model } = app
  const schema = 'public'
  const objTypeResultSchema = require('../../schema/tb_obj_type_result')(app)
  const ObjTypeResult = model.define('tb_obj_type_result', objTypeResultSchema, {
    schema
  })
  const { Model } = require('../core/transactionalDeco/index')

  class Query {
    app = app
    @Model
    async findAndCountAllData(condition) {
      // console.log('++++', condition)
      const data = await (this as any).findAndCountAll(condition)
      // 处理返回格式
      const result = {
        total: data.count,
        list: data.rows
      }
      return result
    }
    @Model
    async findOneData(params) {
      const data = await (this as any).findOne(params)
      return data
    }

    @Model
    async queryAll(condition) {
      // console.log('++++', condition)
      const data = await (this as any).findAll(condition)
      // // 处理返回格式
      // const result = {
      //   total: data.count,
      //   list: data.rows
      // }
      return data
    }
  }
  ObjTypeResult.query = new Query()
  return ObjTypeResult
}
