/*
 * @Author: renxiaojian
 * @Date: 2019-12-23 10:51:30
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-04-18 11:36:01
 */
'use strict';
module.exports = app => {
  const {
    Sequelize,
    model
  } = app
  const schema = 'public'
  const PatrolTaskDateSchema = require('../../schema/tb_patrol_task_date')(app)
  const PatrolTaskDate = model.define('tb_patrol_task_date', PatrolTaskDateSchema, {
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
     * 添加任务执行时间
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
     * 更新任务执行时间
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async updateData(params) {
      return await (this as any).update(params, {
        where: {
          taskExecuteId: params.taskExecuteId
        }
      })
    }
    /**
     * 查询任务执行时间
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryData(condition) {
      return await (this as any).findAll(condition)
    }
    /**
     * 删除-软删除，支持多条 (destroy)
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async deleteData(idsArr) {
      return await (this as any).update({
        isDelete: 1
      }, {
        where: {
          taskExecuteId: {
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
     * 删除-软删除，支持多条 (destroy)
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async deleteDataByGroupIds(idsArr) {
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
    /**
     * 删除-物理删除，支持多条 (destroy)
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async physicsDeleteTaskDate(condition) {
      return await (this as any).destroy(condition)
    }
  }
  PatrolTaskDate.query = new Query()
  return PatrolTaskDate;
}
