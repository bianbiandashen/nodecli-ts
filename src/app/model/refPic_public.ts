'use strict';

module.exports = app => {
  const {
    model
  } = app
  const schema = 'public'
  const itemSchema = require('../../schema/tb_ref_pic')(app)
  const RefPic = model.define('tb_ref_pic', itemSchema, {
    schema
  })
  const {
    Model
  } = require('../core/transactionalDeco/index')
  class Query {
    app=app
    /**
     * 巡检项查询
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryManyData(condition) {
      const data = await (this as any).findAll(condition);
      return data
    }

    @Model
    async queryData(condition) {
      const data = await (this as any).findAndCountAll(condition);
      // 处理返回格式
      const result = {
        total: data.count,
        list: data.rows
      }
      return result;
    }
    /**
     * 查询巡检计划详情，单条查询
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryDetail(condition) {
      const data = await (this as any).findOne(condition);
      return data
    }
  }
  RefPic.query = new Query()
  return RefPic;
};
