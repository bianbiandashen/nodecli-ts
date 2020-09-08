'use strict';

module.exports = app => {
  const {
    model
  } = app
  const schema = 'public'
  const usedSchema = require('../../schema/tb_his_tem_used')(app)
  const Used = model.define('tb_his_tem_used', usedSchema, {
    schema
  })
  const {
    Model
  } = require('../core/transactionalDeco/index')
  class Query {
    app=app
    /**
     * 添加
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async createData(params) {
      return await (this as any).create(params)
    }

    /**
     * 查询所有
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async findAllModel(condition) {
      const data = await (this as any).findAndCountAll(condition) || {};
      const result = {
        total: data.count,
        list: data.rows
      }
      return result;
    }

    /**
     * 更新状态
     * @param {object} { params, fields } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async updateData(params, where) {
      return await (this as any).update(params, {
        where
      });
    }
  }
  Used.query = new Query()
  return Used;
};
