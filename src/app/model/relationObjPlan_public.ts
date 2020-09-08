/*
 * @Author: renxiaojian
 * @Date: 2019-12-23 10:51:30
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-03-26 17:58:02
 */
'use strict';
module.exports = app => {
  const {
    Sequelize,
    model
  } = app
  const schema = 'public'
  const capitalSchema = app.capitalize(schema)
  const RelationObjPlanSchema = require('../../schema/tb_relation_obj_plan')(app)
  const RelationObjPlan = model.define('tb_relation_obj_plan', RelationObjPlanSchema, {
    schema
  })
  const {
    Model
  } = require('../core/transactionalDeco/index')
  const {
    Op
  } = Sequelize
  RelationObjPlan.associate = function() {
    app.model['RelationObjPlan' + capitalSchema].hasMany(app.model['PatrolObj' + capitalSchema], {
      foreignKey: 'patrolObjId',
      targetKey: 'patrolObjId',
      as: 'planRelationObj'
    })
  }
  class Query {
    app=app
    /**
     * 根据巡检对象ID删除计划
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async deleteData(params) {
      return await (this as any).destroy({
        where: {
          patrolObjId: {
            [Op.or]: params.list
          }
        }
      })
    }
    /**
     * 添加任务执行时间
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async createData(params) {
      return await (this as any).create(params);
    }
    /**
     * 添加任务执行时间
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async blukCreate(params) {
      return await (this as any).bulkCreate(params);
    }
    /**
     * 关联表查询巡检对象ID集合
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryAllData(condition) {
      const data = await (this as any).findAll(condition);
      return data
    }
    /**
     * 更新计划关联的流程
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async updateData(params) {
      return await (this as any).update(params, {
        where: {
          uuid: params.uuid
        }
      })
    }
    /**
     * 关联表查询巡检对象的巡检项ID集合
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryItemsData(condition) {
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

    // 数据隔离追加方法

    /**
     * 关联表查询巡检对象ID集合
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryAllDataByMapServiceGetPlanRelationObjService(params) {
      const {
        patrolPlanId
      } = params
      if (!patrolPlanId) {
        const error:any = new Error(this.app.ctx.__('model.missingParameters'))
        error.status = 425
        throw error
      }
      const condition = {
        where: {
          patrolPlanId
        },
        order: [
          'objOrder'
        ],
        // attributes: [ 'patrolObjId', 'patrolPlanId' ],
        // include: {
        //   model: app.model['PatrolObj' + capitalSchema],
        //   as: 'planRelationObj',
        //   where: {
        //     isDelete: '0'
        //   },
        //   require: false
        // },
        // raw: true,
        raw: false // 使用hasMany的时候需要聚合一下数据
      }
      const data = await (this as any).findAll(condition);
      return data
    }
  }
  RelationObjPlan.query = new Query()
  return RelationObjPlan;
}
