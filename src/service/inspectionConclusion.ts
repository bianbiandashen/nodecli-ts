'use strict'
import {  Context, inject, provide, Application} from 'midway';
import { 
  IInspectionConclusionService,
} from '../app/interface/inspectionConclusionInterface';
const { Transactional } = require('../app/core/transactionalDeco')
// 数组对象根据属性值（数字比较）排序
function compare (property) {
  return function (a, b) {
    const value1 = a[property]
    const value2 = b[property]
    return value1 - value2
  }
}
@provide('inspectionConclusionService')
export class InspectionConclusionService implements IInspectionConclusionService {
  @inject()
  ctx: Context;
  app: Application;
  /**
   * 查询任务巡检项处理的详情信息
   * @param {object} params
   * @return {string} - object
   * @author renxiaojian
   */
  @Transactional
  async getOperateDetail (params): Promise<any> {
    const { ctx } = this
    const { patrolTaskItemId } = params
    const result:any = {}
    // 查询当前巡检项的详情
    const taskItemDetail = await ctx.service.patrolTaskItem.getTaskItemInfo(
      { patrolTaskItemId },
      (this as any).transaction
    )
    // 查询当前巡检项对应的巡检方法列表
    const mannerList = await ctx.service.common.getItemMannerByTaskItemId(
      { taskItemId: patrolTaskItemId },
      (this as any).transaction
    )
    // 把巡检项对应的巡检项结论列表数据一起返回
    const conclusionList = await ctx.service.common.getPatrolResultByTaskItemId(
      { patrolTaskItemId },
      (this as any).transaction
    )
    // 获取计划模板流程
    const processList = await ctx.service.process.getProcessAllInfo({ psId: taskItemDetail.dataValues.psId })
    // 查询当前任务的下一个环节是什么，一并在详情里返回
    const _taskExecResult = await ctx.service.taskExecResult.getExecResultByTask(
      { patrolTaskItemId },
      (this as any).transaction
    )
    const _nextFlowInfo = _taskExecResult[0]
    if (_nextFlowInfo) { // 从任务结论表的流程表中查询下一步执行人
      let processType = null
      if (_nextFlowInfo.status === '0') {
        processType = 1
      } else if (_nextFlowInfo.status === '3') {
        processType = 2
      } else if (_nextFlowInfo.status === '5') {
        processType = 3
      }
      result.nextFlowInfo = {
        processType,
        currentPerson: _nextFlowInfo.nextHandlePeople
      }
      if (_nextFlowInfo.nextHandlePeople) {
        const res = await ctx.service.common.getUserInfoByUserIds(
          { userIds: _nextFlowInfo.nextHandlePeople },
          (this as any).transaction
        )
        result.nextFlowInfo.personList = res.list
      } else result.nextFlowInfo.personList = []
    } else {
      // 统一提交的时候，不能从任务结论表中查询下一步执行人
      const condition = {
        where: {
          patrolTaskId: taskItemDetail.dataValues.patrolTaskId,
          objectId: taskItemDetail.dataValues.patrolObjId
        }
      }
      const taskPersonRes = await (this as any).query('PatrolTaskPerson', 'queryManyAll', [ condition ])
      const _taskPersonRes = taskPersonRes.sort(compare('processType'))
      const index = _taskPersonRes.findIndex(item => item.processType === 0)
      const _nextIndex = index + 1
      const nextData = taskPersonRes[_nextIndex]
      if (nextData) {
        result.nextFlowInfo = {
          processType: nextData.processType,
          currentPerson: nextData.currentPerson
        }
        if (nextData.currentPerson) {
          const res = await ctx.service.common.getUserInfoByUserIds(
            { userIds: nextData.currentPerson },
            (this as any).transaction
          )
          result.nextFlowInfo.personList = res.list
        } else result.nextFlowInfo.personList = []
      } else {
        result.nextFlowInfo = {
          processType: null,
          currentPerson: '',
          personList: []
        }
      }
    }
    if (taskItemDetail.dataValues.taskExecList && taskItemDetail.dataValues.taskExecList.picUrls) {
      // 当前项有结论，取结论中的picUrls
      const picArr = taskItemDetail.dataValues.taskExecList.picUrls.split(',')
      const picArrInfo = []
      for (const v of picArr) {
        const urlInfo = await this.ctx.service.common.getImageUrlForBS(
          v,
          (this as any).transaction
        )
        if (typeof urlInfo === 'object') {
          picArrInfo.push(urlInfo)
        }
      }
      taskItemDetail.dataValues.picArrInfo = picArrInfo
    } else {
      const condition = { where: { patrolTaskItemId } }
      const picInfo = await (this as any).query('PatrolTaskPoint', 'findOneData', [ condition ])
      if (picInfo && picInfo.dataValues.picUrl) {
        const urlInfo = await this.ctx.service.common.getImageUrlForBS(
          picInfo.dataValues.picUrl,
          (this as any).transaction
        )
        taskItemDetail.dataValues.picArrInfo = [ urlInfo ]
      } else { taskItemDetail.dataValues.picArrInfo = [] }
    }
    // 数据结果
    result.currentTaskItemDetail = taskItemDetail
    result.mannerList = mannerList
    result.conclusionList = conclusionList.list
    result.processList = processList
    return result
  }
}
