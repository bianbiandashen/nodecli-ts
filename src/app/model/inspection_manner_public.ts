'use strict';
module.exports = app => {
  const {
    model
  } = app
  const schema = 'public'
  const inspectionMannerSchema = require('../../schema/tb_inspection_manner')(app)
  const InspectionManner = model.define('tb_inspection_manner', inspectionMannerSchema, {
    schema
  })
  const {
    Model
  } = require('../core/transactionalDeco/index')
  class Query {
    app=app
    /**
     * 查询
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryAllAndCount(params) {
      const data = await (this as any).findAndCountAll(params);
      return data
    }
    /**
     * 查询所有
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryAll(condition) {
      const data = await (this as any).findAll(condition);
      return data
    }
    /**
     * 查询一个
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryOne(condition) {
      const data = await (this as any).findOne(condition);
      return data
    }
  }
  InspectionManner.query = new Query()
  return InspectionManner;
};
