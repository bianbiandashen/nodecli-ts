/*
 * @Author: renxiaojian
 * @Date: 2020-02-23 09:23:16
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-03-06 21:07:19
 */
'use strict'

module.exports = app => {
  const {model} = app
  const schema = 'public'
  const BussinessSchema = require('../../schema/tb_bussiness')(app)
  const Bussiness = model.define('tb_bussiness', BussinessSchema, {schema})
  const {Model} = require('../core/transactionalDeco/index')
  class Query {
    app = app
    /**
     * 查询巡检计划详情，单条查询
     * @return {object|null} - 查找结果
     */
    @Model
    async queryOne (params) {
      const condition = {
        where: {identify: params.identify}
      }
      const data = await (this as any).findOne(condition)
      return data
    }
    /**
     * 查询巡检应用，全部查询
     * @return {object|null} - 查找结果
     */
    @Model
    async queryAllData (params) {
      const condition = {
        where: {isDelete: 0}
      }
      const data = await (this as any).findAll(condition)
      return data
    }
  }
  Bussiness.query = new Query()
  return Bussiness
}
