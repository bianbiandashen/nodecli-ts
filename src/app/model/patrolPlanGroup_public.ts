/*
 * @Author: renxiaojian
 * @Date: 2020-01-20 10:12:59
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-06-28 16:16:35
 */
'use strict';
module.exports = app => {
  const {
    Sequelize,
    model
  } = app
  const schema = 'public'
  const capitalSchema = app.capitalize(schema)
  const PatrolPlanGroupSchema = require('../../schema/tb_patrol_plan_group')(app)
  const PatrolPlanGroup = model.define('tb_patrol_plan_group', PatrolPlanGroupSchema, {
    schema
  })
  const {
    Model
  } = require('../core/transactionalDeco/index')
  const {
    Op
  } = Sequelize
  PatrolPlanGroup.associate = function() {
    app.model['PatrolPlanGroup' + capitalSchema].hasMany(app.model['PatrolTaskDate' + capitalSchema], {
      foreignKey: 'groupId',
      targetKey: 'taskExecuteId',
      as: 'taskExecuteDateList'
    })
  }
  class Query {
    app=app
    /**
     * 添加计划分组
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async createData(params) {
      return await (this as any).create(params);
    }
    /**
     * 查询巡检计划时间分组
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryAllData(condition) {
      const data = await (this as any).findAll(condition);
      return data
    }
    /**
     * 更新数据
     * @param {object} { params, fields } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async updateData(params) {
      return await (this as any).update(params, {
        where: {
          patrolPlanId: params.patrolPlanId,
          groupId: params.groupId
        }
      });
    }
    /**
     * 删除-软删除，支持多条
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async deleteData(idsArr) {
      return await (this as any).update({
        isDelete: 1
      }, {
        where: {
          groupId: {
            [Op.or]: idsArr
          }
        }
      })
    }
    @Model
    async deleteDataByPlanIds(idsArr) {
      return await (this as any).update({
        isDelete: 1
      }, {
        where: {
          patrolPlanId: {
            [Op.or]: idsArr
          }
        }
      })
    }
    /**
     * 删除-物理删除，支持多条 (destroy)
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async physicsDeleteDate(condition) {
      return await (this as any).destroy(condition)
    }
    /**
     * 查询巡检计划详情分组详情
     * @param {object}
     * @return {object|null} - 查找结果
     */
    @Model
    async queryGroupDetail(params) {
      const condition = {
        where: {
          patrolPlanId: params.patrolPlanId,
          isDelete: 0
        },
        attributes: ['groupId', 'groupName', 'onceEffective', 'taskExecuteCycle'],
        include: [{
          model: app.model['PatrolTaskDate' + capitalSchema],
          as: 'taskExecuteDateList',
          where: { isDelete: 0 },
          required: false,
          attributes: ['taskExecuteId', 'taskExecuteDate', 'taskExecuteTime', 'taskEffective']
        }]
      }
      const data = await (this as any).findAll(condition);
      return data
    }
  }
  PatrolPlanGroup.query = new Query()
  return PatrolPlanGroup;
}
