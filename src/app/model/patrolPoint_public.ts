'use strict'

module.exports = app => {
  const {
    Sequelize,
    model
  } = app
  const schema = 'public'
  const capitalSchema = app.capitalize(schema)
  const patrolPointSchema = require('../../schema/tb_patrol_point')(app)
  const PatrolPoint = model.define('tb_patrol_point', patrolPointSchema, {
    schema
  })
  const {
    Model
  } = require('../core/transactionalDeco/index')
  const {
    Op
  } = Sequelize
  PatrolPoint.associate = function() {
    app.model['PatrolPoint' + capitalSchema].belongsTo(app.model['InspectionManner' + capitalSchema], {
      foreignKey: 'patrolMethodId',
      targetKey: 'mId',
      as: 'patrolMethod'
    })
  }
  class Query {
    app=app
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
     * 添加
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async createData(params) {
      return await (this as any).create(params)
    }

    /**
     * 通过巡检对象id查询巡检任务
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryDataById(params) {
      const data = await (this as any).findAndCountAll(params);
      const result = {
        total: data.count,
        list: data.rows
      }
      return result
    }
    /**
     * 通过巡检对象id查询巡检任务
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryAllData(condition) {
      const data = await (this as any).findAll(condition);
      return data
    }
    /**
     * 通过巡检对象id查询巡检任务
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryAllDataByPlan(params) {
      const {
        patrolItemId,
        patrolObjId,
        mannerIds
      } = params
      const condition:any = {
        where: {
          patrolItemId,
          isDelete: 0
        },
        attributes: [
          'patrolPointId', 'pointName', 'cameraName', 'patrolMethodId',
          'cameraId', 'cameraPtz', 'createTime', 'updateTime', 'patrolObjId',
          [Sequelize.col('patrolMethod.ai_type'), 'aiType']
        ],
        include: {
          model: app.model['InspectionManner' + capitalSchema],
          as: 'patrolMethod',
          attributes: []
        }
      }
      if (patrolObjId) {
        condition.where.patrolObjId = patrolObjId
      }
      if (mannerIds) {
        condition.where.patrolMethodId = {
          [Op.or]: mannerIds.split(',')
        }
      }
      const data = await (this as any).findAll(condition);
      return data
    }
    /**
     * 通过巡检对象id获取全部巡检检测点
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryDataByIdFindAll(params) {
      const data = await (this as any).findAll(params);
      return data
    }
    /**
     * 查询某一个检测点详情
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async findOneData(params) {
      const data = await (this as any).findOne(params);
      return data
    }
  }
  PatrolPoint.query = new Query()
  return PatrolPoint
}
