import {  Context, inject, provide} from 'midway';
import { ItaskExecResultService } from '../app/interface/taskExecResultInterface';
const Sequelize = require('sequelize')
const { Op } = Sequelize
const { Transactional } = require('../app/core/transactionalDeco/index')

@provide('taskExecResultService')
export class TaskExecResultService implements ItaskExecResultService{
  @inject()
  ctx: Context;
  /**
   * 通过巡检项id查巡检结论
   * @param {object} { params, pagination } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async queryByItemId (params:any = {}) {
    const { itemId } = params
    if (itemId) {
      // 先通过itemId查出所有的 patrol_task_item_id
      const condition = {
        where: { patrolItemId: itemId },
        attributes: [ 'patrolTaskItemId' ]
      }
      const res = await (this as any).query('PatrolTaskItem', 'queryManyAll', [ condition ])
      const arr = res.map(s => s.patrolTaskItemId)
      const condition1 = {where: { patrolTaskItemId: { [Op.in]: arr } }}
      const result = await (this as any).query('TaskExecSchema', 'queryManyAll', [ condition1 ])
      return result
    }
    throw Error(this.ctx.__('common.paramsNotExit'))

  }
  /**
   * 通过计划id查询已解决的问题数
   * @param {object} { params, pagination } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async querySolvedProblemByPlanId (params:any): Promise<any> {
    const { patrolPlanId } = params
    const condition:any = {
      where: {},
      attributes: [ 'patrolTaskId' ],
      raw: true
    }
    if (patrolPlanId) {
      condition.where.planId = { [Op.or]: patrolPlanId.split(',') }
    } // 巡检计划
    const { list } = await (this as any).query('Task', 'queryAllData', [ condition ])

    const patrolTaskIdArr = list.map(item => {
      return item.patrolTaskId.toString()
    })
    let problemNum = 0

    if (patrolTaskIdArr.length > 0) {
      const condition1 = {
        where: {
          taskId: { [Op.or]: patrolTaskIdArr },
          isIntoNextStep: 1,
          status: 1
        },
        attributes: [ 'pointResultId' ]
      }
      const problemRes = await (this as any).query('TaskExecSchema', 'queryManyAll', [ condition1 ])
      let problemIdArr = null
      if (problemRes) {
        problemIdArr = problemRes.map(item => item.pointResultId)
      }
      if (problemIdArr) {
        const condition2 = {
          where: {
            relativeId: { [Op.or]: problemIdArr },
            status: '3'
          }
        }
        problemNum = await (this as any).query('TransactionFlow', 'queryCount', [ condition2 ])
      }
    }
    return problemNum
  }
  /**
   * 通过计划id查询有问题的对象数
   * @param {object} { params, pagination } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async queryProblemObjByPlanId (params:any): Promise<any> {
    const { patrolPlanId } = params
    // 思路,先查询计划下所有的问题,然后根据问题-> 任务巡检项 -> 对象
    const condition:any = {
      where: {},
      attributes: [ 'patrolTaskId' ],
      raw: true
    }
    if (patrolPlanId) {
      condition.where.planId = { [Op.in]: patrolPlanId.split(',') }
    } // 巡检计划
    const { list } = await (this as any).query('Task', 'queryAllData', [ condition ])

    const patrolTaskIdArr = list.map(item => {
      return item.patrolTaskId.toString()
    })
    let problemNum = 0

    if (patrolTaskIdArr.length > 0) {
      const data = await (this as any).query('TaskExecSchema', 'findObjByPromble', [{ patrolTaskIdArr }])
      const returnData = data
        .map(item => item['patrolTaskItem.patrolObj.patrolObjId'])
        .filter(elem => {
          if (elem) {
            return elem
          }
        })
      // 去重
      const newData = []
      for (const e of returnData.values()) {
        if (!newData.includes(e)) {
          newData.push(e)
        }
      }
      problemNum = newData.length
    }
    return problemNum
  }
  /**
   * 通过计划id查询问题数
   * @param {object} { params, pagination } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async queryProblemByPlanId (params:any): Promise<any> {
    const { patrolPlanId } = params
    const condition:any = {
      where: {},
      attributes: [ 'patrolTaskId' ],
      raw: true
    }
    if (patrolPlanId) {
      condition.where.planId = { [Op.in]: patrolPlanId.split(',') }
    } // 巡检计划
    const { list } = await (this as any).query('Task', 'queryAllData', [ condition ])

    const patrolTaskIdArr = list.map(item => {
      return item.patrolTaskId.toString()
    })
    let problemNum = 0

    if (patrolTaskIdArr.length > 0) {
      const condition1 = {
        where: {
          taskId: { [Op.or]: patrolTaskIdArr },
          isIntoNextStep: 1,
          status: 1
        }
      }
      problemNum = await (this as any).query('TaskExecSchema', 'queryCount', [ condition1 ])
    }
    return problemNum
  }

  /**
   * 通过任务id查询问题数
   * @param {object} { params, pagination } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async queryProblemByTaskId (params:any): Promise<any> {
    const { taskId } = params
    let problemNum = 0
    if (taskId) {
      const condition1 = {
        where: {
          taskId,
          isIntoNextStep: 1,
          status: 1
        }
      }
      problemNum = await (this as any).query('TaskExecSchema', 'queryCount', [ condition1 ])
    }
    return problemNum
  }

  /**
   * 查询巡检对象的问题数(taskid,patrolObjRelId)
   * @param {object} { params, pagination } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async queryObjProblem (params:any): Promise<any> {
    const { taskId, patrolObjRelId } = params
    // 通过taskid 和 patrolObjRelId找出该对象下的任务巡检项
    const condition = {
      where: {
        patrolTaskId: taskId,
        patrolObjRelId
      },
      attributes: [ 'patrolTaskItemId' ]
    }
    const patrolTaskItemIds = await (this as any).query('PatrolTaskItem', 'queryManyAll', [ condition ])
    let problemNum = 0
    if (patrolTaskItemIds && patrolTaskItemIds.length > 0) {
      const itemIds = patrolTaskItemIds.map(m => m.patrolTaskItemId)
      const condition1 = {
        where: {
          taskId,
          isIntoNextStep: 1,
          patrolTaskItemId: { [Op.or]: itemIds },
          status: 1
        }
      }
      problemNum = await (this as any).query('TaskExecSchema', 'queryCount', [ condition1 ])
    }
    return problemNum
  }

  /**
   * 通过任务巡检项id
   * @param {object} { params, pagination } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async queryProblemByTaskItemIdArr (params:any): Promise<any> {
    const { taskItemIdArr, endTime, startTime } = params

    let problemNum = 0
    if (taskItemIdArr) {
      const condition1:any = {
        where: {
          patrolTaskItemId: { [Op.in]: taskItemIdArr },
          isIntoNextStep: 1,
          status: 1
        }
      }
      if (endTime && startTime) {
        condition1.where.createTime = { [Op.between]: [ parseInt(startTime), parseInt(endTime) ] }
      }
      problemNum = await (this as any).query('TaskExecSchema', 'queryCount', [ condition1 ])
    }
    return problemNum
  }
  /**
   * 根据任务巡检项ID，查找任务巡检项的结果
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async getTaskItemResult (params:any): Promise<any> {
    const condition = { where: { patrolTaskItemId: { [Op.or]: params } } }
    const result = await (this as any).query('TaskExecSchema', 'queryManyAll', [ condition ])
    return result
  }
  @Transactional
  async getTaskItemResultByUuid (params:any): Promise<any> {
    const condition = { where: { pointResultId: { [Op.or]: params } } }
    const result = await (this as any).query('TaskExecSchema', 'queryManyAll', [ condition ])
    return result
  }
  /**
   * 根据任务巡检项ID，查找任务巡检项的结果
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async getTaskItemResultOne (params:any): Promise<any> {
    const condition = { where: { patrolTaskItemId: params } }
    const result = await (this as any).query('TaskExecSchema', 'queryDetail', [ condition ])
    return result
  }
  /**
   * 根据resultId，查找执行结果详情，包括是否进入下一环节、巡检结论、下个环节执行人、抄送人等信息
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async getExecResultById (params:any): Promise<any> {
    const { relativeId } = params
    const condition = {
      where: { pointResultId: relativeId },
      raw: true
    }
    const result = await (this as any).query('TaskExecSchema', 'queryDetail', [ condition ])
    return result
  }
  @Transactional
  async getExecTypeByRelativeId (relativeId:any): Promise<any> {
    // const { relativeId } = params
    const condition = { where: { pointResultId: relativeId } }
    const result = await (this as any).query('TaskExecSchema', 'queryDetail', [ condition ])
    const condition1 = { where: { patrolTaskItemId: result.patrolTaskItemId } }
    const TaskItem = await (this as any).query('PatrolTaskItem', 'findOneData', [ condition1 ])
    const taskCondition = { where: { patrolTaskId: TaskItem.patrolTaskId } }
    const PatrolTask = await (this as any).query('Task', 'findOneData', [ taskCondition ])
    return PatrolTask.execType
  }
  /**
   * 根据taskPointId，查找执行结果详情
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async getExecResultByTaskPointId (taskPointId:any): Promise<any> {
    const condition = {
      where: { taskPointId },
      raw: true
    }
    const result = await (this as any).query('TaskExecSchema', 'queryDetail', [ condition ])
    return result
  }
  /**
   * 根据taskItemId，查找执行结果详情
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async getExecResultByTaskItemId (patrolTaskItemId:any): Promise<any> {
    const condition = {
      where: { patrolTaskItemId },
      raw: true
    }
    const result = await (this as any).query('TaskExecSchema', 'queryDetail', [ condition ])
    return result
  }
  /**
   * 根据 patrolTaskItemId 查询
  */
  @Transactional
  async getExecResultByTask (params:any): Promise<any> {
    const result = await (this as any).query('TaskExecSchema', 'queryNextResult', [ params ])
    return result
  }
}
