/*
 * @Author: renxiaojian
 * @Date: 2020-02-25 14:45:26
 * @Last Modified by: jiangyan6
 * @Last Modified time: 2020-03-11 14:03:37
 */

'use strict';

module.exports = app => {
  const {
    Sequelize,
    model
  } = app
  const schema = 'public'
  const PdmsRegionSchema = require('../../schema/tb_pdms_region')(app)
  const PdmsRegion = model.define('tb_pdms_region', PdmsRegionSchema, {
    schema
  })
  const {
    Model
  } = require('../core/transactionalDeco/index')
  const {
    Op
  } = Sequelize
  class Query {
    app=app
    /**
     * 添加
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async createData(params) {
      return await (this as any).create(params);
    }
    /**
     * 更新
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async updateData(params) {
      return await (this as any).update(params, {
        where: {
          modelDataId: params.modelDataId
        }
      })
    }
    /**
     * 删除-物理删除，支持多条 (destroy)
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async deleteDate(modelDataIds) {
      return await (this as any).destroy({
        where: {
          regionId: {
            [Op.or]: modelDataIds
          }
        }
      })
    }
  }
  PdmsRegion.query = new Query()
  return PdmsRegion;
}
