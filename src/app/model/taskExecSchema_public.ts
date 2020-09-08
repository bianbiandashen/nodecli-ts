'use strict'

module.exports = app => {
  const { model, Sequelize } = app
  const { Model } = require('../core/transactionalDeco/index')
  const schema = 'public'
  const capitalSchema = app.capitalize(schema)
  const execSchema = require('../../schema/tb_task_exec_result')(app)
  const TaskExecSchema = model.define('tb_task_exec_result', execSchema, { schema })
  const { Op } = Sequelize
  TaskExecSchema.associate = function () {
    app.model['TaskExecSchema' + capitalSchema].hasMany(
      app.model['TransactionFlow' + capitalSchema],
      {
        foreignKey: 'relativeId',
        sourceKey: 'pointResultId',
        as: 'taskFlowStatus'
      }
    )
    app.model['TaskExecSchema' + capitalSchema].belongsTo(
      app.model['PatrolTaskItem' + capitalSchema],
      {
        foreignKey: 'patrolTaskItemId',
        targetKey: 'patrolTaskItemId',
        as: 'patrolTaskItem'
      }
    )
    app.model['TaskExecSchema' + capitalSchema].belongsTo(
      app.model['PatrolTaskPoint' + capitalSchema],
      {
        foreignKey: 'taskPointId',
        targetKey: 'patrolTaskPointId',
        as: 'patrolTaskPoint'
      }
    )
    app.model['TaskExecSchema' + capitalSchema].belongsTo(app.model['Task' + capitalSchema], {
      foreignKey: 'taskId',
      sourceKey: 'patrolTaskId',
      as: 'patrolTask'
    })
    app.model['TaskExecSchema' + capitalSchema].belongsTo(
      app.model['ObjTypeResult' + capitalSchema],
      {
        foreignKey: 'patrolResult',
        targetKey: 'orId',
        as: 'itemPatrolResult'
      }
    )
  }
  class Query {
    app=app
    @Model
    async queryResultListByItem (params) {
      const { taskItemIds } = params
      const condition = {
        order: [[ 'createTime', 'DESC' ]],
        where: { patrolTaskItemId: { [Op.or]: taskItemIds } },
        attributes: [ 'eventValue', 'status' ]
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
    async queryResultList (params) {
      const { taskItemIds, pageSize, pageNo } = params
      const condition = {
        order: [[ 'patrolScore', 'DESC' ]],
        limit: pageSize * 1,
        offset: (pageNo - 1) * pageSize,
        where: {
          taskId: { [Op.or]: taskItemIds },
          status: { [Op.not]: 99 }
        },
        attributes: [ 'patrolTaskItemId', 'taskId', 'resultDesc', 'patrolScore' ],
        include: [
          {
            model: app.model['PatrolTaskItem' + capitalSchema],
            as: 'patrolTaskItem',
            attributes: [ 'itemName', 'path' ]
          },
          {
            model: app.model['Task' + capitalSchema],
            as: 'patrolTask',
            attributes: [ 'psId' ],
            include: [
              {
                model: app.model['PlanSchema' + capitalSchema],
                as: 'psIdTransPsName',
                attributes: [ 'psName' ]
              }
            ]
          }
        ]
      }
      const data = await (this as any).findAndCountAll(condition)
      return data
    }
    // 通过问题查询问题对应的巡检对象
    @Model
    async findObjByPromble (params) {
      const { patrolTaskIdArr } = params
      const condition = {
        where: {
          taskId: { [Op.or]: patrolTaskIdArr },
          isIntoNextStep: 1,
          status: 1
        },
        attributes: [ 'patrolTaskItemId' ],
        include: [
          {
            model: app.model['PatrolTaskItem' + capitalSchema],
            as: 'patrolTaskItem',
            attributes: [ 'patrolObjRelId' ],
            include: [
              {
                model: app.model['PatrolObjRel' + capitalSchema],
                as: 'patrolObj',
                attributes: [ 'patrolObjId' ]
              }
            ]
          }
        ],
        raw: true
      }
      const data = await (this as any).findAll(condition)
      return data
    }
    // 分页获取问题
    @Model
    async findAndCountAllData (condition) {
      console.log('++++', condition)
      const data = await (this as any).findAndCountAll(condition)
      // 处理返回格式
      const result = {
        total: data.count,
        list: data.rows
      }
      return result
    }

    /**
     * 查询巡检计划详情，单条查询
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryDetail (condition) {
      console.log('queryDetailqueryDetailqueryDetail', condition)

      const data = await (this as any).findOne(condition)
      return data
    }

    /**
     * 筛选查询所有的巡检结论
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryManyAll (condition) {
      const data = await (this as any).findAll(condition)
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
    /**
     * 查询巡检点位的巡检结果(v1.1.0新增)
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryPointPatrolDetail (params) {
      const { patrolPointId } = params
      const condition = {
        where: { taskPointId: patrolPointId },
        attributes: [
          [ Sequelize.col('patrolTaskItem.item_name'), 'itemName' ],
          [ Sequelize.col('patrolTaskItem.item_score'), 'itemScore' ],
          [ Sequelize.col('patrolTaskItem.patrol_item_id'), 'patrolItemId' ],
          [ Sequelize.col('patrolTaskItem.item_parent_id'), 'itemParentId' ],
          [ Sequelize.col('patrolTaskItem.path'), 'path' ],
          'patrolTaskItemId',
          'picUrls',
          'patrolResult',
          'patrolScore',
          'nextHandlePeople',
          'nextCopyPeople',
          'recResult',
          'resultDesc'
        ],
        include: [
          {
            model: app.model['PatrolTaskItem' + capitalSchema],
            as: 'patrolTaskItem',
            attributes: []
          }
        ]
      }
      const data = await (this as any).findAll(condition)
      return data
    }
    /**
     * 获取监控点， 考评项， 问题描述， 巡查时间
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryDataByTaskIdByQuestionServicePersonList (params) {
      const { relativeId, processType, patrolObjId } = params
      if (!relativeId) {
        const error:any = new Error(this.app.ctx.__('model.missingParameters'))
        error.status = 425
        throw error
      }
      const condition:any = {
        where: { pointResultId: relativeId },
        include: [
          {
            model: app.model['Task' + capitalSchema],
            as: 'patrolTask',
            include: [
              {
                where: { processType },
                require: false,
                model: app.model['PatrolTaskPerson' + capitalSchema],
                as: 'person'
              }
            ]
          }
        ],
        raw: false // 使用hasMany的时候需要聚合一下数据
      }
      if (patrolObjId) {
        condition.include[0].include[0].where = {
          processType,
          objectId: patrolObjId
        }
      }
      const data = await TaskExecSchema.findOne(condition)
      return data.patrolTask.person.dataValues
    }
    /**
     * 获取变电站 监控点， 考评项， 问题描述， 巡查时间
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryDataByIdByQuestionServiceSubstationGetInspectionRemark (params) {
      const inspectionRemark = {
        where: { pointResultId: params.dataValues.relativeId },
        attributes: [ 'taskPointId', 'patrolTaskItemId', 'resultDesc', 'patrolScore' ],
        include: [
          {
            model: app.model['PatrolTaskItem' + capitalSchema],
            as: 'patrolTaskItem',
            attributes: [ 'path', 'createTime' ]
          }
        ]
      }
      const data = await TaskExecSchema.findOne(inspectionRemark)
      return data
    }

    @Model
    async queryAllQuestion (params) {
      const {
        startTime, endTime, remark, taskIdArr
      } = params
      const inspectionRemark:any = {
        where: { isIntoNextStep: 1 },
        attributes: [
          'pointResultId',
          [ Sequelize.col('patrolTaskItem.path'), 'path' ],
          [ Sequelize.col('patrolTaskItem.patrol_obj_rel_id'), 'patrolObjRelId' ]
        ],
        include: [
          {
            model: app.model['PatrolTaskItem' + capitalSchema],
            as: 'patrolTaskItem',
            attributes: []
          }
        ]
      }
      if (taskIdArr) {
        inspectionRemark.where.taskId = { [Op.in]: taskIdArr }
      }
      if (startTime && endTime) {
        inspectionRemark.where.createTime = { [Op.between]: [ startTime, endTime ] }
      }
      if (remark) {
        inspectionRemark.where.resultDesc = { [Op.iLike]: `%%${remark}%%` }
      }
      const data = await TaskExecSchema.findAll(inspectionRemark)
      console.log('+++++++++++++++++++++++所有的问题', data)

      return data
    }

    /**
     * 获取 监控点， 考评项， 问题描述， 巡查时间
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryDataByIdByQuestionServiceImgInquireGetInspectionRemark (params) {
      console.log('=+++++++++++++++++++++++++++', params.relative_id)
      const inspectionRemark = {
        where: { pointResultId: params.relative_id },
        attributes: [
          'taskPointId',
          'patrolTaskItemId',
          'resultDesc',
          'eventCode',
          'patrolScore',
          'createTime',
          'picUrls'
        ],
        include: [
          {
            model: app.model['PatrolTaskPoint' + capitalSchema],
            as: 'patrolTaskPoint',
            attributes: [ 'pointName', 'modelName', 'patrolPointId', 'patrolTaskItemId' ],
            include: {
              model: app.model['PatrolPoint' + capitalSchema],
              as: 'PatrolPoint',
              attributes: [ 'cameraName' ]
            }
          },
          {
            model: app.model['PatrolTaskItem' + capitalSchema],
            as: 'patrolTaskItem',
            attributes: [
              'path',
              'createTime',
              'patrolItemId',
              'patrolTaskItemId',
              'patrolObjRelId',
              'itemName'
            ],
            include: {
              model: app.model['PatrolObjRel' + capitalSchema],
              as: 'patrolObj',
              attributes: [ 'patrolObjId' ],
              include: {
                model: app.model['PatrolObj' + capitalSchema],
                as: 'partrolObjItem',
                attributes: [ 'patrolObjName' ]
              }
            }
          },
          {
            model: app.model['Task' + capitalSchema],
            as: 'patrolTask',
            attributes: [ 'execType', 'patrolTaskName', 'planId' ],
            include: {
              model: app.model['PatrolPlan' + capitalSchema],
              as: 'planItems',
              attributes: [ 'patrolPlanName' ]
            }
          }
        ]
      }
      const data = await TaskExecSchema.findOne(inspectionRemark)
      return data
    }

    @Model
    async queryQuestionTransPatrolMethod (params) {
      const inspectionRemark:any = {
        where: {},
        include: [
          {
            model: app.model['Task' + capitalSchema],
            as: 'patrolTask',
            attributes: [ 'execType' ]
          },
          {
            model: app.model['PatrolTaskItem' + capitalSchema],
            as: 'patrolTaskItem',
            attributes: [ 'itemName' ]
          },
          {
            model: app.model['ObjTypeResult' + capitalSchema],
            as: 'itemPatrolResult',
            attributes: [ 'orName' ]
          }
        ]
      }
      if (params.relativeId) {
        inspectionRemark.where.pointResultId = params.relativeId
      } else if (params.taskPointId) {
        inspectionRemark.where.taskPointId = params.taskPointId
      } else {
        inspectionRemark.where.patrolTaskItemId = params.patrolTaskItemId
      }
      const data = await TaskExecSchema.findOne(inspectionRemark)
      return data
    }

    /**
     * 获取社区巡查考评监控点， 考评项， 问题描述， 巡查时间
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryDataByIdByQuestionServiceEvaluationGetInspectionRemark (params) {
      const inspectionRemark:any = {
        where: { pointResultId: params.dataValues.relativeId },
        attributes: [ 'taskPointId', 'patrolTaskItemId', 'resultDesc', 'patrolScore' ],
        include: [
          {
            model: app.model['PatrolTaskPoint' + capitalSchema],
            as: 'patrolTaskPoint',
            attributes: [ 'pointName', 'modelName', 'patrolPointId' ]
          },
          {
            model: app.model['PatrolTaskItem' + capitalSchema],
            as: 'patrolTaskItem',
            attributes: [ 'path', 'createTime' ]
          }
        ]
      }
      const data = await TaskExecSchema.findOne(inspectionRemark)
      return data
    }

    /**
     * 获取下一步流程
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryDataByTaskIdByQuestionServiceGetNextProcess (params) {
      const { relativeId } = params
      let { processType } = params
      if (!relativeId) {
        const error:any = new Error(this.app.ctx.__('model.missingParameters'))
        error.status = 425
        throw error
      }
      const condition = {
        where: { pointResultId: relativeId },
        include: [
          {
            model: app.model['Task' + capitalSchema],
            as: 'patrolTask',
            include: [
              {
                require: false,
                model: app.model['Process' + capitalSchema],
                as: 'Process'
              }
            ]
          }
        ],
        raw: false // 使用hasMany的时候需要聚合一下数据
      }
      const data = await TaskExecSchema.findOne(condition)
      console.log('hhhhhhhh', data)
      const compare = function (obj1, obj2) {
        const val1 = obj1.processType
        const val2 = obj2.processType
        if (val1 > val2) {
          return -1
        } else if (val1 < val2) {
          return 1
        }
        return 0
      }
      const arr = data.patrolTask.Process
      let handlePeople = ''
      arr.sort(compare)
      if (arr[0].processType === 3) {
        // 下一步操作  0 巡检 1 复核 2 整改 3 审核
        if (processType === '0') {
          processType = this.app.ctx.__('model.toReview') // 1
          handlePeople = this.app.ctx.__('model.rectification')
        } else if (processType <= 3) {
          processType = this.app.ctx.__('model.rectification') //  2
          handlePeople = this.app.ctx.__('model.toExamine')
        } else if (processType <= 5) {
          processType = this.app.ctx.__('model.toExamine') // 3
          handlePeople = this.app.ctx.__('model.rectification')
        } else if (processType === '7') {
          processType = this.app.ctx.__('model.rectification') // 2
          handlePeople = this.app.ctx.__('model.toExamine')
        }
      } else if (arr[0].processType === 2) {
        // 下一步操作  0 巡检 1 复核 2 整改 3 审核
        if (processType === '0') {
          processType = this.app.ctx.__('model.toReview') // 1
          handlePeople = this.app.ctx.__('model.rectification')
        } else if (processType <= 3) {
          processType = this.app.ctx.__('model.rectification') // 2
          handlePeople = ''
        }
      } else if (arr[0].processType === 1) {
        // 下一步操作  0 巡检 1 复核
        if (processType === '0') {
          processType = this.app.ctx.__('model.toReview') // 1
          handlePeople = ''
        }
      }
      return {
        processType, // 当前步骤
        patrolTaskItemId: data.patrolTaskItemId,
        taskPointId: data.taskPointId,
        handlePeople, // 下一步步骤
        process: arr
      }
    }

    /**
     * 获取计划模板流程
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryDataByTaskIdByQuestionServiceGetProcess (params) {
      const { relativeId, taskPointId, patrolTaskItemId } = params
      const condition:any = {
        where: {},
        include: [
          {
            model: app.model['Task' + capitalSchema],
            as: 'patrolTask',
            include: [
              {
                require: false,
                model: app.model['Process' + capitalSchema],
                where: { isDelete: 0 },
                as: 'Process'
              }
            ]
          }
        ],
        raw: false // 使用hasMany的时候需要聚合一下数据
      }
      if (relativeId) {
        condition.where.pointResultId = relativeId
      } else if (patrolTaskItemId) {
        condition.where.patrolTaskItemId = patrolTaskItemId
      } else {
        condition.where.taskPointId = taskPointId
      }
      const data = await TaskExecSchema.findOne(condition)
      const compare = function (obj1, obj2) {
        const val1 = obj1.processType
        const val2 = obj2.processType
        if (val1 > val2) {
          return -1
        } else if (val1 < val2) {
          return 1
        }
        return 0
      }
      if (data) {
        const arr = data.patrolTask.Process
        arr.sort(compare)
        return {
          process: arr,
          taskPointId: data.taskPointId,
          patrolTaskItemId: data.patrolTaskItemId
        }
      }
      return {
        process: [],
        taskPointId: '',
        patrolTaskItemId: ''
      }
    }
    @Model
    async queryNextResult (params) {
      const res = await (this as any).query(`
      select
        b.*
      from ` +
      schema + '.tb_task_exec_result a,' +
      schema + `.tb_transaction_flow b
      where
        a.patrol_task_item_id = $patrolTaskItemId
        and a.point_result_id = b.relative_id
        and b.is_delete = 0
      `, { bind: { patrolTaskItemId: params.patrolTaskItemId } })
      return this.app.toHumpJson(res[0])
    }
  }

  TaskExecSchema.query = new Query()
  return TaskExecSchema
}
