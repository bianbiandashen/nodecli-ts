import {  Context, inject, provide} from 'midway';
import { ItaskApiService } from '../app/interface/taskApiInterface';
import { ICommonService } from '../app/interface/commonInterface';
const moment = require('moment')
const Sequelize = require('sequelize')
const { Op } = Sequelize
const { Transactional } = require('../app/core/transactionalDeco/index')

@provide('taskApiService')
export class TaskApiService implements ItaskApiService{
  @inject()
  ctx: Context;

  @inject('commonService')
  serviceICommon: ICommonService;
  /**
   * 获取巡检记录列表
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async taskItemByUse(params:any): Promise<any> {
    const { ctx } = this
    const {
      id,
      pageNo,
      pageSize,
      startTime,
      endTime,
      checkItemName,
      checkPointType,
      checkPointName,
      userId
    } = params
    // 先根据巡检对象类型名称,查出类型id
    // const pageNo = decodeURI(pageNo)
    let objTypeArr = null
    if (checkPointType) {
      const _checkPointType = checkPointType.replace(/%/g, '\\%').replace(/_/g, '\\_')
      const typeCondition = {
        where: {
          objTypeName: {
            [Op.like]: `%${_checkPointType}%`
          },
          isDelete: 0
        }, 
        attributes: ['objTypeId']
      }
      const typeRes = await (this as any).query('PatrolObjType', 'queryAllData', [typeCondition])
      if (typeRes) objTypeArr = typeRes.map(item => item.objTypeId)
    }
    // 先根据巡检对象名称查出符合的巡检对象id
    let objArr = null
    let _checkPointName = null
    if (checkPointName) {
      _checkPointName = checkPointName.replace(/%/g, '\\%').replace(/_/g, '\\_')
    }
    if (_checkPointName || objTypeArr) {
      const objCondition:any = {
        where: {
          isDelete: '0'
        },
        attributes: ['patrolObjId']
      }
      if (checkPointName) objCondition.where.patrolObjName = { [Op.like]: `%${_checkPointName}%` }
      if (objTypeArr) {
        objCondition.where.objTypeId = {
          [Op.in]: objTypeArr
        }
      }
      const objRes = await (this as any).query('PatrolObj', 'queryManyData', [objCondition])
      if (objRes) objArr = objRes.map(item => item.patrolObjId)
    }
    // 根据objid查出符合的objrelid
    let objRelArr = null
    if (objArr) {
      const objRel = await (this as any).query('PatrolObjRel', 'queryAll', [
        {
          where: {
            patrolObjId: {
              [Op.in]: objArr
            }
          },
          attributes: ['patrolObjRelId']
        }
      ])
      if (objRel) objRelArr = objRel.map(item => item.patrolObjRelId)
    }
    // 根据relid查出taskitemid
    let itemArr = null
    if (objRelArr || checkItemName) {
      const itemCondition:any = {
        where: {},
        attributes: ['patrolTaskItemId']
      }
      if (objRelArr) itemCondition.where.patrolObjRelId = { [Op.in]: objRelArr }
      if (checkItemName) {
        const _checkItemName = checkItemName.replace(/%/g, '\\%').replace(/_/g, '\\_')
        itemCondition.where.itemName = {
          [Op.like]: `%${_checkItemName}%`
        }
      }
      const itemRes = await (this as any).query('PatrolTaskItem', 'queryManyAll', [itemCondition])
      if (itemRes) itemArr = itemRes.map(item => item.patrolTaskItemId)
    }
    // 查出只有计划的任务
    const hasPlanTask = await (this as any).query('Task', 'queryAllData', [
      {
        where: {
          planId: {
            [Op.notIn]: ['']
          }
        },
        attributes: ['patrolTaskId']
      }
    ])
    const hasPlanTaskArr = hasPlanTask.list.map(item => item.patrolTaskId)
    // 传入用户的话
    const resultCondition:any = {
      where: {
        taskId: {
          [Op.in]: hasPlanTaskArr
        }
      },
      attributes: [
        'execUser',
        'isIntoNextStep',
        'createTime',
        'updateTime',
        'pointResultId',
        'patrolTaskItemId'
      ],
      limit: pageSize * 1,
      offset: (pageNo - 1) * pageSize
    }
    if (id) resultCondition.where.pointResultId = id
    if (userId) resultCondition.where.execUser = userId
    if (startTime && endTime)
      {resultCondition.where.createTime = { [Op.between]: [parseInt(startTime), parseInt(endTime)] }}
    if (itemArr) {
      resultCondition.where.patrolTaskItemId = {
        [Op.in]: itemArr
      }
    }
    const resultRes = await (this as any).query('TaskExecSchema', 'findAndCountAllData', [resultCondition])
    const resultData = []
    for (const elem of resultRes.list.values()) {
      const taskItemRes = await (this as any).query('PatrolTaskItem', 'findOneData', [
        {
          where: {
            patrolTaskItemId: elem.patrolTaskItemId
          },
          attributes: ['itemName', 'patrolObjRelId', 'patrolTaskItemId']
        }
      ])
      resultData.push(
        Object.assign({}, JSON.parse(JSON.stringify(elem)), {
          checkItemName: taskItemRes ? taskItemRes.itemName : null,
          relId: taskItemRes ? taskItemRes.patrolObjRelId : null
        })
      )
    }
    const returnData = []
    for (const elem of resultData.values()) {
      const elemc = JSON.parse(JSON.stringify(elem))
      const id = elemc.relId
      let objName = null
      if (elemc.relId) {
        objName = await ctx.service.patrolObjApi.queryObjNameByRelId(
          {
            relId: id
          },
          (this as any).transaction
        )
      }
      returnData.push({
        checkTime: elemc.createTime,
        checkPointName: objName ? objName.objName : null,
        checkPointType: objName ? objName.typeName : null,
        checkItemName: elemc.checkItemName,
        checkPersonName: elemc.execUser,
        isProblem: elemc.isIntoNextStep,
        id: elemc.pointResultId
      })
    }
    return {
      total: resultRes.total,
      list: returnData,
      pageNo: parseInt(pageNo),
      pageSize: parseInt(pageSize)
    }
  }
  /**
   * 单个计划下任务的状态统计
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async taskStateCount(params:any): Promise<any> {
    const { planId } = params
    if (!planId) return null
    // 计划过期,status 0,1 都为过期    预期完成的2,也为过期
    let planEffectiveEnd = null
    if (planId) {
      let planDetailRes = await (this as any).query('PatrolPlan', 'queryOne', [{
        where: {
          patrolPlanId: planId,
        },
        attributes:['planEffectiveEnd']
      }])
      if (planDetailRes) planEffectiveEnd = planDetailRes.planEffectiveEnd
    }
    // 通过planID 查出巡检任务id
    let taskIdArr = null
    const taskCondition = {
      where: {
        planId
      },
      attributes: ['patrolTaskId','timeStatus']
    }
    const taskIdRes = await (this as any).query('Task', 'queryData', [taskCondition])
    if (taskIdRes) taskIdArr = taskIdRes.list.map(v => v.patrolTaskId)
    
    if (moment(planEffectiveEnd).endOf('day').format('x') > moment().format('x')){
      // 计划未过期查过期
      const stateArr = [0, 1,2]
      const stateCount = []
      const condition:any = {
        where: {}
      }
      if (taskIdArr) {
        condition.where.patrolTaskId = {
          [Op.in]: taskIdArr
        }
      }
      for (const elem of stateArr.values()) {
        condition.where.status = elem
        const num = await (this as any).query('PatrolObjRel', 'queryCount', [condition])
        stateCount.push(num)
      }
      return {
        notStart: taskIdArr ? stateCount[0] : 0,
        inProgress: taskIdArr ? stateCount[1] : 0,
        completed: taskIdArr ? stateCount[2]: 0,
        expired: 0
        }
    } else {
      if (!taskIdArr) {
        return {
          notStart: 0,
          inProgress: 0,
          completed: 0,
          expired: 0
        }
      }
      let condition2={
        where: {
          status: 2,
          updateTime:{[Op.lte]: new Date(`${planEffectiveEnd} 23:59:59`).getTime()},
          patrolTaskId:{
            [Op.in]: taskIdArr
          }
        },
      }
      let condition3={
        where: {
          patrolTaskId:{
            [Op.in]: taskIdArr
          },
          [Op.not]:{
            [Op.and]:[
              {status:2},
              {
                updateTime:{[Op.lte]: new Date(`${planEffectiveEnd} 23:59:59`).getTime()}
              }
            ]
          }
        }

      }
      const completed = await (this as any).query('PatrolObjRel', 'queryCount', [condition2])
      const expired = await (this as any).query('PatrolObjRel', 'queryCount', [condition3])
      return {
        notStart: 0,
        inProgress: 0,
        completed: completed,
        expired: expired
      }
    }
    
  }

  /**
   * 单个计划下任务的list
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async taskList(params:any): Promise<any> {
    const { ctx } = this
    const { planId, pageNo, pageSize, state, timeStatus  } = params
    const taskCondition:any = {
      where: {
        planId
      },
      attributes: ['patrolTaskId', 'status', 'updateTime', 'planId','timeStatus']
    }
    if (pageNo && pageSize) {
      taskCondition.limit = pageSize * 1
      taskCondition.offset = (pageNo - 1) * pageSize
    }
    if (state) taskCondition.where.status = state
    if (timeStatus) taskCondition.where.timeStatus = timeStatus
    const data = await (this as any).query('Task', 'queryData', [taskCondition])
    if (pageNo && pageSize) {
      return {
        list: data.list,
        total: data.total,
        pageNo: parseInt(pageNo),
        pageSize: parseInt(pageSize)
      }
    }
    return {
      list: data.list,
      total: data.total
    }
    // 勿删勿删
    const returnData = []
    for (const elem of data.list.values()) {
      // 获取计划对应的巡检对象名称
      const objNameData = await (this as any).query('PatrolObjRel', 'findOneDataObjRelByTaskApi', [
        elem.patrolTaskId
      ])
      // 问题数
      const problemNum = await ctx.service.taskExecResult.queryProblemByTaskId(
        {
          taskId: elem.patrolTaskId
        },
        (this as any).transaction
      )
      // 扣分项
      const score = await ctx.service.patrolTaskItem.countScoreByTaskId(
        {
          taskId: elem.patrolTaskId
        },
        (this as any).transaction
      )
      returnData.push(
        Object.assign({}, JSON.parse(JSON.stringify(elem)), {
          objName: objNameData.partrolObjItem.patrolObjName,
          problemNum,
          score
        })
      )
    }
  }

  /**
   * 任务的详情
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async taskDetail(params:any): Promise<any> {
    const { taskId } = params
    const data = await (this as any).query('Task', 'findTaskItemByTaskApi', [taskId])
    // 获取计划对应的巡检对象名称
    const objNameData = await (this as any).query('PatrolObjRel', 'findOneDataByTaskApi', [taskId])
    const returnData = Object.assign({}, JSON.parse(JSON.stringify(data)), {
      objName: objNameData && objNameData.partrolObjItem && objNameData.partrolObjItem.patrolObjName
    })
    return returnData
  }

  /**
   * 获取巡检任务下巡检项巡检结果
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async taskItemList(params:any): Promise<any> {
    const { ctx } = this
    const { taskId, patrolObjRelId } = params
    // 查出符合的巡检项
    const taskCondition = {
      order: [['itemParentId', 'DESC']],
      where: {
        patrolTaskId: taskId,
        patrolObjRelId
      },
      attributes: ['itemName', 'patrolScore', 'itemScore', 'path']
    }

    const data = await (this as any).query('PatrolTaskItem', 'queryManyAll', [taskCondition])
    const returnData = []
    for (const elem of data) {
      const namePath = await ctx.service.item.itemPathNameService(
        {
          path: elem.path
        },
        (this as any).transaction
      )
      const pathArr = namePath.split('/')
      returnData.push({
        itemName: elem.itemName,
        patrolScore: elem.patrolScore,
        itemScore: elem.itemScore,
        itemParentName: pathArr.length > 1 ? pathArr.splice(-2, 1)[0] : ''
      })
    }
    return returnData
  }

  /**
   * 获取任务下问题列表
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async taskProblemList(params:any): Promise<any> {
    const { ctx } = this
    const {
      regionId,
      problemId,
      taskId,
      planId,
      objName,
      objId,
      state,
      templateId,
      itemId,
      startTime,
      endTime,
      pageSize,
      pageNo
    } = params
    // 通过psCode查psid
    let psId = null
    if (templateId) {
      const planCondition = {
        where: {
          schemaCode: templateId
        },
        attributes: ['psId']
      }
      const psData = await (this as any).query('PlanSchema', 'queryDetailData', [planCondition])
      if (psData) psId = psData.psId
    }
    // 通过巡检模板可以查找巡检任务id(作为查询任务巡检项的条件)
    let taskIdArr = null
    if (psId || planId) {
      const taskCondition:any = {
        where: {},
        attributes: ['patrolTaskId']
      }
      if (psId) taskCondition.where.psId = psId
      if (planId) taskCondition.where.planId = planId
      const taskIdData = await (this as any).query('Task', 'queryAllData', [taskCondition])
      taskIdArr = taskIdData.list.map(item => item.patrolTaskId)
    }
    if (taskId) {
      if (taskIdArr) {
        taskIdArr.push(taskId)
      } else {
        taskIdArr = [taskId]
      }
    }

    // objID 查找 patrol_obj_rel_id(作为查询任务巡检项的条件)
    let objRelId = null
    if (objName || regionId || objId) {
      const objRelRes = await (this as any).query('PatrolObj', 'queryManyDataByTaskApi', [
        { objName, regionId, objId }
      ])
      if (objRelRes)
        {objRelId = objRelRes.map(item => {
          return item.dataValues.patrolObjRelId
        })}
    }
    // 查询 查询任务巡检项
    const taskItemCondition:any = {
      where: {},
      attributes: ['patrolTaskItemId']
    }
    if (objRelId) {
      taskItemCondition.where.patrolObjRelId = {
        [Op.in]: objRelId
      }
    }
    if (taskIdArr) {
      taskItemCondition.where.patrolTaskId = {
        [Op.in]: taskIdArr
      }
    }
    if (itemId) taskItemCondition.where.itemParentId = itemId
    // 只有存在帅选任务巡检项的,才去筛选巡检项id
    let taskItemIdArr = null
    if (taskIdArr || objRelId || itemId) {
      const taskItemIdData = await (this as any).query('PatrolTaskItem', 'queryManyAll', [taskItemCondition])
      taskItemIdArr = taskItemIdData.map(item => item.patrolTaskItemId)
    }
    // 通过帅选条件可以筛选到巡检项
    if (taskItemIdArr && taskItemIdArr.length === 0) {
      return {
        list: [],
        total: 0
      }
    }
    // 根据state到流程表里查出符合的巡检结果id,作为问题的帅选条件
    let statueResultIdArr = null
    if (state) {
      const flowCondition = {
        where: {
          status: {
            [Op.in]: state.split(',')
          },
          isDelete: 0
        },
        attributes: ['relativeId']
      }
      const stateRes = await (this as any).query('TransactionFlow', 'queryAllData', [flowCondition])
      if (stateRes && state.length > 0) statueResultIdArr = stateRes.map(item => item.relativeId)
    }
    this.ctx.hikLogger.info('wwwwwwwwwwwwwwwwwwww',taskItemIdArr)
    this.ctx.hikLogger.info('wwwwwwwwwwwwwwwwwwww',statueResultIdArr)
    this.ctx.hikLogger.info('wwwwwwwwwwwwwwwwwwww',taskItemIdArr)
    const problemCondition:any = {
      where: {
        isIntoNextStep: 1,
        status: 1
      },
      attributes: [
        'pointResultId',
        'resultDesc',
        'execUser',
        'picUrls',
        'createTime',
        'status',
        'patrolTaskItemId',
        'taskId'
      ]
    }
    if (pageSize && pageNo) {
      problemCondition.limit = pageSize * 1
      problemCondition.offset = (pageNo - 1) * pageSize
    }
    if (problemId) {
      problemCondition.where.pointResultId = problemId
    } else {
      if (taskItemIdArr) {
        problemCondition.where.patrolTaskItemId = {
          [Op.in]: taskItemIdArr
        }
      }
      // if (state) problemCondition.where.status = state
      if (statueResultIdArr) problemCondition.where.pointResultId = { [Op.in]: statueResultIdArr }
      if (startTime && endTime) {
        problemCondition.where.createTime = {
          [Op.between]: [parseInt(startTime), parseInt(endTime)]
        }
      }
    }

    const problemData = await (this as any).query('TaskExecSchema', 'findAndCountAllData', [
      problemCondition
    ])
    const returnData = []
    for (const elem of problemData.list) {
      let problemFlow = null
      if (elem.pointResultId) {
        problemFlow = await (this as any).query('TransactionFlow', 'findOneData', [
          {
            where: {
              relativeId: elem.pointResultId,
              isDelete: 0
            },
            attributes: ['transactionId', 'status']
          }
        ])
      }
      const namePath = await ctx.service.item.queryPathByTaskItemId(
        {
          taskItemId: elem.patrolTaskItemId
        },
        (this as any).transaction
      )
      let pathArr = null
      if (namePath) pathArr = namePath.path.split('/')
      const psName = await ctx.service.patrolTemplate.queryNameByTaskId(
        {
          taskId: elem.taskId
        },
        (this as any).transaction
      )
      const objData = await (this as any).query('PatrolTaskItem', 'queryObjName', [elem.patrolTaskItemId])
      returnData.push({
        patrolObjName: objData ? objData['patrolObj.partrolObjItem.patrolObjName'] : null,
        schoolName: objData ? objData['patrolObj.partrolObjItem.patrolObjExtend2'] : null,
        schoolId: objData ? objData['patrolObj.partrolObjItem.patrolObjExtend1'] : null,
        patrolObjId: objData ? objData['patrolObj.partrolObjItem.patrolObjId'] : null,
        problemFlow: problemFlow ? problemFlow.transactionId : null,
        createTime: elem.createTime,
        problemId: elem.pointResultId,
        resultDesc: elem.resultDesc,
        execUser: elem.execUser,
        picUrls: elem.picUrls,
        status: problemFlow ? problemFlow.status : null,
        itemName: pathArr ? pathArr.splice(-2, 1)[0] : null,
        itemId: namePath ? namePath.id : null,
        psName
      })
    }
    return {
      list: returnData,
      total: problemData.total
    }
  }

  /**
   * 获取问题整改流程详情
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async taskProblemDetail(params:any): Promise<any> {
    const { problemId } = params
    const taskCondition = {
      where: {
        relativeId: problemId,
        status: '4'
      },
      attributes: ['remark', 'status', 'picUrl', 'modifier', 'createTime']
    }
    const data = await (this as any).query('TransactionFlow', 'findOneData', [taskCondition])
    return data
  }

  /**
   * 单个计划下倒数第二级巡检项问题统计
   * task/problem/typeCount
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async taskProblemTypeCount(params:any): Promise<any> {
    const { ctx } = this
    const { planId, type, regionId, objName, objId, startTime, endTime } = params
    // return ctx.headers.appid
    // 巡检计划id -> 巡检任务id -> 任务巡检项id ->聚合成巡检项:[任务巡检项] -> 计算问题数
    let planIdArr = null
    if (planId || (startTime && endTime && type === 1)) {
      // 求出符合的planID
      const planCondition:any = {
        where: {},
        attributes: ['patrolPlanId']
      }
      if (planId) planCondition.where.patrolPlanId = planId
      if (startTime && endTime && type === 1) {
        const s = moment(parseInt(startTime)).format('YYYY-MM-DD')
        const e = moment(parseInt(endTime)).format('YYYY-MM-DD')
        planCondition.where.planEffectiveStart = { [Op.between]: [s, e] }
      }
      const planRes = await (this as any).query('PatrolPlan', 'queryAll', [planCondition])
      if (planRes) planIdArr = planRes.map(item => item.patrolPlanId)
    }
    // 通过巡检对象name 查出objrelid
    let objRelArr = null
    if (objName || regionId || objId) {
      const objRelRes = await (this as any).query('PatrolObj', 'queryManyDataByTaskApi', [
        { objName, regionId, objId }
      ])
      if (objRelRes)
        {objRelArr = objRelRes.map(item => {
          return item.dataValues.patrolObjRelId
        })}
    }
    // 查询符合taskid
    let taskIdArr = null
    if (planIdArr) {
      const taskCondition:any = {
        where: {},
        attributes: ['patrolTaskId']
      }
      if (planIdArr) {
        taskCondition.where.planId = {
          [Op.in]: planIdArr
        }
      }
      const data = await (this as any).query('Task', 'queryAllData', [taskCondition])
      if (data) taskIdArr = data.list.map(item => item.patrolTaskId)
    }

    // 查询taskitemid
    const taskItemCondition:any = {
      order: [['itemParentId', 'DESC']],
      where: {},
      attributes: ['itemParentId', 'patrolTaskItemId']
    }
    if (taskIdArr) {
      taskItemCondition.where.patrolTaskId = {
        [Op.in]: taskIdArr
      }
    }
    if (objRelArr) {
      taskItemCondition.where.patrolObjRelId = {
        [Op.in]: objRelArr
      }
    }
    const taskItemRes = await (this as any).query('PatrolTaskItem', 'queryManyAll', [taskItemCondition])
    const itemObj = {}
    const str = 'patrolTaskItemId'
    const str2 = 'itemParentId'
    for (const elem of taskItemRes) {
      if (itemObj[elem[str2]]) {
        itemObj[elem[str2]].push(elem[str])
      } else {
        itemObj[elem[str2]] = []
        itemObj[elem[str2]].push(elem[str])
      }
    }
    const returnData = []
    for (const key in itemObj) {
      const name = await ctx.service.item.queryItemName(
        {
          itemId: key
        },
        (this as any).transaction
      )
      const count = await ctx.service.taskExecResult.queryProblemByTaskItemIdArr(
        {
          taskItemIdArr: itemObj[key],
          startTime,
          endTime
        },
        (this as any).transaction
      )
      returnData.push({
        itemId: key,
        itemName: name,
        problemNum: count
      })
    }
    console.error('-------------------------planIdArr', planIdArr)
    console.error('-------------------------taskIdArr', taskIdArr)
    console.error('-------------------------objRelArr', objRelArr)
    return returnData
  }

  /**
   * 巡检模板维度查问题分类
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async problemPlanTemplateCount(params:any): Promise<any> {
    const { ctx } = this
    const { regionId, objName, startTime, endTime, objId } = params
    // 查出所有计划模板
    const data = await (this as any).query('PlanSchema', 'queryAllIncludeTask', [])
    const psList = []
    // 根据objName查出 patrol_obj_rel_id
    let objRelArr = null
    if (objName || regionId || objId) {
      const objRelRes = await (this as any).query('PatrolObj', 'queryManyDataByTaskApi', [
        { objName, regionId, objId }
      ])
      if (objRelRes)
        {objRelArr = objRelRes.map(item => {
          return item.dataValues.patrolObjRelId
        })}
    }
    for (const elem of data.list) {
      if (elem.taskItems.length === 0) {
        psList.push({
          psName: elem.psName,
          psId: elem.schemaCode,
          problemNum: 0
        })
      } else {
        // 查询 查询任务巡检项
        const taskItemCondition:any = {
          where: {
            patrolTaskId: {
              [Op.in]: elem.taskItems.map(item => item.patrolTaskId)
            }
          },
          attributes: ['patrolTaskItemId']
        }
        if (objRelArr) {
          taskItemCondition.where.patrolObjRelId = {
            [Op.in]: objRelArr
          }
        }
        const taskItemIdData = await (this as any).query('PatrolTaskItem', 'queryManyAll', [
          taskItemCondition
        ])
        const taskItemIdArr = taskItemIdData.map(item => item.patrolTaskItemId)
        if (taskItemIdArr.length === 0) {
          // 没有任务巡检项
          psList.push({
            psName: elem.psName,
            psId: elem.schemaCode,
            problemNum: 0
          })
        } else {
          // 通过任务巡检项查询问题
          const count = await ctx.service.taskExecResult.queryProblemByTaskItemIdArr(
            {
              taskItemIdArr,
              startTime,
              endTime
            },
            (this as any).transaction
          )
          psList.push({
            psName: elem.psName,
            psId: elem.schemaCode,
            problemNum: count
          })
        }
      }
    }
    return psList
  }

  /**
   * 问题状态统计问题(已修改和未修改)
   * problem/state/Count
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async problemStateCount(params:any): Promise<any> {
    const { objName, objId, startTime, endTime, regionId } = params
    let objRelArr = null
    if (objName || regionId || objId) {
      const objRelRes = await (this as any).query('PatrolObj', 'queryManyDataByTaskApi', [
        { objName, regionId, objId }
      ])
      if (objRelRes)
        {objRelArr = objRelRes.map(item => {
          return item.dataValues.patrolObjRelId
        })}
    }
    // 通过objrelid,求出符合taskitemid
    let patrolTaskItemArr = null
    if (objRelArr) {
      const taskIdRes = await (this as any).query('PatrolTaskItem', 'queryManyAll', [
        {
          where: {
            patrolObjRelId: {
              [Op.in]: objRelArr
            }
          },
          attributes: ['patrolTaskItemId']
        }
      ])
      if (taskIdRes) patrolTaskItemArr = taskIdRes.map(item => item.patrolTaskItemId)
    }
    // 求出巡检结论id
    let taskExecResultArr = null
    const resultCondition:any = {
      where: {
        isIntoNextStep: 1,
        status:1
      },
      attributes: ['pointResultId']
    }
    if (patrolTaskItemArr) {
      resultCondition.where.patrolTaskItemId = {
        [Op.in]: patrolTaskItemArr
      }
    }
    if (startTime && endTime) {
      resultCondition.where.createTime = {
        [Op.between]: [parseInt(startTime), parseInt(endTime)]
      }
    }
    const resultRes = await (this as any).query('TaskExecSchema', 'findAndCountAllData', [resultCondition])
    if (resultRes) taskExecResultArr = resultRes.list.map(item => item.pointResultId)
    const statusProblem = [
      {
        state: '0',
        stateName: this.ctx.__('taskApi.toBeCheck'),
        problemNum: 0
      },
      {
        state: '1',
        stateName: this.ctx.__('taskApi.checkSuccess'),
        problemNum: 0
      },
      {
        state: '2',
        stateName: this.ctx.__('taskApi.checkFailed'),
        problemNum: 0
      },
      {
        state: '3',
        stateName: this.ctx.__('taskApi.toBeRectified'),
        problemNum: 0
      },
      {
        state: '4',
        stateName: this.ctx.__('taskApi.rectifiedComplete'),
        problemNum: 0
      },
      {
        state: '5',
        stateName: this.ctx.__('taskApi.toBeReview'),
        problemNum: 0
      },
      {
        state: '6',
        stateName: this.ctx.__('taskApi.reviewSuccess'),
        problemNum: 0
      },
      {
        state: '7',
        stateName: this.ctx.__('taskApi.reviewError'),
        problemNum: 0
      },
      {
        state: '8',
        stateName: this.ctx.__('taskApi.questionFinish'),
        problemNum: 0
      },
      {
        state: '9',
        stateName: this.ctx.__('taskApi.notQuestions'),
        problemNum: 0
      }
    ]
    for (const [index, elem] of statusProblem.entries()) {
      const flowCondition:any = {
        where: {
          status: elem.state,
          isDelete: 0
        }
      }
      if (taskExecResultArr) {
        flowCondition.where.relativeId = {
          [Op.in]: taskExecResultArr
        }
      }
      const data = await (this as any).query('TransactionFlow', 'queryCount', [flowCondition])
      statusProblem[index].problemNum = data
    }
    console.log('---------------------------------taskExecResultArr', taskExecResultArr)
    return statusProblem
  }

  /**
   * 区域下巡检对象(看板)
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async planObjList(params:any): Promise<any> {
    const { startTime, endTime, regionId } = params
    // 区域->计划->任务id
    let taskArr = null
    if (regionId) {
      taskArr = []
      const planRes = await (this as any).query('PatrolPlan', 'queryAllDataByTaskApiServer', [
        { regionId, startTime, endTime }
      ])
      let planRes1 = null
      if (planRes) {
        planRes1 = planRes.filter(item => {
          return item.taskList.length > 0
        })
      }
      if (planRes1) {
        const taskIdObjArr = []
        for (const elem of planRes1.values()) {
          taskIdObjArr.push(...elem.taskList)
        }
        if (taskIdObjArr.length > 0) taskArr = taskIdObjArr.map(item => item.patrolTaskId)
      }
    }
    // 拿到patroltaskid,找出符合的巡检对象
    const relRes = await (this as any).query('PatrolObjRel', 'queryAllIncludeObjAndItem', [{ taskArr }])
    // return relRes
    const newObj = {}
    for (const elem of relRes.values()) {
      if (elem.partrolObjItem && elem.partrolObjItem.patrolObjId) {
        if (newObj[elem.partrolObjItem.patrolObjId]) {
          const taskIdS = elem.patrolTaskItem.map(item => item.patrolTaskItemId)

          newObj[elem.partrolObjItem.patrolObjId].taskItemIdArr.push(...taskIdS)
        } else {
          const taskIdS = elem.patrolTaskItem.map(item => item.patrolTaskItemId)
          newObj[elem.partrolObjItem.patrolObjId] = {
            patrolObjName: elem.partrolObjItem.patrolObjName,
            taskItemIdArr: [...taskIdS]
          }
        }
      }
    }
    const returnData = []
    for (const key in newObj) {
      let problemData = 0
      if (newObj[key].taskItemIdArr.length > 0) {
        problemData = await (this as any).query('TaskExecSchema', 'queryCount', [
          {
            where: {
              patrolTaskItemId: {
                [Op.in]: newObj[key].taskItemIdArr
              },
              isIntoNextStep: 1
            }
          }
        ])
      }
      returnData.push({
        patrolObjName: newObj[key].patrolObjName,
        problemNum: problemData
      })
    }

    return returnData
  }
}
