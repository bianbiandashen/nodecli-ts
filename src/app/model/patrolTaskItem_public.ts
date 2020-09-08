'use strict'

module.exports = app => {
  const { Sequelize, model } = app
  const schema = 'public'
  const capitalSchema = app.capitalize(schema)
  const inspection_conclusionSchema = require('../../schema/tb_patrol_task_item')(app)
  const PatrolTaskItem = model.define('tb_patrol_task_item', inspection_conclusionSchema, { schema })

  PatrolTaskItem.associate = function () {
    app.model['PatrolTaskItem' + capitalSchema].belongsTo(app.model['Task' + capitalSchema], {
      foreignKey: 'patrolTaskId',
      targetKey: 'patrolTaskId',
      as: 'Task'
    })
    app.model['PatrolTaskItem' + capitalSchema].belongsTo(
      app.model['PatrolObjRel' + capitalSchema],
      {
        foreignKey: 'patrolObjRelId',
        targetKey: 'patrolObjRelId',
        as: 'patrolObj'
      }
    )
    app.model['PatrolTaskItem' + capitalSchema].belongsTo(
      app.model['ObjTypeResult' + capitalSchema],
      {
        foreignKey: 'patrolResult',
        targetKey: 'orId',
        as: 'itemResult'
      }
    )
    // //  关联任务执行表(一对一，适用于通用、变电站场景)
    app.model['PatrolTaskItem' + capitalSchema].belongsTo(
      app.model['TaskExecSchema' + capitalSchema],
      {
        foreignKey: 'patrolTaskItemId',
        targetKey: 'patrolTaskItemId',
        as: 'taskItemExec'
      }
    )
    // 关联任务执行表
    app.model['PatrolTaskItem' + capitalSchema].belongsTo(
      app.model['TaskExecSchema' + capitalSchema],
      {
        foreignKey: 'patrolTaskItemId',
        targetKey: 'patrolTaskItemId',
        as: 'taskExecList'
      }
    )
    app.model['PatrolTaskItem' + capitalSchema].hasMany(
      app.model['PatrolTaskPoint' + capitalSchema],
      {
        foreignKey: 'patrolTaskItemId',
        targetKey: 'patrolTaskItemId',
        as: 'ponitList'
      }
    )
    // 巡检任务关联巡检执行表
    // app.model.PatrolTaskItem.hasMany(app.model.TaskExecSchema, {
    //   foreignKey: 'taskId',
    //   sourceKey: 'patrolTaskId',
    //   as: 'taskIdTaskExecList'
    // })
    // 巡检任务关联任务人员表
    app.model['PatrolTaskItem' + capitalSchema].belongsTo(
      app.model['PatrolTaskPerson' + capitalSchema],
      {
        foreignKey: 'patrolTaskId',
        targetKey: 'patrolTaskId',
        as: 'PatrolTaskPerson'
      }
    )
    app.model['PatrolTaskItem' + capitalSchema].belongsTo(
      app.model['ItemTitle' + capitalSchema],
      {
        foreignKey: 'objTypeId',
        targetKey: 'objTypeId',
        as: 'itemTitle'
      }
    )
    app.model['PatrolTaskItem' + capitalSchema].belongsTo(
      app.model['ItemTitle' + capitalSchema],
      {
        foreignKey: 'objTypeId',
        targetKey: 'objTypeId',
        as: 'objTypeLevel'
      }
    )
  }

  const { Model } = require('../core/transactionalDeco/index')
  const { Op } = Sequelize

  class Query {
    app=app
    @Model
    async queryManner (params) {
      const res = await (this as any).query(
        `
        select distinct a.patrol_task_item_id,b.item_id,b.manner_id,c.ai_type,c.m_name from ` +
          schema +
          '.tb_patrol_task_item a,' +
          schema +
          '.tb_patrol_task d,' +
          schema +
          `.tb_item_event b
        left join ` +
          schema +
          `.tb_inspection_manner c
        on(b.manner_id = c.m_id)
        where
        a.patrol_task_item_id = $taskItemId
        and a.patrol_item_id = b.item_id
        and a.patrol_task_id = d.patrol_task_id
        and d.exec_type = c.m_type
        and c.ai_type != ''
        and b.is_delete = 0
        and c.is_delete = 0
      `,
        { bind: { taskItemId: params.taskItemId } }
      )
      return this.app.toHumpJson(res[0])
    }
    @Model
    async queryCount (condition) {
      const num = await (this as any).count(condition)
      // 返回统计数量
      return num
    }
    @Model
    async queryOneAndInfo (params) {
      const condition = {
        where: { patrolTaskItemId: params.patrolTaskItemId },
        attributes: [ 'path', 'status', 'patrolResult', 'patrolItemId', 'patrolTaskItemId' ],
        include: [{
          model: app.model['TaskExecSchema' + capitalSchema],
          attributes: [ 'recResult', 'resultDesc', 'status', 'pointResultId' ],
          as: 'taskExecList',
          include: {
            model: app.model['TransactionFlow' + capitalSchema],
            where: { isDelete: 0 },
            attributes: [ 'status', 'remark' ],
            as: 'taskFlowStatus'
          }
        }]
      }
      const data = await (this as any).findOne(condition)
      return data
    }
    @Model
    async getTaskItemsRelationMonitor (params) {
      const { patrolTaskId } = params
      const condition = {
        where: {
          patrolTaskId,
          level: { [Op.eq]: Sequelize.col('itemTitle.level') }
        },
        attributes: [ 'path', 'status', 'patrolResult', 'patrolItemId', 'patrolTaskItemId', 'objTypeId', 'level', 'createTime', 'path' ],
        include: [
          {
            where: { relateMonitor: 1 },
            model: app.model['ItemTitle' + capitalSchema],
            attributes: [ 'titleId', 'level', 'relateMonitor' ],
            as: 'itemTitle'
          }
        ]
      }
      const data = await (this as any).findAll(condition)
      return data
    }
    @Model
    async getTaskItemsByTaskId (params) {
      const {
        patrolTaskId, relatePatrolPoint = '1'
      } = params
      // relatePatrolPoint 任务报告, 线下的任务不存在监控点,也要查出巡检记录 传 false
      const condition:any = {
        where: { patrolTaskId },
        order: [
          [ Sequelize.col('patrolObj.obj_order'), 'ASC' ],
          [ 'itemOrder', 'ASC' ],
          [ Sequelize.col('patrolObj.partrolObjItem.punchList.punch_time'), 'DESC' ],
          [ Sequelize.col('objTypeLevel.level'), 'DESC' ]
        ],
        attributes: [
          'path', 'status', 'patrolResult', 'patrolItemId', 'patrolTaskItemId', 'objTypeId', 'itemOrder', 'level', 'createTime',
          [ Sequelize.col('objTypeLevel.title_id'), 'titleId' ],
          [ Sequelize.col('objTypeLevel.title_name'), 'titleName' ],
          [ Sequelize.col('objTypeLevel.relate_monitor'), 'relateMonitor' ],
          [ Sequelize.col('objTypeLevel.level'), 'titleLevel' ],
          [ Sequelize.col('taskItemExec.point_result_id'), 'pointResultId' ],
          [ Sequelize.col('taskItemExec.result_desc'), 'resultDesc' ]
        ],
        include: [
          {
            model: app.model['TaskExecSchema' + capitalSchema],
            attributes: [],
            as: 'taskItemExec'
          },
          {
            model: app.model['TaskExecSchema' + capitalSchema],
            attributes: [ 'recResult', 'resultDesc', 'status', 'pointResultId' ],
            as: 'taskExecList',
            include: {
              model: app.model['TransactionFlow' + capitalSchema],
              where: { isDelete: 0 },
              attributes: [ 'status', 'remark' ],
              as: 'taskFlowStatus'
            }
          },
          {
            model: app.model['PatrolTaskPoint' + capitalSchema],
            attributes: [
              'patrolPointId',
              'pointName',
              'cameraId'
              // [Sequelize.col('PatrolPoint.camera_name'), 'cameraName']
            ],
            as: 'ponitList',
            include: [
              {
                model: app.model['PatrolPoint' + capitalSchema],
                as: 'PatrolPoint',
                attributes: [ 'cameraName' ]
              }
            ],
            required: relatePatrolPoint === '1'
          },
          {
            model: app.model['PatrolObjRel' + capitalSchema],
            attributes: [ 'patrolObjRelId', 'objOrder' ],
            as: 'patrolObj',
            include: {
              model: app.model['PatrolObj' + capitalSchema],
              as: 'partrolObjItem',
              // 巡检对象名称
              attributes: [ 'patrolObjName', 'regionPath', 'patrolObjId' ],
              include: [{
                model: app.model['PatrolObjType' + capitalSchema],
                as: 'patrolObjType',
                // 巡检对象类型名称
                attributes: [ 'objTypeName' ]
              }, {
                where: { patrolTaskId },
                model: app.model['PunchResult' + capitalSchema],
                as: 'punchList',
                attributes: [ 'punchId', 'punchUserId', 'punchType', 'patrolTaskId', 'punchTime', 'createTime', 'updateTime' ],
                required: false
              }]
            }
          },
          {
            where: { relateMonitor: 1 },
            model: app.model['ItemTitle' + capitalSchema],
            attributes: [ 'titleId', 'level', 'relateMonitor' ],
            as: 'itemTitle'
          }, {
            where: { isDelete: 0 },
            model: app.model['ItemTitle' + capitalSchema],
            attributes: [],
            as: 'objTypeLevel'
          }
        ]
      }
      // if (relatePatrolPoint === '0') {
      //   condition.where.level = { [Op.eq]: Sequelize.col('itemTitle.level') }
      // }
      if (relatePatrolPoint === '0') {
        condition.where.isLeaf = 1
      }
      const data = await (this as any).findAndCountAll(condition)
      // 处理返回格式
      const result = {
        list: data.rows,
        total: data.count
      }
      return result
    }
    @Model
    async getObjIdByPatrolTaskItemId (patrolTaskItemId) {
      const result = await (this as any).query(
        'SELECT distinct A.patrol_obj_id, B.patrol_task_id  FROM ' +
          schema +
          '.tb_patrol_obj_rel A, ' +
          schema +
          `.tb_patrol_task_item B
          where B.patrol_task_item_id = $patrolTaskItemId
          and A.patrol_obj_rel_id = B.patrol_obj_rel_id
        `,
        { bind: { patrolTaskItemId } }
      )
      return (
        this.app.toHumpJson(result[0]) &&
        this.app.toHumpJson(result[0]).length > 0 &&
        this.app.toHumpJson(result[0])[0]
      )
    }

    // 社区那边根据 一级巡检项 获取一级巡检项下面所有的 问题列表cffa85cb38894a1e9036725bf855d10d

    @Model
    async getQuestionsByFirstItemId (
      firstItemId,
      patrolObjId,
      status,
      orderType,
      pageSize = 20,
      pageNo = 0,
      isAccept,
      userId
    ) {
      let paramSQL = ''
      if (orderType === '1') {
        paramSQL = ' order by is_accept DESC,create_time ASC'
      } else {
        paramSQL = ' order by is_accept DESC, create_time DESC'
      }
      let isaccSql = ''
      if (isAccept !== null && typeof isAccept !== 'undefined') {
        isaccSql = ' and c.is_accept = $isAccept'
      }
      const nowDate = this.app.dateFormatter(new Date(), 'yyyy-MM-dd hh:mm:ss')
      // select c.* from tb_task_exec_result a ,(
      //   select patrol_task_item_id from (with RECURSIVE cte as
      //       (
      //       select a.* from tb_item a,
      //       tb_patrol_task_item b
      //     where
      //     a.item_id = b.patrol_item_id
      //     and
      //     b.patrol_task_item_id = $firstTaskItemId
      //       union all
      //       select k.*  from tb_item k , cte c where c.item_id = k.parent_item
      //       )select * from cte) b left join tb_patrol_task_item a
      //    on a.patrol_item_id = b.item_id
      //    ) b, tb_transaction_flow c
      //    where
      //    b.patrol_task_item_id = a.patrol_task_item_id
      //    and a.point_result_id = c.relative_id
      //    and c.is_delete >=0
      //    and c.status = $status
      const result = await (this as any).query(
        `
      select c.* from ` +
          schema +
          `.tb_task_exec_result a ,(
        select * from (with RECURSIVE cte as 
            ( 
            select a.* from ` +
          schema +
          `.tb_item a
          where 
          a.item_id = $firstItemId
            union all  
            select k.*  from ` +
          schema +
          `.tb_item k , cte c where c.item_id = k.parent_item 
            )select * from cte) b left join ` +
          schema +
          `.tb_patrol_task_item a 
         on a.patrol_item_id = b.item_id
         ) b, (
          select distinct a.* from ` +
          schema +
          `.tb_transaction_flow a,((
          select a.submitter_user_id as valid_agent from ` +
          schema +
          `.tb_agent_person a
          where a.agent_user_id = $userId
          and recovery_status = 0
          and is_delete = 0
          and start_time < $nowDate
          and end_time > $nowDate
          )
          union (
            select $userId as valid_agent
          )) b
          where 
          (
          ','||a.NEXT_HANDLE_PEOPLE||',' like '%,' || b.valid_agent || ',%'
          )
        ) c, ` +
          schema +
          '.tb_patrol_task f, ' +
          schema +
          `.tb_patrol_obj_rel g  
         where
         b.patrol_task_item_id = a.patrol_task_item_id
         and f.patrol_task_id = b.patrol_task_id
         and f.exec_type = 2
         and b.patrol_obj_rel_id = g.patrol_obj_rel_id
         and g.patrol_obj_id = $patrolObjId
         and a.point_result_id = c.relative_id
         and c.is_delete >=0
         and c.status = $status` +
          isaccSql +
          paramSQL,
        {
          bind: {
            firstItemId,
            patrolObjId,
            status,
            pageSize,
            pageNo,
            isAccept,
            userId,
            nowDate
          }
        }
      )
      return this.app.toHumpJson(result[0])
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
     * 查询xx分页列表
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryData (condition) {
      const data = await (this as any).findAndCountAll(condition)
      // 处理返回格式
      const result = {
        total: data.count,
        list: data.rows
      }
      return result
    }
    @Model
    async queryDataByTaskService (params) {
      const { patrolTaskId,
        // 这个status 是transactionflow 的流程状态
        } = params
      const condition = {
        where: { patrolTaskId },
        distinct: true,
        // raw: false,
        // status: 巡检处理状态  itemName： 巡检项名称\ resultDesc 巡检结果\  \ patrolItemId 用于筛选巡检项\
        attributes: [ 'path', 'status', 'patrolResult', 'patrolItemId', 'patrolTaskItemId' ],
        include: [
          {
            model: app.model['TaskExecSchema' + capitalSchema],
            attributes: [ 'recResult', 'resultDesc', 'status', 'ponit_result_id' ],
            as: 'taskExecList',
            include: {
              model: app.model['TransactionFlow' + capitalSchema],
              attributes: [ 'status', 'remark' ],
              as: 'taskFlowStatus'
            }
          },
          {
            model: app.model['PatrolTaskPoint' + capitalSchema],
            attributes: [ 'patrolPointId', 'pointName' ],
            as: 'ponitList'
          },
          {
            model: app.model['PatrolObjRel' + capitalSchema],
            attributes: [ 'patrolObjRelId' ],
            as: 'patrolObj',
            include: {
              model: app.model['PatrolObj' + capitalSchema],
              as: 'partrolObjItem',

              // 巡检对象名称
              attributes: [ 'patrolObjName', 'regionPath', 'patrolObjId' ],
              include: {
                model: app.model['PatrolObjType' + capitalSchema],
                as: 'patrolObjType',
                // 巡检对象类型名称
                attributes: [ 'objTypeName' ]
              }
            }
          }
        ]
      }
      const data = await (this as any).findAndCountAll(condition)
      // 处理返回格式
      const result = {
        total: data.count,
        list: data.rows
      }
      return result
    }
    /**
     * 查询xx分页列表
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryDataModel (taskCondition, pageSize, pageNo, wherePonit, whereTask) {
      const condition = {
        where: { patrolObjRelId: { [Op.in]: taskCondition } },
        limit: pageSize * 1,
        offset: (pageNo - 1) * pageSize,
        include: [
          {
            model: app.model['TaskExecSchema' + capitalSchema],
            as: 'taskExecList',
            attributes: [ 'recResult', 'patrolResult' ],
            where: wherePonit,
            required: true
          },
          {
            model: app.model['Task' + capitalSchema],
            as: 'Task',
            attributes: [ 'startTime', 'patrolTaskName', 'patrolTaskId', 'ps_id', 'startTimeStamp', 'startTimeZone' ],
            where: whereTask,
            required: true,
            include: {
              model: app.model['PatrolPlan' + capitalSchema],
              attributes: [ 'executeType' ],
              as: 'planItems',
              required: true
            }
          }
        ],
        raw: false,
        distinct: true
      }
      const data = await (this as any).findAndCountAll(condition)
      // 处理返回格式
      const result = {
        total: data.count,
        list: data.rows
      }
      return result
    }

    /**
     * 添加xx
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async findOneData (params) {
      const data = await (this as any).findOne(params)
      return data
    }

    /**
     * 获取巡检对象name
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryObjName (params) {
      const condition = {
        where: { patrolTaskItemId: params },
        attributes: [],
        include: [
          {
            model: app.model['PatrolObjRel' + capitalSchema],
            attributes: [],
            as: 'patrolObj',
            include: {
              model: app.model['PatrolObj' + capitalSchema],
              attributes: [ 'patrolObjId', 'patrolObjName', 'patrolObjExtend1', 'patrolObjExtend2' ],
              as: 'partrolObjItem'
            }
          }
        ],
        raw: true
      }
      const data = await (this as any).findOne(condition)
      return data
    }

    @Model
    async findOneDataByReport (params) {
      const condition = {
        where: { patrolTaskItemId: params.patrolTaskItemId },
        attributes: [
          'itemName',
          'patrolTaskId',
          'patrolItemId',
          'patrolTaskItemId',
          'patrolObjRelId',
          'createTime'
        ],
        include: [
          {
            model: app.model['PatrolObjRel' + capitalSchema],
            attributes: [ 'patrolObjRelId' ],
            as: 'patrolObj',
            include: {
              model: app.model['PatrolObj' + capitalSchema],
              as: 'partrolObjItem',
              attributes: [ 'patrolObjName', 'patrolObjId', 'regionPath' ]
            }
          },
          {
            model: app.model['Task' + capitalSchema],
            as: 'Task',
            attributes: [ 'startTime' ]
          },
          {
            model: app.model['ObjTypeResult' + capitalSchema],
            as: 'itemResult',
            attributes: [ 'orName' ]
          },
          {
            model: app.model['TaskExecSchema' + capitalSchema],
            attributes: [
              'pointResultId',
              'execUser',
              'taskPointId',
              'picUrls',
              'referencePictures',
              'recResult',
              'resultDesc',
              'updateTime'
            ],
            as: 'taskItemExec',
            include: {
              model: app.model['TransactionFlow' + capitalSchema],
              attributes: [ 'status', 'modifier', 'version', 'picUrl', 'remark' ],
              as: 'taskFlowStatus'
            }
          }
        ]
      }
      const data = await (this as any).findOne(condition)
      return data
    }
    /**
     * 查询xx分页列表
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryList (condition) {
      console.log('conditionconditioncondition', condition)
      const data = await (this as any).findAndCountAll(condition)
      // 处理返回格式
      const result = {
        list: data.rows,
        total: data.count
      }
      return result
    }

    @Model
    async queryList2 (params) {
      const { patrolTaskId, firstTaskItemId } = params
      // 一级巡检项 以及 状态是 未完成的
      const condition = {
        where: {
          patrolTaskId,
          status: 2, // 完成的任务巡检项
          path: { [Op.iLike]: `%%${firstTaskItemId}%%` }
          // status: 0
        },
        attributes: [ 'patrolScore', 'path' ],
        include: [
          {
            model: app.model['TaskExecSchema' + capitalSchema],
            attributes: [
              'recResult',
              'picUrls',
              'resultDesc',
              'status',
              'nextCopyPeople',
              'nextHandlePeople'
            ],
            as: 'taskExecList'
          }
        ]
      }
      const data = await (this as any).findAndCountAll(condition)
      // 处理返回格式
      const result = {
        list: data.rows,
        total: data.count
      }
      return result
    }

    /**
     * 通过筛选获取全部任务巡检项
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryManyAll (params) {
      const data = await (this as any).findAll(params)
      return data
    }
    // 下面是为了数据隔离增加的方法

    /**
     * 添加xx
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async findOneDataByPatrolTaskItemServiceGetTaskItemDetailByIdForApp (params) {
      const { patrolTaskItemId } = params
      if (!patrolTaskItemId) {
        throw Error(this.app.ctx.__('model.noCorrespondingInspectionItems'))
      }
      const patrolTaskItemCondition = {
        where: { patrolTaskItemId },
        include: [
          {
            model: app.model['TaskExecSchema' + capitalSchema],
            attributes: [
              'recResult',
              'resultDesc',
              'patrolResult',
              'patrolScore',
              'execUser',
              'nextCopyPeople',
              'nextHandlePeople',
              'picUrls'
            ],
            as: 'taskExecList'
          },
          {
            model: app.model['Task' + capitalSchema],
            attributes: [ 'execType', 'status' ],
            as: 'Task',
            include: {
              model: app.model['PatrolPlan' + capitalSchema],
              attributes: [ 'patrolPlanId' ],
              as: 'planItems',
              include: {
                model: app.model['PlanSchema' + capitalSchema],
                as: 'planSchemaItem',
                attributes: [ 'psId' ]
              }
            }
          }
        ]
      }
      const data = await (this as any).findOne(patrolTaskItemCondition)
      return data
    }
    /**
     * 获取当前任务巡检项的信息，包含当前项的执行结果
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     * @author renxiaojian
     */
    @Model
    async getTaskItemInfo (params) {
      const { patrolTaskItemId } = params
      const condition = {
        where: { patrolTaskItemId },
        order: [
          [ Sequelize.col('itemTitle.level'), 'DESC' ]
        ],
        attributes: [
          'patrolTaskItemId', 'patrolTaskId', 'patrolItemId', 'itemName', 'itemOrder', 'itemParentId', 'itemScore', 'patrolScore', 'level', 'path', 'status',
          'pageJson', 'pageData', 'objTypeId', 'patrolObjRelId', 'patrolObjRegion', 'patrolResult', 'picUrls', 'isLeaf', 'createTime', 'updateTime',
          [ Sequelize.col('itemTitle.title_id'), 'titleId' ],
          [ Sequelize.col('itemTitle.title_name'), 'titleName' ],
          [ Sequelize.col('itemTitle.relate_monitor'), 'relateMonitor' ],
          [ Sequelize.col('itemTitle.level'), 'titleLevel' ],
          [ Sequelize.col('Task.exec_type'), 'taskExecType' ],
          [ Sequelize.col('Task.patrol_task_id'), 'patrolTaskId' ],
          [ Sequelize.col('Task.patrol_task_name'), 'patrolTaskName' ],
          [ Sequelize.col('Task.score_type'), 'scoreType' ],
          [ Sequelize.col('Task.status'), 'taskStatus' ],
          [ Sequelize.col('Task.planItems.patrol_plan_name'), 'patrolPlanName' ],
          [ Sequelize.col('Task.planItems.patrol_plan_id'), 'patrolPlanId' ],
          [ Sequelize.col('Task.planItems.score_num'), 'scoreNum' ],
          [ Sequelize.col('Task.planItems.planSchemaItem.ps_id'), 'psId' ],
          [ Sequelize.col('Task.planItems.planSchemaItem.ps_name'), 'psName' ],
          [ Sequelize.col('patrolObj.partrolObjItem.patrol_obj_id'), 'patrolObjId' ]
        ],
        include: [{
          model: app.model['PatrolObjRel' + capitalSchema],
          attributes: [],
          as: 'patrolObj',
          include: {
            model: app.model['PatrolObj' + capitalSchema],
            as: 'partrolObjItem'
          }
        }, {
          model: app.model['Task' + capitalSchema],
          as: 'Task',
          attributes: [],
          include: {
            model: app.model['PatrolPlan' + capitalSchema],
            attributes: [],
            as: 'planItems',
            include: {
              model: app.model['PlanSchema' + capitalSchema],
              as: 'planSchemaItem',
              attributes: []
            }
          }
        }, {
          where: { isDelete: 0 },
          model: app.model['ItemTitle' + capitalSchema],
          attributes: [],
          as: 'itemTitle'
        }, {
          model: app.model['TaskExecSchema' + capitalSchema],
          attributes: [
            'recResult', 'resultDesc', 'patrolResult', 'patrolScore',
            'execUser', 'nextCopyPeople', 'nextHandlePeople', 'picUrls', 'pageJson'
          ],
          as: 'taskExecList'
        }]
      }
      const data = await (this as any).findOne(condition)
      return data
    }
    /**
     * 获取当前任务巡检项包含的下级巡检项
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     * @author renxiaojian
     */
    @Model
    async getTaskItemTree (params) {
      const query = `
        with recursive cte as (
        select
          a.*
        from ` +
        schema +
        `.tb_patrol_task_item a
        where
          a.patrol_task_item_id = $patrolTaskItemId
          and a.patrol_task_id = $patrolTaskId
        union
        select
          k.*
        from ` +
        schema +
        `.tb_patrol_task_item k ,
          cte c
        where
          c.patrol_item_id = k.item_parent_id
          and k.patrol_task_id = $patrolTaskId
        )select
          patrol_task_item_id,
          patrol_item_id,
          item_parent_id,
          item_name,
          is_leaf,
          level,
          page_json,
          page_data,
          patrol_score as score,
          item_score as max_score
        from
          cte
      `
      const data = await (this as any).query(query, {
        bind: {
          patrolTaskItemId: params.patrolTaskItemId,
          patrolTaskId: params.patrolTaskId
        }
      })
      return app.toHumpJson(data[0])
    }
    /**
     *
     * @param {*} 通过巡检项获取任务检测点
     */

    @Model
    async questionManageByItemIdGetTaskPointId (params) {
      const { patrolItemId } = params
      const condition = {
        where: { patrolItemId },
        include: [
          {
            model: app.model['PatrolTaskPoint' + capitalSchema],
            as: 'ponitList'
          }
        ]
      }
      const data = await (this as any).findAll(condition)
      return data
    }
    @Model
    async queryOne (params) {
      const condition = { where: { patrolTaskItemId: params.patrolTaskItemId } }
      const data = await (this as any).findOne(condition)
      return data
    }
    /**
     * 异步查询任务巡检项
     * @return {object|null} - 查找结果
     */
    @Model
    async queryAsyncTaskItem (params) {
      const {
        pageNo = 1,
        pageSize = 100,
        patrolTaskId,
        patrolObjRelId,
        parentItemId
      } = params
      const condition:any = {
        order: [
          [ 'itemOrder', 'ASC' ]
        ],
        limit: pageSize * 1,
        offset: (pageNo - 1) * pageSize,
        where: {
          patrolTaskId,
          itemParentId: parentItemId
        }
      }
      if (patrolObjRelId) condition.where.patrolObjRelId = patrolObjRelId
      const data = await (this as any).findAndCountAll(condition)
      const result = {
        total: data.count,
        list: data.rows,
        pageNo: parseInt(pageNo),
        pageSize: parseInt(pageSize),
        lastPage: data.count <= parseInt(pageNo) * parseInt(pageSize)
      }
      return result
    }
  }
  PatrolTaskItem.query = new Query()
  return PatrolTaskItem
}
