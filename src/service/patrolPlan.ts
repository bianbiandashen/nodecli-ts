import {  Context, inject, provide, Application} from 'midway';
import { IPatrolPlanService,getProcessListParams,getProcessListResult,createPatrolPlanServiceParams,addPatrolPlanParams,updatePatrolPlanParams } from '../app/interface/patrolPlanInterface';
import { IpdmsService } from '../app/interface/pdmsInterface';
import { IprocessService } from '../app/interface/processInterface';
import { IPatrolPlanGroupService } from '../app/interface/patrolPlanGroupInterface';
import { IpatrolTaskDateService } from '../app/interface/patrolTaskDateInterface';
import { IrelationObjPlanService } from '../app/interface/relationObjPlanInterface';
import { IsceneDataService } from '../app/interface/sceneDataInterface';
import { IPatrolPlanFlowService } from '../app/interface/patrolPlanFlowInterface';
import { IrelationObjPersonService } from '../app/interface/relationObjPersonInterface';
import { IPatrolItemService } from '../app/interface/patrolItemInterface';
import { IPatrolPointService } from '../app/interface/patrolPointInterface';
import { IPatrolItemTitleService } from '../app/interface/patrolItemTitleInterface';
import { IPatrolObjService } from '../app/interface/patrolObjInterface';

const { Transactional } = require('../app/core/transactionalDeco/index')
const Sequelize = require('sequelize')
const { Op } = Sequelize
const moment = require('moment')
const UUID = require('uuid')
// 过滤对象中的某些属性
function filterObj (that,obj,arr):any {
  if (typeof obj !== 'object' || !Array.isArray(arr)) {
    throw new Error(that.ctx.__('patrolPlan.paramsFormatWrong'))
  }
  const result = {}
  Object.keys(obj)
    .filter(key => !arr.includes(key))
    .forEach(key => {
      result[key] = obj[key] || (obj[key] === '' ? null : obj[key])
    })
  return result
}
// 比较两个数组
function returnDiffObj (souceArr, targetArr, id) {
  return souceArr.filter(item => {
    const d = targetArr.map(v => v[id])
    return !d.includes(item[id])
  })
}
function groupHandle (arr) {
  const map = {},
    dest = []
  for (let i = 0; i < arr.length; i++) {
    const ai = arr[i]
    if (!map[ai.groupId]) {
      dest.push({
        groupId: ai.groupId,
        groupName: ai.groupName,
        onceEffective: ai.onceEffective,
        taskExecuteCycle: ai.taskExecuteCycle,
        patrolObjectList: [{
          patrolObjId: ai.patrolObjId,
          objTypeName: ai.objTypeName,
          patrolObjName: ai.patrolObjName,
          patrolObjRegion: ai.patrolObjRegion,
          regionPath: ai.regionPath,
          uuid: ai.uuid,
          objOrder: ai.objOrder,
          objTypeId: ai.objTypeId,
          patrolItemList: []
        }],
        taskExecuteDateList: [{
          taskExecuteId: ai.taskExecuteId,
          taskExecuteDate: ai.taskExecuteDate,
          taskExecuteTime: ai.taskExecuteTime,
          taskEffective: ai.taskEffective
        }]
      })
      map[ai.groupId] = ai
    } else {
      for (let j = 0; j < dest.length; j++) {
        const dj = dest[j]
        if (dj.groupId === ai.groupId) {
          let objExist = false
          let taskDateExist = false
          for (const objItem of dj.patrolObjectList) {
            if (objItem.patrolObjId === ai.patrolObjId) {
              objExist = true
            }
          }
          if (!objExist) {
            dj.patrolObjectList.push({
              patrolObjId: ai.patrolObjId,
              objTypeName: ai.objTypeName,
              patrolObjName: ai.patrolObjName,
              patrolObjRegion: ai.patrolObjRegion,
              regionPath: ai.regionPath,
              uuid: ai.uuid,
              objOrder: ai.objOrder,
              objTypeId: ai.objTypeId,
              patrolItemList: []
            })
          }
          for (const dateItem of dj.taskExecuteDateList) {
            if (dateItem.taskExecuteId === ai.taskExecuteId) {
              taskDateExist = true
            }
          }
          if (!taskDateExist) {
            dj.taskExecuteDateList.push({
              taskExecuteId: ai.taskExecuteId,
              taskExecuteDate: ai.taskExecuteDate,
              taskExecuteTime: ai.taskExecuteTime,
              taskEffective: ai.taskEffective
            })
          }
          break
        }
      }
    }
  }
  return dest
}
function patrolObjHandle (arr) {
  const map = {},
    dest = []
  for (let i = 0; i < arr.length; i++) {
    const ai = arr[i]
    if (!map[ai.patrolObjId]) {
      dest.push({
        patrolObjId: ai.patrolObjId,
        patrolItemList: [ ai ]
      })
      map[ai.patrolObjId] = ai
    } else {
      for (let j = 0; j < dest.length; j++) {
        const dj = dest[j]
        if (dj.patrolObjId === ai.patrolObjId) {
          dj.patrolItemList.push(ai)
          break
        }
      }
    }
  }
  return dest
}
function patrolItemHandle (arr) {
  const map = {},
    dest = []
  for (let i = 0; i < arr.length; i++) {
    const ai = arr[i]
    if (!map[ai.itemId]) {
      dest.push({
        itemId: ai.itemId,
        patrolPointList: [ ai ],
        mannerList: [ ai ]
      })
      map[ai.itemId] = ai
    } else {
      for (let j = 0; j < dest.length; j++) {
        const dj = dest[j]
        if (dj.itemId === ai.itemId) {
          dj.patrolPointList.push(ai)
          dj.mannerList.push(ai)
          break
        }
      }
    }
  }
  return dest
}
@provide('patrolPlanService')
export class PatrolPlanService implements IPatrolPlanService {
  @inject()
  ctx: Context;
  app: Application;

  @inject('pdmsService')
  pdmsService: IpdmsService;

  @inject('processService')
  serviceIprocess: IprocessService;

  @inject('patrolPlanGroupService')
  serviceIPatrolPlanGroup: IPatrolPlanGroupService;

  @inject('patrolTaskDateService')
  serviceIpatrolTaskDate: IpatrolTaskDateService;

  @inject('relationObjPlanService')
  serviceIrelationObjPlan: IrelationObjPlanService;

  @inject('sceneDataService')
  serviceIsceneData: IsceneDataService;

  @inject('patrolPlanFlowService')
  serviceIPatrolPlanFlow: IPatrolPlanFlowService;

  @inject('relationObjPersonService')
  serviceIrelationObjPerson: IrelationObjPersonService;

  @inject('patrolItemService')
  serviceIPatrolItem: IPatrolItemService;

  @inject('patrolPointService')
  serviceIPatrolPoint: IPatrolPointService;

  @inject('patrolItemTitleService')
  serviceIPatrolItemTitle: IPatrolItemTitleService;

  @inject('patrolObjService')
  serviceIPatrolObj: IPatrolObjService;
  
  /**
   * 获取巡检计划的唯一编号
   */
  @Transactional
  async getPatrolPlanUuid ():Promise<string> {
    return `PLAN${moment().format('YYYYMMDDHHmmss')}_${UUID.v1().substring(0, 4)}`
  }
   /**
   * 巡检计划名称校验
   */
  @Transactional
  async planNameIsExist (patrolPlanName:any,transaction?:any): Promise<any> {
    const result = await (this  as  any).query('PatrolPlan', 'queryDataByPlanName', [ patrolPlanName ])
    return result
  }
  @Transactional
  async getProcessList (params: getProcessListParams): Promise<getProcessListResult> {
    const result = await (this  as  any).query('PatrolPlan', 'getProcessList', [ params ])
    // 获取计划模板流程
    const processList = await this.serviceIprocess.getProcessAllInfo({ psId: result.dataValues.psId }, (this  as  any).transaction)
    result.dataValues.processList = processList
    return result
  }
  /**
   * 新增巡检计划
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async createPatrolPlanService (params : createPatrolPlanServiceParams, transaction?:any):Promise<string> {
    const _params = filterObj(this, params, [ 'planGroup', 'flowConfigList' ])
    // const baseExecuteType = [0, 1, 2]
    if (!_params.executeType) throw new Error(this.ctx.__('patrolPlan.executeTypeMust'))
    if (typeof _params.executeType !== 'string') throw new Error(this.ctx.__('patrolPlan.executeTypeMustString'))
    // if (!baseExecuteType.includes(_params.executeType)) throw new Error(`暂无executeType为${_params.executeType}的任务执行方式`);
    params = Object.assign(_params, { isDelete: 0, isDefault: 1 })
    const plan = await this.planNameIsExist(params, (this  as  any).transaction)
    const isExist = plan.length > 0
    if (isExist) {
      throw new Error(this.ctx.__('patrolPlan.planNameRepeat'))
    }
    const nowTime = new Date()
    const createDataParams = Object.assign(params, { createTimeZone: -(nowTime.getTimezoneOffset() / 60), createTimeStamp: nowTime.getTime(), updateTimeZone: -(nowTime.getTimezoneOffset() / 60), updateTimeStamp: nowTime.getTime() })
    const result = await (this  as  any).query('PatrolPlan', 'createData', [ createDataParams ])
    return result.patrolPlanId
  }
  /**
   * 添加巡检计划2(兼容教育督导)
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async addPatrolPlan (params:addPatrolPlanParams):Promise<string> {
    const dateRexp = /^[1-9]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/
    const timeRexp = /^(20|21|22|23|[0-1]\d):[0-5]\d$/
    const { ctx } = this
    const id = await this.createPatrolPlanService(params, (this as any).transaction)
    const planGroup = params.planGroup
    if (!planGroup) throw new Error(this.ctx.__('patrolPlan.planNameGroupRepeat'))
    for (const item of planGroup) {
      if (!item.taskExecuteCycle && item.taskExecuteCycle !== 0) throw new Error(this.ctx.__('patrolPlan.taskExecuteCycleMust'))
      if (!Number.isFinite(item.taskExecuteCycle)) throw new Error(this.ctx.__('patrolPlan.taskExecuteCycleMustNumber'))
      if (!item.taskExecuteDateList) throw new Error(this.ctx.__('patrolPlan.taskExecuteDateListMust'))
      // 创建分组
      const group = await this.serviceIPatrolPlanGroup.createPatrolPlanGroup(
        {
          patrolPlanId: id,
          groupName: item.groupName,
          onceEffective: item.onceEffective || null,
          taskExecuteCycle: item.taskExecuteCycle
        },
        (this  as  any).transaction
      )
      const _taskExecuteDateList = item.taskExecuteDateList.map(v => {
        if (!v.taskExecuteDate) throw new Error(this.ctx.__('patrolPlan.datetaskExecuteDateMust'))
        if (!v.taskExecuteTime) throw new Error(this.ctx.__('patrolPlan.taskExecuteTimeMust'))
        if (item.taskExecuteCycle === 0 && !dateRexp.test(v.taskExecuteDate)) {
          throw new Error(this.ctx.__('patrolPlan.dateFormatWrong'))
        }
        if (!timeRexp.test(v.taskExecuteTime)) {
          throw new Error(this.ctx.__('patrolPlan.timeFormatWrong'))
        }
        v.patrolPlanId = id || ''
        v.groupId = group.dataValues.groupId
        return v
      })
      if (!item.patrolObjectList) throw new Error(this.ctx.__('patrolPlan.patrolObjectListMust'))
      const RelationCollection = []
      item.patrolObjectList.forEach(item => {
        if (!item.patrolObjId) throw new Error(this.ctx.__('patrolPlan.patrolObjIdMust'))
        if (!item.objOrder && item.objOrder !== 0) throw new Error(this.ctx.__('patrolPlan.objOrderMust'))
        const RelationObj = {
          patrolPlanId: id,
          groupId: group.dataValues.groupId,
          patrolObjId: item.patrolObjId,
          objOrder: item.objOrder
        }
        if (item.patrolItemList && item.patrolItemList.length > 0) {
          item.patrolItemList.forEach(innerItem => {
            if (innerItem.patrolPointList && innerItem.patrolPointList.length > 0) {
              innerItem.patrolPointList.forEach(v => {
                const RelationItem = Object.assign({}, RelationObj, {
                  itemId: innerItem.itemId,
                  patrolPointId: v.patrolPointId
                })
                RelationCollection.push(RelationItem)
              })
            } else {
              const RelationItem = Object.assign({}, RelationObj, { itemId: innerItem.itemId })
              RelationCollection.push(RelationItem)
            }
          })
        } else {
          RelationCollection.push(RelationObj)
        }
      })
      const _taskExecuteDateListNew = _taskExecuteDateList.map(res => {
        const obj = res
        obj.taskStartTimeZone = -(new Date(res.localTimeToISOTime).getTimezoneOffset() / 60)
        obj.taskStartTimeStamp = new Date(res.localTimeToISOTime).getTime()
        return obj
      })
      // 保存任务执行时间表
      await this.serviceIpatrolTaskDate.createPatrolTaskDateService(
        _taskExecuteDateListNew,
        (this  as  any).transaction
      )
      // 保存巡检计划、巡检对象、巡检项、关联检测点表
      await this.serviceIrelationObjPlan.createRelationObjPlanService(
        RelationCollection,
        (this  as  any).transaction
      )
    }
    // 保存计划关联的流程表
    const _flowlist = await this.serviceIprocess.getProcess(
      { psId: params.psId },
      (this  as  any).transaction
    )
    if (!_flowlist || (_flowlist && _flowlist.length <= 0)) {
      const planManage = await this.serviceIsceneData.getOnePageConfig({
        appId: ctx.header.appid,
        page: 'PlanManage'
      }, (this  as  any).transaction)
      if (planManage && planManage.baseInfo) {
        const psConfigName = planManage.baseInfo.find(v => v.key === 'psId')
        const name = psConfigName ? (psConfigName.alias || psConfigName.label || this.ctx.__('patrolPlan.planTemplate')) : this.ctx.__('patrolPlan.planTemplate')
        throw new Error(this.ctx.__('patrolPlan.noExitRefresh',name))
      } else throw new Error(this.ctx.__('patrolPlan.planNoExitRefresh'))
    }
    for (const item of params.flowConfigList) {
      const currentflow = _flowlist.find(v => v.processType === item.processType)
      const planFlow = await this.serviceIPatrolPlanFlow.createPatrolPlanFlow(
        Object.assign({}, item, currentflow, { patrolPlanId: id }),
        (this  as  any).transaction
      )
      if (currentflow.executorAssignStrategy && currentflow.executorAssignStrategy === 1) {
        for (const innerItem of item.relationList) {
          const relParams = Object.assign(
            {},
            {
              personIds: innerItem.personList
                .map(item => {
                  return item.userId
                })
                .join(','),
              patrolObjId: innerItem.patrolObjId,
              planFlowId: planFlow.dataValues.planFlowId
            }
          )
          await this.serviceIrelationObjPerson.createRelation(relParams, (this  as  any).transaction)
        }
      }
    }
    return id
  }
  /**
   * 更新巡检计划2(兼容教育督导)
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async updatePatrolPlanInfo (params:updatePatrolPlanParams) {
    const _this = (this as any)
    const _params = filterObj(this,params, [ 'planGroup', 'flowConfigList' ])
    // 修改计划信息
    await _this.query('PatrolPlan', 'updateData', [ _params ])
    const updatePlanGroup = params.planGroup.filter(v => v.groupId)
    const addPlanGroup = params.planGroup.filter(v => !v.groupId)
    const existPlanGroup = await this.serviceIPatrolPlanGroup.queryAllPlanGroup(
      { patrolPlanId: params.patrolPlanId },
      _this.transaction
    )
    const deletePlanGroup = returnDiffObj(existPlanGroup, updatePlanGroup, 'groupId')
    if (deletePlanGroup.length > 0) {
      // 删除分组
      const deletePlanGroupIds = deletePlanGroup.map(item => item.groupId)
      await this.serviceIPatrolPlanGroup.deleteGroupDate(deletePlanGroupIds, _this.transaction)
      await this.serviceIrelationObjPlan.deleteDataByGroupIds(deletePlanGroupIds, _this.transaction)
      await this.serviceIpatrolTaskDate.deleteDateByGroupIds(deletePlanGroupIds, _this.transaction)
    }
    if (addPlanGroup.length > 0) {
      for (const item of addPlanGroup) {
        // 新增分组
        const group = await this.serviceIPatrolPlanGroup.createPatrolPlanGroup(
          {
            patrolPlanId: params.patrolPlanId,
            groupName: item.groupName,
            onceEffective: item.onceEffective,
            taskExecuteCycle: item.taskExecuteCycle
          },
          _this.transaction
        )
        const _taskExecuteDateList = item.taskExecuteDateList.map(v => {
          v.patrolPlanId = params.patrolPlanId || ''
          v.groupId = group.dataValues.groupId
          return v
        })
        const RelationCollection = []
        item.patrolObjectList.forEach(m => {
          const RelationObj = {
            patrolPlanId: params.patrolPlanId,
            groupId: group.dataValues.groupId,
            patrolObjId: m.patrolObjId,
            objOrder: m.objOrder
          }
          if (m.patrolItemList && m.patrolItemList.length > 0) {
            m.patrolItemList.forEach(innerItem => {
              if (innerItem.patrolPointList && innerItem.patrolPointList.length > 0) {
                innerItem.patrolPointList.forEach(v => {
                  const RelationItem = Object.assign({}, RelationObj, {
                    itemId: innerItem.itemId,
                    patrolPointId: v.patrolPointId
                  })
                  RelationCollection.push(RelationItem)
                })
              } else {
                const RelationItem = Object.assign({}, RelationObj, { itemId: innerItem.itemId })
                RelationCollection.push(RelationItem)
              }
            })
          } else {
            RelationCollection.push(RelationObj)
          }
        })
        const _taskExecuteDateListNew = _taskExecuteDateList.map(res => {
          const obj = res
          obj.taskStartTimeZone = -(new Date(res.localTimeToISOTime).getTimezoneOffset() / 60)
          obj.taskStartTimeStamp = new Date(res.localTimeToISOTime).getTime()
          return obj
        })
        // 保存任务执行时间表
        await this.serviceIpatrolTaskDate.createPatrolTaskDateService(
          _taskExecuteDateListNew,
          _this.transaction
        )
        // 保存巡检计划、巡检对象、巡检项、关联检测点表
        await this.serviceIrelationObjPlan.createRelationObjPlanService(
          RelationCollection,
          _this.transaction
        )
      }
    }
    if (updatePlanGroup.length > 0) {
      for (const item of updatePlanGroup) {
        // 更新分组信息
        // 1-更新分组基本信息
        const updateGroupInfo = filterObj(this,item, [ 'taskExecuteDateList', 'patrolObjectList' ])
        await this.serviceIPatrolPlanGroup.updatePlanGroup(
          Object.assign({}, { patrolPlanId: params.patrolPlanId }, updateGroupInfo),
          _this.transaction
        )
        // 2-更新分组任务执行时间列表信息
        const addTaskDate = item.taskExecuteDateList.filter(v => !v.taskExecuteId)
        const updateTaskData = item.taskExecuteDateList.filter(v => v.taskExecuteId)
        const existTaskDate = await this.serviceIpatrolTaskDate.queryPatrolTaskDate(
          {
            patrolPlanId: params.patrolPlanId,
            groupId: item.groupId
          },
          _this.transaction
        )
        const deleteTaskDate = returnDiffObj(existTaskDate, updateTaskData, 'taskExecuteId')
        // 更新任务执行时间（先删除，更新，再添加）
        if (deleteTaskDate.length > 0) {
          const deleteTaskDateIds = deleteTaskDate.map(item => item.taskExecuteId)
          await this.serviceIpatrolTaskDate.deletePatrolTaskDate(deleteTaskDateIds, _this.transaction)
        }
        if (updateTaskData.length > 0) {
          const updateTaskDataNew = updateTaskData.map(res => {
            const obj = res
            obj.taskStartTimeZone = -(new Date(res.localTimeToISOTime).getTimezoneOffset() / 60)
            obj.taskStartTimeStamp = new Date(res.localTimeToISOTime).getTime()
            return obj
          })
          await this.serviceIpatrolTaskDate.updatePatrolTaskDateService(
            updateTaskDataNew,
            _this.transaction
          )
        }
        if (addTaskDate.length > 0) {
          const addTaskDateParams = addTaskDate.map(n => {
            return {
              patrolPlanId: params.patrolPlanId,
              groupId: item.groupId,
              taskExecuteDate: n.taskExecuteDate,
              taskExecuteTime: n.taskExecuteTime,
              taskEffective: n.taskEffective,
              localTimeToISOTime: n.localTimeToISOTime
            }
          })
          const addTaskDateParamsNew = addTaskDateParams.map(res => {
            const obj = res
            obj.taskStartTimeZone = -(new Date(res.localTimeToISOTime).getTimezoneOffset() / 60)
            obj.taskStartTimeStamp = new Date(res.localTimeToISOTime).getTime()
            return obj
          })
          await this.serviceIpatrolTaskDate.createPatrolTaskDateService(
            addTaskDateParamsNew,
            _this.transaction
          )
        }
        // 3-更新分组下的巡检对象
        const RelationCollection = []
        item.patrolObjectList.forEach(m => {
          const RelationObj = {
            uuid:'',
            patrolPlanId: params.patrolPlanId,
            groupId: item.groupId,
            patrolObjId: m.patrolObjId,
            objOrder: m.objOrder
          }
          if (m.patrolItemList && m.patrolItemList.length > 0) {
            m.patrolItemList.forEach(innerItem => {
              if (innerItem.patrolPointList && innerItem.patrolPointList.length > 0) {
                innerItem.patrolPointList.forEach(v => {
                  const RelationItem = Object.assign({}, RelationObj, {
                    itemId: innerItem.itemId,
                    patrolPointId: v.patrolPointId
                  })
                  if (v.uuid) RelationItem.uuid = v.uuid
                  RelationCollection.push(RelationItem)
                })
              } else {
                const RelationItem = Object.assign({}, RelationObj, { itemId: innerItem.itemId })
                if (innerItem.uuid) RelationItem.uuid = innerItem.uuid
                RelationCollection.push(RelationItem)
              }
            })
          } else {
            if (m.uuid) RelationObj.uuid = m.uuid
            RelationCollection.push(RelationObj)
          }
        })
        const addRelation = RelationCollection.filter(v => !v.uuid)
        const updateRelation = RelationCollection.filter(v => v.uuid)
        const _existRelation = await this.serviceIrelationObjPlan.queryManyAllList(
          {
            patrolPlanId: params.patrolPlanId,
            groupId: item.groupId
          },
          _this.transaction
        )
        const existRelation = _existRelation.map(v => v.dataValues)
        const deleteRelation = returnDiffObj(existRelation, updateRelation, 'uuid')
        // 更新计划关联表数据（先删除，更新，再添加）
        if (deleteRelation.length > 0) {
          const deleteRelationIds = deleteRelation.map(item => item.uuid)
          await this.serviceIrelationObjPlan.physicsDeleteData(deleteRelationIds, _this.transaction)
        }
        if (updateRelation.length > 0) {
          await this.serviceIrelationObjPlan.updateRelationObjPlanDateService(
            updateRelation,
            _this.transaction
          )
        }
        if (addRelation.length > 0) {
          const addRelationData = addRelation.map(n => {
            n.patrolPlanId = params.patrolPlanId
            n.groupId = item.groupId
            return n
          })
          await this.serviceIrelationObjPlan.createRelationObjPlanService(
            addRelationData,
            _this.transaction
          )
        }
      }
    }
    // 更新计划流程信息
    const addPlanFlow = params.flowConfigList.filter(v => !v.planFlowId)
    const updatePlanFlow = params.flowConfigList.filter(v => v.planFlowId)
    const existPlanFlow = await this.serviceIPatrolPlanFlow.queryManyDataList(
      [ params.patrolPlanId ],
      _this.transaction
    )
    const deletePlanFlow = returnDiffObj(existPlanFlow, updatePlanFlow, 'planFlowId')
    // 更新计划流程表数据（先删除，更新，再添加）
    if (deletePlanFlow.length > 0) {
      const deletePlanFlowIds = deletePlanFlow.map(item => item.planFlowId)
      await this.serviceIPatrolPlanFlow.physicsDeleteData(deletePlanFlowIds, _this.transaction)
    }
    if (updatePlanFlow.length > 0) {
      await this.serviceIPatrolPlanFlow.updatePatrolPlanFlowService(updatePlanFlow, _this.transaction)
    }
    if (addPlanFlow.length > 0) {
      // 保存计划关联的流程表
      const _flowlist = await this.serviceIprocess.getProcess({ psId: params.psId },_this.transaction)
      for (const item of addPlanFlow) {
        const currentflow = _flowlist.find(v => v.processType === item.processType)
        const planFlow = await this.serviceIPatrolPlanFlow.createPatrolPlanFlow(
          Object.assign({}, item, currentflow, { patrolPlanId: params.patrolPlanId }),
          _this.transaction
        )
        if (
          currentflow &&
          currentflow.executorAssignStrategy &&
          currentflow.executorAssignStrategy === 1
        ) {
          for (const innerItem of item.relationList) {
            const relParams = Object.assign(
              {},
              {
                personIds: innerItem.personList
                  .map(item => {
                    return item.userId
                  })
                  .join(','),
                patrolObjId: innerItem.patrolObjId,
                planFlowId: planFlow.dataValues.planFlowId
              }
            )
            await this.serviceIrelationObjPerson.createRelation(relParams, _this.transaction)
          }
        }
      }
    }
    // 更新流程中的对象与人的关系
    for (const flowItem of params.flowConfigList) {
      if (flowItem.planFlowId) {
        const currentFlow = await this.serviceIPatrolPlanFlow.queryDataAllList(
          {
            patrolPlanId: params.patrolPlanId,
            planFlowId: flowItem.planFlowId
          },
          _this.transaction
        )
        if (
          currentFlow &&
          currentFlow[0] &&
          currentFlow[0].dataValues &&
          currentFlow[0].dataValues.executorAssignStrategy &&
          currentFlow[0].dataValues.executorAssignStrategy === 1
        ) {
          const addRelation = flowItem.relationList.filter(v => !v.relationId)
          const updateRelation = flowItem.relationList.filter(v => v.relationId)
          const _existRelation = await this.serviceIrelationObjPerson.queryAllList(
            { planFlowId: flowItem.planFlowId },
            _this.transaction
          )
          const existRelation = _existRelation.map(v => v.dataValues)
          const deleteRelation = returnDiffObj(existRelation, updateRelation, 'relationId')
          if (deleteRelation.length > 0) {
            const deleteRelationIds = deleteRelation.map(item => item.relationId)
            await this.serviceIrelationObjPerson.deleteDate(deleteRelationIds, _this.transaction)
          }
          if (updateRelation.length > 0) {
            const updateRelationData = updateRelation.map(n => {
              const relParams = {
                personIds: n.personList
                  .map(item => {
                    return item.userId
                  })
                  .join(','),
                patrolObjId: n.patrolObjId,
                relationId: n.relationId,
                planFlowId: flowItem.planFlowId
              }
              return relParams
            })
            await this.serviceIrelationObjPerson.updateRelation(updateRelationData, _this.transaction)
          }
          if (addRelation.length > 0) {
            const addRelationData = addRelation.map(n => {
              const relParams = {
                personIds: n.personList
                  .map(item => {
                    return item.userId
                  })
                  .join(','),
                patrolObjId: n.patrolObjId,
                planFlowId: flowItem.planFlowId
              }
              return relParams
            })
            await this.serviceIrelationObjPerson.batchCreateRelation(
              addRelationData,
              _this.transaction
            )
          }
        }
      }
    }
    return params.patrolPlanId
  }
  /**
   * 巡检计划查询列表-根据巡检计划ID集合
   */
  @Transactional
  async queryPlanAllListByIds (patrolPlanIds:string):Promise<any> {
    const result = await (this  as  any).query('PatrolPlan', 'queryAllDataByIds', [ patrolPlanIds ])
    return result
  }
  /**
   * 巡检计划查询列表-不分页
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async queryPlanAllList (params:any): Promise<any> {
    const result = await (this  as  any).query('PatrolPlan', 'queryAllData', [ params ])
    for (const item of result) {
      item.regionName = await this.pdmsService.treePath(item.patrolAreaIds || '', (this  as  any).transaction)
      const _relationPlanObj = await this.serviceIrelationObjPlan.queryDataAllList(
        { patrolPlanId: item.patrolPlanId },
        (this  as  any).transaction
      )
      item.patrolObjNum = Array.from(new Set(_relationPlanObj.map(item => item.patrolObjId))).length
    }
    return { list: result }
  }
  /**
   * 巡检计划分页查询列表
   * @param {object} { params, pagination } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async queryPlanList (params:any = {}): Promise<any> {
    const _this = (this as any)
    // const userId = ctx.getUserId()
    const userId = 'admin'
    const appid = _this.ctx.header.appid

    if (appid && userId) {
      // 获取该用户有权限的区域列表
      const regionList = await _this.pdmsService.getAllRegionByUserName(
        { userId },
        _this.transaction
      )
      if (regionList) {
        const regionIdLimit = regionList
          .filter(v => v.regionStatus === 1)
          .map(item => item.regionIndexCode)
        params = Object.assign({}, params, { regionIdsArr: regionIdLimit })
      }
    }
    const result = await _this.query('PatrolPlan', 'queryData', [ params ])
    for (const item of result.list) {
      item.regionName = await this.pdmsService.treePath(
        item.patrolAreaIds,
        (this  as  any).transaction
      )
      const _relationPlanObj = await this.serviceIrelationObjPlan.queryDataAllList(
        { patrolPlanId: item.patrolPlanId },
        (this  as  any).transaction
      )
      item.patrolObjNum = Array.from(new Set(_relationPlanObj.map(item => item.patrolObjId))).length
    }
    return result
  }
  /**
   * 巡检计划分页查询列表
   * @param {object} { params, pagination } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async queryPlanListOriginal (params:any): Promise<any> {
    const { userId } = params
    if (userId) {
      // 获取该用户有权限的区域列表
      const regionList = await this.pdmsService.getAllRegionByUserName(
        { userId },
        (this  as  any).transaction
      )
      if (regionList) {
        const regionIdLimit = regionList
          .filter(v => v.regionStatus === 1)
          .map(item => item.regionIndexCode)
        params = Object.assign({}, params, { regionIdsArr: regionIdLimit })
      }
    } else {
      throw new Error(this.ctx.__('patrolPlan.userIdParLost'))
    }
    const result = await (this  as  any).query('PatrolPlan', 'queryDataOriginal', [ params ])
    for (const item of result.list) {
      item.regionName = await this.pdmsService.treePath(
        item.patrolAreaIds,
        (this  as  any).transaction
      )
      const _relationPlanObj = await this.serviceIrelationObjPlan.queryDataAllList(
        { patrolPlanId: item.patrolPlanId },
        (this  as  any).transaction
      )
      item.patrolObjNum = Array.from(new Set(_relationPlanObj.map(item => item.patrolObjId))).length
    }
    return result
  }
  /**
   * 巡检计划详情
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async queryPlanDetail (params :any): Promise<any> {
    const result = await (this  as  any).query('PatrolPlan', 'queryBasicDetail', [ params ])
    if (result.dataValues.patrolAreaIds) {
      const regionInfo = await this.pdmsService.getRegionInfo(
        { regionId: result.dataValues.patrolAreaIds },
        (this  as  any).transaction
      )
      result.dataValues.regionInfo = regionInfo
    } else result.dataValues.regionInfo = null
    // 获取各个分组下的巡检对象
    const planGroup = await this.queryPlanGroupNoAll(params.patrolPlanId, (this  as  any).transaction)
    result.dataValues.planGroup = planGroup
    // 获取计划流程
    const _flowConfigList = await this.serviceIPatrolPlanFlow.queryDataAllList(
      params,
      (this  as  any).transaction
    )
    const roleList = await this.pdmsService.getAllRoles(params, (this  as  any).transaction)
    const flowArr = []
    for (const item of _flowConfigList) {
      const _roleId = item.dataValues.roleId ? item.dataValues.roleId.split(',') : []
      const _submitterIds = item.dataValues.submitterIds ? item.dataValues.submitterIds.split(',') : []
      const currentInfo = roleList.filter(v => _roleId.includes(v.roleId))
      const submitterList = roleList.filter(v => _submitterIds.includes(v.roleId))
      item.dataValues.roleName = currentInfo && currentInfo.length > 0 ? currentInfo.map(v => v.roleName).join(',') : ''
      item.dataValues.submitterName = submitterList && submitterList.length > 0 ? submitterList.map(v => v.roleName).join(',') : ''
      // 查询流程中对象与人关联关系数据
      if (item.executorAssignStrategy && item.executorAssignStrategy === 1) {
        let personIdsArr = []
        const relationList = await this.serviceIrelationObjPerson.queryRelationList(
          { planFlowId: item.planFlowId },
          (this  as  any).transaction
        )
        for (const v of relationList) {
          if (v.personIds) personIdsArr = personIdsArr.concat(v.personIds.split(','))
        }
        const personIdsCollect = this.ctx.helper.dedupe(personIdsArr)
        const personIdsCollection = await this.pdmsService.getUserInfoList(
          personIdsCollect,
          (this  as  any).transaction
        )
        for (const v of relationList) {
          let personList = []
          if (v.personIds) {
            const hasId = v.personIds.split(',')
            personList = personIdsCollection.filter(v => hasId.includes(v.userId))
          }
          v.personList = personList
        }
        item.dataValues.relationList = relationList
      } else item.dataValues.relationList = []
      const firstPersonIdsArr = item.dataValues.firstPersonIds ? item.dataValues.firstPersonIds.split(',') : []
      const secondPersonIdsArr = item.dataValues.secondPersonIds ? item.dataValues.secondPersonIds.split(',') : []
      if (firstPersonIdsArr.length) {
        item.dataValues.firstPersons = await this.pdmsService.getUserInfoList(
          firstPersonIdsArr,
          (this  as  any).transaction
        )
      } else item.dataValues.firstPersons = []
      if (secondPersonIdsArr.length) {
        item.dataValues.secondPersons = await this.pdmsService.getUserInfoList(
          secondPersonIdsArr,
          (this  as  any).transaction
        )
      } else item.dataValues.secondPersons = []
      flowArr.push(item.dataValues)
    }
    result.dataValues.flowConfigList = flowArr
    return result
  }
  /**
   * 巡检计划分组信息(不包括巡检项，检测点)
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async queryPlanGroupNoAll (params:any,transaction?:any): Promise<any> {
    const planDetail = await (this  as  any).query('PatrolPlan', 'queryPlanGroupDataNoAll', [ params ])
    const groupData = groupHandle(planDetail)
    return groupData
  }
  /**
   * 巡检计划详情全部信息_对外接口
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async queryAllPlanDetailByApi (params:any): Promise<any> {
    const condition = { where: { patrolPlanName: params.patrolPlanCode } }
    const plan = await (this  as  any).query('PatrolPlan', 'queryOne', [ condition ])
    const _patrolPlanId = plan.dataValues.patrolPlanId
    const planDetail = await this.queryAllPlanDetail({ patrolPlanId: _patrolPlanId }, (this  as  any).transaction)
    return planDetail
  }
  /**
   * 巡检计划详情全部信息
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async queryAllPlanDetail (params:any, transaction?:any): Promise<any> {
    const result = await (this  as  any).query('PatrolPlan', 'queryBasicDetail', [ params ])
    if (result.dataValues.patrolAreaIds) {
      const regionInfo = await this.pdmsService.getRegionInfo(
        { regionId: result.dataValues.patrolAreaIds },
        (this  as  any).transaction
      )
      result.dataValues.regionInfo = regionInfo
    } else result.dataValues.regionInfo = null
    // 获取各个分组下的巡检对象
    const planGroup = await this.queryPlanGroup(params.patrolPlanId, (this  as  any).transaction)
    result.dataValues.planGroup = planGroup
    // 获取计划流程
    const _flowConfigList = await this.serviceIPatrolPlanFlow.queryDataAllList(
      params,
      (this  as  any).transaction
    )
    const roleList = await this.pdmsService.getAllRoles(params, (this  as  any).transaction)
    const flowArr = []
    for (const item of _flowConfigList) {
      const _roleId = item.dataValues.roleId ? item.dataValues.roleId.split(',') : []
      const _submitterIds = item.dataValues.submitterIds ? item.dataValues.submitterIds.split(',') : []
      const currentInfo = roleList.filter(v => _roleId.includes(v.roleId))
      const submitterList = roleList.filter(v => _submitterIds.includes(v.roleId))
      item.dataValues.roleName = currentInfo && currentInfo.length > 0 ? currentInfo.map(v => v.roleName).join(',') : ''
      item.dataValues.submitterName = submitterList && submitterList.length > 0 ? submitterList.map(v => v.roleName).join(',') : ''
      // 查询流程中对象与人关联关系数据
      if (item.executorAssignStrategy && item.executorAssignStrategy === 1) {
        let personIdsArr = []
        const relationList = await this.serviceIrelationObjPerson.queryRelationList(
          { planFlowId: item.planFlowId },
          (this  as  any).transaction
        )
        for (const v of relationList) {
          if (v.personIds) personIdsArr = personIdsArr.concat(v.personIds.split(','))
        }
        const personIdsCollect = this.ctx.helper.dedupe(personIdsArr)
        const personIdsCollection = await this.pdmsService.getUserInfoList(
          personIdsCollect,
          (this  as  any).transaction
        )
        for (const v of relationList) {
          let personList = []
          if (v.personIds) {
            const hasId = v.personIds.split(',')
            personList = personIdsCollection.filter(v => hasId.includes(v.userId))
          }
          v.personList = personList
        }
        item.dataValues.relationList = relationList
      } else item.dataValues.relationList = []
      const firstPersonIdsArr = item.dataValues.firstPersonIds ? item.dataValues.firstPersonIds.split(',') : []
      const secondPersonIdsArr = item.dataValues.secondPersonIds ? item.dataValues.secondPersonIds.split(',') : []
      if (firstPersonIdsArr.length) {
        item.dataValues.firstPersons = await this.pdmsService.getUserInfoList(
          firstPersonIdsArr,
          (this  as  any).transaction
        )
      } else item.dataValues.firstPersons = []
      if (secondPersonIdsArr.length) {
        item.dataValues.secondPersons = await this.pdmsService.getUserInfoList(
          secondPersonIdsArr,
          (this  as  any).transaction
        )
      } else item.dataValues.secondPersons = []
      flowArr.push(item.dataValues)
    }
    result.dataValues.flowConfigList = flowArr
    return result
  }
  /**
   * 巡检计划分组信息(包括巡检对象，巡检项，检测点)
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async queryPlanGroup (params:any,transaction?:any): Promise<any> {
    const planDetail = await (this  as  any).query('PatrolPlan', 'queryPlanGroupData', [ params ])
    const groupData = groupHandle(planDetail)
    const patrolObjList = patrolObjHandle(planDetail)
    const patrolitem = patrolItemHandle(planDetail)
    for (const groupItem of groupData) {
      const _groupId = groupItem.groupId
      for (const objItem of groupItem.patrolObjectList) {
        const _patrolObjId = objItem.patrolObjId
        const currentObj = patrolObjList.find(obj => obj.patrolObjId === _patrolObjId)
        if (currentObj) {
          const _patrolItemList = currentObj.patrolItemList ? currentObj.patrolItemList.filter(v => v.groupId === _groupId && v.patrolObjId === _patrolObjId) : []
          for (const _item of _patrolItemList) {
            let itemExist = false
            for (const patrolItem of objItem.patrolItemList) {
              if (patrolItem.itemId === _item.itemId) {
                itemExist = true
              }
            }
            if (!itemExist && _item.itemId !== null) {
              objItem.patrolItemList.push({
                itemId: _item.itemId,
                itemContent: _item.itemContent,
                itemOrder: _item.itemOrder,
                itemScore: _item.itemScore,
                level: _item.level,
                objTypeId: _item.objTypeId,
                parentItem: _item.parentItem,
                relateMonitor: _item.relateMonitor,
                path: _item.path,
                uuid: _item.uuid,
                mannerList: [],
                patrolPointList: []
              })
            }
          }
        }
      }
    }
    for (const groupItem of groupData) {
      const _groupId = groupItem.groupId
      for (const objItem of groupItem.patrolObjectList) {
        const _patrolObjId = objItem.patrolObjId
        for (const patrolItem of objItem.patrolItemList) {
          const _patrolItemId = patrolItem.itemId
          const currentItem = patrolitem.find(item => item.itemId === _patrolItemId)
          if (currentItem) {
            const _patrolPointList = currentItem.patrolPointList ? currentItem.patrolPointList.filter(v => v.groupId === _groupId && v.patrolObjId === _patrolObjId && v.itemId === _patrolItemId) : []
            const _mannerList = currentItem.mannerList ? currentItem.mannerList.filter(v => v.groupId === _groupId && v.patrolObjId === _patrolObjId && v.itemId === _patrolItemId) : []
            for (const _point of _patrolPointList) {
              let pointExist = false
              for (const pointItem of patrolItem.patrolPointList) {
                if (pointItem.patrolPointId === _point.patrolPointId) {
                  pointExist = true
                }
              }
              if (!pointExist && _point.patrolPointId !== null) {
                patrolItem.patrolPointList.push({
                  patrolPointId: _point.patrolPointId,
                  uuid: _point.uuid,
                  pointName: _point.pointName,
                  patrolMethodId: _point.patrolMethodId,
                  aiType: _point.aiType,
                  cameraId: _point.cameraId,
                  cameraName: _point.cameraName
                })
              }
            }
            for (const _manner of _mannerList) {
              let mannerExist = false
              for (const pointItem of patrolItem.mannerList) {
                if (pointItem.mannerId === _manner.mannerId) {
                  mannerExist = true
                }
              }
              if (!mannerExist && _manner.mannerId !== null) {
                patrolItem.mannerList.push({
                  mannerId: _manner.mannerId,
                  mType: _manner.mType,
                  aiType: _manner.aiType,
                  mName: _manner.mName
                })
              }
            }
          }
        }
      }
    }
    return groupData
  }
  /**
   * 巡检计划详情分布查询第二步不包括巡检项和检测点
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async queryPlanDetailStep (params:any): Promise<any> {
    const { step } = params
    if (!step) throw new Error(this.ctx.__('patrolPlan.stepLost'))
    if (step === '1') {
      const result = await (this  as  any).query('PatrolPlan', 'queryBasicDetail', [ params ])
      if (result.dataValues.patrolAreaIds) {
        const regionInfo = await this.pdmsService.getRegionInfo(
          { regionId: result.dataValues.patrolAreaIds },
          (this  as  any).transaction
        )
        result.dataValues.regionInfo = regionInfo
      } else result.dataValues.regionInfo = null
      return result
    } else if (step === '2') {
      const result = await this.queryPlanGroupNoAll(params.patrolPlanId, (this  as  any).transaction)
      return result
    } else if (step === '3') {
      const _flowConfigList = await this.serviceIPatrolPlanFlow.queryDataAllList(
        params,
        (this  as  any).transaction
      )
      const roleList = await this.pdmsService.getAllRoles(params, (this  as  any).transaction)
      const flowArr = []
      for (const item of _flowConfigList) {
        const _roleId = item.dataValues.roleId ? item.dataValues.roleId.split(',') : []
        const _submitterIds = item.dataValues.submitterIds ? item.dataValues.submitterIds.split(',') : []
        const currentInfo = roleList.filter(v => _roleId.includes(v.roleId))
        const submitterList = roleList.filter(v => _submitterIds.includes(v.roleId))
        item.dataValues.roleName = currentInfo && currentInfo.length > 0 ? currentInfo.map(v => v.roleName).join(',') : ''
        item.dataValues.submitterName = submitterList && submitterList.length > 0 ? submitterList.map(v => v.roleName).join(',') : ''
        // 查询流程中对象与人关联关系数据
        if (item.executorAssignStrategy && item.executorAssignStrategy === 1) {
          let personIdsArr = []
          const relationList = await this.serviceIrelationObjPerson.queryRelationList(
            { planFlowId: item.planFlowId },
            (this  as  any).transaction
          )
          for (const v of relationList) {
            if (v.personIds) personIdsArr = personIdsArr.concat(v.personIds.split(','))
          }
          const personIdsCollect = this.ctx.helper.dedupe(personIdsArr)
          const personIdsCollection = await this.pdmsService.getUserInfoList(
            personIdsCollect,
            (this  as  any).transaction
          )
          for (const v of relationList) {
            let personList = []
            if (v.personIds) {
              const hasId = v.personIds.split(',')
              personList = personIdsCollection.filter(v => hasId.includes(v.userId))
            }
            v.personList = personList
          }
          item.dataValues.relationList = relationList
        } else item.dataValues.relationList = []
        const firstPersonIdsArr = item.dataValues.firstPersonIds ? item.dataValues.firstPersonIds.split(',') : []
        const secondPersonIdsArr = item.dataValues.secondPersonIds ? item.dataValues.secondPersonIds.split(',') : []
        if (firstPersonIdsArr.length) {
          item.dataValues.firstPersons = await this.pdmsService.getUserInfoList(
            firstPersonIdsArr,
            (this  as  any).transaction
          )
        } else item.dataValues.firstPersons = []
        if (secondPersonIdsArr.length) {
          item.dataValues.secondPersons = await this.pdmsService.getUserInfoList(
            secondPersonIdsArr,
            (this  as  any).transaction
          )
        } else item.dataValues.secondPersons = []
        flowArr.push(item.dataValues)
      }
      return flowArr
    } throw new Error(this.ctx.__('patrolPlan.stepNotCorrect'))
  }
  /**
   * 巡检计划详情分布查询
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async queryPlanAllDetailStep (params:any): Promise<any> {
    const { step } = params
    if (!step) throw new Error(this.ctx.__('patrolPlan.stepLost'))
    if (step === '1') {
      const result = await (this  as  any).query('PatrolPlan', 'queryBasicDetail', [ params ])
      if (result.dataValues.patrolAreaIds) {
        const regionInfo = await this.pdmsService.getRegionInfo(
          { regionId: result.dataValues.patrolAreaIds },
          (this  as  any).transaction
        )
        result.dataValues.regionInfo = regionInfo
      } else result.dataValues.regionInfo = null
      return result
    } else if (step === '2') {
      const result = await this.queryPlanGroup(params.patrolPlanId, (this  as  any).transaction)
      return result
    } else if (step === '3') {
      const _flowConfigList = await this.serviceIPatrolPlanFlow.queryDataAllList(
        params,
        (this  as  any).transaction
      )
      const roleList = await this.pdmsService.getAllRoles(params, (this  as  any).transaction)
      const flowArr = []
      for (const item of _flowConfigList) {
        const _roleId = item.dataValues.roleId ? item.dataValues.roleId.split(',') : []
        const _submitterIds = item.dataValues.submitterIds ? item.dataValues.submitterIds.split(',') : []
        const currentInfo = roleList.filter(v => _roleId.includes(v.roleId))
        const submitterList = roleList.filter(v => _submitterIds.includes(v.roleId))
        item.dataValues.roleName = currentInfo && currentInfo.length > 0 ? currentInfo.map(v => v.roleName).join(',') : ''
        item.dataValues.submitterName = submitterList && submitterList.length > 0 ? submitterList.map(v => v.roleName).join(',') : ''
        // 查询流程中对象与人关联关系数据
        if (item.executorAssignStrategy && item.executorAssignStrategy === 1) {
          let personIdsArr = []
          const relationList = await this.serviceIrelationObjPerson.queryRelationList(
            { planFlowId: item.planFlowId },
            (this  as  any).transaction
          )
          for (const v of relationList) {
            if (v.personIds) personIdsArr = personIdsArr.concat(v.personIds.split(','))
          }
          const personIdsCollect = this.ctx.helper.dedupe(personIdsArr)
          const personIdsCollection = await this.pdmsService.getUserInfoList(
            personIdsCollect,
            (this  as  any).transaction
          )
          for (const v of relationList) {
            let personList = []
            if (v.personIds) {
              const hasId = v.personIds.split(',')
              personList = personIdsCollection.filter(v => hasId.includes(v.userId))
            }
            v.personList = personList
          }
          item.dataValues.relationList = relationList
        } else item.dataValues.relationList = []
        const firstPersonIdsArr = item.dataValues.firstPersonIds ? item.dataValues.firstPersonIds.split(',') : []
        const secondPersonIdsArr = item.dataValues.secondPersonIds ? item.dataValues.secondPersonIds.split(',') : []
        if (firstPersonIdsArr.length) {
          item.dataValues.firstPersons = await this.pdmsService.getUserInfoList(
            firstPersonIdsArr,
            (this  as  any).transaction
          )
        } else item.dataValues.firstPersons = []
        if (secondPersonIdsArr.length) {
          item.dataValues.secondPersons = await this.pdmsService.getUserInfoList(
            secondPersonIdsArr,
            (this  as  any).transaction
          )
        } else item.dataValues.secondPersons = []
        flowArr.push(item.dataValues)
      }
      return flowArr
    } throw new Error(this.ctx.__('patrolPlan.stepNotCorrect'))
  }
  /**
   * 查询巡检计划中巡检对象关联的巡检项及检测点
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async queryPlanItems (params:any): Promise<any> {
    const _relationPlanItems = await this.serviceIrelationObjPlan.queryPlanItemIds(
      params,(this  as  any).transaction
    )
    const itemsIds = Array.from(new Set(_relationPlanItems.map(item => item.itemId)))
    const result = await this.serviceIPatrolItem.queryItemManyService(itemsIds, (this  as  any).transaction)
    for (const item of result) {
      const _params = {
        patrolPlanId: params.patrolPlanId,
        patrolObjId: params.patrolObjId,
        itemId: item.itemId
      }
      const _relationPlanPoints = await this.serviceIrelationObjPlan.queryPlanPointIds(
        _params,
        (this  as  any).transaction
      )
      const points = this.ctx.helper.bouncer(
        Array.from(new Set(_relationPlanPoints.map(item => item.patrolPointId)))
      )
      const pointList =
        points.length > 0
          ? await this.serviceIPatrolPoint.queryPointAllListByPointIds(points, (this  as  any).transaction)
          : []
      item.dataValues.patrolPointList = pointList
    }
    return result
  }
  /**
   * 查询巡检项，通过巡检对象类型
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async queryPlanItemsFromObjType (params:any): Promise<any> {
    if (!params.executeType) throw new Error(this.ctx.__('patrolPlan.lostExecuteType'))
    if (!params.objTypeId) throw new Error(this.ctx.__('patrolPlan.lostObjTypeId'))
    const result = await this.serviceIPatrolItem.queryItemService(params, (this  as  any).transaction)
    return result
  }
  /**
   * 查询巡检计划中巡检对象类型的结构
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async queryPlanItemsTitle (params:any = {}): Promise<any> {
    const result = await this.serviceIPatrolItemTitle.queryItemTitleManyService(params, (this  as  any).transaction)
    return result
  }
  /**
   * 更新巡检计划状态
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async updatePatrolStatus (params:any, transaction?:any): Promise<any> {
    const result = await (this  as  any).query('PatrolPlan', 'updatePatrolStatus', [ params ])
    return result
  }
  /**
   * 定时任务调用方法
   * 更新巡检计划状态_批量
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async stopPatrolPlan (params:any): Promise<any> {
    const { ctx } = this
    ctx.header.appid = params.appid
    const data = {
      currentTime: params.currentTime,
      patrolPlanStatus: 2
    }
    const result = []
    const planList = await (this  as  any).query('PatrolPlan', 'queryAllData', [ data ])
    for (const item of planList) {
      const res = await this.updatePatrolStatus(
        {
          patrolPlanId: item.patrolPlanId,
          patrolPlanStatus: 2
        },(this as any).transaction
      )
      result.push(res)
    }
    return result
  }
  /**
   * 删除巡检计划
   * @param {object}
   * @return {string} - objec
   */
  @Transactional
  async deletePatrolPlanData (params:any): Promise<any> {
    const idsArr = params.ids.split(',')
    const deletePatrolPlan = await (this  as  any).query('PatrolPlan', 'deleteData', [ idsArr ])
    await this.serviceIpatrolTaskDate.deleteDateByPlanIds(
      idsArr,
      (this  as  any).transaction
    )
    await this.serviceIPatrolPlanGroup.deleteGroupDateByPlanIds(
      idsArr,
      (this  as  any).transaction
    )
    const result = deletePatrolPlan && deletePatrolPlan[0] !== 0 ? this.ctx.__('patrolPlan.deleteSuccess') : this.ctx.__('patrolPlan.planNotExit')
    return result
  }
  /**
   * 获取某一区域下的巡查子项（1/2/3级）
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async getLevelItemsList (params:any): Promise<any> {
    const { regionId, level, itemId } = params
    let result
    if (level === '1') {
      const queryPatrolObjCondition = { where: { patrolObjRegion: regionId } }
      const patrolObjList = await this.serviceIPatrolObj.queryObjByRegionId(
        queryPatrolObjCondition,
        (this  as  any).transaction
      )
      const _objTypeIdArr = Array.from(new Set(patrolObjList.map(item => item.objTypeId)))
      const queryItemsCondition = {
        where: {
          objTypeId: { [Op.or]: _objTypeIdArr },
          level
        }
      }
      result = await this.serviceIPatrolItem.queryItemManyCommon(
        queryItemsCondition,
        (this  as  any).transaction
      )
    } else {
      const queryItemsCondition = {
        where: {
          parentItem: itemId,
          level
        }
      }
      result = await this.serviceIPatrolItem.queryItemManyCommon(
        queryItemsCondition,
        (this  as  any).transaction
      )
    }
    return result
  }
}