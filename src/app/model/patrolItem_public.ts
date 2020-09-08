/*
 * @Author: renxiaojian
 * @Date: 2019-12-11 11:17:24
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-08-03 10:21:09
 */
'use strict'

module.exports = app => {
  const { Sequelize,
    model } = app
  const schema = 'public'
  const capitalSchema = app.capitalize(schema)
  const PatrolItemSchema = require('../../schema/tb_item')(app)
  const PatrolItem = model.define('tb_item', PatrolItemSchema, { schema })
  const { Model } = require('../core/transactionalDeco/index')
  const { Op } = Sequelize
  PatrolItem.associate = function () {
    app.model['PatrolItem' + capitalSchema].hasMany(app.model['PatrolPoint' + capitalSchema], {
      foreignKey: 'patrolItemId',
      targetKey: 'itemId',
      as: 'patrolPointList'
    })
  }
  class Query {
    app=app
    /**
     * 添加xx
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async createData (params) {
      return await (this as any).create(params)
    }
    /**
     * 查询树组织路径
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryTreePathData (condition) {
      const data = await (this as any).findAndCountAll(condition)
      const result = {
        total: data.count,
        list: data.rows
      }
      return result
    }
    /**
     * 通过巡检项ID查询多条
     * @param {object}
     * @return {string} - object
     */
    @Model
    async queryItemManyList (condition) {
      const data = await (this as any).findAll(condition)
      return data
    }

    /**
     * 通过巡检项ID查询多条
     * @param {object}
     * @return {string} - object
     */

    @Model
    async queryItemModel (params) {
      const condition = {
        order: [
          [ 'itemOrder', 'ASC' ]
        ],
        where: {
          objTypeId: { [Op.or]: params.objTypeId.split(',') },
          isDelete: 0
        },
        include: [{
          model: app.model['PatrolPoint' + capitalSchema],
          as: 'patrolPointList',
          attributes: [
            'patrolPointId', 'pointName', 'cameraName',
            'camera_id', 'cameraPtz', 'createTime', 'updateTime', 'patrolObjId'
          ],
          where: { isDelete: 0 },
          required: false
        }]
      }
      const data = await (this as any).findAll(condition)
      return data
    }
    /**
     * 通过巡检项ID查询多条
     * @param {object}
     * @return {string} - object
     */

    @Model
    async queryItemModelBySql (params) {
      const { objIds,
        objTypeId,
        executeType } = params
      const replacementsParams = {
        patrolObjIds: [],
        objTypeId: objTypeId.split(','),
        executeType: executeType.split(',')
      }
      let queryStr = `
      select
      r.*,
      s.patrol_point_id,s.point_name,s.camera_name,s.camera_id,s.patrol_obj_id,s.patrol_method_id,s.is_delete
        from
          (
          select
            distinct a.*,
            b.relate_monitor,
            c.manner_id,
            d.m_type,
            d.ai_type,
            d.m_name
          from ` +
          schema + '.tb_item_title b,' +
          schema + `.tb_item a
          left join ` + schema + `.tb_item_event c on
            (a.item_id = c.item_id)
          left join ` + schema + `.tb_inspection_manner d on
            (d.m_id = c.manner_id)
          where
            a.obj_type_id in (:objTypeId)
            and a.is_delete = 0
            and a.obj_type_id = b.obj_type_id
            and a."level" = b."level"
            and b.is_delete = 0 
            and (d.m_type in (:executeType) or d.m_type is null)) r
        left join ` + schema + `.tb_patrol_point s on
          r.item_id = s.patrol_item_id
          and r.manner_id = s.patrol_method_id
          and s.is_delete = 0
      `
      if (objIds) {
        queryStr = `${queryStr} and s.patrol_obj_id in (:patrolObjIds)`
        replacementsParams.patrolObjIds = objIds.split(',')
      }
      const res = await (this as any).query(`
        ${queryStr} order by r.item_order
      `, { replacements: replacementsParams })
      return this.app.toHumpJson(res[0])
    }
    /**
     * 查询巡检计划分组下某对象的巡检项和检测点
     * @return {object|null} - 查找结果
     */
    @Model
    async queryPlanItemsAndPointsBySql (params) {
      const res = await (this as any).query(`
        select
        distinct a.uuid,
        a.item_id,
        a.patrol_point_id,
        b.*,
        c.manner_id,
        d.m_type,
        d.ai_type,
        d.m_name,
        e.relate_monitor,
        f.point_name,
        f.camera_id,
        f.camera_name,
        f.patrol_obj_id,
        f.patrol_method_id
      from ` +
      schema + '.tb_item_title e,' +
      schema + `.tb_relation_obj_plan a
      left join ` + schema + `.tb_patrol_point f on
        (a.patrol_point_id = f.patrol_point_id),` +
      schema + `.tb_item b
      left join ` + schema + `.tb_item_event c on
        (b.item_id = c.item_id)
      left join ` + schema + `.tb_inspection_manner d on
        (d.m_id = c.manner_id)
      where
        a.item_id = b.item_id
        and (f.is_delete = 0 or f.is_delete is null)
        and (c.manner_id = f.patrol_method_id or f.patrol_method_id is null or c.manner_id is null)
        and b.obj_type_id = e.obj_type_id
        and b."level" = e."level"
        and e.is_delete = 0
        and b.is_delete = 0
        and a.patrol_obj_id = $patrolObjId
        and a.group_id = $groupId
        and a.patrol_plan_id = $patrolPlanId
      order by
        b.item_order
      `, {
        bind: {
          patrolPlanId: params.patrolPlanId,
          patrolObjId: params.patrolObjId,
          groupId: params.groupId
        }
      })
      return this.app.toHumpJson(res[0])
    }
    /**
     * 异步查询巡检项
     * @return {object|null} - 查找结果
     */
    @Model
    async queryAsyncItem (params) {
      const { pageNo = 1,
        pageSize = 100,
        parentItemId } = params
      const condition = {
        order: [
          [ 'itemOrder', 'ASC' ]
        ],
        limit: pageSize * 1,
        offset: (pageNo - 1) * pageSize,
        where: {
          parentItem: parentItemId,
          isDelete: 0
        }
      }
      const data = await (this as any).findAndCountAll(condition)
      const result = {
        total: data.count,
        list: data.rows,
        pageNo: parseInt(pageNo),
        pageSize: parseInt(pageSize)
      }
      return result
    }
  }
  PatrolItem.query = new Query()
  return PatrolItem
}
