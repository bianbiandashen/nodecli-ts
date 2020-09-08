/*
 * @Author: renxiaojian
 * @Date: 2019-12-11 11:17:24
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-09-04 10:58:54
 */
'use strict'

module.exports = app => {
  const { Sequelize,
    model } = app
  const schema = 'public'
  const moment = require('moment')
  const capitalSchema = app.capitalize(schema)
  const PatrolPlanSchema = require('../../schema/tb_patrol_plan')(app)
  const PatrolPlan = model.define('tb_patrol_plan', PatrolPlanSchema, { schema })
  const { Model } = require('../core/transactionalDeco/index')
  const { Op } = Sequelize
  PatrolPlan.associate = function () {
    app.model['PatrolPlan' + capitalSchema].hasMany(app.model['Task' + capitalSchema], {
      foreignKey: 'planId',
      targetKey: 'patrolPlanId',
      as: 'taskList'
    })
    app.model['PatrolPlan' + capitalSchema].belongsTo(app.model['Pdms' + capitalSchema], {
      foreignKey: 'patrolAreaIds',
      targetKey: 'regionId',
      as: 'regionInfo'
    })
    app.model['PatrolPlan' + capitalSchema].belongsTo(app.model['PlanSchema' + capitalSchema], {
      foreignKey: 'psId',
      targetKey: 'psId',
      as: 'planSchemaItem'
    })
    app.model['PatrolPlan' + capitalSchema].hasMany(app.model['PatrolTaskDate' + capitalSchema], {
      foreignKey: 'patrolPlanId',
      targetKey: 'taskExecuteId',
      as: 'taskExecuteDateList'
    })
    app.model['PatrolPlan' + capitalSchema].hasMany(app.model['PatrolPlanGroup' + capitalSchema], {
      foreignKey: 'patrolPlanId',
      targetKey: 'groupId',
      as: 'planGroup'
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
    async queryAllDataByTaskApiServer (params) {
      const { startTime,
        endTime,
        regionId } = params
      const planCondition:any = {
        where: {},
        attributes: [ 'patrolPlanId' ],
        include: [{
          model: app.model['Task' + capitalSchema],
          as: 'taskList',
          attributes: [ 'patrolTaskId' ]
        }]
      }
      if (startTime && endTime) {
        const s = moment(parseInt(startTime)).format('YYYY-MM-DD')
        const e = moment(parseInt(endTime)).format('YYYY-MM-DD')
        planCondition.where.planEffectiveStart = { [Op.between]: [ s, e ] }
      }
      if (regionId) planCondition.where.regionPath = { [Op.like]: `%${regionId}%` }
      const data = await (this as any).findAll(planCondition)
      return data
    }

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
     * 更新状态
     * @param {object} { params, fields } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async updateData (params) {
      return await (this as any).update(params, { where: { patrolPlanId: params.patrolPlanId } })
    }
    /**
     * 更新巡检计划状态
     * @param {object} { params, fields } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async updatePatrolStatus (params) {
      return await (this as any).update({ patrolPlanStatus: params.patrolPlanStatus }, { where: { patrolPlanId: params.patrolPlanId } })
    }
    /**
     * 删除巡检计划-支持多条 (destroy)
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async deleteData (idsArr) {
      return await (this as any).update({ isDelete: 1 }, { where: { patrolPlanId: { [Op.or]: idsArr } } })
    }
    /**
     * 查询巡检计划分页列表
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryDataByPlanApiService (params) {
      const {
        regionId,
        planName,
        state,
        psIdArr,
        pageNo,
        pageSize,
        startTime,
        endTime,
        planIdArr,
        deleteType
      } = params
      const condition:any = {
        order: [
          [ 'createTime', 'DESC' ]
        ],
        limit: pageSize * 1,
        offset: (pageNo - 1) * pageSize,
        where: { patrolPlanId: { [Op.or]: planIdArr } },
        attributes: [
          'patrolPlanId', 'patrolPlanName', 'createTime',
          'patrolPlanStatus', 'planEffectiveStart', 'planEffectiveEnd',
          [ Sequelize.col('planSchemaItem.ps_id'), 'psId' ],
          [ Sequelize.col('planSchemaItem.ps_name'), 'psName' ]
        ],
        include: {
          model: app.model['PlanSchema' + capitalSchema],
          as: 'planSchemaItem',
          attributes: []
        }
      }
      if (deleteType || deleteType === 0) condition.where.isDelete = deleteType
      if (regionId) condition.where.patrolAreaIds = regionId
      if (planName) condition.where.patrolPlanName = { [Op.like]: `%${planName}%` }
      if (state) {
        const time = moment().format('YYYY-MM-DD')
        if (startTime && endTime) {
          const s = moment(parseInt(startTime)).format('YYYY-MM-DD')
          const e = moment(parseInt(endTime)).format('YYYY-MM-DD')
          if (state === '1') {
            condition.where.planEffectiveStart = {
              [Op.and]: [
                { [Op.gt]: time },
                { [Op.between]: [ s, e ] }
              ]
            }
          } else if (state === '3') {
            condition.where.planEffectiveStart = { [Op.between]: [ s, e ] }
            condition.where.planEffectiveEnd = { [Op.lt]: time }
          } else {
            condition.where.planEffectiveStart = {
              [Op.and]: [
                { [Op.lte]: time },
                { [Op.between]: [ s, e ] }
              ]
            }
            condition.where.planEffectiveEnd = { [Op.gte]: time }
          }
        } else {
          if (state === '1') {
            condition.where.planEffectiveStart = { [Op.gt]: time }
          } else if (state === '3') {
            condition.where.planEffectiveEnd = { [Op.lt]: time }
          } else {
            condition.where.planEffectiveStart = { [Op.lte]: time }
            condition.where.planEffectiveEnd = { [Op.gte]: time }
          }
        }
      } else if (startTime && endTime) {
        const s = moment(parseInt(startTime)).format('YYYY-MM-DD')
        const e = moment(parseInt(endTime)).format('YYYY-MM-DD')
        condition.where.planEffectiveStart = { [Op.between]: [ s, e ] }
      }

      if (psIdArr) condition.where.psId = { [Op.or]: psIdArr } // 巡检计划

      const data = await (this as any).findAndCountAll(condition)
      // 处理返回格式
      const result = {
        total: data.count,
        list: data.rows,
        pageNo: parseInt(pageNo),
        pageSize: parseInt(pageSize)
      }
      return result
    }

    /**
     * 统计计划执行方式查询计划
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async getPlanByExecuteType (params) {
      const { executeType } = params
      const condition:any = {
        where: { executeType },
        attributes: [
          'patrolPlanId', 'executeType'
        ],
        include: [
          {
            model: app.model['Task' + capitalSchema],
            as: 'taskList',
            attributes: [ 'patrolTaskId' ]
          }
        ],
        raw: false
      }
      const data = await (this as any).findAll(condition)
      return data
    }

    /**
     * 查询巡检计划流程
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async getProcessList (params) {
      const condition = {
        where: { patrolPlanId: params.planId },
        attributes: [
          'patrolPlanId', 'patrolPlanName',
          [ Sequelize.col('planSchemaItem.ps_name'), 'psName' ],
          [ Sequelize.col('planSchemaItem.ps_id'), 'psId' ]
        ],
        include: [
          {
            model: app.model['PlanSchema' + capitalSchema],
            as: 'planSchemaItem',
            attributes: []
          }
        ],
        raw: false
      }
      const data = await (this as any).findOne(condition)
      return data
    }
    /**
     * 查询巡检计划分页列表
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryData (params) {
      const {
        patrolPlanName,
        executeType,
        psId,
        patrolPlanStatus,
        planEffectiveStart,
        planEffectiveEnd,
        createTimeStart,
        createTimeEnd,
        patrolAreaIds,
        regionIdsArr,
        pageNo,
        pageSize
      } = params

      const condition:any = {
        order: [
          [ 'createTime', 'DESC' ]
        ],
        limit: pageSize * 1,
        offset: (pageNo - 1) * pageSize,
        where: { isDelete: { [Op.lt]: 1 } },
        attributes: [
          'patrolPlanId', 'patrolPlanName', 'executeType', 'onceEffective', 'patrolAreaIds',
          'patrolPlanStatus', 'planEffectiveStart', 'planEffectiveEnd', 'createTime', 'updateTime', 'createTimeZone', 'createTimeStamp',
          [ Sequelize.col('planSchemaItem.ps_name'), 'psName' ]
        ],
        include: {
          model: app.model['PlanSchema' + capitalSchema],
          as: 'planSchemaItem',
          attributes: []
        },
        raw: true
      }
      if (patrolPlanName) {
        const _patrolPlanName = patrolPlanName.replace(/%/g, '\\%').replace(/_/g, '\\_')
        condition.where.patrolPlanName = { [Op.like]: `%${_patrolPlanName}%` }
      }
      if (executeType) condition.where.executeType = executeType
      if (patrolPlanStatus) condition.where.patrolPlanStatus = patrolPlanStatus
      if (psId) condition.where.psId = psId
      if (createTimeStart && createTimeEnd) {
        condition.where.createTime = {
          [Op.between]: [
            new Date(`${createTimeStart} 00:00:00`).getTime(),
            new Date(`${createTimeEnd} 23:59:59`).getTime() ]
        }
      }
      if (planEffectiveStart && planEffectiveEnd) {
        condition.where.planEffectiveStart = { [Op.gte]: `${planEffectiveStart}` }
        condition.where.planEffectiveEnd = { [Op.lte]: `${planEffectiveEnd}` }
      }
      if (patrolAreaIds && regionIdsArr.includes(patrolAreaIds)) {
        condition.where.patrolAreaIds = patrolAreaIds
      } else if (patrolAreaIds && !regionIdsArr.includes(patrolAreaIds)) {
        const result:any = {
          total: 0,
          list: [],
          isNoJurisdiction: true,
          pageNo: parseInt(pageNo),
          pageSize: parseInt(pageSize)
        }
        if (!(regionIdsArr.length > 0)) result.noRegionJurisdiction = true
        return result
      } else if (!patrolAreaIds) {
        if (regionIdsArr.length > 0) {
          condition.where.patrolAreaIds = { [Op.or]: [ ...regionIdsArr, null ] }
        } else {
          const result = {
            total: 0,
            list: [],
            isNoJurisdiction: true,
            noRegionJurisdiction: true,
            pageNo: parseInt(pageNo),
            pageSize: parseInt(pageSize)
          }
          return result
        }
      }
      const data = await (this as any).findAndCountAll(condition)
      // 处理返回格式
      const result = {
        total: data.count,
        list: data.rows,
        pageNo: parseInt(pageNo),
        pageSize: parseInt(pageSize)
      }
      return result
    }
    /**
     * 查询巡检计划分页列表_原始查询
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryDataOriginal (params) {
      const {
        patrolPlanId,
        patrolPlanName,
        executeType,
        psId,
        patrolPlanStatus,
        planEffectiveStart,
        planEffectiveEnd,
        createTimeStart,
        createTimeEnd,
        patrolAreaIds,
        regionIdsArr,
        patrolObjId,
        modelDataId,
        pageNo,
        pageSize
      } = params
      let queryStr = `
        select distinct a.*,c.ps_name,c.ps_id,
        d.model_data_id from ` +
        schema + '.tb_patrol_plan a,' +
        schema + '.tb_relation_obj_plan b,' +
        schema + '.tb_plan_schema c,' +
        schema + `.tb_patrol_obj d
        where
        a.patrol_plan_id = b.patrol_plan_id
        and b.patrol_obj_id = d.patrol_obj_id
        and a.ps_id = c.ps_id
        and a.is_delete = 0
      `
      const replacementsParams:any = {
        limit: pageSize * 1,
        offset: (pageNo - 1) * pageSize
      }
      if (patrolPlanId) {
        const _patrolPlanId = patrolPlanId.replace(/%/g, '\\%').replace(/_/g, '\\_')
        queryStr = `${queryStr} and a.patrol_plan_id like :patrolPlanId`
        replacementsParams.patrolPlanId = `%${_patrolPlanId}%`
      }
      if (patrolPlanName) {
        const _patrolPlanName = patrolPlanName.replace(/%/g, '\\%').replace(/_/g, '\\_')
        queryStr = `${queryStr} and a.patrol_plan_name like :planName`
        replacementsParams.planName = `%${_patrolPlanName}%`
      }
      if (executeType) {
        queryStr = `${queryStr} and a.execute_type = :executeType`
        replacementsParams.executeType = executeType
      }
      if (psId) {
        queryStr = `${queryStr} and a.ps_id = :psId`
        replacementsParams.psId = psId
      }
      if (patrolPlanStatus) {
        queryStr = `${queryStr} and a.patrol_plan_status = :patrolPlanStatus`
        replacementsParams.patrolPlanStatus = patrolPlanStatus
      }
      if (createTimeStart && createTimeEnd) {
        queryStr = `${queryStr} and a.create_time between :createTimeStart and :createTimeEnd`
        replacementsParams.createTimeStart = `${createTimeStart} 00:00:00`
        replacementsParams.createTimeEnd = `${createTimeEnd} 23:59:59`
      }
      if (planEffectiveStart && planEffectiveEnd) {
        queryStr = `${queryStr} and a.plan_effective_start >= :planEffectiveStart and a.plan_effective_end <= :planEffectiveEnd`
        replacementsParams.planEffectiveStart = planEffectiveStart
        replacementsParams.planEffectiveEnd = planEffectiveEnd
      }
      if (modelDataId) {
        queryStr = `${queryStr} and d.model_data_id in (:modelDataIds)`
        replacementsParams.modelDataIds = modelDataId.split(',')
      }
      if (patrolObjId) {
        queryStr = `${queryStr} and b.patrol_obj_id in (:patrolObjIds)`
        replacementsParams.patrolObjIds = patrolObjId.split(',')
      }
      if (patrolAreaIds && regionIdsArr.includes(patrolAreaIds)) {
        queryStr = `${queryStr} and a.patrol_area_ids in (:areaIds)`
        replacementsParams.areaIds = patrolAreaIds
      } else if (patrolAreaIds && !regionIdsArr.includes(patrolAreaIds)) {
        const result:any = {
          total: 0,
          list: [],
          isNoJurisdiction: true, // 没有该区域权限
          pageNo: parseInt(pageNo),
          pageSize: parseInt(pageSize)
        }
        if (!(regionIdsArr.length > 0)) result.noRegionJurisdiction = true // 没有任何区域权限
        return result
      } else if (!patrolAreaIds) {
        if (regionIdsArr.length > 0) {
          queryStr = `${queryStr} and a.patrol_area_ids in (:areaIds)`
          replacementsParams.areaIds = [ ...regionIdsArr, null ]
        } else {
          const result = {
            total: 0,
            list: [],
            isNoJurisdiction: true, // 没有该区域权限
            noRegionJurisdiction: true, // 没有任何区域权限
            pageNo: parseInt(pageNo),
            pageSize: parseInt(pageSize)
          }
          return result
        }
      }
      const res = await (this as any).query(`${queryStr} order by a.create_time desc limit :limit offset :offset`, { replacements: replacementsParams })
      const count = await (this as any).query(`
        select count(s.*)
        from (
          ${queryStr} order by a.create_time
        ) s
      `, { replacements: replacementsParams })
      const _count = count[0]
      const result = {
        total: Number(_count[0].count),
        list: this.app.toHumpJson(res[0]),
        pageNo: parseInt(pageNo),
        pageSize: parseInt(pageSize)
      }
      return result
    }
    /**
     * 查询巡检计划全部列表
     * @return {object|null} - 查找结果
     */
    @Model
    async queryAllData (params:any = {}) {
      const { currentTime,
        patrolPlanStatus } = params
      const condition:any = {
        order: [
          [ 'createTime', 'DESC' ]
        ],
        where: { isDelete: { [Op.lt]: 1 } },
        attributes: [
          'patrolPlanId', 'patrolPlanName', 'executeType', 'onceEffective', 'patrolAreaIds',
          'patrolPlanStatus', 'planEffectiveStart', 'planEffectiveEnd', 'createTime',
          [ Sequelize.col('planSchemaItem.ps_name'), 'psName' ]
        ],
        include: {
          model: app.model['PlanSchema' + capitalSchema],
          as: 'planSchemaItem',
          attributes: []
        },
        raw: true
      }
      if (currentTime) {
        condition.where.planEffectiveEnd = { [Op.lt]: `${currentTime}` }
      }
      if (patrolPlanStatus) {
        condition.where.patrolPlanStatus = { [Op.ne]: patrolPlanStatus }
      }
      const data = await (this as any).findAll(condition)
      return data
    }
    /**
     * 查询巡检计划全部列表
     * @return {object|null} - 查找结果
     */
    @Model
    async queryAllDataByReport (params:any = {}) {
      const { startTime,
        endTime } = params
      const condition:any = {
        order: [
          [ 'createTime', 'DESC' ]
        ],
        where: { isDelete: { [Op.lt]: 1 } },
        attributes: [
          'patrolPlanId', 'patrolPlanName', 'executeType', 'onceEffective', 'patrolAreaIds', 'regionPath',
          'patrolPlanStatus', 'planEffectiveStart', 'planEffectiveEnd', 'createTime'
        ]
      }
      if (startTime && endTime) {
        condition.where.createTime = {
          [Op.between]: [
            new Date(`${startTime}`).getTime(),
            new Date(`${endTime}`).getTime()
          ]
        }
      }
      const data = await (this as any).findAll(condition)
      return data
    }
    /**
     * 根据计划名称查询数据
     * @return {object|null} - 查找结果
     */
    @Model
    async queryDataByPlanName (patrolPlanName:string) {
      const condition = {
        where: {
          patrolPlanName,
          isDelete: { [Op.lt]: 1 }
        }
      }
      const data = await (this as any).findAll(condition)
      return data
    }
    /**
     * 查询巡检计划全部列表-通过计划ID集合
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryAllDataByIds (patrolPlanIds) {
      const condition = {
        order: [
          [ 'createTime', 'DESC' ]
        ],
        attributes: [ 'patrolPlanId', 'patrolPlanName' ],
        where: {
          patrolPlanId: { [Op.or]: patrolPlanIds },
          isDelete: { [Op.lt]: 1 }
        }
      }
      const data = await (this as any).findAll(condition)
      return data
    }
    /**
     * 查询巡检计划详情，单条查询
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryDetail (params) {
      const condition = {
        where: { patrolPlanId: params.patrolPlanId },
        attributes: [
          'patrolPlanId', 'patrolPlanName', 'executeType', 'onceEffective', 'taskExecuteCycle', 'scoreStatus', 'scoreNum',
          'patrolPlanStatus', 'planEffectiveStart', 'patrolAreaIds', 'planEffectiveEnd', 'createTime', 'isCapture',
          [ Sequelize.col('planSchemaItem.ps_name'), 'psName' ],
          [ Sequelize.col('planSchemaItem.ps_id'), 'psId' ],
          [ Sequelize.col('planSchemaItem.pattern'), 'pattern' ]
        ],
        include: [
          {
            model: app.model['PlanSchema' + capitalSchema],
            as: 'planSchemaItem',
            attributes: []
          }, {
            model: app.model['PatrolPlanGroup' + capitalSchema],
            as: 'planGroup',
            where: { isDelete: 0 },
            required: false,
            attributes: [ 'groupId', 'groupName', 'onceEffective', 'taskExecuteCycle' ],
            include: [{
              model: app.model['PatrolTaskDate' + capitalSchema],
              as: 'taskExecuteDateList',
              where: { isDelete: 0 },
              required: false,
              attributes: [ 'taskExecuteId', 'taskExecuteDate', 'taskExecuteTime' ]
            }]
          }],
        raw: false
      }
      const data = await (this as any).findOne(condition)
      return data
    }
    /**
     * 查询巡检计划详情基本信息
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryBasicDetail (params) {
      const condition = {
        where: { patrolPlanId: params.patrolPlanId },
        attributes: [
          'patrolPlanId', 'patrolPlanName', 'executeType', 'onceEffective', 'taskExecuteCycle', 'scoreStatus', 'scoreNum',
          'patrolPlanStatus', 'planEffectiveStart', 'patrolAreaIds', 'planEffectiveEnd', 'createTime', 'isCapture', 'isCmpelCode',
          [ Sequelize.col('planSchemaItem.ps_name'), 'psName' ],
          [ Sequelize.col('planSchemaItem.ps_id'), 'psId' ],
          [ Sequelize.col('planSchemaItem.pattern'), 'pattern' ],
          [ Sequelize.col('planSchemaItem.scan_code_on'), 'scanCodeOn' ]
        ],
        include: [
          {
            model: app.model['PlanSchema' + capitalSchema],
            as: 'planSchemaItem',
            attributes: []
          }],
        raw: false
      }
      const data = await (this as any).findOne(condition)
      return data
    }
    /**
     * 查询全部
     * @return {object|null} - 查找结果
     */
    @Model
    async queryAll (condition) {
      const data = await (this as any).findAll(condition)
      return data
    }
    /**
     * 查询巡检计划详情，单条查询
     * @return {object|null} - 查找结果
     */
    @Model
    async queryDetailByPlanApiService (params) {
      const condition = {
        where: { patrolPlanId: params.planId },
        attributes: [
          'patrolPlanId', 'patrolPlanName',
          'planEffectiveStart', 'planEffectiveEnd',
          [ Sequelize.col('patrol_area_ids'), 'regionId' ],
          [ Sequelize.col('planSchemaItem.ps_name'), 'psName' ],
          [ Sequelize.col('planSchemaItem.ps_id'), 'psId' ]
        ],
        include: [{
          model: app.model['PlanSchema' + capitalSchema],
          as: 'planSchemaItem',
          attributes: []
        }],
        raw: false
      }
      const data = await (this as any).findOne(condition)
      return data
    }
    @Model
    async queryOne (condition) {
      const data = await (this as any).findOne(condition)
      return data
    }
    /**
     * 查询巡检计划分组信息全部
     * @return {object|null} - 查找结果
     */
    @Model
    async queryPlanGroupData (planId) {
      const res = await (this as any).query(`
      select distinct
      a.*,
      e.*,
      c.*,
      b.*,
      f.*,
      g.obj_type_name,
      d.patrol_point_id as point_id,
      d.point_name,
      d.camera_id,
      d.camera_ptz,
      d.patrol_method_id,
      d.camera_name,
      h.manner_id,
      k.relate_monitor,
      m.m_type,
      m.ai_type,
      m.m_name from ` +
      schema + '.tb_patrol_obj b,' +
      schema + '.tb_item_title k,' +
      schema + `.tb_item c
      left join ` + schema + `.tb_item_event h on
        (c.item_id = h.item_id)
      left join ` + schema + `.tb_inspection_manner m on
        (m.m_id = h.manner_id),` +
      schema + '.tb_object_type g,' +
      schema + '.tb_patrol_plan_group e,' +
      schema + `.tb_relation_obj_plan a
      left join ` + schema + `.tb_patrol_point d
      on (
      d.patrol_point_id = a.patrol_point_id
      and d.is_delete >=0
      )
      left join ` + schema + `.tb_patrol_task_date f
      on (
      f.group_id = a.group_id
      and f.is_delete <=0
      )
      where
      a.patrol_plan_id = $planId
      and a.patrol_obj_id = b.patrol_obj_id
      and a.item_id = c.item_id
      and c.obj_type_id = k.obj_type_id
      and c."level" = k."level"
      and k.is_delete = 0 
      and b.obj_type_id = g.obj_type_id
      and a.group_id = e.group_id
      and (d.patrol_method_id = h.manner_id or d.patrol_method_id is null)
      and c.is_delete = '0'
      and b.is_delete = '0'
      order by c.item_order
      `, { bind: { planId } })
      return this.app.toHumpJson(res[0])
    }
    /**
     * 查询巡检计划分组信息（不包括巡检项和检测点）
     * @return {object|null} - 查找结果
     */
    @Model
    async queryPlanGroupDataNoAll (planId) {
      const res = await (this as any).query(`
      select a.*,e.*,b.*,f.*,g.obj_type_name from ` +
      schema + '.tb_patrol_obj b,' +
      schema + '.tb_object_type g,' +
      schema + '.tb_patrol_plan_group e,' +
      schema + `.tb_relation_obj_plan a
      left join ` + schema + `.tb_patrol_task_date f
      on (
      f.group_id = a.group_id
      and f.is_delete <=0
      )
      where
      a.patrol_plan_id = $planId
      and a.patrol_obj_id = b.patrol_obj_id
      and b.obj_type_id = g.obj_type_id
      and a.group_id = e.group_id
      and b.is_delete='0'
      `, { bind: { planId } })
      return this.app.toHumpJson(res[0])
    }
  }
  PatrolPlan.query = new Query()
  return PatrolPlan
}
