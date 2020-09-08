'use strict'
module.exports = app => {
  const { Sequelize, model } = app
  const schema = 'public'
  const capitalSchema = app.capitalize(schema)
  const taskSchema = require('../../schema/tb_patrol_task')(app)
  const Task = model.define('tb_patrol_task', taskSchema, { schema })
  const { Model } = require('../core/transactionalDeco/index')
  const { Op } = Sequelize
  Task.associate = function () {
    app.model['Task' + capitalSchema].hasMany(app.model['PatrolTaskItem' + capitalSchema], {
      foreignKey: 'patrolTaskId',
      targetKey: 'patrolTaskId',
      as: 'taskItems'
    })
    app.model['Task' + capitalSchema].belongsTo(app.model['PatrolPlan' + capitalSchema], {
      foreignKey: 'planId',
      targetKey: 'patrolPlanId',
      as: 'planItems'
    })
    app.model['Task' + capitalSchema].belongsTo(app.model['PlanSchema' + capitalSchema], {
      foreignKey: 'psId',
      targetKey: 'psId',
      as: 'psIdTransPsName'
    })
    // app.model['Task' + capitalSchema].hasMany(app.model['PatrolTaskPerson' + capitalSchema], {
    //   foreignKey: 'patrolTaskId',
    //   targetKey: 'patrolTaskId',
    //   as: 'taskRelPatrolTaskUser'
    // })
    app.model['Task' + capitalSchema].hasMany(app.model['TaskExecSchema' + capitalSchema], {
      foreignKey: 'taskId',
      targetKey: 'patrolTaskId',
      as: 'taskExecResult'
    })
    // 每条任务对应 一条任务执行人的数据
    app.model['Task' + capitalSchema].belongsTo(app.model['PatrolTaskPerson' + capitalSchema], {
      foreignKey: 'patrolTaskId',
      targetKey: 'patrolTaskId',
      as: 'person'
    })
    app.model['Task' + capitalSchema].hasMany(app.model['Process' + capitalSchema], {
      foreignKey: 'psId',
      sourceKey: 'psId',
      as: 'Process'
    })
    app.model['Task' + capitalSchema].hasMany(app.model['PatrolObjRel' + capitalSchema], {
      foreignKey: 'patrolTaskId',
      sourceKey: 'patrolTaskId',
      as: 'PatrolObjRel'
    })
  }

  class Query {
    app=app
    @Model
    async getExtendInfo (patrolTaskId) {
      const result = await (this as any).query(
        'SELECT A.patrol_task_id, A.start_time_stamp,A.status,C.task_submit_strategy, C.task_person_strategy,C.allow_adjust_executor,C.task_result_editable, f.is_cmpel_code,D.submit_person_ids FROM ' +
          schema +
          '.tb_patrol_task A, ' +
          schema +
          '.tb_patrol_task_person D, ' +
          schema +
          '.tb_patrol_plan F, ' +
          schema +
          `.tb_process C 
        where D.patrol_task_id = $patrolTaskId
        and A.patrol_task_id = $patrolTaskId
        and A.plan_id = f.patrol_plan_id
        and A.ps_id = C.ps_id
        and C.process_type = 0
        and C.is_delete = 0
        and D.process_type = 0
      `,
        { bind: { patrolTaskId } }
      )
      this.app.logger.log('　获取任务下的额外信息', result)
      return result
    }
    /**
     * 消息代办
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async newsagencyModel (params) {
      const condition = {
        where: { patrolTaskId: params.taskId },
        include: [
          {
            model: app.model['PatrolPlan' + capitalSchema],
            as: 'planItems',
            attributes: [ 'patrolPlanName', 'psId' ]
          },
          {
            model: app.model['PatrolTaskPerson' + capitalSchema], // 关联查询
            attributes: [ 'processType', 'firstPersonIds', 'secondPersonIds', 'currentPerson' ],
            as: 'person', // 别名
            where: { processType: 0 }
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
    @Model
    async findTaskItemByTaskApi (taskId) {
      const taskCondition = {
        where: { patrolTaskId: taskId },
        attributes: [
          'status',
          'updateTime',
          'planId',
          [ Sequelize.col('planItems.patrol_plan_name'), 'patrolPlanName' ],
          [ Sequelize.col('psIdTransPsName.ps_name'), 'psName' ]
        ],
        include: [
          {
            model: app.model['PatrolPlan' + capitalSchema],
            as: 'planItems',
            attributes: []
          },
          {
            model: app.model['PlanSchema' + capitalSchema],
            as: 'psIdTransPsName',
            attributes: []
          }
        ]
      }
      return await (this as any).findOne(taskCondition)
    }

    // 边黎安 实现 社区场景下 获取task 下所有的一级巡检项
    @Model
    async getFirstTaskItemsByTaskId (patrolTaskId) {
      // console.log('infofnifof', info)
      const res = await (this as any).query(
        `
        SELECT * 
        FROM ` +
          schema +
          `.tb_patrol_task_item 
        WHERE
        char_length(path) - char_length(replace(path, '@', '')) = 2
        AND patrol_task_id = $patrolTaskId
      `,
        { bind: { patrolTaskId } }
      )
      console.log('++++++++++++++++++', res)
      return res
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
     * 删除xx
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async deleteData (ids) {
      return await (this as any).destroy({ where: { uuid: { [Op.or]: ids } } })
    }
    /**
     * 更新状态
     * @param {object} { params, fields } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async updateData (params, options) {
      return await (this as any).update(params, options)
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
    /**
     * 查询xx分页列表
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryDataList (params) {
      const {
        patrolTaskName,
        patrolPlanName,
        status,
        timeStatus,
        patrolPlanId,
        regionId,
        psId,
        taskType,
        execType,
        patrolTaskIds,
        patrolTaskId,
        startTime,
        endTime,
        showExecTypes,
        pageNo = 1,
        pageSize = 1000
      } = params
      if (!pageNo || !pageSize) {
        const error:any = new Error(this.app.ctx.__('model.missingParameters'))
        error.status = 425
        throw error
      }

      let taskCon:any = {}
      if (showExecTypes) {
        if (!Array.isArray(showExecTypes)) {
          const error:any = new Error(this.app.ctx.__('model.showexectypesFormatIsNotArrayFormat'))
          error.status = 425
          throw error
        }
      }
      if (patrolTaskIds && patrolTaskIds.length === 0) {
        taskCon = {
          limit: pageSize * 1,
          offset: (pageNo - 1) * pageSize,
          order: [
            [ 'status', 'ASC' ], // 根据sort字段排序
            [ 'startTime', 'DESC' ] // 根据sort字段排序
          ],
          where: {
            execType: { [Op.or]: showExecTypes || [ 0, 1, 2 ] },
            taskType: { [Op.or]: [ 0, 1 ] }
          }, // where 先实例 不然的话不能直接往上面挂载实例
          attributes: [
            [ Sequelize.col('psIdTransPsName.ps_name'), 'psName' ],
            [ Sequelize.col('psIdTransPsName.ps_id'), 'psId' ],
            // 1.2 新需求 carry_on   1 过期了还能操作
            [ Sequelize.col('psIdTransPsName.carry_on'), 'carryOn' ],
            [ Sequelize.col('planItems.plan_effective_start'), 'planEffectiveStart' ],
            [ Sequelize.col('planItems.patrol_plan_name'), 'patrolPlanName' ],
            'regionPath',
            'patrolTaskId',
            'patrolTaskName',
            'finishPatrolItemNum',
            'finishObjNum',
            'startTime',
            'taskType',
            'execType',
            'status',
            'timeStatus',
            'regionId',
            'planId',
            'psId',
            'patrolObjNum',
            'problemNum',
            'patrolPointNum',
            'startTimeZone',
            'startTimeStamp',
            'endTimeZone',
            'endTimeStamp'
          ],
          include: [
            {
              model: app.model['PatrolPlan' + capitalSchema],
              as: 'planItems',
              attributes: []
            },
            {
              model: app.model['PlanSchema' + capitalSchema],
              as: 'psIdTransPsName',
              attributes: []
            }
          ],
          // raw: true,
          raw: false // 使用hasMany的时候需要聚合一下数据
        }
      } else {
        taskCon = {
          limit: pageSize * 1,
          offset: (pageNo - 1) * pageSize,
          order: [
            [ 'status', 'ASC' ], // 根据sort字段排序
            [ 'startTime', 'DESC' ] // 根据sort字段排序
          ],
          where: {
            patrolTaskId: { [Op.or]: patrolTaskIds },
            execType: { [Op.or]: showExecTypes || [ 0, 1, 2 ] },
            taskType: { [Op.or]: [ 0, 1 ] }
          },
          attributes: [
            [ Sequelize.col('psIdTransPsName.ps_name'), 'psName' ],
            [ Sequelize.col('psIdTransPsName.ps_id'), 'psId' ],
            [ Sequelize.col('planItems.plan_effective_start'), 'planEffectiveStart' ],
            [ Sequelize.col('planItems.patrol_plan_name'), 'patrolPlanName' ],
            'regionPath',
            'patrolTaskId',
            'patrolTaskName',
            'finishPatrolItemNum',
            'finishObjNum',
            'startTime',
            'taskType',
            'execType',
            'status',
            'timeStatus',
            'regionId',
            'planId',
            'psId',
            'patrolObjNum',
            'problemNum',
            'patrolPointNum',
            'startTimeZone',
            'startTimeStamp',
            'endTimeZone',
            'endTimeStamp'
          ],
          include: [
            {
              model: app.model['PatrolPlan' + capitalSchema],
              as: 'planItems',
              attributes: []
            },
            {
              model: app.model['PlanSchema' + capitalSchema],
              as: 'psIdTransPsName',
              attributes: []
            }
          ],
          // raw: true,
          raw: false // 使用hasMany的时候需要聚合一下数据
        }
      }
      // 根据状态排序 然后根据 创建时间

      if (patrolTaskName) {
        const _patrolTaskName = patrolTaskName.replace(/%/g, '\\%').replace(/_/g, '\\_')
        taskCon.where.patrolTaskName = { [Op.like]: `%%${_patrolTaskName}%%` }
      }

      if (patrolPlanName) {
        const _patrolPlanName = patrolPlanName.replace(/%/g, '\\%').replace(/_/g, '\\_')
        taskCon.where.patrolPlanName = { [Op.like]: `%%${_patrolPlanName}%%` }
      }
      // 需要针对任务筛选
      if (timeStatus === '2') {
        taskCon.where.timeStatus = 1
      } else if (timeStatus === '6') {
        taskCon.where.timeStatus = 0
      }
      if (status) {
        taskCon.where.status = parseInt(status, 10)
        // taskCon.where.timeStatus = 0
      } else {
        // condition.where.status = {
        //   [Op.or]: [1, 0]
        // }
      }
      if (patrolPlanId) {
        taskCon.where.planId = patrolPlanId
      }
      if (patrolTaskId) {
        taskCon.where.patrolTaskId = patrolTaskId
      }
      if (regionId) {
        taskCon.where.regionPath = { [Op.like]: `%${regionId}%` }
      }
      if (psId) {
        taskCon.where.psId = psId
      }
      if (taskType) {
        taskCon.where.taskType = taskType
      }
      if (execType) {
        taskCon.where.execType = execType
      }
      if (startTime && endTime) {
        taskCon.where.startTime = { [Op.between]: [ `${startTime}`, `${endTime}` ] }
      }
      const data = await (this as any).findAndCountAll(taskCon)
      // 处理返回格式
      const result = {
        total: data.count,
        list: data.rows
      }
      return result
    }
    /**
     * app 中的任务列表的接口
     * @param {object} { status, regionId, patrolTaskIds, pageNo = 1, pageSize = 20  } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryDataByTaskService (params) {
      const {
        status, regionId, patrolTaskIds, pageNo = 1, pageSize = 20, showStatus
      } = params

      const condition:any = {
        limit: pageSize * 1,
        offset: (pageNo - 1) * pageSize,
        order: [
          [ 'status', 'ASC' ], // 根据sort字段排序
          [ 'startTime', 'ASC' ] // 根据sort字段排序
        ],
        where: {
          patrolTaskId: { [Op.or]: patrolTaskIds },
          taskType: { [Op.or]: [ 0, 1 ] },
          execType: 2 // 线下
        },
        attributes: [
          [ Sequelize.col('psIdTransPsName.ps_name'), 'psName' ],
          [ Sequelize.col('psIdTransPsName.ps_id'), 'psId' ],
          [ Sequelize.col('planItems.score_status'), 'scoreStatus' ],
          [ Sequelize.col('planItems.patrol_plan_name'), 'patrolPlanName' ],
          // 是否强制扫码
          [ Sequelize.col('planItems.is_cmpel_code'), 'isCmpelCode' ],
          [ Sequelize.col('planItems.region_path'), 'regionPath' ],
          [ Sequelize.col('psIdTransPsName.process.allow_adjust_executor'), 'allowAdjustExecutor' ],
          [ Sequelize.col('planItems.region_path'), 'regionPath' ],
          // 在任务列表中新增了 任务处理人的列表 逗号分隔
          // [Sequelize.col('person.current_person'), 'currentPerson'],
          // [Sequelize.col('person.submit_person_ids'), 'submitPersonIds'],
          'patrolTaskId',
          'patrolTaskName',
          'currentPerson',
          'submitPersonIds',
          'finishObjNum',
          'startTime',
          'endTime',
          'taskType',
          'execType',
          'status',
          'timeStatus',
          'regionId',
          'patrolObjNum',
          'problemNum',
          'patrolPointNum',
          'startTimeStamp',
          'endTimeStamp'
        ],
        include: [
          {
            model: app.model['PatrolPlan' + capitalSchema],
            as: 'planItems',
            attributes: []
          },
          {
            model: app.model['PlanSchema' + capitalSchema],
            as: 'psIdTransPsName',
            attributes: [],
            include: {
              model: app.model['Process' + capitalSchema],
              attributes: [],
              where: {
                processType: 0,
                isDelete: 0
              },
              as: 'process'
            }
          }
        ],
        // raw: true,
        raw: false // 使用hasMany的时候需要聚合一下数据
      }
      let showStatusArr = []
      if (showStatus) {
        showStatusArr = showStatus.split('_')
      } else {
        showStatusArr = []
      }
      const showStatusArrs = showStatusArr.map(
        ele => parseInt(ele, 10)
      )
      if (status === '2') {
        condition.where.timeStatus = 1
        condition.where.status = { [Op.or]: showStatusArrs && showStatusArrs.length > 0 ? showStatusArrs : [ 1, 0 ] }
      } else if (status === '1') {
        condition.where.status = 1
        // condition.where.timeStatus = 0
      } else if (status === '0') {
        condition.where.status = 0
        // condition.where.timeStatus = 0
      } else if (status === '3') {
        condition.where.status = 3
        // condition.where.timeStatus = 0
      } else {
        condition.where.status = { [Op.or]: showStatusArrs && showStatusArrs.length > 0 ? showStatusArrs : [ 1, 0 ] }
      }

      if (regionId) {
        condition.where.regionId = regionId
      }
      const countCondition = {
        where: {
          patrolTaskId: { [Op.or]: patrolTaskIds },
          status: { [Op.or]: [ 0, 1 ] },
          execType: 2 // 线下
        }
      }

      const untreatedNumber = await (this as any).count(countCondition)
      const data = await (this as any).findAndCountAll(condition)
      // 处理返回格式
      const result = {
        total: data.count,
        list: data.rows,
        untreatedNumber
      }
      return result
    }
    /**
     * 查询所有数据
     * @param {object} { regionId, status, patrolTaskName } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryAllData (condition) {
      const data = await (this as any).findAll(condition)
      console.log(data)
      // 处理返回格式
      const result = { list: data }
      return result
    }
    @Model
    async queryAllDataList (params) {
      const { patrolTaskName, status, regionId } = params
      // console.log(params)
      const condition:any = {
        where: {},
        attributes: [
          [ Sequelize.col('planItems.patrol_plan_name'), 'patrolPlanName' ],
          'patrolTaskId',
          'patrolTaskName',
          'startTime',
          'planId'
        ],
        include: [
          {
            model: app.model['PatrolPlan' + capitalSchema],
            as: 'planItems',
            attributes: []
          }
        ],
        // raw: true,
        raw: false // 使用hasMany的时候需要聚合一下数据
      }
      if (patrolTaskName) {
        condition.where[Op.or] = [
          { patrolTaskName: { [Op.iLike]: `%%${patrolTaskName}%%` } }
        ]
      }
      if (status) {
        condition.where.status = status
      }
      if (regionId) {
        condition.where.regionId = regionId
      }
      const data = await (this as any).findAll(condition)
      // 处理返回格式
      const result = { list: data }
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
    @Model
    async findOneDataGetDetail (params) {
      const { patrolTaskId } = params
      const condition = {
        where: { patrolTaskId },
        attributes: [
          [ Sequelize.col('psIdTransPsName.ps_name'), 'psName' ],
          [ Sequelize.col('psIdTransPsName.ps_id'), 'psId' ],
          [ Sequelize.col('planItems.patrol_plan_name'), 'patrolPlanName' ],
          [ Sequelize.col('planItems.region_path'), 'regionPath' ],
          [ Sequelize.col('person.submit_person_ids'), 'submitPersonIds' ],
          'patrolTaskName',
          'finishPatrolItemNum',
          'patrolItemNum',
          'finishObjNum',
          'problemNum',
          'normalReusltNum',
          'missingCount',
          'startTime',
          'endTime',
          'taskType',
          'status',
          'regionId',
          'planId',
          'psId',
          'execType',
          'patrolObjNum',
          'patrolPointNum',
          'startTimeStamp',
          'endTimeStamp'
        ],
        include: [
          {
            model: app.model['PatrolPlan' + capitalSchema],
            as: 'planItems',
            attributes: []
          },
          {
            model: app.model['PatrolTaskPerson' + capitalSchema],
            as: 'person',
            where: { processType: 0 },
            attributes: []
          },
          {
            model: app.model['Process' + capitalSchema],
            where: {
              processType: 0,
              isDelete: 0
            },
            attributes: [
              'allowAdjustExecutor',
              'taskSubmitStrategy',
              'taskPersonStrategy',
              'taskResultEditable'
            ],
            as: 'Process'
          },
          {
            model: app.model['PlanSchema' + capitalSchema],
            as: 'psIdTransPsName',
            attributes: []
          }
        ],
        raw: false
      }
      const data = await (this as any).findOne(condition)
      return data
    }

    @Model
    async findOneDataGetTaskInfo (params) {
      const { patrolTaskId
        // 这个status 是transactionflow 的流程状态
      } = params

      const condition = {
        where: { patrolTaskId },
        attributes: [
          [ Sequelize.col('psIdTransPsName.ps_name'), 'psName' ],
          [ Sequelize.col('psIdTransPsName.ps_id'), 'psId' ],
          [ Sequelize.col('planItems.patrol_plan_name'), 'patrolPlanName' ],
          [ Sequelize.col('planItems.region_path'), 'regionPath' ],
          [ Sequelize.col('person.submit_person_ids'), 'submitPersonIds' ],
          'patrolTaskName',
          'finishPatrolItemNum',
          'patrolItemNum',
          'finishObjNum',
          'problemNum',
          'normalReusltNum',
          'missingCount',
          'startTime',
          'taskType',
          'status',
          'regionId',
          'planId',
          'psId',
          'execType',
          'patrolObjNum',
          'problemNum',
          'patrolPointNum'
        ],
        include: [
          {
            model: app.model['PatrolPlan' + capitalSchema],
            as: 'planItems',
            attributes: []
          },
          {
            model: app.model['PlanSchema' + capitalSchema],
            as: 'psIdTransPsName',
            attributes: []
          },
          {
            model: app.model['PatrolTaskPerson' + capitalSchema],
            as: 'person',
            where: { processType: 0 },
            attributes: []
          },
          {
            model: app.model['Process' + capitalSchema],
            as: 'Process',
            where: {
              processType: 0,
              isDelete: 0
            },
            attributes: [ 'taskSubmitStrategy', 'taskPersonStrategy', 'taskResultEditable' ]
          }
        ]
      }
      const data = await (this as any).findOne(condition)
      return data
    }

    @Model
    async findOneDataByTaskDetail (params) {
      const { patrolTaskId } = params
      const taskDetailCondition = {
        where: { patrolTaskId },
        attributes: [
          [ Sequelize.col('psIdTransPsName.ps_name'), 'psName' ],
          'patrolTaskId',
          'patrolTaskName',
          'endTime',
          'planId',
          'status'
        ],
        include: [
          {
            model: app.model['PlanSchema' + capitalSchema],
            as: 'psIdTransPsName',
            attributes: []
          },
          {
            model: app.model['PatrolTaskPerson' + capitalSchema],
            as: 'person'
          }
        ],
        // raw: true,
        raw: false // 使用hasMany的时候需要聚合一下数据
      }
      const data = await (this as any).findOne(taskDetailCondition)
      return data
    }
    /**
     * 添加xx
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async findOneDataByTaskService (params) {
      const { patrolTaskId
        // 这个status 是transactionflow 的流程状态
      } = params
      const condition = {
        where: { patrolTaskId },
        attributes: [
          [ Sequelize.col('planItems.patrol_plan_name'), 'patrolPlanName' ],
          [ Sequelize.col('planItems.region_path'), 'regionPath' ],
          'patrolTaskName',
          'startTime',
          'endTime',
          'taskType',
          'status',
          'startTimeStamp',
          'endTimeStamp'
        ],
        include: [
          {
            model: app.model['PatrolPlan' + capitalSchema],
            as: 'planItems',
            attributes: [],
            include: {
              model: app.model['PlanSchema' + capitalSchema],
              attributes: [],
              as: 'planSchemaItem'
            }
          }
        ]
      }
      const data = await (this as any).findOne(condition)
      return data
    }
    /**
     * 添加xx
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async findOneDataModel (elem, result, Sequelize) {
      const planCondition = {
        where: { patrolTaskId: elem.patrolTaskId },
        attributes: [
          [ Sequelize.col('planItems.patrol_plan_name'), 'planName' ],
          // [ Sequelize.col('planItems.create_time', 'planCreateTime')],
          [ Sequelize.col('planItems.plan_effective_start'), 'planStartTime' ],
          [ Sequelize.col('planItems.plan_effective_start'), 'planEndTime' ],
          [ Sequelize.col('psIdTransPsName.ps_name'), 'psName' ],
          [ Sequelize.col('psIdTransPsName.schema_code'), 'psCode' ]
        ],
        include: [
          {
            model: app.model['PatrolPlan' + capitalSchema],
            as: 'planItems',
            attributes: []
          },
          {
            model: app.model['PlanSchema' + capitalSchema],
            as: 'psIdTransPsName',
            attributes: []
          }
        ]
      }
      const data = await (this as any).findOne(planCondition)
      return data
    }
    /**
     * 计数
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryCount (condition) {
      const data = await (this as any).count(condition)
      return data
    }

    // 数据隔离新增方法

    /**
     * 查询所有数据
     * @param {object} { regionId, status, patrolTaskName } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryAllDataByAnalysisServiceGetCompletionRate (params) {
      const { patrolTemplateId } = params
      const condition:any = {
        where: {},
        attributes: [ 'patrolTaskId' ]
      }
      if (patrolTemplateId && patrolTemplateId !== '') {
        condition.where.psId = patrolTemplateId
      }
      const data = await (this as any).findAll(condition)
      console.log(data)
      // 处理返回格式
      const result = { list: data }
      return result
    }

    /**
     * 查询所有数据
     * @param {object} { regionId, status, patrolTaskName } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryAllDataByAnalysisServiceTimeoutRankService (params) {
      const {
        patrolTemplateId, startTime, endTime, taskIdArr
      } = params
      const condition:any = {
        where: { timeStatus: 1 },
        attributes: [ 'patrolTaskId', [ Sequelize.col('person.current_person'), 'execCurrentPerson' ]],
        include: [
          {
            model: app.model['PatrolTaskPerson' + capitalSchema],
            where: { processType: 0 },
            attributes: [],
            as: 'person'
          }
        ]
      }
      if (taskIdArr) {
        condition.where.patrolTaskId = { [Op.in]: taskIdArr }
      }
      if (patrolTemplateId && patrolTemplateId !== '') {
        condition.where.psId = patrolTemplateId
      }
      if (startTime && endTime) {
        condition.where.createTime = { [Op.between]: [ parseInt(startTime), parseInt(endTime) ] }
      }
      const data = await (this as any).findAll(condition)
      // 处理返回格式
      const result = { list: data }
      return result
    }

    /**
     * 查询所有数据
     * @param {object} { regionId, status, patrolTaskName } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryAllDataByMapServiceGetAllList (params) {
      const { patrolTaskName, status, regionId } = params
      const condition:any = {
        where: {},
        attributes: [
          [ Sequelize.col('planItems.patrol_plan_name'), 'patrolPlanName' ],
          'patrolTaskId',
          'patrolTaskName',
          'startTime',
          'planId'
        ],
        include: [
          {
            model: app.model['PatrolPlan' + capitalSchema],
            as: 'planItems',
            attributes: []
          }
        ],
        // raw: true,
        raw: false // 使用hasMany的时候需要聚合一下数据
      }
      if (patrolTaskName) {
        condition.where.patrolTaskName = { [Op.iLike]: `%%${patrolTaskName}%%` }
      }
      if (status) {
        condition.where.status = status
      }
      if (regionId) {
        condition.where.regionId = regionId
      }
      const data = await (this as any).findAll(condition)
      console.log(data)
      // 处理返回格式
      const result = { list: data }
      return result
    }

    /**
     * 添加xx
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async findOneDataByMapServiceGetTaskObjDetailTaskDetail (params) {
      const { patrolTaskId, patrolObjId } = params
      // console.log(params)
      if (!patrolTaskId || !patrolObjId) {
        const error:any = new Error(this.app.ctx.__('model.missingParameters'))
        error.status = 425
        throw error
      }
      const taskDetailCondition = {
        where: { patrolTaskId },
        attributes: [
          [ Sequelize.col('psIdTransPsName.ps_name'), 'psName' ],
          'patrolTaskId',
          'patrolTaskName',
          'endTime',
          'planId',
          'psId',
          'status'
        ],
        include: [
          {
            model: app.model['PlanSchema' + capitalSchema],
            as: 'psIdTransPsName',
            attributes: []
          }
          //  {
          //   model: app.model.PatrolTaskUser,
          //   as: 'taskRelPatrolTaskUser'
          // }
        ],
        // raw: true,
        raw: false // 使用hasMany的时候需要聚合一下数据
      }
      const data = await (this as any).findOne(taskDetailCondition)
      return data
    }
    /**
     * 根据计划查询任务
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryAllDataByPlanIds (planIdsArr) {
      const condition = { where: { planId: { [Op.or]: planIdsArr } } }
      const data = await (this as any).findAll(condition)
      return data
    }
  }
  Task.query = new Query()
  return Task
}
