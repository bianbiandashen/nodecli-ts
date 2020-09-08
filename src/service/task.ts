import {  Context, inject, provide} from 'midway';
import { ItaskService } from '../app/interface/taskInterface';
import { IBussinessService } from '../app/interface/bussinessInterface';
import { ItlncService } from '../app/interface/tlncInterface';
import { IpdmsService } from '../app/interface/pdmsInterface';
import { IAgentPersonService } from '../app/interface/agentPersonInterface';
import { ICommonService } from '../app/interface/commonInterface';

const Sequelize = require('sequelize')
const { Op } = Sequelize
const moment = require('moment')
const { Transactional } = require('../app/core/transactionalDeco/index')
// 数组对象根据属性值（数字比较）排序
function compare (property) {
  return function (a, b) {
    const value1 = a[property]
    const value2 = b[property]
    return value1 - value2
  }
}
@provide('taskService')
export class TaskService implements ItaskService{
  @inject()
  ctx: Context;

  @inject('bussinessService')
  serviceIBussiness: IBussinessService;

  @inject('tlncService')
  serviceItlnc: ItlncService;

  @inject('pdmsService')
  serviceIpdms: IpdmsService;

  @inject('agentPersonService')
  serviceIAgentPerson: IAgentPersonService;

  @inject('commonService')
  serviceICommon: ICommonService;

  @Transactional
  // edit by bian 帮助app 实现 统一任务下对某个对象直接提交
  async unifiedSubmit (params:any,userId:any): Promise<any> {
    const { patrolTaskId, patrolObjId } = params
    if (!userId) {
      throw new Error(this.ctx.__('task.personInforNotAll'))
    } else if (!params.patrolTaskId) {
      throw new Error(this.ctx.__('task.taskIdMust'))
    } else if (!params.patrolObjId) {
      throw new Error(this.ctx.__('task.objIdMust'))
    }
    const PatrolObjRelCon = {
      where: {
        patrolTaskId,
        patrolObjId
      }
    }
    const patrolObjRel = await (this as any).query('PatrolObjRel', 'findOneData', [ PatrolObjRelCon ])
    if (!patrolObjRel || !patrolObjRel.patrolObjRelId) {
      throw new Error(this.ctx.__('task.taxkObjRelateNotExit'))
    }

    const baseUserId = new Buffer(userId).toString('base64')
    const realAppid = this.ctx.header.appid

    const result = await this.ctx.consulCurl(
      '/patrolengine-execute/api/v1/task/unified/submit',
      'patrolengine',
      'patrolengine-execute',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          userId: baseUserId,
          appId: realAppid
        },
        data: {
          patrolObjRelId: patrolObjRel.patrolObjRelId,
          isSceneObj: params.isSceneObj,
          patrolTaskItemIds: params.patrolTaskItemIds
        }
      }
    )
    const resultData = this.ctx.helper.bufferToJson(result.data)
    this.ctx.helper.throwErrorByOtherComponents(result, this.ctx.__('task.lookDoTask'))
    this.ctx.hikLogger.info(resultData)
    return resultData
  }

  @Transactional
  async assignTask (params:any,userId:any): Promise<any> {
    const realAppid = this.ctx.header.appid
    const bussiness = await this.serviceIBussiness.queryAllApp(undefined)
    this.ctx.header.appid = realAppid
    const SenceObj = {}
    if (bussiness && bussiness.length > 0) {
      bussiness.forEach(element => {
        SenceObj[`${element.identify}`] = element.bussinessName
      })
    }
    if (!userId || !params.assignUserId) {
      throw new Error(this.ctx.__('task.personInforNotAll'))
    }
    // console.log('bodyDatabodyData222', bodyData)
    const result = await this.ctx.consulCurl(
      '/patrolengine-execute/api/v1/task/task/assign',
      'patrolengine',
      'patrolengine-execute',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          appId: realAppid
        },
        data: {
          assignUserId: params.assignUserId,
          currentUserId: userId,
          taskId: params.taskId
        }
      }
    )
    const resultData = this.ctx.helper.bufferToJson(result.data)
    this.ctx.helper.throwErrorByOtherComponents(result, this.ctx.__('task.lookDoTask'))
    this.ctx.hikLogger.info(resultData)
    if (resultData) {
      // 将执行人的任务代办删除然后将移交人的代办加上

      const taskCondition:any = {}
      taskCondition.patrolTaskId = params.taskId

      const PatrolTask = await (this as any).query('Task', 'findOneDataGetDetail', [ taskCondition ])
      console.log('.dataValuesdataValues', PatrolTask)
      console.log('.PatrolTaskPatrolTask', PatrolTask.dataValues)
      const taskRes = PatrolTask && PatrolTask.dataValues
      // 开始时间
      const st = (this as any).app.dateFormatter(taskRes.startTime, 'yyyy/MM/dd hh:mm')
      // 结束时间
      const et = (this as any).app.dateFormatter(taskRes.endTime, 'yyyy/MM/dd hh:mm')
      const result = {
        a: this.ctx.__('task.doTimeSinceto',  st, et ),
        b: this.ctx.__('task.belongPlan',  taskRes.patrolPlanName ),
        c: this.ctx.__('task.taskNumber',  taskRes.patrolTaskName )

        // d: extendJson.now
      }
      const extendNoShow = {
        appId: realAppid,
        status: taskRes.status,
        msgStatus: 3,
        patrolTaskId: params.taskId
      }
      const message = {
        // taskid作为代办任务的主键ｉｄ
        msgId: params.taskId,
        userId: params.assignUserId.split(','),
        moduleId: taskRes.execType === 2 ? 'taskHandle' : 'taskHandleCommonWeb',
        comId: realAppid,
        msgStatus: '3', // 1 问题  2 请加代理 3 任务分发
        listType: 'todo',
        extendJson: JSON.stringify(result),
        msgTitle: `[${this.ctx.helper.getShowSenceName(realAppid)}]${this.ctx.__('task.taskRecive')}`,
        extendNoShow: JSON.stringify(extendNoShow)
      };
      // 给执行人发代办
      (this as any).app.logger.warn('message', message)
      await this.serviceItlnc.mq(message, (this as any).transaction)
      const delePar:any = {}
      delePar.taskId = params.taskId
      delePar.userId = userId
      await this.serviceIpdms.agencyDelete(delePar)
      // }
    }
    return resultData
  }
  // 消息代办查询
  @Transactional
  async newsagencyService (params:any,appid:any): Promise<any> {
    const realAppid = appid
    const bussiness = await this.serviceIBussiness.queryAllApp(undefined)
    this.ctx.header.appid = realAppid
    const SenceObj = {}
    if (bussiness && bussiness.length > 0) {
      bussiness.forEach(element => {
        SenceObj[`${element.identify}`] = element.bussinessName
      })
    }
    this.ctx.header.appid = appid
    console.log(' this.ctx.header.appid', this.ctx.header.appid)
    const itemList = await (this as any).query('Task', 'newsagencyModel', [ params ])
    const list =
      (itemList && itemList.list && itemList.list.length > 0 && itemList.list[0].dataValues) || {}
    const extendJson:any = {}
    // 任务编号
    extendJson.patrolPlanName = list.planItems
      ? list &&
        list.planItems &&
        list.planItems.dataValues &&
        list.planItems.dataValues.patrolPlanName
      : ''
    // 所属计划
    extendJson.patrolTaskName = list.patrolTaskName

    // 开始时间
    extendJson.startTime = (this as any).app.dateFormatter(list.startTime, 'yyyy/MM/dd hh:mm')
    // 结束时间
    extendJson.endTime = (this as any).app.dateFormatter(list.endTime, 'yyyy/MM/dd hh:mm')
    // 任务ID
    extendJson.patrolTaskId = list.patrolTaskId
    // 当前时间
    extendJson.now = (this as any).app.dateFormatter(new Date(), 'yyyy-MM-dd hh:mm')
    const result = {
      a: this.ctx.__('task.doTimeSinceto',  extendJson.startTime, extendJson.endTime ),
      b: this.ctx.__('task.belongPlan',  extendJson.patrolPlanName ),
      c: this.ctx.__('task.taskNumber',  extendJson.patrolTaskName )
      // d: extendJson.now
    }

    const extendNoShow = {
      appId: appid,
      status: list.status,
      msgStatus: 3,
      patrolTaskId: extendJson.patrolTaskId
    }
    // edit bybian 在有教育场景的代理人场景下 要给代理认发代办
    // 另外现在的 currentPerson 拆到了任务里面 所以直接可以使用
    const person = list && list.currentPerson && list.currentPerson.split(',')
    let personlist = []
    if (person && person.length > 0) {
      personlist = await this.serviceIAgentPerson.getUserIdsBySubmiiters(
        person,(this as any).transaction
      )
    }
    let message = {}
    // todo bla app端不能收到任务拆分的代办
    if (appid === 'pps') {
      message = {
        msgId: extendJson.patrolTaskId,
        userId: personlist,
        moduleId: list.execType === 2 ? 'taskHandlePpsApp' : 'taskHandlePpsWeb',
        comId: appid,
        msgStatus: '3', // 1 问题  2 请加代理 3 任务分发
        listType: 'todo',
        extendJson: JSON.stringify(result),
        msgTitle: `[${this.ctx.helper.getShowSenceName(appid)}]${this.ctx.__('task.taskRecive')}`,
        extendNoShow: JSON.stringify(extendNoShow)
      }
    } else if (appid === 'pes') {
      message = {
        msgId: extendJson.patrolTaskId,
        userId: personlist,
        moduleId: list.execType === 2 ? 'taskHandlePesApp' : 'taskHandlePesWeb',
        comId: appid,
        msgStatus: '3', // 1 问题  2 请加代理 3 任务分发
        listType: 'todo',
        extendJson: JSON.stringify(result),
        msgTitle: `[${this.ctx.helper.getShowSenceName(appid)}]${this.ctx.__('task.taskRecive')}`,
        extendNoShow: JSON.stringify(extendNoShow)
      }
    } else if (appid === 'eris') {
      message = {
        msgId: extendJson.patrolTaskId,
        userId: personlist,
        moduleId: list.execType === 2 ? 'taskHandleErisApp' : 'taskHandleErisWeb',
        comId: appid,
        msgStatus: '3', // 1 问题  2 请加代理 3 任务分发
        listType: 'todo',
        extendJson: JSON.stringify(result),
        msgTitle: `[${this.ctx.helper.getShowSenceName(appid)}]${this.ctx.__('task.taskRecive')}`,
        extendNoShow: JSON.stringify(extendNoShow)
      }
    } else {
      message = {
        msgId: extendJson.patrolTaskId,
        userId: personlist,
        moduleId: list.execType === 2 ? 'taskHandle' : 'taskHandleCommonWeb',
        comId: appid,
        msgStatus: '3', // 1 问题  2 请加代理 3 任务分发
        listType: 'todo',
        extendJson: JSON.stringify(result),
        msgTitle: `[${this.ctx.helper.getShowSenceName(appid)}]${this.ctx.__('task.taskRecive')}`,
        extendNoShow: JSON.stringify(extendNoShow)
      }
    }
    // for (const iterator of person) {

    // 给执行人发代办
    (this as any).app.logger.warn('message', message)
    console.log('taskHandle', message)
    await this.serviceItlnc.mq(message, (this as any).transaction)
    // }
  }
  // 异步获取任务巡检项结构
  @Transactional
  async getSyncTaskItemList (params:any): Promise<any> {
    // @TODOrenxiaojian 说明params中有哪些参数
    const { patrolTaskId, patrolObjId } = params
    if (!patrolTaskId) {
      const error:any = new Error(this.ctx.__('task.taskIdMust'))
      error.status = 425
      throw error
    }
    let patrolObjRelId = ''
    if (patrolObjId) {
      const objRelCondition = {
        where: {
          patrolObjId,
          patrolTaskId
        }
      }
      const objRel = await (this as any).query('PatrolObjRel', 'findOneData', [ objRelCondition ])
      patrolObjRelId = objRel && objRel.patrolObjRelId
    }
    if (patrolObjRelId) params.patrolObjRelId = patrolObjRelId
    const itemList = await (this as any).query('PatrolTaskItem', 'queryAsyncTaskItem', [ params ])
    return itemList
  }
  // 实现 社区场景下 获取task下所有任务巡检项可以根据objid筛选相同任务下的对象
  @Transactional
  async getTaskFirstItemsByTaskId (params:any): Promise<any> {
    const { patrolTaskId, patrolObjId } = params
    if (!patrolTaskId) {
      const error:any = new Error(this.ctx.__('task.taskIdMust'))
      error.status = 425
      throw error
    }
    let patrolObjRelId:any = ''
    if (patrolObjId) {
      const objRelCondition = {
        where: {
          patrolObjId,
          patrolTaskId
        }
      }
      const objRel = await (this as any).query('PatrolObjRel', 'findOneData', [ objRelCondition ])
      patrolObjRelId = objRel && objRel.patrolObjRelId
    }

    // 一级巡检项 以及 状态是 未完成的
    const condition:any = {
      where: {
        patrolTaskId,
        level: 1
        // status: 0
      },
      order: [[ 'createTime', 'DESC' ]]
    }
    if (patrolObjRelId) {
      condition.where.patrolObjRelId = patrolObjRelId
      // @TODO bian日志方法修改
      (this as any).app.logger.warn(this.ctx.__('task.searchOneLevelLook'))
    }

    const itemList = await (this as any).query('PatrolTaskItem', 'queryList', [ condition ])
    const taskCondition = {
      where: {
        patrolTaskId,
        objectId: patrolObjId
      },
      order: [[ 'processType', 'ASC' ]]
    }
    const PatrolTaskPerson = await (this as any).query('PatrolTaskPerson', 'queryManyAll', [ taskCondition ])
    console.log('============================================PatrolTaskPerson', PatrolTaskPerson)
    if (PatrolTaskPerson && PatrolTaskPerson.length > 1) {
      // 升序排列即 有下一个步骤
      const personItem = PatrolTaskPerson[1]

      let taskRoleName = ''
      let extraNextPersonOn
      if (personItem.processType === 1) {
        extraNextPersonOn = await (this as any).query('Process', 'getExtraNextPersonOnByTaskId', [
          patrolTaskId,
          1
        ])
        taskRoleName = this.ctx.__('task.relookPerson')
      } else if (personItem.processType === 2) {
        extraNextPersonOn = await (this as any).query('Process', 'getExtraNextPersonOnByTaskId', [
          patrolTaskId,
          2
        ])
        taskRoleName = this.ctx.__('task.changePerson')
      } else if (personItem.processType === 3) {
        extraNextPersonOn = await (this as any).query('Process', 'getExtraNextPersonOnByTaskId', [
          patrolTaskId,
          3
        ])
        taskRoleName = this.ctx.__('task.lookPerson')
      } else if (personItem.processType === 0) {
        extraNextPersonOn = await (this as any).query('Process', 'getExtraNextPersonOnByTaskId', [
          patrolTaskId,
          0
        ])
        taskRoleName = this.ctx.__('task.inspector')
      } else {
        throw Error(this.ctx.__('task.roleInfoInvalid'))
      }
      for (const item of itemList.list) {
        item.dataValues.extraNextPersonOn = extraNextPersonOn
        item.dataValues.taskRoleName = taskRoleName
        item.dataValues.defaultPersonIds = personItem.currentPerson
      }
    }
    console.log('itemListitemList', itemList)
    return itemList
  }

  // 实现 社区场景下 获取task 下所有任务巡检项
  @Transactional
  async getOtherTaskItemsByFirstTaskItemId (params:any): Promise<any> {
    const { patrolTaskId, patrolItemId, patrolObjRelId } = params
    // 一级巡检项 以及 状态是 未完成的
    const condition = {
      where: {
        patrolTaskId,
        patrolObjRelId,
        // @TODO bian 2，3，4都啥意思
        level: { [Op.or]: [ 2, 3, 4 ] },
        path: { [Op.iLike]: `%%${patrolItemId}%%` }
        // status: 0
      },
      order: [[ 'createTime', 'DESC' ]]
    }

    const itemList = await (this as any).query('PatrolTaskItem', 'queryList', [ condition ])
    // 暂时不反回
    return itemList
  }

  // 实现 社区场景下 获取task 下所有任务巡检项
  @Transactional
  async getChildrenResultByFirstTaskItemId (params:any): Promise<any> {
    // @TODO bian queryList2方法名不标准
    const itemList = await (this as any).query('PatrolTaskItem', 'queryList2', [ params ])

    for (const item of itemList.list) {
      item.dataValues.patrolItemPath = await this.serviceICommon.partrolItemsPath(
        item.dataValues.path,
        (this as any).transaction
      )
    }

    return itemList
  }

  @Transactional
  async getExtendTaksInfo (params:any): Promise<any> {
    // @TODO bian this.app.toHumpJson使用helper中的
    const res = await (this as any).query('Task', 'getExtendInfo', [ params.patrolTaskId ])
    if (res.length > 0 && (this as any).app.toHumpJson(res[0]) && (this as any).app.toHumpJson(res[0]).length > 0) {
      return (this as any).app.toHumpJson(res[0])[0]
    }
  }

  /**
   * 查询任务下的对象列表
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async getObjListByTaskId (params:any): Promise<any> {
    const res = await (this as any).query('PatrolObjRel', 'getObjListByTaskId', [ params.patrolTaskId ])
    if (res.length > 0) {
      const objList = (this as any).app.toHumpJson(res[0])
      for (const obj of objList) {
        const taskCondition1 = { where: { patrolTaskId: params.patrolTaskId } }
        const taskData = await (this as any).query('Task', 'findOneData', [ taskCondition1 ])
        let planData
        if (taskData && taskData.planId) {
          const planCondition = { where: { patrolPlanId: taskData.planId } }
          planData = await (this as any).query('PatrolPlan', 'queryOne', [ planCondition ])
        }
        obj.scoreStatus = (planData && planData.scoreStatus) || 0
      }
      return objList
    }
  }

  /**
   * 新增xx
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async createQuestionByApp (params:any,userId:any): Promise<any> {
    const {
      nextCopyPeople,
      nextHandlerPeople,
      patrolItemId,
      patrolObjId,
      picUrls,
      resultDesc
    } = params
    const baseUserId = new Buffer(userId).toString('base64')
    // const result = await this.app.curl('http://10.15.66.12:8082/patrolengine/api/v1/task/problem/submit', {
    const result = await this.ctx.consulCurl(
      '/patrolengine-execute/api/v1/task/problem/submit',
      'patrolengine',
      'patrolengine-execute',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          userId: baseUserId,
          appId: this.ctx.header.appid
        },
        data: {
          nextCopyPeople,
          nextHandlerPeople,
          patrolItemId,
          patrolObjId,
          picUrls,
          resultDesc,
          submitter: userId
        }
      }
    )
    const resultData = result && result.data && this.ctx.helper.bufferToJson(result.data)
    const mq1 = resultData && resultData.data
    if (mq1 && mq1.list && mq1.list.length > 0) {
      const pointResultIds = mq1.list.map(ele => ele.pointResultId)
      if (pointResultIds && pointResultIds.length > 0) {
        for (const relativeId of pointResultIds) {
          const execCondition = { where: { pointResultId: relativeId } }
          const TaskExec = await (this as any).query('TaskExecSchema', 'queryDetail', [ execCondition ])
          const params:any = {}
          params.info = {}
          params.relativeId = relativeId
          // params.resultDesc = resultDesc
          params.info.remark = resultDesc
          params.copyUsers = nextCopyPeople
          params.execUsers = TaskExec && TaskExec.nextHandlePeople
          params.appId = this.ctx.header.appid
          params.judge = 'deny'
          await this.ctx.service.mq.questionHandleMq(params, (this as any).transaction)
        }
      }
    }
    return resultData
  }

  /**
   * app接受任务
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async taskRecive (params:any,userId:any): Promise<any> {
    const { taskId } = params
    const realAppid = this.ctx.header.appid
    const bussiness = await this.serviceIBussiness.queryAllApp(undefined)
    this.ctx.header.appid = realAppid
    const SenceObj = {}
    if (bussiness && bussiness.length > 0) {
      bussiness.forEach(element => {
        SenceObj[`${element.identify}`] = element.bussinessName
      })
    }
    const baseUserId = new Buffer(userId).toString('base64')
    console.log('taskreevice____taskId', taskId)
    console.log('baseUserIdbaseUserId', baseUserId)
    console.log(' this.ctx.header.appid', this.ctx.header.appid)
    console.log('realAppid', realAppid)
    // const result = await this.app.curl('http://10.15.66.102:8082/patrolengine-execute/api/v1/task/accept', {
    const result = await this.ctx.consulCurl(
      '/patrolengine-execute/api/v1/task/accept',
      'patrolengine',
      'patrolengine-execute',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          userId: baseUserId,
          appId: realAppid
        },
        data: {
          taskId,
          submitter: userId
        }
      }
    )
    const resultData = result && result.data && this.ctx.helper.bufferToJson(result.data)

    // 发代办
    this.ctx.hikLogger.info('调用任务移交接口完成')
    if (resultData && resultData.code !== '0') {
      throw new Error(resultData.msg)
    }
    // this.app.logger.log('解析后响应内容：')
    this.ctx.hikLogger.info('========', resultData)

    if (resultData) {
      // 首先删除所有的 taskid 相关的代办
      const delePar:any = {}
      delePar.taskId = taskId
      // delePar.userId = userId
      await this.serviceIpdms.agencyDelete(delePar)

      // 将执行人的任务代办删除然后将移交人的代办加上

      const taskCondition:any = {}
      taskCondition.patrolTaskId = taskId

      const PatrolTask = await (this as any).query('Task', 'findOneDataGetDetail', [ taskCondition ])
      console.log('.dataValuesdataValues', PatrolTask)
      console.log('.PatrolTaskPatrolTask', PatrolTask.dataValues)
      const taskRes = PatrolTask && PatrolTask.dataValues

      const st = (this as any).app.dateFormatter(taskRes.startTime, 'yyyy/MM/dd hh:mm')
      // 结束时间
      const et = (this as any).app.dateFormatter(taskRes.endTime, 'yyyy/MM/dd hh:mm')
      const result = {
        a: this.ctx.__('task.doTimeSinceto',  st, et ),
        b: this.ctx.__('task.belongPlan',  taskRes.patrolPlanName ),
        c: this.ctx.__('task.taskNumber',  taskRes.patrolTaskName )
        // d: extendJson.now
      }
      console.log('.resultresult', result)
      // this.ctx.hikLogger.info('接受任务发送的显示在app 上的信息'), result)
      const extendNoShow = {
        appId: realAppid,
        status: taskRes.status,
        msgStatus: 3,
        patrolTaskId: taskId
      }
      const message = {
        // taskid作为代办任务的主键id
        msgId: taskId,
        userId: userId.split(','),
        moduleId: taskRes.execType === 2 ? 'taskHandle' : 'taskHandleCommonWeb',
        comId: realAppid,
        msgStatus: '3', // 1 问题  2 请加代理 3 任务分发
        listType: 'todo',
        extendJson: JSON.stringify(result),
        msgTitle: `[${this.ctx.helper.getShowSenceName(realAppid)}]${this.ctx.__('task.taskRecive')}`,
        extendNoShow: JSON.stringify(extendNoShow)
      }
      // 给执行人发代办
      this.ctx.hikLogger.info('给执行人发代办', message)
      await this.serviceItlnc.mq(message, (this as any).transaction)
    }
    return resultData
  }

  /**
   * 任务继续 web 端的
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async taskContinue (params:any): Promise<any> {
    const { taskId } = params
    // const result = await this.app.curl('http://10.15.66.12:8082/patrolengine/api/v1/task/accept', {
    const result = await this.ctx.consulCurl(
      '/patrolengine-execute/api/v1/task/cont',
      'patrolengine',
      'patrolengine-execute',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          appId: this.ctx.header.appid
        },
        data: { taskId }
      }
    )
    const resultData = result && result.data && this.ctx.helper.bufferToJson(result.data)
    console.log('realUrlrealUrlrealUrlrealUrlrealUrl', resultData)
    return resultData
  }

  /**
   * 任务一键暂停 web 端的
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async taskStopAll (): Promise<any> {
    const result = await this.ctx.consulCurl(
      '/patrolengine-execute/api/v1/task/stop/all',
      'patrolengine',
      'patrolengine-execute',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          appId: this.ctx.header.appid
        },
        data: {}
      }
    )
    const resultData = this.ctx.helper.bufferToJson(result.data)
    return resultData
  }
  /**
   * 任务暂停 web 端的
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async taskPause (params:any): Promise<any> {
    const { taskId } = params
    const result = await this.ctx.consulCurl(
      '/patrolengine-execute/api/v1/task/stop',
      'patrolengine',
      'patrolengine-execute',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          appId: this.ctx.header.appid
        },
        data: { taskId }
      }
    )
    const resultData = result && result.data && this.ctx.helper.bufferToJson(result.data)
    console.log('realUrlrealUrlrealUrlrealUrlrealUrl', resultData)
    return resultData
  }

  /**
   * 创建临时任务 web 端的
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async temporaryTaskCreation (params:any): Promise<any> {
    const result = await this.ctx.consulCurl(
      '/patrolengine-execute/api/v1/task/create',
      'patrolengine',
      'patrolengine-execute',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          appId: this.ctx.header.appid
        },
        data: params
      }
    )

    const resultData = result && result.data && this.ctx.helper.bufferToJson(result.data)
    console.log('realUrlrealUrlrealUrlrealUrlrealUrl', resultData)
    return resultData
  }

  /**
   * 删除xx
   * @param {object}
   * @return {string} - objec
   */
  @Transactional
  async delete ({ id }) {}

  @Transactional
  async sitePlanInspectionList (params:any,userId:any): Promise<any> {
    const {regionName, lookPowerList, showStatus, startTimeType} = params
    let patrolTaskIdArr = []
    const patrolTaskIds = await (this as any).query('PatrolTaskPerson', 'queryTaskPersonByUserId', [
      userId,
      lookPowerList || '0'
    ])
    if (patrolTaskIds && patrolTaskIds.length > 0) {
      patrolTaskIdArr = patrolTaskIds.map(ele => ele.patrolTaskId)
    }
    if (patrolTaskIds && patrolTaskIds.length <= 0) {
      const taskiList:any = {}

      taskiList.list = []
      taskiList.total = 0
      taskiList.untreatedNumber = 0
      return taskiList
    }
    const _params = Object.assign({}, params, { patrolTaskIds: patrolTaskIdArr, showStatus })
    const startChooseArr = []
    // song
    const data = await (this as any).query('Task', 'queryDataByTaskService', [ _params ])
    // 任务列表按照 status 1 2 0 排序
    if (data && data.list && data.list.length > 0) {
      console.log('app 的 list任务列表===============================', data.list)
      const regionList:any = {}
      regionList.list = []
      // 组装巡检区域名称字段
      for (const item of data.list) {
        const regionFullName = await this.serviceIpdms.treePath(item.dataValues.regionPath || '')
        item.dataValues.regionPathName = regionFullName
        if (regionName) {
          const bufferStr = new Buffer(regionName, 'base64')
          const baseStr = bufferStr.toString()
          if (baseStr && regionFullName.indexOf(baseStr) >= 0) {
            regionList.list.push(item)
          }
        }
        // “1” 1个月  “2”1周  “3”3天  “0”全部
        const startTimeZone = this.ctx.helper.getInervalHour(new Date(), item.dataValues.startTime)
        if (startTimeType && startTimeType !== '0') {

          console.log('startTimeTypestartTimeType', startTimeType)
          console.log('startTimeZonestartTimeZone', startTimeZone)
          switch (true) {
            case startTimeType.toString() === '3' && startTimeZone <= 72:

              startChooseArr.push(item)
              break
            case startTimeType.toString() === '2' && startTimeZone <= 168:
              startChooseArr.push(item)
              break
            case startTimeType.toString() === '1' && startTimeZone <= 720:
              startChooseArr.push(item)
              break
            default:
              console.log(1)
          }
        }
      }

      if (startTimeType && startTimeType !== '0' && regionName) {
        const intersection = startChooseArr.filter(item => regionList.has(item))
        data.list = intersection
        data.total = intersection.length
        return data
      }
      if (startTimeType && startTimeType !== '0') {
        data.list = startChooseArr
        data.total = startChooseArr.length
        return data
      }
      if (regionName) {
        regionList.total = regionList.list.length
        return regionList
      }
    }

    return data
  }

  @Transactional
  async toAssign (params:any = {}) {
    const { ctx } = this
    const realAppid = this.ctx.header.appid
    const bussiness = await this.serviceIBussiness.queryAllApp(undefined)
    this.ctx.header.appid = realAppid
    const SenceObj = {}
    if (bussiness && bussiness.length > 0) {
      bussiness.forEach(element => {
        SenceObj[`${element.identify}`] = element.bussinessName
      })
    }
    // const { patrolNum, planId, startTime, taskType } = params
    const { patrolTaskId, taskExecuterList } = params

    if (!taskExecuterList || !patrolTaskId) {
      throw new Error(this.ctx.__('task.paramsLosePersonIdTaskId'))
    }
    const data = {
      adjustUserId: taskExecuterList,
      taskId: patrolTaskId
    }
    // const result = await this.app.curl('http://10.15.66.12:8082/patrolengine/api/v1/task/accept', {
    const result = await this.ctx.consulCurl(
      '/patrolengine-execute/api/v1/task/adjust',
      'patrolengine',
      'patrolengine-execute',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          appId: realAppid
        },
        data
      }
    )

    const resultData = result && result.data && this.ctx.helper.bufferToJson(result.data)
    this.ctx.hikLogger.info('调用任务移交接口完成')
    if (resultData && resultData.code !== '0') {
      throw new Error(resultData.msg)
    }
    // this.app.logger.log('解析后响应内容：')
    this.ctx.hikLogger.info(resultData)

    if (resultData) {
      // 首先删除所有的 taskid 相关的代办
      const delePar:any = {}
      delePar.taskId = patrolTaskId
      // delePar.userId = userId
      await this.serviceIpdms.agencyDelete(delePar)

      // 将执行人的任务代办删除然后将移交人的代办加上
      const taskCondition:any = {}
      taskCondition.patrolTaskId = patrolTaskId
      const PatrolTask = await (this as any).query('Task', 'findOneDataGetDetail', [ taskCondition ])
      const taskRes = PatrolTask && PatrolTask.dataValues
      const st = (this as any).app.dateFormatter(taskRes.startTime, 'yyyy/MM/dd hh:mm')
      // 结束时间
      const et = (this as any).app.dateFormatter(taskRes.endTime, 'yyyy/MM/dd hh:mm')
      const result = {
        a: this.ctx.__('task.doTimeSinceto',  st, et ),
        b: this.ctx.__('task.belongPlan',  taskRes.patrolPlanName ),
        c: this.ctx.__('task.taskNumber',  taskRes.patrolTaskName )
        // d: extendJson.now
      }
      this.ctx.hikLogger.info('任务', PatrolTask)
      const extendNoShow = {
        appId: realAppid,
        status: taskRes.status,
        msgStatus: 3,
        patrolTaskId
      }
      const message = {
        // taskid作为代办任务的主键ｉｄ
        msgId: patrolTaskId,
        userId: taskExecuterList.split(','),
        moduleId: taskRes.execType === 2 ? 'taskHandle' : 'taskHandleCommonWeb',
        comId: realAppid,
        msgStatus: '3', // 1 问题  2 请加代理 3 任务分发
        listType: 'todo',
        extendJson: JSON.stringify(result),
        msgTitle: `[${ctx.helper.getShowSenceName(realAppid)}]${this.ctx.__('task.taskRecive')}`,
        extendNoShow: JSON.stringify(extendNoShow)
      }
      // 给执行人发代办
      this.ctx.hikLogger.info('messagebianbianabiann', message)
      await this.serviceItlnc.mq(message, (this as any).transaction)
    }
  }

  @Transactional
  async patrolObjListInRegionByTaskId (params:any): Promise<any> {
    const temp = []
    const { patrolTaskId,regionId} = params
    const responseData = await (this as any).query('Task', 'findOneDataByTaskService', [ params ])
    responseData.dataValues.regionPathName = await this.serviceIpdms.treePath(
      responseData.dataValues.regionPath,
      (this as any).transaction
    )
    // 取出该任务下所有的任务巡检项
    const taskItemsDataCondition = {
      where: { patrolTaskId },
      attributes: [ 'patrolObjRelId' ]
    }
    const taskItemsData = await (this as any).query('PatrolTaskItem', 'queryList', [ taskItemsDataCondition ])

    let patrolObjRelIds = []
    if (taskItemsData && taskItemsData.list.length > 0) {
      patrolObjRelIds = taskItemsData.list.map(ele => ele.patrolObjRelId)
    }
    const patrolObjRelDataCondition = {
      where: { patrolObjRelId: { [Op.or]: patrolObjRelIds } },
      attributes: [ 'patrolObjId', 'status' ]
    }

    const patrolObjDataIds = await (this as any).query('PatrolObjRel', 'findAndCountAllData', [
      patrolObjRelDataCondition
    ])
    // 维护一个 状态跟对象id 的关联关系
    let objStatusRelObjIdArr = []
    let patrolObjIds = []
    if (patrolObjDataIds && patrolObjDataIds.list && patrolObjDataIds.list.length > 0) {
      patrolObjIds = patrolObjDataIds.list.map(ele => ele.patrolObjId)
      objStatusRelObjIdArr = patrolObjDataIds.list.map(ele => {
        return {
          patrolObjId: ele.patrolObjId,
          status: ele.status
        }
      })
    }

    const patrolObjDataCondition = {
      where: { patrolObjId: { [Op.or]: patrolObjIds } },
      attributes: [ 'patrolObjName', 'patrolObjRegion', 'patrolObjId', 'objTypeId', 'modelDataId' ]
    }
    const patrolObjData = await (this as any).query('PatrolObj', 'findAndCountAllData', [
      patrolObjDataCondition
    ])
    if (patrolObjData && patrolObjData.list && patrolObjData.list.length > 0) {
      // responseData.dataValues.list = patrolObjData.list
      for (const i of patrolObjData.list) {
        const objtypeCondition = {
          where: {
            // isDelete: 0,
            objTypeId: i.dataValues && i.dataValues.objTypeId
          }
        }
        const ObjType = await (this as any).query('PatrolObjType', 'queryOneData', [ objtypeCondition ])
        i.dataValues.objTypeName = ObjType.objTypeName
        i.dataValues.regionPathName = await this.serviceIpdms.treePath(
          i.patrolObjRegion,
          (this as any).transaction
        )
        const objectStatus = objStatusRelObjIdArr.find(ite => ite.patrolObjId === i.dataValues.patrolObjId)
        i.dataValues.objectStatus = objectStatus.status
        if (
          temp &&
          temp.length > 0 &&
          temp.find(ele => ele.patrolObjRegion === i.dataValues.patrolObjRegion)
        ) {
          temp.find(ele => ele.patrolObjRegion === i.dataValues.patrolObjRegion).data.push(i)
        } else {
          const obj:any = {}
          obj.patrolObjRegion = i.dataValues.patrolObjRegion
          obj.objTypeName = ObjType.objTypeName
          obj.regionPathName = await this.serviceIpdms.treePath(
            i.dataValues.patrolObjRegion,
            (this as any).transaction
          )
          obj.data = []
          obj.data.push(i)
          temp.push(obj)
        }
      }
    }
    let tempArr = []
    let regionArr = []
    if (temp && temp.length > 0 && regionId) {
      const regionList = await this.serviceICommon.getRegionIdsFromFirstRegion(
        regionId,
        (this as any).transaction
      )
      let regionIds = []
      regionIds = regionList.map(ele => ele.region_id)
      regionArr = temp.filter(ele => {
        return regionIds.includes(ele.patrolObjRegion)
      })
      tempArr = regionArr
    } else {
      tempArr = temp
    }
    responseData.dataValues.list = tempArr

    return responseData
  }
  /**
   * 根据用户区域查询任务列表
   * @param {object} params
   * @return {string} - list
   */
  @Transactional
  async getlistByUserRegion (params:any): Promise<any> {
    const { ctx } = this
    let userId = this.ctx.getUserId() || 'admin'
    const { isSmartLine } = params
    // isByRegion 1,查询的是用户所具有权限操作权限的任务;不为1,查询的是用户具有区域权限的任务 wangwei58
    const patrolTaskIdArr = []
    const patrolTaskIdsByCopyPersonArr = []
    if (userId !== 'admin') {
    }
    const dedupeTaskIds = this.ctx.helper.dedupe(patrolTaskIdsByCopyPersonArr, patrolTaskIdArr)
    if (dedupeTaskIds && dedupeTaskIds.length <= 0) {
      const taskiList:any = {}
      taskiList.list = []
      taskiList.total = 0
      if (userId !== 'admin') {
        return taskiList
      }
    }

    let _params

    if (userId === 'admin') {
      _params = Object.assign({}, params, { patrolTaskIds: [] })
    } else {
      _params = Object.assign({}, params, { patrolTaskIds: dedupeTaskIds })
    }
    const data = await (this as any).query('Task', 'queryDataList', [ _params ])

    // 组装巡检区域名称字段
    for (const item of data.list) {
      if (isSmartLine) {
        const pa:any = {}
        pa.patrolTaskId = item.dataValues.patrolTaskId
        if (!item.dataValues.patrolTaskId) {
          throw new Error(this.ctx.__('task.checkTaskIdIsExit'))
        }
        const objList = await ctx.service.task.getObjListByTaskId(pa, (this as any).transaction)
        item.dataValues.objList = objList
      }
      if (item.dataValues.regionPath) {
        item.dataValues.regionPathName = await this.serviceIpdms.treePath(
          item.dataValues.regionPath || '',
          (this as any).transaction
        )
      }
      item.dataValues.problemNum =
        (await ctx.service.task.getAllQuestionsNumByTaskId(
          item.dataValues.patrolTaskId || '',
          (this as any).transaction
        )) || 0
    }
    return data
  }
  /**
   * 查询
   * @param {object} params
   * @return {string} - list
   */
  @Transactional
  async getlist (params:any): Promise<any> {
    const { ctx } = this
    const {isSmartLine, isByRegion = 1, lookPowerList, showExecTypes} = params
    let userId = this.ctx.getUserId() || 'admin'
    if (isByRegion !== 1) {
      userId = 'admin'
    }
    let patrolTaskIdArr = []
    let patrolTaskIdsByCopyPersonArr = []
    if (userId !== 'admin') {
      if (isByRegion === 1) {
        // lookPowerList 是 任务列表的能力， 巡检 0 复核 1 整改 2 审核3
        const patrolTaskIds = await (this as any).query('PatrolTaskPerson', 'queryTaskPersonByUserId', [
          userId,
          lookPowerList || '0'
        ])
        if (patrolTaskIds && patrolTaskIds.length > 0) {
          patrolTaskIdArr = patrolTaskIds.map(ele => ele.patrolTaskId)
        }
        const patrolTaskIdsByCopyPerson = await (this as any).query(
          'PatrolTaskPerson',
          'getPatrolTaskIdsByCopyPerson',
          [ userId ]
        )
        if (patrolTaskIdsByCopyPerson && patrolTaskIdsByCopyPerson.length > 0) {
          patrolTaskIdsByCopyPersonArr = patrolTaskIdsByCopyPerson.map(ele => ele.patrolTaskId)
        }
      } else {
        // 获取用户具有的权限
        const regionListRes = await this.serviceIpdms.getRegionByUserName({ userId })
        const regionList = regionListRes.list
        let regionIdList = null
        if (regionList && regionList.length > 0) {
          regionIdList = regionList
            .filter(v => v.regionStatus === 1)
            .map(ele => ele.regionIndexCode)
        }
        // 通过region获取符合的任务id
        if (regionIdList && regionIdList.length > 0) {
          // song
          const taskRes = await (this as any).query('Task', 'queryAllData', [
            {
              where: { regionId: { [Op.in]: regionIdList } },
              attributes: [ 'patrolTaskId' ]
            }
          ])
          const taskResList = taskRes.list
          if (taskResList && taskResList.length > 0) {
            patrolTaskIdArr = taskResList.map(ele => ele.patrolTaskId)
          }
        }
      }
    }

    let dedupeTaskIds = null
    // if (isByRegion === 1) {
    // 展示抄送给他的任务
    // 1 通过exec 表的 copy 2 通过exec找到对应的taskid
    // 去重 taskids 抄送人的 和 属于user的task
    dedupeTaskIds = this.ctx.helper.dedupe(patrolTaskIdsByCopyPersonArr, patrolTaskIdArr)
    if (dedupeTaskIds && dedupeTaskIds.length <= 0) {
      const taskiList:any = {}
      taskiList.list = []
      taskiList.total = 0
      if (userId !== 'admin') {
        return taskiList
      }
    }
    let _params
    if (userId === 'admin') {
      _params = Object.assign({}, params, { patrolTaskIds: [] })
    } else {
      _params = Object.assign({}, params, { patrolTaskIds: dedupeTaskIds })
    }
    if (showExecTypes) {
      const showExcuTypesArr = showExecTypes.split(',')
      _params.showExecTypes = showExcuTypesArr
    }
    // song
    const data = await (this as any).query('Task', 'queryDataList', [ _params ])
    // 组装巡检区域名称字段
    for (const item of data.list) {
      if (isSmartLine) {
        const pa:any = {}
        pa.patrolTaskId = item.dataValues.patrolTaskId
        if (!item.dataValues.patrolTaskId) {
          throw new Error(this.ctx.__('task.checkTaskIdIsExit'))
        }
        const objList = await ctx.service.task.getObjListByTaskId(pa, (this as any).transaction)
        item.dataValues.objList = objList
      }
      if (item.dataValues.regionPath) {
        item.dataValues.regionPathName = await this.serviceIpdms.treePath(
          item.dataValues.regionPath || '',
          (this as any).transaction
        )
      }
      item.dataValues.problemNum =
        (await ctx.service.task.getAllQuestionsNumByTaskId(
          item.dataValues.patrolTaskId || '',
          (this as any).transaction
        )) || 0
      if (userId === 'admin') {
        item.dataValues.isDeal = 1
        item.dataValues.isView = 1
      } else {
        if (patrolTaskIdArr.includes(item.dataValues.patrolTaskId)) {
          item.dataValues.isDeal = 1
        } else item.dataValues.isDeal = 0
        if (patrolTaskIdsByCopyPersonArr.includes(item.dataValues.patrolTaskId)) {
          item.dataValues.isView = 1
        } else item.dataValues.isView = 0
      }
    }
    return data
  }
  async getNormalNumByTaskId (taskId:any,type:any = 0): Promise<any> {
    // type 0 正常数, 1 异常数
    const _params = {
      where: {
        taskId,
        isIntoNextStep: type
      },
      attributes: [ 'pointResultId' ]
    }
    const data = await (this as any).query('TaskExecSchema', 'queryManyAll', [ _params ])
    if (data) return data.length
  }
  /**
   * 查询
   * @param {object} params
   * @return {string} - list
   */
  @Transactional
  async getAllQuestionsNumByTaskId (taskId) {
    const _params = {
      where: { taskId },
      attributes: [ 'pointResultId' ]
    }
    const data = await (this as any).query('TaskExecSchema', 'queryManyAll', [ _params ])
    if (data.length === 0) {
      return 0
    }
    const pointResultIds = data && data.length > 0 && data.map(ele => ele.pointResultId)

    const countCondition = {
      where: {
        relativeId: { [Op.or]: pointResultIds },
        status: { [Op.ne]: '9' },
        isDelete: 0
      }
    }
    return await (this as any).query('TransactionFlow', 'queryCount', [ countCondition ])
  }

  /**
   * 查询
   * @param {object} params
   * @return {string} - list
   */
  @Transactional
  async getAllList (params:any): Promise<any> {
    const data = await (this as any).query('Task', 'queryAllDataList', [ params ])
    return data
  }

  /**
   * 查询任务里面对象详情
   * @param {object} params
   * @return {string} - list
   */
  @Transactional
  async getTaskObjDetail (params:any): Promise<any> {
    const { patrolTaskId, patrolObjId } = params
    // console.log(params)
    if (!patrolTaskId || !patrolObjId) {
      const error:any = new Error(this.ctx.__('task.paramsLose'))
      error.status = 425
      throw error
    }

    const _this:any = this

    function taskDetail () {
      return _this.query('Task', 'findOneDataByTaskDetail', [ params ])
    }

    function taskPoint () {
      return _this.query('PatrolObjRel', 'findOneDataByTask', [ params ])
    }
    const [ taskDetailData, taskPointData ] = await Promise.all([ taskDetail(), taskPoint() ])
    const result = {
      taskDetailData,
      taskPointData
    }
    return result
  }
  // 获取任务头部信息

  @Transactional
  async getTaskInfoByTaskId (params:any): Promise<any> {
    console.log('巡检任务id不存在', params)
    if (!params.patrolTaskId) {
      throw new Error(this.ctx.__('task.lookTaskIdNotExit'))
    }
    const responseData = await (this as any).query('Task', 'findOneDataGetTaskInfo', [ params ])
    if (!responseData) {
      throw new Error(this.ctx.__('task.lookTaskNotExit'))
    }
    responseData.dataValues.regionPathName = await this.serviceIpdms.treePath(
      responseData.dataValues.regionPath,
      (this as any).transaction
    )
    const pointResultData = await (this as any).query('PatrolTaskPoint', 'getResolveInfoByTaskId', [ params ])
    responseData.dataValues.pointResultData = pointResultData
    responseData.dataValues.resolveInfo = []

    return responseData
  }
  @Transactional
  // 获取任务下巡检项列表
  async getTaskPatrolItemListByTaskId (params:any): Promise<any> {
    const responseData = await (this as any).query('PatrolTaskItem', 'queryDataByTaskService', [ params ])
    return responseData
  }

  /**
   * 任务详情接口
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async getDetailByTaskId (params:any): Promise<any> {
    const { ctx } = this
    const { patrolTaskId } = params
    if (!patrolTaskId) {
      throw Error(this.ctx.__('task.patrolTaskIdNotExit'))
    }
    let responseData:any = {}
    responseData = await (this as any).query('Task', 'findOneDataGetDetail', [ params ])
    console.log('findOneDataGetDetailfindOneDataGetDetail', responseData)
    // 追加区域名称字段
    responseData.dataValues.regionPathName = await this.serviceIpdms.treePath(
      responseData.dataValues.regionPath,
      (this as any).transaction
    )
    responseData.dataValues.normalReusltNum =
      (await ctx.service.task.getNormalNumByTaskId(patrolTaskId || '', 0, (this as any).transaction)) || 0

    responseData.dataValues.problemNum =
      (await ctx.service.task.getNormalNumByTaskId(patrolTaskId || '', 1, (this as any).transaction)) || 0
    return responseData
  }

  @Transactional
  async getObjlistHavePonitByTaskId (params:any): Promise<any> {
    const { patrolTaskId } = params
    if (!patrolTaskId) {
      throw Error(this.ctx.__('task.patrolTaskIdNotExit'))
    }
    let responseData = {}
    responseData = await (this as any).query('PatrolObjRel', 'getObjlistHavePonitByTaskId', [ params ])
    return responseData
  }

  @Transactional
  async getTaskItemsByTaskIdByBs (params:any): Promise<any> {
    const {
      patrolTaskId,
      patrolObjId,
      status
    } = params
    if (!patrolTaskId) {
      throw Error(this.ctx.__('task.patrolTaskIdNotExit'))
    }
    let responseData:any = {}
    responseData = await (this as any).query('PatrolTaskItem', 'getTaskItemsByTaskId', [ params ])
    const statusPartrolItemsList = []
    // const taskexecType = responseData.dataValues.execType
    for (const item of responseData.list) {
      // 打卡记录信息
      if (item.patrolObj &&
        item.patrolObj.partrolObjItem &&
        item.patrolObj.partrolObjItem.punchList &&
        item.patrolObj.partrolObjItem.punchList.length > 0
      ) {
        const _punchList = item.patrolObj.partrolObjItem.punchList
        const _userIds = this.ctx.helper.dedupe(_punchList.map(item => item.punchUserId))
        const personList = await this.serviceIpdms.getUserInfoList(_userIds, (this as any).transaction) || []
        for (const v of _punchList) {
          v.dataValues.personName = personList.find(n => n.userId === v.dataValues.punchUserId).personName || ''
          v.dataValues.punchTime = moment(v.dataValues.punchTime).format('YYYY-MM-DD HH:mm:ss')
        }
      }
      // 12.31 改 巡检结论有多条巡检流程记录
      const excelist = item.taskExecList
      const flowStatus =
        excelist &&
        excelist.taskFlowStatus &&
        excelist.taskFlowStatus.length > 0 &&
        excelist.taskFlowStatus[0] &&
        excelist.taskFlowStatus[0].status
      item.dataValues.recResult = excelist && excelist.recResult
      const itemObjId =
        item &&
        item.patrolObj &&
        item.patrolObj.partrolObjItem &&
        item.patrolObj.partrolObjItem.dataValues &&
        item.patrolObj.partrolObjItem.dataValues.patrolObjId
      item.dataValues.flowStatus = flowStatus
      if (item.patrolResult) {
        const patrolResultParams = { orId: item.patrolResult }
        const patrolResult = await this.ctx.service.objTypeResult.queryOne(
          patrolResultParams,
          (this as any).transaction
        )
        item.dataValues.patrolResult = patrolResult.orName
        item.dataValues.patrolResultTriggerNext = patrolResult.triggerNext
      }

      // item.dataValues.patrolResult = patrolResult
      if ((patrolObjId && itemObjId === patrolObjId) || !patrolObjId) {
        const regionPath =
          item &&
          item.patrolObj &&
          item.patrolObj.partrolObjItem &&
          item.patrolObj.partrolObjItem.dataValues.regionPath
        item.dataValues.regionPathName =
          regionPath && (await this.serviceIpdms.treePath(regionPath, (this as any).transaction))
        item.dataValues.patrolItemPath = await this.serviceICommon.partrolItemsPath(
          item.dataValues.path,
          (this as any).transaction
        )

        // 变电站的情况下 筛选巡检项状态  由于 一个巡检项只有一个结论因此
        // 未巡检 有两种 一有巡检结论且不进流程引擎，二巡检结论但是流程引擎

        // taskitem 的状态
        const execStatus = (item && item.dataValues && item.dataValues.status) || 0
        console.log('============execStatus', execStatus)
        console.log('============statusstatusstatus', status)
        console.log('============flowStatus', flowStatus)
        console.log('============itemitemitem', item)
        if (status && status === '99' && !execStatus && !flowStatus) {
          statusPartrolItemsList.push(item)
        } else if (status && flowStatus === status) {
          statusPartrolItemsList.push(item)
        } else if (status && status === '999') {
          statusPartrolItemsList.push(item)
        } else if (
          status &&
          status === '8' &&
          (([ 2, 3 ].includes(execStatus) && !flowStatus) || flowStatus === '8' || flowStatus === '9')
        ) {
          // [2, 3].includes(execStatus)   的意思是 taskitem 的状态是2 3 的情况
          // 已完成和不是问题都是 已完成  陈牧要求
          statusPartrolItemsList.push(item)
        }
      }
    }

    if (status) {
      responseData.list = statusPartrolItemsList
      responseData.total = statusPartrolItemsList.length
    }
    return responseData
  }
  /**
   * 更新
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async update (params = {}) {}
  /**
   * 任务关联检测点列表接口
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async getPointerListByTaskId (params:any): Promise<any> {
    // 调用patrolTaskPoint的model中的queryData方法，基于findAndCountAll查询分页数据
    const data = await (this as any).query('PatrolTaskPoint', 'queryDataByTaskGetPointerListByTaskId', [
      params
    ])
    // 每一项图片url都要通过asw服务获取真实url地址后需要改成调用寻址后的接口
    for (const item of data.list) {
      try {
        const picIds = item.picStr ? item.picStr.split(',') : null
        if (picIds && picIds[0]) {
          const picData = await this.serviceICommon.getPatrolPic(picIds[0])
          if (picData && picData[0] && picData[0].picUrl) {
            const data = await this.serviceICommon.getImageUrlForBS(
              picData[0].picUrl,
              (this as any).transaction
            )
            item.picUrl = data
          } else item.picUrl = null
        } else item.picUrl = null
        // console.log('itemitemitemitem=====', item)
        if (item.patrolResult) {
          const ObjTypeRes = {
            where: { orId: item.patrolResult },
            attributes: [ 'orName', 'triggerNext' ]
          }
          const res = await (this as any).query('ObjTypeResult', 'findOneData', [ ObjTypeRes ])
          item.patrolResult = res
        }
      } catch (error) {
        console.error(error)
      }
    }
    return data
  }
  /**
   * 任务关联一级巡检项列表接口
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async getFirstLevelItemListByTaskId (params:any): Promise<any> {
    const { patrolTaskId, pageNo, pageSize } = params
    if (!patrolTaskId) {
      const error:any = new Error(this.ctx.__('task.taskIdMustGive'))
      error.status = 425
      throw error
    }
    // 编写查询条件
    const condition:any = {
      where: {
        patrolTaskId,
        item_parent_id: 'root'
      },
      attributes: [
        [ 'patrol_item_id', 'patrolItemId' ],
        [ 'item_name', 'patrolItemName' ]
      ],
      raw: true
    }
    // 如果传了分页参数，那么分页返回
    if (pageNo && pageSize) {
      condition.limit = pageSize * 1
      condition.offset = (pageNo - 1) * pageSize
    }
    // 调用patrolTaskPoint的model中的queryList方法，基于findAndCountAll查询分页数据
    const data = await (this as any).query('PatrolTaskItem', 'queryList', [ condition ])
    return data
  }

  /**
   * 任务抓图处理数量查询接口
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async getResolveInfoByTaskId (params:any): Promise<any> {
    const { patrolTaskId } = params
    if (!patrolTaskId) {
      const error:any = new Error(this.ctx.__('task.taskIdMustGive'))
      error.status = 425
      throw error
    }
    // 编写查询条件
    const condition = {
      where: { patrolTaskId },
      attributes: [ 'status' ],
      group: [ 'status' ],
      raw: true
    }
    // 调用patrolTaskPoint的model中的queryData方法，基于findAndCountAll查询分页数据
    const data = await (this as any).query('PatrolTaskPoint', 'queryCount', [ condition ])
    return data
  }

  /**
   * 任务巡检项处理数量查询接口
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async getResolveItemInfoByTaskId (params:any): Promise<any> {
    const { patrolTaskId } = params
    if (!patrolTaskId) {
      const error:any = new Error(this.ctx.__('task.taskIdMustGive'))
      error.status = 425
      throw error
    }
    // 编写查询条件
    const condition = {
      where: {
        patrolTaskId,
        isLeaf: 1
      },
      attributes: [ 'status' ],
      group: [ 'status' ],
      raw: true
    }
    // 调用patrolTaskPoint的model中的queryData方法，基于findAndCountAll查询分页数据
    const data = await (this as any).query('PatrolTaskItem', 'queryCount', [ condition ])
    return data
  }
  /**
   * 通过任务查计划的(提交人 是否可编辑巡检项的)
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async getProcess (params:any): Promise<any> {
    const { patrolTaskId } = params

    // 先获取 计划模板id
    const res = await (this as any).query('Task', 'findOneData', [
      {
        where: { patrolTaskId },
        attributes: [ 'psId' ]
      }
    ])
    // 获取process
    const precessRes = await (this as any).query('Process', 'queryDetail', [
      {
        where: {
          psId: res.psId,
          processType: 0
        },
        attributes: [ 'taskSubmitStrategy', 'taskPersonStrategy', 'taskResultEditable' ]
      }
    ])
    return precessRes
  }
  /**
   * 检测点详情接口
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async getPointDetail (params:any): Promise<any> {
    const { ctx } = this
    const { patrolPointId } = params
    if (!patrolPointId) {
      const error:any = new Error(this.ctx.__('task.checkPointIdMustGive'))
      error.status = 425
      throw error
    }

    // 调用patrolTaskPoint的model中的queryData方法，基于findAndCountAll查询分页数据
    const data = await (this as any).query('PatrolTaskPoint', 'findOneDataByTask', [ params ])
    // 如果查询无结果，那么直接返回null
    if (!data) {
      return data
    }
    const taskResult = await this.ctx.service.taskExecResult.getExecResultByTaskPointId(patrolPointId, (this as any).transaction)
    let realUrl = []
    let picUrlsData = ''
    if (taskResult && taskResult.picUrls) {
      picUrlsData = taskResult.picUrls
    } else if (data && data.picUrl) {
      picUrlsData = data.picUrl
    }
    if (picUrlsData) {
      const picArr = picUrlsData.split(',')
      const len = picArr.length
      const realPicArr = []
      for (let i = 0; i < len; i++) {
        const urlInfo = await this.serviceICommon.getImageUrlForBS(picArr[i], (this as any).transaction)
        realPicArr.push({
          picId: urlInfo.picId,
          base64: urlInfo.picUrl
        })
      }
      realUrl = realPicArr
    } else {
      realUrl = []
    }
    data.realUrl = realUrl
    // 调用查询检测点处理情况信息的方法,组装到结果中
    const resolveInfo = await this.getResolveInfoByTaskId({ patrolTaskId: data.patrolTaskId })
    const finishPatrolPointNum = Number(
      resolveInfo.find(item => item.status === 2)
        ? resolveInfo.find(item => item.status === 2).count
        : 0
    )
    const unFinishPatrolPointNum = Number(
      resolveInfo.find(item => item.status === 0)
        ? resolveInfo.find(item => item.status === 0).count
        : 0
    )
    data.finishPatrolPointNum = finishPatrolPointNum
    data.patrolPointNum = finishPatrolPointNum + unFinishPatrolPointNum
    // 把检测点对应的巡检项结论列表数据一起返回
    const conclusionList = await this.serviceICommon.getPatrolResultByTaskItemId({ patrolTaskItemId: data.patrolTaskItemId })
    data.conclusionList = conclusionList.list
    // 查询当前任务的下一个环节是什么，一并在详情里返回
    const nextFlowInfo = await ctx.service.task.getDefaultExecPersonsByPatrolTaskItemId(
      { patrolTaskItemId: data.patrolTaskItemId },
      (this as any).transaction
    )
    data.nextFlowInfo = nextFlowInfo
    // 查询当前巡检项对应的巡检方法列表
    const mannerList = await this.serviceICommon.getItemMannerByTaskItemId({ taskItemId: data.patrolTaskItemId })
    data.mannerList = mannerList
    // 获取计划模板流程
    const processList = await ctx.service.process.getProcessAllInfo({ psId: data.psId })
    data.processList = processList
    return data
  }
  /**
   * 检测点巡检的详情(v1.1.0版本新增,用于对巡检结果的数据回显)
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async getPointPatrolDetail (params:any): Promise<any> {
    const { patrolPointId } = params
    if (!patrolPointId) {
      const error:any = new Error(this.ctx.__('task.checkPointIdMustGive'))
      error.status = 425
      throw error
    }
    const data = await (this as any).query('TaskExecSchema', 'queryPointPatrolDetail', [ params ])
    let realUrl = []
    if (data && data.length > 0) {
      if (data[0].picUrls) {
        const picArr = data[0].picUrls.split(',')
        const len = picArr.length
        const realPicArr = []
        for (let i = 0; i < len; i++) {
          const urlInfo = await this.serviceICommon.getImageUrlForBS(
            picArr[i],
            (this as any).transaction
          )
          realPicArr.push({
            picId: urlInfo.picId,
            base64: urlInfo.picUrl
          })
        }
        realUrl = realPicArr
      } else {
        realUrl = []
      }
    }
    const data1 = data.map(v => {
      return Object.assign({}, JSON.parse(JSON.stringify(v)), { realUrl })
    })
    return data1
  }

  /**
   * 巡检项详情接口
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async getItemDetail (params:any): Promise<any> {
    const { ctx } = this
    const { patrolTaskItemId, isManner = 0 } = params
    if (!patrolTaskItemId) {
      const error:any = new Error(ctx.__('task.taskLookIdMust'))
      error.status = 425
      throw error
    }
    const data:any = {}
    // 把巡检项的详情信息返回
    const itemDetail = await ctx.service.patrolTaskItem.getTaskItemDetailByIdForApp(
      { patrolTaskItemId },
      (this as any).transaction
    )
    // 根据patrolTaskItemId获取关联检测点的抓图
    const capturePicList = await this.ctx.service.patrolTaskItem.getCapturedPicByTaskItemId(
      patrolTaskItemId,
      '',
      (this as any).transaction
    )
    // 这里分条件判断，如果是picUrls有多张，那么要额外增加一个字段保存图片信息
    if (capturePicList && capturePicList.length > 0) {
      if (capturePicList.length === 1) {
        let picUrlsss = null
        if (itemDetail.picUrls) {
          picUrlsss = itemDetail.picUrls
        } else {
          const con = { where: { patrolTaskItemId } }
          const taskpointRes = await (this as any).query('PatrolTaskPoint', 'findOneData', [ con ])
          itemDetail.dataValues.taskpointRes = taskpointRes.dataValues.patrolTaskPointId
          let taskPicRes = null
          if (taskpointRes) {
          // 获取图片
            const picCon = { where: { taskPointId: taskpointRes.dataValues.patrolTaskPointId } }
            taskPicRes = await (this as any).query('PatrolPic', 'queryManyData', [ picCon ])
          }
          if (taskPicRes && taskPicRes[0]) {
            picUrlsss = taskPicRes[0].picUrl
          }
        }
        if (picUrlsss) {
          const urlInfo = await this.serviceICommon.getImageUrlForBS(
            picUrlsss,
            (this as any).transaction
          )
          itemDetail.dataValues.realUrl = urlInfo
          // if (urlInfo && urlInfo.picUrl && urlInfo.picUrl !== '') {
          itemDetail.dataValues.picInfoArr = [
            {
              picUrl: picUrlsss,
              realUrl: urlInfo
            }
          ]
        } else {
          itemDetail.dataValues.realUrl = null
          itemDetail.dataValues.picInfoArr = []
        }
      } else {
        const picInfoArr = capturePicList.map(item => {
          if (item.picId) {
            return {
              picUrl: item.picId,
              realUrl: item.picUrl
            }
          }
        })
        itemDetail.dataValues.picInfoArr = picInfoArr
      }
    }
    data.itemDetail = itemDetail
    // 把巡检项对应的巡检项结论列表数据一起返回
    const conclusionList = await this.serviceICommon.getPatrolResultByTaskItemId(
      { patrolTaskItemId },
      (this as any).transaction
    )
    data.conclusionList = conclusionList.list
    // 查询当前任务的下一个环节是什么，一并在详情里返回
    const _taskExecResult = await ctx.service.taskExecResult.getExecResultByTask(
      { patrolTaskItemId },
      (this as any).transaction
    )
    const _nextFlowInfo = _taskExecResult[0]
    if (_nextFlowInfo) {
      let processType = null
      if (_nextFlowInfo.status === '0') {
        processType = 1
      } else if (_nextFlowInfo.status === '3') {
        processType = 2
      } else if (_nextFlowInfo.status === '5') {
        processType = 3
      }
      data.nextFlowInfo = {
        processType,
        currentPerson: _nextFlowInfo.nextHandlePeople
      }
      if (_nextFlowInfo.nextHandlePeople) {
        const res = await this.serviceICommon.getUserInfoByUserIds(
          { userIds: _nextFlowInfo.nextHandlePeople },
          (this as any).transaction
        )
        data.nextFlowInfo.personList = res.list
      } else data.nextFlowInfo.personList = []
    } else {
      // 统一提交的时候，不能从任务结论表中查询下一步执行人
      const condition = {
        where: {
          patrolTaskId: itemDetail.dataValues.patrolTaskId,
          objectId: itemDetail.dataValues.patrolObjId
        }
      }
      const taskPersonRes = await (this as any).query('PatrolTaskPerson', 'queryManyAll', [ condition ])
      const _taskPersonRes = taskPersonRes.sort(compare('processType'))
      const index = _taskPersonRes.findIndex(item => item.processType === 0)
      const _nextIndex = index + 1
      const nextData = taskPersonRes[_nextIndex]
      if (nextData) {
        data.nextFlowInfo = {
          processType: nextData.processType,
          currentPerson: nextData.currentPerson
        }
        if (nextData.currentPerson) {
          const res = await this.serviceICommon.getUserInfoByUserIds(
            { userIds: nextData.currentPerson },
            (this as any).transaction
          )
          data.nextFlowInfo.personList = res.list
        } else data.nextFlowInfo.personList = []
      } else {
        data.nextFlowInfo = {
          processType: null,
          currentPerson: '',
          personList: []
        }
      }
    }
    if (isManner === 1 || isManner === '1') {
      const cond = { patrolTaskId: itemDetail.dataValues.patrolTaskId }
      const _patrolTaskItem = await await (this as any).query('PatrolTaskItem', 'getTaskItemsRelationMonitor', [ cond ])
      const _patrolTaskItemOne = await await (this as any).query('PatrolTaskItem', 'queryOne', [{ patrolTaskItemId }])
      let obj = null
      for (const v of _patrolTaskItem) {
        if (_patrolTaskItemOne.dataValues.path.indexOf(v.dataValues.path) > -1) {
          obj = v.dataValues
          break
        }
      }
      if (obj && obj.patrolTaskItemId) {
        const mannerList = await this.serviceICommon.getItemMannerByTaskItemId(
          { taskItemId: obj.patrolTaskItemId },
          (this as any).transaction
        )
        data.mannerList = mannerList
      }
    } else {
      // 查询当前巡检项对应的巡检方法列表
      const mannerList = await this.serviceICommon.getItemMannerByTaskItemId(
        { taskItemId: patrolTaskItemId },
        (this as any).transaction
      )
      data.mannerList = mannerList
    }
    const _psId =
      itemDetail.Task &&
      itemDetail.Task.planItems &&
      itemDetail.Task.planItems.planSchemaItem &&
      itemDetail.Task.planItems.planSchemaItem.psId
    if (_psId) {
      // 获取计划模板流程
      const processList = await ctx.service.process.getProcessAllInfo(
        { psId: _psId },
        (this as any).transaction
      )
      data.processList = processList
    }
    return data
  }
  /**
   * 获取检测点关联的巡检项的直接子级列表接口
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async getPointItemTree (params:any): Promise<any> {
    const { patrolPointId, patrolTaskId } = params
    if (!patrolPointId) {
      const error:any = new Error(this.ctx.__('task.checkPointIdMustGive'))
      error.status = 425
      throw error
    }
    // 调用patrolTaskPoint的model中的queryData方法，基于findAndCountAll查询分页数据
    const data = await (this as any).query('PatrolTaskPoint', 'findTree', [ params ])
    console.log('=================tree=============')
    console.log(data)
    // 查询出已经提交过的巡检选项，加上标识
    // const haha = []
    // haha.push(patrolPointId)
    const condition = {
      attributes: [ 'patrolTaskItemId' ],
      where: {
        taskId: patrolTaskId,
        taskPointId: { [Op.notIn]: [ patrolPointId ] }
      },
      raw: true
    }
    const submitedData = await (this as any).query('TaskExecSchema', 'queryManyAll', [ condition ])
    console.log('=========submitedData=========')
    console.log(submitedData)
    for (const item of data) {
      item.submitted = submitedData
        .map(submitItem => submitItem.patrolTaskItemId)
        .includes(item.patrolTaskItemId)
    }
    const patrolTaskItemIdArr = []
    const data1 = []
    data.map(v => {
      if (!patrolTaskItemIdArr.includes(v.patrolItemId)) {
        patrolTaskItemIdArr.push(v.patrolItemId)
        data1.push(v)
      }
    })
    return data1
  }

  /**
   * 查询当前任务巡检项的巡检环节默认处理人
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async getDefaultExecPersonIds (params:any): Promise<any> {
    let { patrolTaskId, patrolTaskItemId, patrolPointId } = params
    if (patrolTaskItemId) {
      const condition = {
        where: { patrolTaskItemId },
        raw: true
      }
      const data = await (this as any).query('PatrolTaskItem', 'findOneData', [ condition ])
      patrolTaskId = data && data.patrolTaskId
    } else if (patrolPointId) {
      const condition = {
        where: { patrolTaskPointId: patrolPointId },
        raw: true
      }
      const data = await (this as any).query('PatrolTaskPoint', 'findOneData', [ condition ])
      patrolTaskId = data && data.patrolTaskId
    } else if (patrolTaskId) {
      // 传了任务id直接用即可，无需操作
    } else {
      throw new Error(this.ctx.__('task.taskIdOrPointIdLeastOne'))
    }
    const personCondition = {
      where: {
        patrolTaskId,
        processType: 0
      },
      attributes: [
        [ 'process_type', 'processType' ],
        [ 'current_person', 'currentPerson' ]
      ],
      raw: true
    }
    const res = await (this as any).query('PatrolTaskPerson', 'queryDetail', [ personCondition ])
    return res.currentPerson
  }
  /**
   * 查询当前任务巡检项的巡检的下一个环节默认处理人
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async getDefaultExecPersonsByPatrolTaskItemId (params:any): Promise<any> {
    const { patrolTaskItemId } = params
    const condition = {
      where: { patrolTaskItemId },
      raw: true
    }
    const data = await (this as any).query('PatrolTaskItem', 'findOneData', [ condition ])
    const patrolTaskId = data && data.patrolTaskId
    const personCondition = {
      where: {
        patrolTaskId,
        processType: { [Op.ne]: 0 }
      },
      attributes: [
        [ 'process_type', 'processType' ],
        [ 'current_person', 'currentPerson' ]
      ],
      order: [[ 'process_type', 'ASC' ]],
      limit: 1,
      raw: true
    }

    // todo  bianbian======教育场景 taskperson表 相同任务id下不同的objectid 则会产生不同的处理人
    const flowAndPersonIds = await (this as any).query('PatrolTaskPerson', 'queryDetail', [ personCondition ])
    if (flowAndPersonIds && flowAndPersonIds.currentPerson) {
      const data = await this.serviceICommon.getUserInfoByUserIds(
        { userIds: flowAndPersonIds.currentPerson },
        (this as any).transaction
      )
      flowAndPersonIds.personList = data.list
    }
    return flowAndPersonIds
  }
  /**
   * 查询当前检测点对应任务巡检项的默认处理人
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async getDefaultExecPersonsByPatrolPointId (params:any): Promise<any> {
    const { ctx } = this
    const { patrolPointId } = params
    const condition = {
      where: { patrolTaskPointId: patrolPointId },
      raw: true
    }
    const data = await (this as any).query('PatrolTaskPoint', 'findOneData', [ condition ])
    const patrolTaskItemId = data && data.patrolTaskItemId
    return ctx.service.task.getDefaultExecPersonsByPatrolTaskItemId(
      { patrolTaskItemId },
      (this as any).transaction
    )
  }
  /**
   * 根据计划ID集合查询任务
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async queryAllDataByPlanIds (planIdsArr:any): Promise<any> {
    const result = await (this as any).query('Task', 'queryAllDataByPlanIds', [ planIdsArr ])
    return result
  }
  /**
   * 查询当前 问题的默认处理人
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async getDefaultExecPersonsBytransactionId (params:any): Promise<any> {
    const { transactionId } = params
    const condition = {
      where: {
        transactionId,
        isDelete: 0
      }
      // attributes: []
    }
    // 流程类型，0：巡检，1：复合，2：整改，3：审核
    // 状态 带复核 0  复核通过 1 复活不通过 2 待整改 3 整改通过 4 待审核 5  审核通过 6  审核不通过 7   问题关闭 8  不是问题 9
    const flowStatusShadowPerson = {
      0: 2,
      3: 3,
      5: 2
    }
    const response = await (this as any).query('TransactionFlow', 'findOneData', [ condition ])

    // 获取 releativeId
    const relativeId = response && response.relativeId
    // 状态 带复核 0  复核通过 1 复活不通过 2 待整改 3 整改通过 4 待审核 5  审核通过 6  审核不通过 7   问题关闭 8  不是问题 9
    const status = response && response.status
    if (!relativeId) {
      throw Error(this.ctx.__('task.relateIdNotExit'))
    }

    const execCondition = { where: { pointResultId: relativeId } }
    const TaskExec = await (this as any).query('TaskExecSchema', 'queryDetail', [ execCondition ])
    const patrolTaskItemId = TaskExec && TaskExec.patrolTaskItemId
    console.log('+++++++++++++++++++++++++++TaskExecTaskExecTaskExecTaskExecTaskExec', TaskExec)
    if (!patrolTaskItemId) {
      throw Error(this.ctx.__('task.noCorrespondingLook'))
    }

    const patrolTaskItemCondition = { where: { patrolTaskItemId } }
    const TaskItem = await (this as any).query('PatrolTaskItem', 'findOneData', [ patrolTaskItemCondition ])
    const patrolItemId = TaskItem && TaskItem.patrolItemId
    console.log('+++++++++++++++++++++++++++TaskItemTaskItemTaskItemTaskItem', TaskItem)
    if (!patrolItemId) {
      throw Error(this.ctx.__('task.noCorrespondingLook'))
    }
    const patrolTaskId = TaskItem && TaskItem.patrolTaskId

    const personCondition = {
      where: {
        processType: flowStatusShadowPerson[status],
        patrolTaskId
      },
      attributes: [ 'currentPerson' ]
    }
    // todo  bianbian======教育场景 taskperson表 相同任务id下不同的objectid 则会产生不同的处理人
    const PatrolTaskPersonIds = await (this as any).query('PatrolTaskPerson', 'queryDetail', [
      personCondition
    ])
    if (PatrolTaskPersonIds && PatrolTaskPersonIds.currentPerson) {
      return await this.serviceICommon.getUserInfoByUserIds(
        { userIds: PatrolTaskPersonIds.currentPerson },
        (this as any).transaction
      )
    }
    return PatrolTaskPersonIds
  }
}
