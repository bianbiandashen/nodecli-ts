'use strict'

module.exports = app => {
  const { model } = app
  const schema = 'public'
  const capitalSchema = app.capitalize(schema)
  const appPlanSchema = require('../../schema/tb_plan_schema')(app)
  const PlanSchema = model.define('tb_plan_schema', appPlanSchema, {
    schema
  })
  const { Model } = require('../core/transactionalDeco/index')
  PlanSchema.associate = function() {
    app.model['PlanSchema' + capitalSchema].hasMany(app.model['Task' + capitalSchema], {
      foreignKey: 'psId',
      targetKey: 'psId',
      as: 'taskItems'
    })
    app.model['PlanSchema' + capitalSchema].belongsTo(app.model['Process' + capitalSchema], {
      foreignKey: 'psId',
      targetKey: 'psId',
      as: 'process'
    })
  }
  class Query {
    app=app
    /**
     * 根据计划模板Id查询数据
     * @return {object|null} - 查找结果
     */
    @Model
    async queryDataByPsId(params:any = {}) {
      const condition = {
        where: {
          psId: params.psId,
          isDelete: 0
        }
      }
      const data = await (this as any).findOne(condition)
      return data
    }
    /**
     * 根据计划模板Id查询数据
     * @return {object|null} - 查找结果
     */
    @Model
    async queryDataDetailByPlan(params:any = {}) {
      const condition = {
        where: {
          psId: params.psId
        }
      }
      const data = await (this as any).findOne(condition)
      return data
    }
    /**
     * 查询所有数据
     * @param {object} { regionId, status, patrolTaskName } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryAllIncludeTask(params) {
      const condition = {
        attributes: ['psName', 'schemaCode'],
        include: {
          model: app.model['Task' + capitalSchema],
          as: 'taskItems',
          attributes: ['patrolTaskId']
        }
      }
      const data = await (this as any).findAll(condition)
      // 处理返回格式
      const result = {
        list: data
      }
      return result
    }
    /**
     * 查询所有数据
     * @param {object} { regionId, status, patrolTaskName } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryAllData(condition) {
      const data = await (this as any).findAll(condition)
      // 处理返回格式
      const result = {
        list: data
      }
      return result
    }
    /**
     * 查询一条数据
     * @param {object} { regionId, status, patrolTaskName } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryDetailData(condition) {
      const result = await (this as any).findOne(condition)
      return result
    }
  }
  PlanSchema.query = new Query()
  return PlanSchema
}
