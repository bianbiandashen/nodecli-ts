'use strict'
import {  Context, inject, provide, Application} from 'midway';
import { 
  IMqService,
} from '../app/interface/mqInterface';
const { Transactional } = require('../app/core/transactionalDeco')
@provide('mqService')
export class MqService implements IMqService {
  @inject()
  ctx: Context;
  app: Application;

  @Transactional
  async questionHandleMq (params:any = {}): Promise<any> {
    const { ctx } = this
    const { appId, relativeId, status } = params

    const execCondition = { where: { pointResultId: relativeId } }
    const TaskExec = await (this as any).query('TaskExecSchema', 'queryDetail', [ execCondition ])
    const daibanPatrolResult = TaskExec.patrolResult
    let patrolResultJudgeOrDeny = ''
    if (daibanPatrolResult) {
      const obj = { where: { orId: daibanPatrolResult } }
      const orRes = await (this as any).query('ObjTypeResult', 'findOneData', [ obj ])
      if (orRes.triggerNext) {
        patrolResultJudgeOrDeny = 'deny'
        // if (!rectifyUsers) {
        //   throw Error('请指定下一步执行人')
        // }
      } else {
        patrolResultJudgeOrDeny = 'pass'
      }
    }
    const judge = params.judge || patrolResultJudgeOrDeny
    const info:any = {}
    info.remark = params.info.remark || TaskExec.resultDesc
    const execUsers = params.execUsers || TaskExec.nextHandlePeople
    const copyUsers = params.copyUsers || TaskExec.nextCopyPeople

    const problem = await this.ctx.service.transactionFlow.getTransactionOneResultProblem(
      relativeId,
      (this as any).transaction
    )
    const realAppid = this.ctx.header.appid
    const bussiness = await this.ctx.service.bussiness.queryAllApp()
    this.ctx.header.appid = realAppid
    const SenceObj = {}
    if (bussiness && bussiness.length > 0) {
      bussiness.forEach(element => {
        SenceObj[`${element.identify}`] = element.bussinessName
      })
    }
    const flowStatusShowLabel = {
      0: `[${ctx.helper.getShowSenceName(SenceObj, appId)}]${this.ctx.__('mq.questionsReview')}`,
      3: `[${ctx.helper.getShowSenceName(SenceObj, appId)}]${this.ctx.__('mq.questionChange')}`,
      5: `[${ctx.helper.getShowSenceName(SenceObj, appId)}]${this.ctx.__('mq.questionAudit')}`
    }
    const flowStatusNoShow = {
      0: '1',
      3: '2',
      5: '3'
    }
    const extendNoShow:any = {}
    extendNoShow.msgStatus = '1'
    // extendJson.flowLabel = flowStatusShadowPerson[transaction.status]
    extendNoShow.transationId = (problem && problem.transactionId) || '' // 主键
    extendNoShow.version = (problem && problem.version) || '' // 主键
    extendNoShow.relativeId = relativeId // 主键
    extendNoShow.judge = judge // 主键
    extendNoShow.appId = appId // 主键
    const msgTitle =
      (problem && problem.status && flowStatusShowLabel[problem.status]) ||
      `[${ctx.helper.getShowSenceName(SenceObj, appId)}]${this.ctx.__('mq.taskFinish')}` // 整改 审核  复核
    const flowStatus = problem && problem.status && flowStatusNoShow[problem.status]

    if (flowStatus) {
      extendNoShow.flowStatus = flowStatus
    }
    console.log('copyFor===================', copyUsers)

    if (copyUsers && copyUsers.split(',').length > 0) {
      const ccUserList = copyUsers.split(',')

      const extendJson:any = {}

      // extendJson.remark = info && info.remark // 备注
      const execCondition = { where: { pointResultId: relativeId } }
      const TaskExec = await (this as any).query('TaskExecSchema', 'queryDetail', [ execCondition ])

      const patrolTaskItemId = TaskExec && TaskExec.patrolTaskItemId
      extendNoShow.patrolTaskItemId = patrolTaskItemId // 主键
      console.log('+++++++++++++++++++++++++++TaskExecTaskExecTaskExecTaskExecTaskExec', TaskExec)
      if (!patrolTaskItemId) {
        throw Error(this.ctx.__('mq.noCorrespondingItems'))
      }
      const patrolTaskItemCondition = { where: { patrolTaskItemId } }
      const TaskItem = await (this as any).query('PatrolTaskItem', 'findOneData', [ patrolTaskItemCondition ])
      const patrolObjRelId = TaskItem && TaskItem.patrolObjRelId
      const patrolObjRelIdCondition = { where: { patrolObjRelId } }
      const PatrolObjRel = await (this as any).query('PatrolObjRel', 'findOneData', [
        patrolObjRelIdCondition
      ])
      // if (PatrolObjRel && PatrolObjRel.patrolObjId) {
      const objId = PatrolObjRel && PatrolObjRel.patrolObjId
      const patrolObjIdCondition = { where: { patrolObjId: objId } }
      const PatrolObj = await (this as any).query('PatrolObj', 'queryDataById', [ patrolObjIdCondition ])
      // extendJson.objName = PatrolObj.patrolObjName
      const objtypeCondition = {
        where: {
          // isDelete: 0,
          objTypeId: PatrolObj.objTypeId
        }
      }
      const ObjType = await (this as any).query('PatrolObjType', 'queryOneData', [ objtypeCondition ])
      extendNoShow.objTypeName = ObjType.objTypeName
      extendNoShow.regionPathName = await ctx.service.pdms.treePath(
        PatrolObj.regionPath || '',
        (this as any).transaction
      )

      // if 社区 场景 sip 的
      // 巡检项: xxx  巡检对象: xxx  巡检对象类型: xxx
      //  变电站
      if (appId === 'hpp' || appId === 'eris') {
        extendJson.itemFullPath =
          this.ctx.__('mq.inspectionItems') +
          (await ctx.service.common.partrolItemsPath(TaskItem.dataValues.path, (this as any).transaction)) // 巡检项全路径
        extendJson.objName = this.ctx.__('mq.inspectionObj') + PatrolObj.patrolObjName
        extendJson.objTypeName = this.ctx.__('mq.inspectionObjType') + ObjType.objTypeName
      } else if (appId === 'sip' || appId === 'pes') {
        extendJson.remark = info && info.remark
        extendJson.itemFullPath =
        this.ctx.__('mq.inspectionPlace') +
          (await ctx.service.common.partrolItemsPath(TaskItem.dataValues.path, (this as any).transaction))
      } else {
        extendJson.itemFullPath =
        this.ctx.__('mq.inspectionItems') +
        (await ctx.service.common.partrolItemsPath(TaskItem.dataValues.path, (this as any).transaction)) // 巡检项全路径
        extendJson.objName = this.ctx.__('mq.inspectionObj') + PatrolObj.patrolObjName
        extendJson.objTypeName = this.ctx.__('mq.inspectionObjType') + ObjType.objTypeName
      }

      // 整改 审核  复核
      // if(resultDesc){
      //   extendJson.resultDesc =  resultDesc
      // }
      // if(recResult){
      //   extendJson.recResult =  recResult
      // }

      // 适配代理人
      let personlist = []
      if (ccUserList && ccUserList.length > 0) {
        personlist = await this.ctx.service.agentPerson.getUserIdsBySubmiiters(
          ccUserList,
          (this as any).transaction
        )
      }
      const message = {
        // useid 即为抄送的userid
        userId: personlist,
        msgId: this.ctx.helper.uuidv1(),
        moduleId: 'questionHandle',
        comId: appId,
        msgTitle: msgTitle + this.ctx.__('mq.copyFor'),
        msgStatus: '1', // 1 问题  2 请加代理 3 任务分发
        extendJson: JSON.stringify(extendJson),
        extendNoShow: JSON.stringify(extendNoShow),
        listType: 'message'
      }
      // if (judge === 'deny' || (transaction && transaction.status === '5')) {
      await this.ctx.service.tlnc.mq(message, (this as any).transaction)
      // }
    }
    if (execUsers && execUsers.split(',').length > 0) {
      const execUserList = execUsers.split(',')

      const extendJson:any = {}
      // extendJson.transationId = transaction.transactionId // 主键
      // extendJson.remark = info && info.remark // 备注
      const execCondition = { where: { pointResultId: relativeId } }

      const TaskExec = await (this as any).query('TaskExecSchema', 'queryDetail', [ execCondition ])
      const patrolTaskItemId = TaskExec && TaskExec.patrolTaskItemId

      extendNoShow.patrolTaskItemId = patrolTaskItemId // 主键
      console.log('+++++++++++++++++++++++++++TaskExecTaskExecTaskExecTaskExecTaskExec', TaskExec)
      if (!patrolTaskItemId) {
        throw Error(this.ctx.__('mq.noCorrespondingItems'))
      }
      const patrolTaskItemCondition = { where: { patrolTaskItemId } }

      const TaskItem = await (this as any).query('PatrolTaskItem', 'findOneData', [ patrolTaskItemCondition ])

      const patrolObjRelId = TaskItem && TaskItem.patrolObjRelId
      const patrolObjRelIdCondition = { where: { patrolObjRelId } }

      const PatrolObjRel = await (this as any).query('PatrolObjRel', 'findOneData', [
        patrolObjRelIdCondition
      ])

      // if (PatrolObjRel && PatrolObjRel.patrolObjId) {
      const objId = PatrolObjRel && PatrolObjRel.patrolObjId

      const patrolObjIdCondition = { where: { patrolObjId: objId } }
      const PatrolObj = await (this as any).query('PatrolObj', 'queryDataById', [ patrolObjIdCondition ])

      // extendJson.objName = PatrolObj.patrolObjName
      const objtypeCondition = {
        where: {
          // isDelete: 0,
          objTypeId: PatrolObj.objTypeId
        }
      }
      const ObjType = await (this as any).query('PatrolObjType', 'queryOneData', [ objtypeCondition ])

      extendNoShow.objTypeName = ObjType.objTypeName
      extendNoShow.regionPathName = await ctx.service.pdms.treePath(
        PatrolObj.regionPath || '',
        (this as any).transaction
      )
      // extendJson.itemFullPath = await ctx.service.common.partrolItemsPath(TaskItem.dataValues.path, (this as any).transaction) // 巡检项全路径

      if (appId === 'hpp' || appId === 'eris') {
        extendJson.itemFullPath =
        this.ctx.__('mq.inspectionItems') +
          (await ctx.service.common.partrolItemsPath(TaskItem.dataValues.path, (this as any).transaction)) // 巡检项全路径
        extendJson.objName = this.ctx.__('mq.inspectionObj') + PatrolObj.patrolObjName
        extendJson.objTypeName = this.ctx.__('mq.inspectionObjType') + ObjType.objTypeName
      } else if (appId === 'sip' || appId === 'pes') {
        extendJson.remark = info && info.remark
        extendJson.itemFullPath =
        this.ctx.__('mq.inspectionPlace') +
          (await ctx.service.common.partrolItemsPath(TaskItem.dataValues.path, (this as any).transaction))
      } else {
        extendJson.itemFullPath =
        this.ctx.__('mq.inspectionItems') +
          (await ctx.service.common.partrolItemsPath(TaskItem.dataValues.path, (this as any).transaction)) // 巡检项全路径
        extendJson.objName = this.ctx.__('mq.inspectionObj') + PatrolObj.patrolObjName
        extendJson.objTypeName = this.ctx.__('mq.inspectionObjType') + ObjType.objTypeName
      }
      // if(resultDesc){
      //   extendJson.resultDesc =  resultDesc
      // }
      // if(recResult){
      //   extendJson.recResult =  recResult
      // }
      let execPerson = []
      if (execUserList && execUserList.length > 0) {
        execPerson = await this.ctx.service.agentPerson.getUserIdsBySubmiiters(
          execUserList,
          (this as any).transaction
        )
      }
      const message = {
        msgId: (problem && problem.transactionId) || this.ctx.helper.uuidv1(),
        // useid 即为抄送的userid
        msgTitle,
        userId: execPerson,
        moduleId: 'questionHandle',
        comId: appId,
        msgStatus: '1', // 1 问题  2 请加代理 3 任务分发
        extendJson: JSON.stringify(extendJson),
        extendNoShow: JSON.stringify(extendNoShow),
        listType: 'todo'
      }

      // 1 judge === 'pass' 且 问题状态改为为整改 即经历了复核
      // 2 judge === 'deny' 且 存在问题流程
      // 3 judge === 'deny' 且 status === "0"  复核 且 判断deny 没问题 则不需要发待办
      console.log('发送的信息前准备 =================', message)
      if (status === '0' && judge === 'deny') {
        return true

      } else if ((judge === 'deny' && problem) || (judge === 'pass' && problem && problem.status === '3') || (problem && problem.status === '5')) {
        console.log('具体发送的信息 执行待办=======', message)
        await this.ctx.service.tlnc.mq(message, (this as any).transaction)
      }
    }
  }

  /*
   * @Author: jiangyan6
   * @Date: 2020-03-16 16:02:27
   * @Desc: bs端的待办的生成
   * @param:
   * @return:
   */
  @Transactional
  async createTodo (resultDetail, totalItemMap, transaction): Promise<any> {
    const { ctx } = this
    console.log('============准备待办内容=========')
    console.log(resultDetail)
    console.log(totalItemMap)
    console.log(transaction)
    // 每个状态下展示的名称先定义好
    const flowStatusShowLabel = {
      0: this.ctx.__('mq.reviewQuestions'),
      3: this.ctx.__('mq.rectification'),
      5: this.ctx.__('mq.auditIssues'),
      8: this.ctx.__('mq.endProblemHandling'),
      9: this.ctx.__('mq.abnormality')
    }
    // 拼接消息标题
    const msgTitle = `${flowStatusShowLabel[transaction.status]}` // 整改 审核  复核
    // 读取消息发送目标用户id
    const execUserList = transaction.nextHandlePeople.split(',')
    // 获取消息代办展示字段的配置信息
    const taskManageConfigParams = {
      appId: ctx.header.appid,
      page: 'TaskManage'
    }
    const taskManageConfig = await this.ctx.service.sceneData.getOnePageConfig(
      taskManageConfigParams,
      (this as any).transaction
    )
    const tlncConfig = taskManageConfig.tlnc
    // 拼接消息中需要展示的信息，交互上不统一，这边梳理一下，统一为：巡检对象名称+巡检项名称+处理结论
    let messageContent = ''
    messageContent += `${totalItemMap.patrolObjName}，`
    if (tlncConfig && tlncConfig.showItem === 'cameraName') {
      // 图片巡查中展示监控点名称
      messageContent += this.ctx.__('mq.camera') + totalItemMap.cameraName
    } else {
      // 巡查考评中展示巡检项内容
      const pathArr = totalItemMap.itemContentList
      messageContent += this.ctx.__('mq.inspectionContent') + pathArr.join('/')
    }
    // messageContent += `。结论：${totalItemMap.patrolResultName}`
    // 组装消息中需要展示的信息
    const extendJson = { messageContent }
    // 准备消息中需要用到但不展示的字段
    const extendNoShow = {
      type: 'todo',
      status: transaction.status,
      // transationId: 'transationId',
      relativeId: resultDetail.pointResultId,
      appId: ctx.headers.appid
    }
    const message = {
      userId: execUserList, // useid 即为抄送的userid
      // 消息唯一ID，有流程id时，使用流程id，没有的话使用自己生成的唯一ID
      msgId: (transaction && transaction.transactionId) || this.ctx.helper.uuidv1(),
      msgStatus: transaction.status, // 消息状态，与tlnc资源包中定义相对应
      moduleId: `question_handle_${this.ctx.headers.appid}`, // 消息源模块标识,资源包中配置的模块id
      comId: this.ctx.headers.appid, // 组件标识
      msgTitle, // 消息标题,最大128个字符
      extendJson: JSON.stringify(extendJson), // 扩展字段Json，不为空则展示,由于app空间限制，只展示前三个字段
      extendNoShow: JSON.stringify(extendNoShow), // 不作展示的扩展字段，仅作为某些组件透传参数
      listType: 'todo' // 报文类型：message-消息，todo-待办
    }
    console.log('=======待办内容组装完成，准备发送待办=======', message)
    // const result = await this.ctx.service.tlnc.mq(message, (this as any).transaction)
  }

  /*
   * @Author: jiangyan6
   * @Date: 2020-03-16 16:02:27
   * @Desc: bs端的消息的生成
   * @param:
   * @return:
   */
  @Transactional
  async createMessage (resultDetail, totalItemMap, transaction): Promise<any> {
    const { ctx } = this
    console.log('============准备消息内容===========')
    console.log(resultDetail)
    console.log(totalItemMap)
    console.log(transaction)
    const flowStatusShowLabel = {
      0: this.ctx.__('mq.reviewQuestions'),
      3: this.ctx.__('mq.rectification'),
      5: this.ctx.__('mq.auditIssues'),
      8: this.ctx.__('mq.endProblemHandling'),
      9: this.ctx.__('mq.abnormality')
    }
    // 拼接消息标题
    const msgTitle = flowStatusShowLabel[transaction.status] + this.ctx.__('mq.copyFor') // 整改 审核  复核
    // 读取消息发送目标用户id
    const ccUserList = transaction.nextCopyPeople.split(',')
    // 获取消息代办展示字段的配置信息
    const taskManageConfigParams = {
      appId: ctx.header.appid,
      page: 'TaskManage'
    }
    const taskManageConfig = await this.ctx.service.sceneData.getOnePageConfig(
      taskManageConfigParams,
      (this as any).transaction
    )
    const tlncConfig = taskManageConfig.tlnc
    // 拼接消息中需要展示的信息，交互上不统一，这边梳理一下，统一为：巡检对象名称+巡检项名称+处理结论
    let messageContent = ''
    messageContent += `${totalItemMap.patrolObjName}，`
    if (tlncConfig && tlncConfig.showItem === 'cameraName') {
      // 图片巡查中展示监控点名称
      messageContent += this.ctx.__('mq.camera') + totalItemMap.cameraName
    } else {
      // 巡查考评中展示巡检项内容
      const pathArr = totalItemMap.itemContentList
      messageContent += this.ctx.__('mq.inspectionContent') + pathArr.join('/')
    }
    // messageContent += `。巡检结论：${totalItemMap.patrolResultName}`
    // 组装消息中需要展示的信息
    const extendJson = { messageContent }
    // 准备消息中需要用到但不展示的字段
    const extendNoShow = {
      // transationId: 'transationId',
      type: 'message',
      status: transaction.status,
      relativeId: resultDetail.pointResultId,
      appId: this.ctx.headers.appid
    }
    const message = {
      userId: ccUserList, // useid 即为抄送的userid
      msgId: this.ctx.helper.uuidv1(), // 消息唯一ID，可用数据库的主键：uuid
      moduleId: `question_handle_${this.ctx.headers.appid}`, // 消息源模块标识,资源包中配置的模块id
      comId: this.ctx.headers.appid, // 组件标识
      msgTitle, // 消息标题,最大128个字符
      extendJson: JSON.stringify(extendJson), // 扩展字段Json，不为空则展示,由于app空间限制，只展示前三个字段
      extendNoShow: JSON.stringify(extendNoShow), // 不作展示的扩展字段，仅作为某些组件透传参数
      listType: 'message' // 报文类型：message-消息，todo-待办
    }
    console.log('消息内容组装完成，准备发送消息', message)
    // const result = await this.ctx.service.tlnc.mq(message, (this as any).transaction)
  }

  @Transactional
  async agentHandle (params:any = {}): Promise<any> {
    const { ctx } = this
    const {
      endTime, startTime, agentUserId, userId
    } = params

    const message:any = {}
    message.msgDetail = this.ctx.__('mq.setYouAgent', userId, startTime, endTime)
    message.msgTitle = this.ctx.__('mq.leaveAgent')
    message.moduleId = 'transferAuthority'
    message.msgStatus = '1'
    // message.extendJson = JSON.stringify(extendJson),
    message.userId = [ agentUserId ]
    message.listType = 'message'
    const extendNoShow:any = {}
    extendNoShow.msgStatus = '2'
    message.extendNoShow = extendNoShow
    message.msgId = ctx.helper.uuidv1()
    // const result = await this.ctx.service.tlnc.mq(message, (this as any).transaction)
  }
  // 生成问题和问题状态改变去通知PDMS
  @Transactional
  async sendMQToPdms (params = {}): Promise<any> {
    // messageId:消息id(任务或问题的id)
    // messageType:消息类型(1:任务 2:问题)
    // schema:对应的应用
    // operateType:操作类型(1:新增 2:修改 3:删除)
    const destination = '/topic/patrolengine.topic.standarddata.change'
    const client = this.app.tlncClient
    this.ctx.hikLogger.info('生成问题和问题状态改变去通知PDMS')
    this.ctx.hikLogger.info('生成问题和问题状态改变去通知PDMS')
    this.ctx.hikLogger.info(params)
    this.ctx.hikLogger.info('冷冷的冰雨')
    this.ctx.hikLogger.info(client)
    this.ctx.hikLogger.info(this.app)
    const str = JSON.stringify(params)
    this.ctx.hikLogger.info(str)

    client.publish(destination, str)
  }
}