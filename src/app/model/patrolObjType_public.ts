'use strict';

module.exports = app => {
  const {
    model
  } = app
  const schema = 'public'
  const objecTypeSchema = require('../../schema/tb_object_type')(app)
  const ObjectType = model.define('tb_object_type', objecTypeSchema, {
    schema
  })
  const {
    Model
  } = require('../core/transactionalDeco/index')
  class Query {
    app=app
    /**
     * 查询巡检对象类型
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async objectTypeSearch(params) {
      const data = await (this as any).findAndCountAll(params);
      return data
    }

    /**
     * 添加xx
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async findOneData(params) {
      const data = await (this as any).findOne(params);
      return data
    }

    /**
     * 查询所有对象类型
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryAllData(params) {
      const data = await (this as any).findAll(params);
      return data
    }
    /**
     * 查询一个对象类型
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryOneData(params) {
      const data = await (this as any).findOne(params);
      return data
    }
  }
  ObjectType.query = new Query()
  return ObjectType
}
