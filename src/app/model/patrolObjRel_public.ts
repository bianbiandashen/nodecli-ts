'use strict'

module.exports = app => {
  const { model, Sequelize } = app
  const schema = 'public'
  const moment = require('moment')
  const capitalSchema = app.capitalize(schema)
  const patrolObjRelSchema = require('../../schema/tb_patrol_obj_rel')(app)
  const PatrolObjRel = model.define('tb_patrol_obj_rel', patrolObjRelSchema, { schema })
  const { Op } = Sequelize
  const { Model } = require('../core/transactionalDeco/index')
  PatrolObjRel.associate = function () {
    app.model['PatrolObjRel' + capitalSchema].belongsTo(app.model['PatrolObj' + capitalSchema], {
      foreignKey: 'patrolObjId',
      targetKey: 'patrolObjId',
      as: 'partrolObjItem'
    })
    app.model['PatrolObjRel' + capitalSchema].hasMany(
      app.model['PatrolTaskPoint' + capitalSchema],
      {
        foreignKey: 'patrolObjRelId',
        targetKey: 'patrolObjRelId',
        as: 'patrolTaskPoint'
      }
    )
    app.model['PatrolObjRel' + capitalSchema].hasMany(app.model['PatrolTaskItem' + capitalSchema], {
      foreignKey: 'patrolObjRelId',
      targetKey: 'patrolObjRelId',
      as: 'patrolTaskItem'
    })
    app.model['PatrolObjRel' + capitalSchema].belongsTo(app.model['Task' + capitalSchema], {
      foreignKey: 'patrolTaskId',
      targetKey: 'patrolTaskId',
      as: 'patrolTask'
    })
  }
  class Query {
    app=app
    @Model
    async queryManyDataByAnalysisServiceGetProblemRateByObj (params) {
      const { patrolObjId } = params
      const condition:any = {
        where: {},
        attributes: [ 'patrolObjRelId' ],
        include: [
          {
            model: app.model['PatrolTaskItem' + capitalSchema],
            attributes: [ 'patrolTaskItemId' ],
            as: 'patrolTaskItem'
          }
        ]
      }
      if (patrolObjId) condition.where.patrolObjId = { [Op.in]: patrolObjId.split(',') }
      const data = await (this as any).findAll(condition)
      return data
    }

    @Model
    async findPlanByObj (patrolObjId) {
      const condition = {
        where: { patrolObjId },
        attributes: [],
        include: {
          model: app.model['Task' + capitalSchema],
          as: 'patrolTask',
          attributes: [ 'planId' ]
        },
        raw: true
      }
      const data = await (this as any).findAll(condition)
      return data
    }
    @Model
    async getObjListByTaskId (patrolTaskId) {
      const result = await (this as any).query(
        'SELECT B.patrol_obj_name,B.model_data_id, B.patrol_obj_id,B.patrol_obj_region, a.patrol_obj_rel_id, a.status FROM ' +
          schema +
          '.tb_patrol_obj_rel A, ' +
          schema +
          `.tb_patrol_obj B 
        where A.patrol_obj_id = B.patrol_obj_id
        and A.patrol_task_id = $patrolTaskId

      `,
        { bind: { patrolTaskId } }
      )
      this.app.logger.log('　获取任务下得所有对象', result)
      return result
    }
    @Model
    async findOneDataObjRelByTaskApi (taskId) {
      const condition = {
        where: { patrolTaskId: taskId },
        attributes: [],
        include: {
          model: app.model['PatrolObj' + capitalSchema],
          as: 'partrolObjItem',
          attributes: [ 'patrolObjName', 'patrolObjId' ]
        }
      }
      const result = await (this as any).findOne(condition)
      return result
    }
    // 边
    @Model
    async findOneDataByTaskApi (taskId) {
      const conditidon = {
        where: { patrolTaskId: taskId },
        attributes: [],
        include: {
          model: app.model['PatrolObj' + capitalSchema],
          as: 'partrolObjItem',
          attributes: [ 'patrolObjName', 'patrolObjId' ]
        }
      }
      const result = await (this as any).findOne(conditidon)
      return result
    }
    /**
     * 查询
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async findOneData (params) {
      const data = await (this as any).findOne(params)
      return data
    }
    @Model
    async findOneDataByTask (params) {
      const { patrolTaskId, patrolObjId } = params
      const taskPointCondition = {
        where: {
          patrolTaskId,
          patrolObjId
        },
        // attributes: [
        //   [ Sequelize.col('partrolObjItem.patrol_obj_name'), 'patrolObjName' ]
        // ],
        include: [
          {
            model: app.model['PatrolTaskPoint' + capitalSchema],
            as: 'patrolTaskPoint'
          },
          {
            model: app.model['PatrolObj' + capitalSchema],
            as: 'partrolObjItem',
            // attributes: [
            //   'patrolObjName'
            // ],
            include: {
              model: app.model['PatrolObjType' + capitalSchema],
              as: 'patrolObjType',
              attributes: [ 'objTypeName' ]
            }
          }
        ],
        raw: false // 使用hasMany的时候需要聚合一下数据
      }
      const data = await (this as any).findOne(taskPointCondition)
      return data
    }
    /**
     * 查询
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async findOneDataModel (params, Sequelize) {
      const condition = {
        where: { patrolObjRelId: params.patrolObjRelId },
        attributes: [
          'patrolObjRelId',
          'patrolObjId',
          [ Sequelize.col('partrolObjItem.patrol_obj_name'), 'patrolObjName' ]
        ],
        include: {
          model: app.model['PatrolObj' + capitalSchema],
          as: 'partrolObjItem',
          attributes: []
        },
        raw: true
      }
      const data = await (this as any).findOne(condition)
      return data
    }
    /**
     * 查询
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryObjNameByRelIdModel (params) {
      const condition = {
        where: { patrolObjRelId: params.relId },
        attributes: [ 'patrolObjRelId' ],
        include: [
          {
            model: app.model['PatrolObj' + capitalSchema],
            as: 'partrolObjItem',
            attributes: [ 'patrolObjName', 'objTypeId' ],
            include: [
              {
                model: app.model['PatrolObjType' + capitalSchema],
                as: 'patrolObjType',
                attributes: [ 'objTypeName' ]
              }
            ]
          }
        ]
      }
      const data = await (this as any).findOne(condition)
      return data
    }
    /**
     * 通过巡检对象id查询巡检任务
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryTaskById (params) {
      const data = await (this as any).findAndCountAll(params)
      return data
    }

    /**
     * 通过巡检对象id获取任务对象关联表获取所有的任务
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryAll (params) {
      const data = await (this as any).findAll(params)
      return data
    }

    @Model
    async queryAllIncludeObjAndItem (params) {
      const { taskArr } = params
      const relCondition:any = {
        where: {},
        attributes: [ 'patrolObjRelId' ],
        include: [
          {
            model: app.model['PatrolObj' + capitalSchema],
            as: 'partrolObjItem',
            attributes: [ 'patrolObjName', 'patrolObjId' ]
          },
          {
            model: app.model['PatrolTaskItem' + capitalSchema],
            as: 'patrolTaskItem',
            attributes: [ 'patrolTaskItemId' ]
          }
        ]
      }
      if (taskArr) {
        relCondition.where.patrolTaskId = { [Op.in]: taskArr }
      }
      const data = await (this as any).findAll(relCondition)
      return data
    }

    // 获取最新生成任务的时间
    @Model
    async getTaskCreate (params) {
      const { patrolObjId } = params
      const relCondition = {
        where: { patrolObjId },
        attributes: [ 'patrolTaskId' ],
        include: [
          {
            model: app.model['Task' + capitalSchema],
            as: 'patrolTask',
            where: { taskType: 1 },
            require: false
          }
        ],
        order: [[ 'createTime', 'DESC' ]]
      }
      const data = await (this as any).findAll(relCondition)
      console.log('--------------临时任务--------------', data)
      return data
    }
    /**
     * 通过巡检任务id查询有检测点任务巡检项的对象列表
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async getObjlistHavePonitByTaskId (params) {
      const { patrolTaskId } = params
      const taskPointCondition = {
        where: { patrolTaskId },
        // attributes: [
        //   [ Sequelize.col('partrolObjItem.patrol_obj_name'), 'patrolObjName' ]
        // ],
        include: [
          {
            model: app.model['PatrolTaskPoint' + capitalSchema],
            as: 'patrolTaskPoint',
            require: true
          }
        ]
      }

      const data = await (this as any).findAll(taskPointCondition)
      return data
    }
    // 分页获取问题
    @Model
    async findAndCountAllData (condition) {
      // console.log('++++', condition)
      const data = await (this as any).findAndCountAll(condition)
      // 处理返回格式
      const result = {
        total: data.count,
        list: data.rows
      }
      return result
    }

    // 分页获取问题
    @Model
    async findAndCountAllDataModel (params, Sequelize, Op) {
      const {
        taskIdList,
        state,
        pageNo,
        pageSize,
        startTime,
        endTime,
        realObjId,
        planEffectiveEnd
      } = params
      const condition:any = {
        limit: pageSize * 1,
        offset: (pageNo - 1) * pageSize,
        where: {},
        attributes: [
          'patrolObjId',
          'patrolTaskId',
          'updateTime',
          [ Sequelize.col('status'), 'state' ],
          [ Sequelize.col('patrol_obj_rel_id'), 'patrolObjRelId' ],
          [ Sequelize.col('partrolObjItem.patrol_obj_name'), 'patrolObjName' ]
        ],
        include: [
          {
            model: app.model['PatrolObj' + capitalSchema],
            as: 'partrolObjItem',
            attributes: []
          }
        ]
      }
      if (taskIdList) {
        condition.where.patrolTaskId = { [Op.or]: taskIdList }
      }
      if (realObjId) condition.where.patrolObjId = realObjId
      if (state || state === 0) {
        if (
          moment(planEffectiveEnd)
            .endOf('day')
            .format('x') > moment().format('x')
        ) {
          // 未过期
          condition.where.status = state
        } else {
          // 过期
          if (state === 2) {

            condition.where.status = state
            condition.where.updateTime = { [Op.lte]: new Date(`${planEffectiveEnd} 23:59:59`).getTime() }
          } else if (state === 3) {
            // 已过期
            //  1 updatetime 判断 status 是2 的数据 跟 计划到期时间比对
            //  2 其他的直接 判断 计划时间
            Object.assign(condition.where, {
              [Op.not]: {
                [Op.and]: [
                  { status: 2 },
                  { updateTime: { [Op.lte]: new Date(`${planEffectiveEnd} 23:59:59`).getTime() } }
                ]
              }
            })
          }
        }
      }
      if (startTime && endTime) {
        condition.where.updateTime = { [Op.between]: [ parseInt(startTime), parseInt(endTime) ] }
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
     * 计数
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryCount (condition) {
      const data = await (this as any).count(condition)
      return data
    }

    // 数据隔离后追加的方法

    /**
     * 查询
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async findOneDataByMapServiceGetTaskObjDetailTaskPoint (params) {
      const { patrolTaskId, patrolObjId } = params

      const taskPointCondition = {
        where: {
          patrolTaskId,
          patrolObjId
        },
        include: [
          {
            model: app.model['PatrolTaskPoint' + capitalSchema],
            as: 'patrolTaskPoint'
          },
          {
            model: app.model['PatrolObj' + capitalSchema],
            as: 'partrolObjItem',
            include: {
              model: app.model['PatrolObjType' + capitalSchema],
              as: 'patrolObjType',
              attributes: [ 'objTypeName' ]
            }
          }
        ],
        raw: false // 使用hasMany的时候需要聚合一下数据
      }
      const data = await (this as any).findOne(taskPointCondition)
      return data
    }

    /**
     *  获取巡查考评得问题列表
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryDataByIdByQuestionServiceSubstationGetListService (params) {
      const { patrolObjId } = params
      const condition = {
        where: { patrolObjId },
        attributes: [ 'patrolObjRelId', 'patrolObjId' ],
        include: [
          {
            model: app.model['PatrolTaskPoint' + capitalSchema],
            as: 'patrolTaskPoint',
            attributes: [ 'patrolTaskPointId' ]
          }
        ],
        raw: false
        // raw: false // 使用hasMany的时候需要聚合一下数据
      }
      const data = await PatrolObjRel.findAll(condition)
      return data
    }

    /**
     *  获取社区图片考评得问题列表
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryDataByIdByQuestionServiceImgInquireGetListService (params) {
      const { patrolObjId } = params
      const condition = {
        where: { patrolObjId },
        attributes: [ 'patrolObjRelId', 'patrolObjId' ],
        include: [
          {
            model: app.model['PatrolTaskItem' + capitalSchema],
            as: 'patrolTaskItem'
            // attributes: ['patrolTaskPointId', 'pointName']
            // include: {
            //   model: app.model['TaskExecSchema' + capitalSchema],
            //   as: 'taskExecSchema'
            // }
          }
        ],
        raw: false
        // raw: false // 使用hasMany的时候需要聚合一下数据
      }
      const data = await PatrolObjRel.findAll(condition)
      return data
    }
  }
  PatrolObjRel.query = new Query()
  return PatrolObjRel
}
