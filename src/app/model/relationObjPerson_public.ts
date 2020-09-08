/*
 * @Author: renxiaojian
 * @Date: 2020-01-20 10:12:59
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-03-26 19:58:03
 */
'use strict';
module.exports = app => {
  const {
    Sequelize,
    model
  } = app
  const schema = 'public'
  const capitalSchema = app.capitalize(schema)
  const RelationObjPersonSchema = require('../../schema/tb_relation_obj_person')(app)
  const RelationObjPerson = model.define('tb_relation_obj_person', RelationObjPersonSchema, {
    schema
  })
  const {
    Model
  } = require('../core/transactionalDeco/index')
  const {
    Op
  } = Sequelize
  RelationObjPerson.associate = function() {
    app.model['RelationObjPerson' + capitalSchema].belongsTo(app.model['PatrolObj' + capitalSchema], {
      foreignKey: 'patrolObjId',
      targetKey: 'patrolObjId',
      as: 'patrolObjList'
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
    @Model
    async blukCreate(params) {
      return await (this as any).bulkCreate(params);
    }
    /**
     * 查询计划流程下对象和人员的关联关系
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryAllData(condition) {
      const data = await (this as any).findAll(condition);
      return data
    }
    @Model
    async queryRelationData(params) {
      const condition = {
        where: {
          planFlowId: params.planFlowId,
          isDelete: 0
        },
        attributes: [
          'relationId', 'planFlowId', 'personIds', 'patrolObjId',
          [Sequelize.col('patrolObjList.obj_type_id'), 'objTypeId'],
          [Sequelize.col('patrolObjList.patrol_obj_name'), 'patrolObjName'],
          [Sequelize.col('patrolObjList.patrolObjType.obj_type_id'), 'objTypeId'],
          [Sequelize.col('patrolObjList.patrolObjType.obj_type_name'), 'objTypeName']
        ],
        include: [{
          model: app.model['PatrolObj' + capitalSchema],
          as: 'patrolObjList',
          attributes: [],
          include: [{
            model: app.model['PatrolObjType' + capitalSchema],
            as: 'patrolObjType',
            attributes: []
          }]
        }],
        raw: true
      }
      const data = await (this as any).findAll(condition);
      return data
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
          relationId: params.relationId
        }
      })
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
          relationId: {
            [Op.or]: idsArr
          }
        }
      })
    }
  }
  RelationObjPerson.query = new Query()
  return RelationObjPerson;
}
