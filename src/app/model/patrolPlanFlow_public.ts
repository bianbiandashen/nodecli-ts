/*
 * @Author: renxiaojian
 * @Date: 2019-12-24 15:26:14
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-03-26 19:48:19
 */
'use strict';
module.exports = app => {
  const {
    model
  } = app
  const schema = 'public'
  const PatrolPlanFlowSchema = require('../../schema/tb_patrol_plan_flow')(app)
  const PatrolPlanFlow = model.define('tb_patrol_plan_flow', PatrolPlanFlowSchema, {
    schema
  })
  const {
    Model
  } = require('../core/transactionalDeco/index')
  class Query {
    app=app
    /**
     * 添加计划流程
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async createData(params) {
      return await (this as any).create(params);
    }
    @Model
    async blukCreate(params) {
      return await (this as any).bulkCreate(params);
    }
    /**
     * 更新计划流程
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async updateData(params) {
      return await (this as any).update(params, {
        where: {
          planFlowId: params.planFlowId
        }
      })
    }
    /**
     * 查询计划的流程
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryAllData(condition) {
      const data = await (this as any).findAll(condition);
      return data
    }
    /**
     * 删除计划的流程
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async physicsDeleteData(condition) {
      return await (this as any).destroy(condition)
    }
    /**
     * 查询一个
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryOne(condition) {
      return await (this as any).findOne(condition)
    }
  }
  PatrolPlanFlow.query = new Query()
  return PatrolPlanFlow;
}
