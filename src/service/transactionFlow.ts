import {  Context, inject, provide} from 'midway';
import { ITransactionFlowService } from '../app/interface/transactionFlowInterface';
const Sequelize = require('sequelize')
const { Op } = Sequelize
const { Transactional } = require('../app/core/transactionalDeco/index')

@provide('transactionFlowService')
export class TransactionFlowService implements ITransactionFlowService{
  @inject()
  ctx: Context;
  @Transactional
  async getQuestionlistByFirstItemId (parmas:any,userId:any): Promise<any> {
    const {
      patrolTaskItemId, // 一级任务巡检项id
      pageSize,
      pageNo,
      type,
      patrolObjId,
      isAccept,
      orderType,
      stopTImeType
    } = parmas
    if (![ '1', '2', '3' ].includes(type)) {
      throw Error(this.ctx.__('transactionFlow.inTypeNotBelong') + type)
    } else if (!userId) {
      throw Error(this.ctx.__('transactionFlow.userIdNotExit'))
    }
    let status = ''
    // 待复核状态
    if (type === '1') {
      status = '0'
    } else if (type === '2') {
      status = '3'
    } else if (type === '3') {
      status = '5'
    }

    let accept
    console.log('isAccept-0-------bianbian', parmas)
    if (typeof isAccept !== 'undefined') {
      console.log('isaccep', typeof isAccept)
      if (isAccept === '1') {
        console.log('isAcceptisAccept', isAccept)
        accept = -1
      } else if (isAccept === '2') {
        accept = 0
      }
    }
    const changePageNo = pageNo && pageNo - 1
    const stopTimeChooseArr = []
    if (!patrolTaskItemId) {
      throw Error(this.ctx.__('transactionFlow.noFindCorresponding'))
    }
    const questionList = await (this as any).query('PatrolTaskItem', 'getQuestionsByFirstItemId', [
      patrolTaskItemId,
      patrolObjId,
      status,
      orderType,
      pageSize,
      changePageNo,
      accept,
      userId
    ])

    console.log('questionListquestionList', questionList)
    for (const item of questionList) {
      console.log('itemitemitemitemitem', item)
      const execCondition:any = {}
      execCondition.where = { pointResultId: item.relativeId }
      const data = await (this as any).query('TaskExecSchema', 'queryDetail', [ execCondition ])
      const questionPatrolTaskItemId = data && data.patrolTaskItemId
      if (!patrolTaskItemId) {
        throw Error(this.ctx.__('transactionFlow.noFindCorresponding'))
      }
      const taskIteem:any = {}
      taskIteem.where = { patrolTaskItemId: questionPatrolTaskItemId }

      const PatrolTaskdata = await (this as any).query('PatrolTaskItem', 'findOneData', [ taskIteem ])
      const PatrolTaskdataItemPath = PatrolTaskdata && PatrolTaskdata.path
      // console.log('PatrolTaskdataItemPathPatrolTaskdataItemPathPatrolTaskdataItemPath', PatrolTaskdataItemPath)
      item.itemFullPath =
        PatrolTaskdataItemPath &&
        (await this.ctx.service.common.partrolItemsPath(PatrolTaskdataItemPath, (this as any).transaction))

      item.stopTime = this.ctx.helper.getInervalHour(item.createTime, new Date())
      item.patrolTaskItemId = questionPatrolTaskItemId

      if (item.isAccept === -1) {
        item.isAccept = '1'
      } else if (item.isAccept === 0) {
        item.isAccept = '2'
      } else {
        item.isAccept = '3'
      }

      console.log('questionList', questionList)
      //  description: '1 一周+2 1天以前 2 1天+ 3 12小时+ 4 4小时+ 5 2小时+ '
      if (stopTImeType && stopTImeType !== '0') {
        switch (true) {
          case stopTImeType === '5' && item.stopTime >= 2:
            stopTimeChooseArr.push(item)
            break
          case stopTImeType === '4' && item.stopTime >= 4:
            stopTimeChooseArr.push(item)
            break
          case stopTImeType === '3' && item.stopTime >= 12:
            stopTimeChooseArr.push(item)
            break
          case stopTImeType === '2' && item.stopTime >= 24:
            stopTimeChooseArr.push(item)
            break
          case stopTImeType === '1' && item.stopTime >= 168:
            stopTimeChooseArr.push(item)
            break
          default:
            console.log(1)
        }
      }
    }

    const res:any = {}
    if (stopTImeType && stopTImeType !== '0') {
      res.list = stopTimeChooseArr
      res.total = stopTimeChooseArr.length
    } else {
      res.list = questionList
      res.total = questionList.length
    }
    return res
  }

  /**
   * 找到这个人 某个objid 的问题
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async getlistByObjId (parmas:any,userId:any): Promise<any> {
    const {
      patrolObjId, pageSize, pageNo, type, isAccept, orderType, stopTImeType
    } = parmas
    if (![ '1', '2', '3' ].includes(type)) {
      throw Error(this.ctx.__('transactionFlow.inTypeNotBelong') + type)
    } else if (!userId) {
      throw Error(this.ctx.__('transactionFlow.userIdNotExit'))
    }
    let status = ''
    // 待复核状态
    if (type === '1') {
      status = '0'
    } else if (type === '2') {
      status = '3'
    } else if (type === '3') {
      status = '5'
    }
    let responseData:any = {}

    let accept
    console.log('isAccept-0-------bianbian', parmas)
    if (typeof isAccept !== 'undefined') {
      console.log('isaccep', typeof isAccept)
      if (isAccept === '1') {
        console.log('isAcceptisAccept', isAccept)
        accept = -1
      } else if (isAccept === '2') {
        accept = 0
      } else {
      }
    }

    const stopTimeChooseArr = []
    if (patrolObjId) {
      responseData = await (this as any).query('TransactionFlow', 'queryQuestionsByObjIdAndUserId', [
        patrolObjId,
        status,
        orderType,
        pageSize,
        pageNo,
        accept,
        userId
      ])
    };
    for (const item of responseData) {
      const execCondition:any = {}
      execCondition.where = { pointResultId: item.relativeId }
      const data = await (this as any).query('TaskExecSchema', 'queryDetail', [ execCondition ])
      const patrolTaskItemId = data && data.patrolTaskItemId
      if (!patrolTaskItemId) {
        throw Error(this.ctx.__('transactionFlow.noFindCorresponding'))
      }
      const taskItemCondition:any = {}
      taskItemCondition.where = { patrolTaskItemId }

      const PatrolTaskdata = await (this as any).query('PatrolTaskItem', 'findOneData', [ taskItemCondition ])
      const PatrolTaskdataItemPath = PatrolTaskdata && PatrolTaskdata.path
      item.itemFullPath =
        PatrolTaskdataItemPath &&
        (await this.ctx.service.common.partrolItemsPath(PatrolTaskdataItemPath, (this as any).transaction))
      item.stopTime = this.ctx.helper.getInervalHour(item.createTime, new Date())
      item.patrolTaskItemId = patrolTaskItemId
      if (item.isAccept === -1) {
        item.isAccept = '1'
      } else if (item.isAccept === 0) {
        item.isAccept = '2'
      } else {
        item.isAccept = '3'
      }
      //  description: '1 一周+2 1天以前 2 1天+ 3 12小时+ 4 4小时+ 5 2小时+ '
      if (stopTImeType && stopTImeType !== '0') {
        switch (true) {
          case stopTImeType === '5' && item.stopTime >= 2:
            stopTimeChooseArr.push(item)
            break
          case stopTImeType === '4' && item.stopTime >= 4:
            stopTimeChooseArr.push(item)
            break
          case stopTImeType === '3' && item.stopTime >= 12:
            stopTimeChooseArr.push(item)
            break
          case stopTImeType === '2' && item.stopTime >= 24:
            stopTimeChooseArr.push(item)
            break
          case stopTImeType === '1' && item.stopTime >= 168:
            stopTimeChooseArr.push(item)
            break
          default:
            console.log(1)
        }
      }
    }
    const res:any = {}
    if (stopTImeType && stopTImeType !== '0') {
      res.list = stopTimeChooseArr
      res.total = stopTimeChooseArr.length
    } else {
      res.list = responseData
      res.total = responseData.length
    }
    return res
  }

  /**
   * 问题详情接口
   * @param {object} params
   * @return {string} - object
   */

  @Transactional
  async getQuestionInfo (params:any): Promise<any> {
    const { transactionId } = params
    const { ctx } = this
    if (!transactionId) {
      throw Error(this.ctx.__('transactionFlow.questionIdNull'))
    }
    const flowStatusShadowPerson = {
      0: 2,
      3: 3,
      5: 2
    }
    const condition = {
      where: {
        transactionId,
        isDelete: 0
      }
    }
    const conditionQuery = {
      where: { transactionId }
    }
    const response = await (this as any).query('TransactionFlow', 'findOneData', [ condition ])
    const flowList = await (this as any).query('TransactionFlow', 'findAndCountAllData', [ conditionQuery ])
    console.log('flowListflowListflowList', flowList)
    // 获取 releativeId
    // 状态 带复核 0  复核通过 1 复活不通过 2 待整改 3 整改通过 4 待审核 5  审核通过 6  审核不通过 7   问题关闭 8  不是问题 9
    const status = response && response.status

    // delete response.picUrl
    let isBack = false
    if (
      (status === '3' || status === '5') &&
      flowList &&
      flowList.list &&
      flowList.list.length > 0
    ) {
      // 判断是否驳回再整改
      const flowarr = flowList.list
      // 获取上一个待整改的picUrl 即整改后的图
      const repairPersons = flowarr.map(ele => {
          if (ele.status === '7') {
            return ele
          }
        }).filter(ele => {
          if (ele) {
            return ele
          }
        })
      if (repairPersons && repairPersons.length > 0) {
        isBack = true
        // 整改后图
      }
      const repairFinish = flowarr
        .map(ele => {
          if (ele.status === '4') {
            return ele
          }
        })
        .filter(ele => {
          if (ele) {
            return ele
          }
        })
        .sort(function (a, b) {
          return parseInt(b.version, 10) - parseInt(a.version, 10)
        })
      // console.log('repairFinishrepairFinishrepairFinish',repairFinish)
      if (repairFinish && repairFinish.length > 0) {
        const pics = repairFinish[0].picUrl && repairFinish[0].picUrl.split(',')
        response.dataValues.rectificationRemark = repairFinish[0].remark
        const rectificationPic = []
        if (pics && pics && pics.length > 0) {
          for (const i of pics) {
            if (i) {
              const pic = await this.ctx.service.picture.getRealPic(i, (this as any).transaction)
              rectificationPic.push(pic)
            }
          }
          response.dataValues.rectificationPic = repairFinish[0].picUrl
        }
      }
      const dismissFigure = flowarr
        .map(ele => {
          if (ele.status === '7') {
            return ele
          }
        })
        .filter(ele => {
          if (ele) {
            return ele
          }
        })
        .sort(function (a, b) {
          return parseInt(b.version, 10) - parseInt(a.version, 10)
        })
      if (dismissFigure && dismissFigure && dismissFigure.length > 0) {
        // 驳回图
        const pics = dismissFigure[0].picUrl && dismissFigure[0].picUrl.split(',')
        const dismissFigurePic = []
        response.dataValues.dismissFigureRemark = dismissFigure[0].remark
        if (pics && pics && pics.length > 0) {
          for (const i of pics) {
            if (i) {
              const pic = await this.ctx.service.picture.getRealPic(i, (this as any).transaction)
              dismissFigurePic.push(pic)
            }
          }
          response.dataValues.dismissFigurePic = dismissFigure[0].picUrl
        }
      }
    }
    const relativeId = response && response.relativeId
    if (!relativeId) {
      throw Error(this.ctx.__('transactionFlow.relateIdNotExit'))
    }
    const execCondition = { where: { pointResultId: relativeId } }
    const TaskExec = await (this as any).query('TaskExecSchema', 'queryDetail', [ execCondition ])
    const patrolTaskItemId = TaskExec && TaskExec.patrolTaskItemId

    const patrolScore = TaskExec && TaskExec.patrolScore
    if (!patrolTaskItemId) {
      throw Error(this.ctx.__('transactionFlow.noCorresponding'))
    }
    const patrolTaskItemCondition = { where: { patrolTaskItemId } }

    const TaskItem = await (this as any).query('PatrolTaskItem', 'findOneData', [ patrolTaskItemCondition ])

    const patrolItemId = TaskItem && TaskItem.patrolItemId
    const patrolItemPath = TaskItem && TaskItem.path
    if (!patrolItemId) {
      throw Error(this.ctx.__('transactionFlow.noCorresponding'))
    }
    const patrolTaskId = TaskItem && TaskItem.patrolTaskId
    const TaskIdCondition = { where: { patrolTaskId } }
    const Task = await (this as any).query('Task', 'findOneData', [ TaskIdCondition ])
    const createTime = response && response.dataValues && response.dataValues.createTime
    response.dataValues.stopTime = createTime && this.ctx.helper.getInervalHour(createTime, new Date())
    let personCondition = {}
    const taskContent = await (this as any).query('PatrolTaskItem', 'getObjIdByPatrolTaskItemId', [
      patrolTaskItemId
    ])
    const patrolObjIdCondition = { where: { patrolObjId: taskContent.patrolObjId } }
    let _PathArr = []
    // 直接一级巡检项上一串的itemid 都去找一把参考图片
    if (patrolItemPath) {
      const reg = /^\@|\@$/g
      _PathArr = patrolItemPath.replace(reg, '').split('@')
    }
    // 根据参考图的id去重
    const ItemRefCondition = {
      where: {
        itemId: { [Op.or]: _PathArr },
        patrolObjId: taskContent.patrolObjId
      },
      attributes: [[ Sequelize.fn('DISTINCT', Sequelize.col('ref_pic_id')), 'refPicId' ], 'refPicUrl' ]
    }
    const ItemRef = await (this as any).query('RefPic', 'queryData', [ ItemRefCondition ])
    const referImages = []
    if (ItemRef && ItemRef.list && ItemRef.list.length > 0) {
      for (const i of ItemRef.list) {
        if (i.refPicUrl) {
          const pic = await this.ctx.service.picture.getRealPic(i.refPicUrl, (this as any).transaction)
          referImages.push(pic)
        }
      }
    }
    const PatrolObj = await (this as any).query('PatrolObj', 'queryDataById', [ patrolObjIdCondition ])
    response.dataValues.regionPathName = await ctx.service.pdms.treePath(PatrolObj.regionPath || '',(this as any).transaction)
    response.dataValues.patrolObjName = PatrolObj.patrolObjName
    // extendJson.objName = PatrolObj.patrolObjName
    const objtypeCondition = {
      where: {
        // isDelete: 0,
        objTypeId: PatrolObj.objTypeId
      }
    }
    const ObjType = await (this as any).query('PatrolObjType', 'queryOneData', [ objtypeCondition ])
    response.dataValues.objTypeName = ObjType.objTypeName
    response.dataValues.patrolObjectName = PatrolObj.patrolObjName
    if (flowStatusShadowPerson[status]) {
      personCondition = {
        where: {
          processType: flowStatusShadowPerson[status],
          patrolTaskId,
          objectId: PatrolObj.patrolObjId
        },
        attributes: [ 'currentPerson', 'processType' ]
      }
      const PatrolTaskPersonIds = await (this as any).query('PatrolTaskPerson', 'queryDetail', [
        personCondition
      ])
      // 暂时不反回
      let taskRoleName = ''
      if (PatrolTaskPersonIds) {
        let extraNextPersonOn
        if (PatrolTaskPersonIds.processType === 1) {
          extraNextPersonOn = await (this as any).query('Process', 'getExtraNextPersonOnByTaskId', [
            patrolTaskId,
            1
          ])
          taskRoleName = this.ctx.__('transactionFlow.reviewer')
        } else if (PatrolTaskPersonIds.processType === 2) {
          extraNextPersonOn = await (this as any).query('Process', 'getExtraNextPersonOnByTaskId', [
            patrolTaskId,
            2
          ])
          taskRoleName = this.ctx.__('transactionFlow.rectifiers')
        } else if (PatrolTaskPersonIds.processType === 3) {
          extraNextPersonOn = await (this as any).query('Process', 'getExtraNextPersonOnByTaskId', [
            patrolTaskId,
            3
          ])
          taskRoleName = this.ctx.__('transactionFlow.looker')
        }

        response.dataValues.taskRoleName = taskRoleName
        response.dataValues.extraNextPersonOn = extraNextPersonOn
        response.dataValues.defaultPersonIds = PatrolTaskPersonIds.currentPerson
        // response.dataValues.defaultExecPerson = res && res.list && res.list
      }
    }
    // 教育场景 taskperson表 相同任务id下不同的objectid 则会产生不同的处理人
    response.dataValues.itemFullPath = await ctx.service.common.partrolItemsPath(TaskItem.dataValues.path,(this as any).transaction)
    // responseData.dataValues.id = transactionId // 巡检结论Id
    response.dataValues.referImages = referImages || []
    response.dataValues.patrolScore = patrolScore
    const problemImages = []
    if (TaskExec && TaskExec.picUrls) {
      const picIds = TaskExec.picUrls.split(',')
      for (const i of picIds) {
        if (i) {
          const pic = await this.ctx.service.picture.getRealPic(i, (this as any).transaction)
          const parseStartWithHttp:any = {}

          if (typeof (pic) === 'string' && pic.indexOf('http') >= 0) {
            parseStartWithHttp.picUrl = pic
            problemImages.push(parseStartWithHttp)
            console.log('problemImages+++', problemImages)
          } else {
            problemImages.push(pic)
          }

        }
      }
      response.dataValues.problemImages = problemImages
    }
    // response.dataValues.problemImages = await ctx.service.patrolTaskItem.getCapturedPicForXunJian(patrolTaskItemId, null, this.transaction)
    response.dataValues.remark = response.remark // 处理备注
    response.dataValues.resultDesc = TaskExec.resultDesc // 巡检结论备注
    response.dataValues.recResult = TaskExec.recResult // 识别结果
    response.dataValues.execUser = TaskExec.execUser // 执行人
    response.dataValues.patrolTaskItemId = patrolTaskItemId
    response.dataValues.video = '' // 视频接口
    // response.dataValues.picUrl = '' // 视频接口
    response.dataValues.isBack = isBack // true则代表被驳回的整改
    response.dataValues.taskType = Task && Task.taskType // 任务类别
    return response
  }

  @Transactional
  async createFlow (relatedId:any,execUsers:any = '',copyUsers:any = '',modifier:any,pageJson:any): Promise<any> {
    let nextPreStatus = '0'
    while (true) {
      const planStep = await (this as any).query('TransactionFlow', 'getStepFromPlanSchema', [
        relatedId,
        nextPreStatus
      ])
      if (planStep.length === 0) {
        if (nextPreStatus === '8' || nextPreStatus === '9') {
          break
        }
        const nextStatusTemplate = await (this as any).query('TransactionFlow', 'getNextStatus', [
          nextPreStatus,
          'Pass'
        ])
        if (nextStatusTemplate.length !== 1) {
          throw Error(this.ctx.__('transactionFlow.errorResultStatus',  nextPreStatus ))
        }
        nextPreStatus = nextStatusTemplate[0].nextStatus
      } else {
        break
      }
    }
    await (this as any).query('TransactionFlow', 'createInitData', [
      nextPreStatus,
      relatedId,
      execUsers,
      copyUsers,
      modifier || 'system',
      pageJson
    ])
    this.ctx.hikLogger.info('调用sendMQToPdms生成问题和问题状态改变去通知PDMS')
    this.ctx.hikLogger.info('调用sendMQToPdms生成问题和问题状态改变去通知PDMS', nextPreStatus)
    this.ctx.hikLogger.info(
      '调用sendMQToPdms生成问题和问题状态改变去通知PDMS',
      nextPreStatus === '3'
    )
    if (nextPreStatus === '3') {
      this.ctx.hikLogger.info('调用sendMQToPdms生成问题和问题状态改变去通知PDMS_____success')
      this.ctx.service.mq.sendMQToPdms(
        {
          messageId: relatedId,
          messageType: 2,
          schema: this.ctx.header.appid,
          operateType: 1
        },
        (this as any).transaction
      )
    }
    // 消息推送处理
    return 'success'
  }

  @Transactional
  async nextStep (relativeId:any,judge:any,info:any,execUsers:any = '',copyUsers:any = '',modifier:any): Promise<any> {
    const capiJudge = (this as any).app.capitalize(judge)
    const transaction = await (this as any).query('TransactionFlow', 'getTransactionByRelativeId', [
      relativeId
    ])
    if (transaction.length !== 1) {
      throw Error(this.ctx.__('transactionFlow.relateFindResultNotOne') + relativeId)
    }
    const currentPreStatus = transaction[0].status
    console.log('____________________________________________', currentPreStatus)
    if (currentPreStatus !== status) {
      throw Error(this.ctx.__('transactionFlow.statusRefresh'))
    }
    if (currentPreStatus === '8' || currentPreStatus === '9') {
      // 重复提交修改提示语
      throw Error(this.ctx.__('transactionFlow.statusRefresh'))
      // throw Error('流程引擎错误：已为状态' + currentPreStatus)
    }
    const nextStatusTemplate = await (this as any).query('TransactionFlow', 'getNextStatus', [
      currentPreStatus,
      capiJudge
    ])
    if (nextStatusTemplate.length !== 1) {
      throw Error(
        this.ctx.__('transactionFlow.errorStatusJudge',  currentPreStatus, capiJudge )
      )
    }
    const handledStatus = nextStatusTemplate[0].handledStatus
    let nextPreStatus = nextStatusTemplate[0].nextStatus
    while (true) {
      const planStep = await (this as any).query('TransactionFlow', 'getStepFromPlanSchema', [
        relativeId,
        nextPreStatus
      ])
      if (planStep.length === 0) {
        if (nextPreStatus === '8' || nextPreStatus === '9') {
          break
        }
        const nextStatusTemplate = await (this as any).query('TransactionFlow', 'getNextStatus', [
          nextPreStatus,
          'Pass'
        ])
        if (nextStatusTemplate.length !== 1) {
          throw Error(
            this.ctx.__('transactionFlow.errorPlanStatusJudge',  nextPreStatus, capiJudge )
          )
        }
        nextPreStatus = nextStatusTemplate[0].nextStatus
      } else {
        break
      }
    }
    await (this as any).query('TransactionFlow', 'updateTransactionByRelativeId', [
      relativeId,
      handledStatus,
      nextPreStatus,
      info,
      execUsers,
      copyUsers,
      modifier
    ])
    this.ctx.hikLogger.info('调用sendMQToPdms生成问题和问题状态改变去通知PDMS')
    this.ctx.hikLogger.info('调用sendMQToPdms生成问题和问题状态改变去通知PDMSnextPreStatus', nextPreStatus)
    this.ctx.hikLogger.info('调用sendMQToPdms生成问题和问题状态改变去通知PDMSnextPreStatus', nextPreStatus > 2)
    if (nextPreStatus > 2) {
      this.ctx.hikLogger.info('调用sendMQToPdms生成问题和问题状态改变去通知PDMS_____success')
      const params = {
        messageId: relativeId,
        messageType: 2,
        schema: this.ctx.header.appid,
        operateType: handledStatus === '1' ? 1 : 2
      }
      this.ctx.service.mq.sendMQToPdms(params, (this as any).transaction)
    }
    if (nextPreStatus === '8' || nextPreStatus === '9') {
      return nextPreStatus
    }
    // 消息推送
    return nextPreStatus
  }
  /**
   * 查询transactionId相关流程
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async getTransactionFlowList (params:any): Promise<any> {
    const { transactionId } = params
    const condition = {
      where: {
        transactionId,
        isDelete: 0
      }
    }
    const transation = await (this as any).query('TransactionFlow', 'findOneData', [ condition ])
    if (!transation) {
      return []
    }
    const relativeId = transation && transation.relativeId
    const relativeCondition = {
      where: { relativeId },
      order: [[ 'createTime', 'DESC' ]]
    }
    const execCondition = {
      where: {
        pointResultId: relativeId
      },
      attributes: [
        [ 'update_time', 'createTime' ],
        [ 'exec_user', 'modifier' ],
        [ 'result_desc', 'remark' ],
        [ 'pic_urls', 'picUrl' ],
        [ 'update_time_stamp', 'createTimeStamp' ],
        'status',
        'pageJson'
      ]
    }
    const execRes = await (this as any).query('TaskExecSchema', 'queryDetail', [ execCondition ])
    console.log('execResexecRes', execRes)

    execRes.dataValues.statusLabel = this.ctx.__('transactionFlow.look')

    execRes.dataValues.pageJson = (execRes.dataValues.pageJson && JSON.parse(execRes.dataValues.pageJson)) || null

    const result = await (this as any).query('TransactionFlow', 'queryAllData', [ relativeCondition ])
    console.log('relativeConditionrelativeCondition', result)
    // 状态 带复核 0  复核通过 1 复活不通过 2 待整改 3 整改通过 4 待审核 5  审核通过 6  审核不通过 7   问题关闭 8  不是问题 9
    const res = []
    for (const i of result) {
      if (i.status === '1' || i.status === '2') {
        i.dataValues.statusLabel = this.ctx.__('transactionFlow.review')
        res.push(i)
      } else if (i.status === '4') {
        i.dataValues.statusLabel = this.ctx.__('transactionFlow.rectify')
        res.push(i)
      } else if (i.status === '6' || i.status === '7') {
        i.dataValues.statusLabel = this.ctx.__('transactionFlow.looklook')
        res.push(i)
      }
    }
    console.log('审核审核', res)
    if (res && Array.isArray(res)) {
      res.push(execRes)
    }
    return res
  }
  @Transactional
  async acceptProblem (relativeId:any,nextHandler:any): Promise<any> {
    const transaction = await (this as any).query('TransactionFlow', 'getTransactionByRelativeId', [
      relativeId
    ])
    if (transaction.length !== 1) {
      throw Error(this.ctx.__('transactionFlow.errorTaskResultNotOneRelateNum',  relativeId ))
    }
    const currentStatus = transaction[0].status
    if (currentStatus !== '0' && currentStatus !== '3' && currentStatus !== '5') {
      throw Error(this.ctx.__('transactionFlow.statusXXAccept'))
    }
    if (nextHandler !== transaction[0].nextHandlePeople && Number(transaction[0].isAccept) === 0) {
      throw Error(this.ctx.__('transactionFlow.processAcceptedCannotRepeat'))
    }
    // app 的需求同一个人连续接收 version不递增
    if (nextHandler === transaction[0].nextHandlePeople && Number(transaction[0].isAccept) === 0) {
      return 'success'
    }
    const result = await (this as any).query('TransactionFlow', 'updateNextHandlerByRelativeId', [
      nextHandler,
      relativeId
    ])
    return result
  }
  /**
   * 获取问题数
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async getTransactionResultProblem (params:any): Promise<any> {
    const condition = {
      where: {
        relativeId: { [Op.or]: params },
        isDelete: { [Op.gte]: 0 },
        status: { [Op.ne]: '9' }
      }
    }
    const result = await (this as any).query('TransactionFlow', 'queryAllData', [ condition ])
    return result
  }
  @Transactional
  async getTransactionOneResultProblem (relativeId:any): Promise<any> {
    const condition = {
      where: {
        relativeId,
        isDelete: { [Op.gte]: 0 }
      }
    }
    const result = await (this as any).query('TransactionFlow', 'findOneData', [ condition ])
    return result
  }

  /**
   * 获取未整改问题数
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async getTransactionResultNoRectifyProblem (params:any): Promise<any> {
    const condition = {
      where: {
        relativeId: { [Op.or]: params },
        isDelete: { [Op.gte]: 0 },
        status: '3'
      }
    }
    const result = await (this as any).query('TransactionFlow', 'queryAllData', [ condition ])
    return result
  }
  @Transactional
  async getTransactionFlowAllData (params:any): Promise<any> {
    const condition = {
      where: {
        relativeId: { [Op.or]: params },
        isDelete: { [Op.gte]: 0 }
      }
    }
    const result = await (this as any).query('TransactionFlow', 'queryAllData', [ condition ])
    return result
  }
}
