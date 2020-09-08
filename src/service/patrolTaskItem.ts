import {  Context, inject, provide} from 'midway';
import { IpatrolTaskItemService } from '../app/interface/patrolTaskItemInterface';
import { IMqService } from '../app/interface/mqInterface';
import { ItaskService } from '../app/interface/taskInterface';
import { IpdmsService } from '../app/interface/pdmsInterface';
import { ItaskExecResultService } from '../app/interface/taskExecResultInterface';
import { ITransactionFlowService } from '../app/interface/transactionFlowInterface';
import { IPatrolObjService } from '../app/interface/itemInterface';
import { IObjTypeResultService } from '../app/interface/objTypeResultInterface';
import { ICommonService } from '../app/interface/commonInterface';
import { IpictureService } from '../app/interface/pictureInterface';

const Sequelize = require('sequelize')
const { Op } = Sequelize
const { Transactional } = require('../app/core/transactionalDeco/index')

@provide('patrolTaskItemService')
export class PatrolTaskItemService implements IpatrolTaskItemService {
  @inject()
  ctx: Context;

  @inject('mqService')
  serviceIMq: IMqService;

  @inject('taskService')
  serviceItask: ItaskService;

  @inject('pdmsService')
  pdmsService: IpdmsService;

  @inject('taskExecResultService')
  serviceItaskExecResult: ItaskExecResultService;

  @inject('transactionFlowService')
  serviceItransactionFlow: ITransactionFlowService;

  @inject('patrolObjService')
  serviceIPatrolObj: IPatrolObjService;

  @inject('objTypeResultService')
  serviceIObjTypeResult: IObjTypeResultService;

  @inject('commonService')
  serviceICommon: ICommonService;

  @inject('pictureService')
  serviceIpicture: IpictureService;

  @Transactional
  async getItemManner (params:any): Promise<any> {
    const { taskItemId } = params
    const result = await (this as any).query('PatrolTaskItem', 'queryManner', [ params ])
    if (result.length && result.length > 0) {
      return result
    }
    const condition = {
      where: { patrolTaskItemId: taskItemId },
      attributes: [ 'patrolTaskId', 'path' ]
    }
    // 通过巡检项查询巡检项path和任务id
    const itemData = await (this as any).query('PatrolTaskItem', 'findOneData', [ condition ])
    const pathArr = itemData.path.split('@').filter(s => {
      return s !== '' && s !== 'root' && s !== taskItemId
    })
    // 查出巡检项对象的任务巡检项
    const condition1 = {
      where: {
        patrolTaskId: itemData.patrolTaskId,
        patrolItemId: { [Op.in]: pathArr }
      },
      attributes: [ 'patrolTaskItemId', 'patrolItemId' ]
    }
    const itemData1 = await (this as any).query('PatrolTaskItem', 'queryManyAll', [ condition1 ])
    const itemDatafilter = []
    const dd = []
    // 同一个任务,同一个巡检项可能有多个任务巡检项,所以只取一个
    itemData1.forEach(s => {
      if (!dd.includes(s.patrolItemId)) {
        itemDatafilter.push(s.patrolTaskItemId)
        dd.push(s.patrolItemId)
      }
    })
    let res1 = []
    for (let [ i, len ] = [ 0, itemDatafilter.length ]; i < len; i++) {
      res1 = await (this as any).query('PatrolTaskItem', 'queryManner', [{ taskItemId: itemDatafilter[i] }])
      if (res1.length && res1.length > 0) {
        break
      }
    }
    return res1
  }

  /**
   * 社区巡检任务提交
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async taskCommunitySubmit (params:any,execUser:any): Promise<any> {
    const { objectRelId } = params
    const result = await this.ctx.consulCurl(
      '/patrolengine-execute/api/v1/task/taskObj/submit',
      'patrolengine',
      'patrolengine-execute',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          appId: this.ctx.header.appid,
          userId: execUser
        },
        data: {
          submitter: execUser,
          taskObjId: objectRelId,
          subType: 1
        }
      }
    )
    const resultData = result && result.data && this.ctx.helper.bufferToJson(result.data)
    return resultData
  }

  @Transactional
  async taskSubmit (params:any,submitter:any): Promise<any> {
    const { taskId, subType } = params
    if (!taskId || !subType) {
      throw new Error(this.ctx.__('patrolTaskItem.mustParNoGive'))
    }
    console.log('submittersubmitter', submitter)
    console.log('taskId', taskId)
    console.log('subType', subType)
    const result = await this.ctx.consulCurl(
      '/patrolengine-execute/api/v1/task/task/submit',
      'patrolengine',
      'patrolengine-execute',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          appId: this.ctx.header.appid,
          userId: Buffer.from(submitter).toString('base64')
        },
        data: {
          submitter,
          subType,
          taskId
        }
      }
    )
    const resultData = result && result.data && this.ctx.helper.bufferToJson(result.data)
    const mq1 = resultData && resultData.data
    console.log('创建结论mq', mq1)
    if (mq1 && mq1.list && mq1.list.length > 0) {
      const pointResultIds = mq1.list.map(ele => ele.pointResultId)
      if (pointResultIds && pointResultIds.length > 0) {
        for (const relativeId of pointResultIds) {
          const params:any = {}
          params.info = {}
          params.info.remark = ''
          params.relativeId = relativeId
          params.resultDesc = ''
          params.recResult = ''
          params.copyUsers = ''
          params.execUsers = ''
          params.judge = ''
          params.appId = this.ctx.header.appid
          await this.serviceIMq.questionHandleMq(params, (this as any).transaction)
        }
      }
    }
    // 抄送发送消息
    return resultData
  }

  /**
   * 创建巡检结论
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async createByApp (params:any,execUser:any): Promise<any> {
    const {
      sceneTaskItemId,
      ccUsers,
      patrolResult,
      itemResultList,
      picUrl,
      rectifyUsers,
      recResult,
      pageJson,
      isCheckComplete, // 变电站：1， 社区：0
      resultDesc
    } = params

    if (itemResultList && itemResultList.length > 0) {
      for (const i of itemResultList) {
        if (i.taskItemId) {
          const condition = { patrolTaskItemId: i.taskItemId }
          await (this as any).query(
            'PatrolTaskItem',
            'findOneDataByPatrolTaskItemServiceGetTaskItemDetailByIdForApp',
            [ condition ]
          )
        }
      }
    }
    const result = await this.ctx.consulCurl(
      '/patrolengine-execute/api/v1/task/spot/submit',
      'patrolengine',
      'patrolengine-execute',
      {
        method: 'POST',
        headers: {
          userId:
            Buffer.from(execUser).toString('base64') || Buffer.from('admin').toString('base64'),
          'content-type': 'application/json',
          appId: this.ctx.header.appid
        },
        data: {
          sceneTaskItemId,
          ccUsers,
          // 1.3 版本增加了动态表单的ｊｓｏｎ
          pageJson,
          execUser: execUser || 'admin',
          patrolResult,
          itemResultList,
          picUrl,
          rectifyUsers,
          isCheckComplete,
          resultDesc,
          recResult
        }
      }
    )
    // todo处理人   message抄送人

    const resultData = this.ctx.helper.bufferToJson(result.data)
    const mq1 = resultData && resultData.data
    console.log('创建结论mq', mq1)
    if (mq1 && mq1.list && mq1.list.length > 0) {
      const pointResultIds = mq1.list.map(ele => ele.pointResultId)

      // java端 返回的 pointResultId 遍历 对每一个巡检项  发送 tlnc ）
      // 执行人是： 代办
      // 抄送人是： 消息
      if (pointResultIds && pointResultIds.length > 0) {
        for (const relativeId of pointResultIds) {
          const params:any = {}
          params.info = {}
          params.info.remark = ''
          params.relativeId = relativeId
          params.resultDesc = ''
          params.recResult = ''
          params.copyUsers = ''
          params.execUsers = ''
          params.judge = ''
          params.appId = this.ctx.header.appid
          await this.serviceIMq.questionHandleMq(params, (this as any).transaction)
        }
      }
    }
    // 抄送发送消息
    return resultData
  }

  /**
   * 创建巡检结论BS端用的接口
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async createByBs (params:any,execUser:any): Promise<any> {
    const { ctx } = this
    // 校验当前操作人员是否具备操作权限
    const currentUserId = execUser || this.ctx.getUserId()
    // 查询当前任务的巡检人员id列表
    const taskExecUserIdList = await this.serviceItask.getDefaultExecPersonIds(
      {
        patrolTaskId: params.patrolTaskId,
        patrolTaskItemId:
          params.patrolTaskItemList &&
          params.patrolTaskItemList[0] &&
          params.patrolTaskItemList[0].patrolTaskItemId,
        patrolPointId: params.patrolPointId
      },
      (this as any).transaction
    )
    if (
      !(
        currentUserId === 'admin' ||
        // @TODO这里是字符串，那么在鉴权时可能出现名称相近的用户名鉴权错乱。例如zy可以操作zy2的任务，因为includesk结果是true。
        (taskExecUserIdList && taskExecUserIdList.includes(currentUserId))
      )
    ) {
      throw new Error(this.ctx.__('patrolTaskItem.currentUserNoPer'))
    }
    const base64useId = new Buffer(execUser).toString('base64')
    if (
      (params.result &&
        params.result.triggerNext &&
        Array.isArray(params.patrolTaskItemList) &&
        params.patrolTaskItemList.length > 0) ||
      (params.result && !params.result.triggerNext)
    ) {
      const bodyData = {
        execUser,
        itemResultList: [],
        ccUsers: params.ccUsers.join(','),
        patrolResult: params.patrolResult,
        patrolTaskPointId: params.patrolPointId,
        picUrl: params.picUrls,
        rectifyUsers: params.rectifyUsers && params.rectifyUsers.join(','),
        resultDesc: params.resultDesc,
        status: params.status
      }
      bodyData.itemResultList = params.patrolTaskItemList.map(item => {
        return {
          patrolScore: item.score,
          taskItemId: item.patrolTaskItemId
        }
      })
      (this as any).app.hikLogger.debug(this.ctx.__('patrolTaskItem.useServicePar'))
      (this as any).app.hikLogger.debug(bodyData)
      (this as any).app.hikLogger.debug(JSON.stringify(bodyData))
      const result = await this.ctx.consulCurl(
        '/patrolengine-execute/api/v1/task/online/submit',
        'patrolengine',
        'patrolengine-execute',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            appId: ctx.header.appid,
            userId: base64useId
          },
          data: bodyData
        }
      );
      (this as any).app.hikLogger.debug(this.ctx.__('patrolTaskItem.useServiceOldContent'))
      (this as any).app.hikLogger.debug(result)
      const resultData = this.ctx.helper.bufferToJson(result.data);
      (this as any).app.hikLogger.debug(this.ctx.__('patrolTaskItem.analysisContent'))
      (this as any).app.hikLogger.debug(resultData)
      return resultData
    }
    // 如果扣分项列表不存在，那么代表社区场景下的巡检任务结论确认，要调社区专用接口（@TODO是不是只传patrolTaskId就代表提交结论）
    (this as any).app.hikLogger.debug(
      this.ctx.__('patrolTaskItem.useServiceSubmitPar')
    )
    (this as any).app.hikLogger.debug({
      submitter: execUser,
      taskId: params.patrolTaskId
    })
    const result = await this.ctx.consulCurl(
      '/patrolengine-execute/api/v1/task/task/submit',
      'patrolengine',
      'patrolengine-execute',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          appId: this.ctx.header.appid,
          userId: base64useId
        },

        data: {
          submitter: execUser,
          taskId: params.patrolTaskId
        }
      }
    );
    (this as any).app.hikLogger.debug(this.ctx.__('patrolTaskItem.useServiceFinish'))
    (this as any).app.hikLogger.debug(result)
    const resultData = this.ctx.helper.bufferToJson(result.data);
    (this as any).app.hikLogger.debug(this.ctx.__('patrolTaskItem.response'))
    (this as any).app.hikLogger.debug(resultData)
    return resultData
  }
  /**
   * 创建巡检结论BS端用的接口
   * @param {object}
   * @return {string} - object
   * @author renxiaojian
   */
  @Transactional
  async createConclusionByBs (params:any,execUser:any): Promise<any> {
    // 校验当前操作人员是否具备操作权限
    const currentUserId = execUser || this.ctx.getUserId()
    // 查询当前任务的巡检人员id列表
    const taskExecUserIdList = await this.serviceItask.getDefaultExecPersonIds(
      {
        patrolTaskId: params.patrolTaskId,
        patrolTaskItemId:
          params.patrolTaskItemList &&
          params.patrolTaskItemList[0] &&
          params.patrolTaskItemList[0].patrolTaskItemId,
        patrolPointId: params.patrolPointId
      },
      (this as any).transaction
    )
    if (
      !(
        currentUserId === 'admin' ||
        // @TODO这里是字符串，那么在鉴权时可能出现名称相近的用户名鉴权错乱。例如zy可以操作zy2的任务，因为includesk结果是true。
        (taskExecUserIdList && taskExecUserIdList.includes(currentUserId))
      )
    ) {
      throw new Error(this.ctx.__('patrolTaskItem.currentUserNoPer'))
    }
    const {
      ccUsers,
      currentItemResult,
      itemResultList,
      patrolTaskId,
      patrolTaskItemId,
      rectifyUsers
    } = params
    const base64useId = new Buffer(execUser).toString('base64')
    const bodyData = {
      execUser,
      currentItemResult,
      itemResultList,
      ccUsers: ccUsers && ccUsers.join(','),
      rectifyUsers: rectifyUsers && rectifyUsers.join(','),
      patrolTaskId,
      pointItemId: patrolTaskItemId
    };
    (this as any).app.hikLogger.debug(this.ctx.__('patrolTaskItem.useServicePar'))
    (this as any).app.hikLogger.debug(bodyData)
    (this as any).app.hikLogger.debug(JSON.stringify(bodyData))
    const result = await this.ctx.consulCurl(
      '/patrolengine-execute/api/v2/task/online/submit',
      'patrolengine',
      'patrolengine-execute',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          appId: this.ctx.header.appid,
          userId: base64useId
        },
        data: bodyData
      }
    );
    (this as any).app.hikLogger.debug(this.ctx.__('patrolTaskItem.useServiceOldContent'))
    (this as any).app.hikLogger.debug(result)
    const resultData = this.ctx.helper.bufferToJson(result.data);
    (this as any).app.hikLogger.debug(this.ctx.__('patrolTaskItem.analysisContent'))
    (this as any).app.hikLogger.debug(resultData)
    return resultData
  }
  /**
   * 发送巡检结论成功后的消息待办
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async createTlnc (params:any): Promise<any> {
    const { pointResultIds, patrolTaskId, type } = params
    // 发送待办之前，首先要删除旧的待办，如果是任务结论提交，那么就删除任务的待办。如果是问题处理结论提交，那么就删除问题待办
    if (type === 'taskSubmit') {
      // 任务提交结论时，直接删除原有任务待办即可
      console.log(`此处是任务提交结论，直接删除原有待办任务：${patrolTaskId}`)
      // 这里去查询该任务的巡检人，将所有巡检人放入参数中，一并删除

      const params = {
        apiType: 'bs',
        taskId: patrolTaskId
      }
      await this.pdmsService.agencyDelete(params, (this as any).transaction)
    }
    if (pointResultIds && pointResultIds.length > 0) {
      // 遍历结论提交成功后，产生的执行结果id，基于处理结果，发送对应的消息和待办内容
      for (const relativeId of pointResultIds) {
        (this as any).app.hikLogger.debug(this.ctx.__('patrolTaskItem.inServiceRelativeId'), relativeId)
        console.log('========进入createTlnc的service，relativeId：', relativeId)
        console.log(relativeId)
        // 到resultExec表中查询当前结论信息
        const resultDetail = await this.serviceItaskExecResult.getExecResultById(
          { relativeId },
          (this as any).transaction
        );
        (this as any).app.hikLogger.debug(this.ctx.__('patrolTaskItem.relativeIdResult'), resultDetail)
        console.log('========基于relativeId查询到的执行结果：', resultDetail)
        console.log(resultDetail)
        // 如果结论不需要进入下一步，那么说明是正常，不需要发送消息代办。
        if (!resultDetail.isIntoNextStep) {
          continue
        }
        // 获取当前结论的流程信息，用于后面拼装待办和消息的内容
        const transactionFlow = await this.serviceItransactionFlow.getTransactionOneResultProblem(
          relativeId,
          (this as any).transaction
        );
        (this as any).app.hikLogger.debug(this.ctx.__('patrolTaskItem.relativeIdProcessResult'), transactionFlow)
        console.log('========基于relativeId查询到的流程结果：', transactionFlow)
        console.log(transactionFlow)
        // 获取当前流程状态，用于后面判断是否发送待办
        const flowStatus = transactionFlow.status
        // 这里先预设所有消息代办可能用到的字段
        const totalItemMap = {
          itemTitleList: [], // 巡检项标题列表
          itemContentList: [], // 巡检项内容列表
          patrolObjName: '', // 巡检对象名称
          cameraName: '', // 监控点名称
          patrolObjTypeName: '', // 巡检对象类型名称
          patrolResultName: '' // 巡检结果名称
        }
        // Start-------开始获取totalItemMap中所有可能用到的字段内容-------Start
        // 根据执行结果信息，获取到任务巡检项id
        const patrolTaskItemId = resultDetail && resultDetail.patrolTaskItemId
        if (!patrolTaskItemId) {
          throw Error(this.ctx.__('patrolTaskItem.noCorresponding'))
        }
        // 根据执行结果信息，获取到任务检测点id
        const patrolTaskPointId = resultDetail && resultDetail.taskPointId
        if (patrolTaskPointId) {
          // 根据任务检测点id，查询检测点的信息
          const patrolTaskPointCondition = { where: { patrolTaskPointId } }
          const PatrolTaskPoint = await (this as any).query('PatrolTaskPoint', 'findOneData', [
            patrolTaskPointCondition
          ])
          // 根据任务检测点信息，查询cameraName
          const patrolPointCondition = { where: { patrolPointId: PatrolTaskPoint.patrolPointId } }
          const PatrolPoint = await (this as any).query('PatrolPoint', 'findOneData', [ patrolPointCondition ])
          totalItemMap.cameraName = PatrolPoint.cameraName
          // throw Error('无对应检测点')
        } else totalItemMap.cameraName = ''
        // 根据巡检项id，查询对象关联id
        const patrolTaskItemCondition = { where: { patrolTaskItemId } }
        const TaskItem = await (this as any).query('PatrolTaskItem', 'findOneData', [
          patrolTaskItemCondition
        ])
        const patrolObjRelId = TaskItem && TaskItem.patrolObjRelId
        // 根据对象关联id，查询巡检对象的id
        const patrolObjRelIdCondition = { where: { patrolObjRelId } }
        const PatrolObjRel = await (this as any).query('PatrolObjRel', 'findOneData', [
          patrolObjRelIdCondition
        ])
        const objId = PatrolObjRel && PatrolObjRel.patrolObjId
        // 根据巡检对象的id，查询巡检对象关联的对象类型
        const patrolObjIdCondition = { where: { patrolObjId: objId } }
        const PatrolObj = await (this as any).query('PatrolObj', 'queryDataById', [ patrolObjIdCondition ])
        // 巡检对象名称存入totalItemMap，后面根据配置，用到的话就展示。
        totalItemMap.patrolObjName = PatrolObj.patrolObjName
        // 根据巡检对象类型id，查询巡检对象类型信息
        const objtypeCondition = {
          where: {
            // isDelete: 0,
            objTypeId: PatrolObj.objTypeId
          }
        }
        const ObjType = await (this as any).query('PatrolObjType', 'queryOneData', [ objtypeCondition ])
        // 巡检对象类型名称存入totalItemMap，后面根据配置，用到的话就展示。
        totalItemMap.patrolObjTypeName = ObjType.objTypeName
        // 根据巡检对象类型id，查询关联的巡检项层级信息
        const itemTitleCondition = {
          where: {
            isDelete: 0,
            objTypeId: PatrolObj.objTypeId
          },
          order: [[ 'level', 'ASC' ]],
          raw: true
        }
        const itemTitleListRes = await (this as any).query('ItemTitle', 'itemTitleModel', [
          itemTitleCondition
        ])
        const itemTitleList = itemTitleListRes.rows.map(item => item.titleName)
        // 巡检项标题名称存入totalItemMap，后面根据配置，用到的话就展示。
        totalItemMap.itemTitleList = itemTitleList
        const { path } = await this.serviceIPatrolObj.queryPathByTaskItemId(
          { taskItemId: resultDetail.patrolTaskItemId },
          (this as any).transaction
        )
        const pathArr = path.split('/')
        // 巡检项名称存入totalItemMap，后面根据配置，用到的话就展示。
        totalItemMap.itemContentList = pathArr
        // 巡检结论信息获取
        const patrolResultParams = { orId: resultDetail.patrolResult }
        const patrolResult = await this.serviceIObjTypeResult.queryOne(
          patrolResultParams,
          (this as any).transaction
        )
        totalItemMap.patrolResultName = patrolResult.orName
        // End---------完成获取totalItemMap中所有可能用到的字段内容--------End
        // 如果选择了抄送人，那么向抄送人发送消息。
        // 这里应该基于transactionFlow.nextCopyPeople判断是否有抄送人@TODO待调试是否所有环节的消息都正常，人工、自动的任务提交和问题处理
        if (transactionFlow.nextCopyPeople) {
          // 发送消息的逻辑
          console.log('准备发送消息，totalItemMap：', totalItemMap)
          await this.serviceIMq.createMessage(
            resultDetail,
            totalItemMap,
            transactionFlow,
            (this as any).transaction
          )
        }
        // 发送待办之前，先把原有待办删除，删除标识使用relativeId查询transactionFlow.transactionId
        const params = {
          apiType: 'bs',
          relativeId
        }
        // 发送待办的逻辑
        console.log('准备删除原有待办，params：', params)
        await this.pdmsService.agencyDelete(params, (this as any).transaction)
        // 对于需要进行下一步处理和存在下一步执行人的问题，需要发送新的待办。
        // flowStatus为8代表问题处理已完成，flowStatus为9代表不是问题，这两种情况不需要发待办这两个状态无需下一步处理了。
        if (
          resultDetail.isIntoNextStep &&
          resultDetail.nextHandlePeople &&
          flowStatus !== '8' &&
          flowStatus !== '9'
        ) {
          console.log('准备发送待办，totalItemMap：', totalItemMap)
          await this.serviceIMq.createTodo(
            resultDetail,
            totalItemMap,
            transactionFlow,
            (this as any).transaction
          )
        }
      }
    }
  }

  /**
   * 删除xx
   * @param {object}
   * @return {string} - objec
   */
  @Transactional
  async delete ({id}:any): Promise<void> {}
  /**
   * 查询
   * @param {object} params
   * @return {string} - list
   */
  @Transactional
  async getTaskItemListbyTaskIdAndObjId (params:any): Promise<any> {
    const {
      patrolTaskId, patrolObjId, pageNo = 1, pageSize = 10
    } = params
    const condition = {
      where: {
        patrolTaskId,
        patrolObjId
      }
    }
    if (!patrolObjId || !patrolTaskId) {
      throw Error(this.ctx.__('patrolTaskItem.patrolObjIdPatrolTaskIdNoExit'))
    }
    const data = await (this as any).query('PatrolObjRel', 'findOneData', [ condition ])
    const patrolObjRelId = data && data.patrolObjRelId
    // todo 这里不能写死  变电站场景下 isLeaf 作为 节点方可
    const taskItemCondition = {
      where: {
        patrolObjRelId,
        patrolTaskId,
        isLeaf: 1
      },
      order: [[ 'createTime', 'DESC' ]],
      attributes: [ 'path', 'patrolResult', 'patrolTaskItemId', 'createTime' ],
      limit: pageSize * 1,
      offset: (pageNo - 1) * pageSize
    }
    const taskItems = await (this as any).query('PatrolTaskItem', 'queryList', [ taskItemCondition ])

    for (const item of taskItems.list) {
      item.dataValues.patrolItemPath = await this.serviceICommon.partrolItemsPath(
        item.dataValues.path,
        (this as any).transaction
      )
      if (item.dataValues.patrolResult !== '') {
        const ObjTypeRes = {
          where: { orId: item.dataValues.patrolResult },
          attributes: [ 'orName', 'triggerNext' ]
        }
        const res = await (this as any).query('ObjTypeResult', 'findOneData', [ ObjTypeRes ])
        item.dataValues.patrolResult = res
      }
    }
    return taskItems
  }
  /**
   * 查询
   * @param {object} params
   * @return {string} - list
   */
  @Transactional
  async getlist (params:any): Promise<any> {
    const { patrolTaskId, pageNo = 1, pageSize = 10 } = params
    const condition = {
      where: { patrolTaskId },
      attributes: [ 'itemName', 'status', 'patrolResult' ],
      limit: pageSize * 1,
      offset: (pageNo - 1) * pageSize,
      raw: true
    }

    const data = await (this as any).query('PatrolTaskItem', 'queryList', [ condition ])
    return data
  }
  /**
   * 更新
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async getCapturedPicForXunJian (taskItemId:any,taskPointId:any): Promise<any> {
    console.log('taskItemId', taskItemId)
    let res
    if (!taskPointId) {
      res = await (this as any).query('PlannedCapture', 'getCapturedPicByItemId', [ taskItemId ])
    } else {
      res = await (this as any).query('PlannedCapture', 'getCapturedPicByPointId', [ taskPointId ])
    }
    for (const item of res) {
      const realUrl =
        item.picUrl && (await this.serviceIpicture.getRealPic(item.picUrl, (this as any).transaction))
      item.picUrl = realUrl && realUrl.picUrl
      item.cameraId = realUrl && realUrl.cameraId
      item.captureTime = realUrl && realUrl.createTime
    }
    return res
  }
  /**
   * 变电站等场景下  根据对象 聚合问题
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async getObjListByPerson (params:any,userId:any): Promise<any> {
    // '1: 问题复核 2：问题整改 3：整改审核'
    const { type } = params
    // console.log('paramsparamsparamsparams', params)
    // 从问题流程表获得该用户是执行人的数据 跟据 type 跟 status 匹配
    if (![ '1', '2', '3' ].includes(type)) {
      throw Error(this.ctx.__('patrolTaskItem.inTypeNotBelong') + type)
    } else if (!userId) {
      throw Error(this.ctx.__('patrolTaskItem.userIdNotExit'))
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
    responseData = await (this as any).query('TransactionFlow', 'queryVaildAgentList', [ userId, status ]);

    const temp = []
    for (const item of responseData.list) {
      const execConditon:any = {}
      execConditon.where = { pointResultId: item.relativeId }
      const data = await (this as any).query('TaskExecSchema', 'queryDetail', [ execConditon ])
      console.log('datadatadatadata', data)
      const patrolTaskItemId = data && data.patrolTaskItemId
      if (!patrolTaskItemId) {
        throw Error(this.ctx.__('patrolTaskItem.noFindCorresponding'))
      }
      const patrolTaskCondition:any = {}
      patrolTaskCondition.where = { patrolTaskItemId }
      const PatrolTaskdata = await (this as any).query('PatrolTaskItem', 'findOneData', [
        patrolTaskCondition
      ])

      const PatrolTaskdataItemPath = PatrolTaskdata && PatrolTaskdata.path
      const patrolTaskId = PatrolTaskdata && PatrolTaskdata.patrolTaskId
      const taskCondition:any = {}
      taskCondition.where = { patrolTaskId }
      const PatrolTask = await (this as any).query('Task', 'findOneData', [ taskCondition ])
      const taskexecType = PatrolTask && PatrolTask.execType

      const patrolObjRelId = PatrolTaskdata && PatrolTaskdata.patrolObjRelId
      const RelCondition:any = {}
      RelCondition.where = { patrolObjRelId }
      const PatrolObjRel = await (this as any).query('PatrolObjRel', 'findOneData', [ RelCondition ])
      const objId = PatrolObjRel.patrolObjId

      const ObjConditon:any = {}
      ObjConditon.where = { patrolObjId: objId }
      if (params.objName) {
        ObjConditon.where.patrolObjName = { [Op.like]: `%${params.objName}%` }
      }

      if (params.regionId) {
        const regionList = await this.serviceICommon.getRegionIdsFromFirstRegion(
          params.regionId,
          (this as any).transaction
        )
        const regionIds = []
        if (regionList && regionList.length > 0) {
          for (const item of regionList) {
            regionIds.push(item.region_id)
          }
        }
        ObjConditon.where.patrolObjRegion = { [Op.or]: regionIds }
      }
      if (params.objTypeId) {
        ObjConditon.where.objTypeId = params.objTypeId
      }

      const PatrolObj = await (this as any).query('PatrolObj', 'queryDataById', [ ObjConditon ])

      const regionPath = PatrolObj && PatrolObj.regionPath
      const objTypeId = PatrolObj && PatrolObj.objTypeId
      const objTypeCondition:any = {}
      objTypeCondition.where = { objTypeId }
      const PatrolObjType = await (this as any).query('PatrolObjType', 'findOneData', [ objTypeCondition ])
      item.objTypeName = PatrolObjType && PatrolObjType.objTypeName
      const patrolObjRegion = PatrolObj && PatrolObj.patrolObjRegion
      const regionPathFullName =
        regionPath && (await this.pdmsService.treePath(regionPath, (this as any).transaction))
      // console.log('regionPathFullNameregionPathFullNameregionPathFullName', regionPath)
      const objName = PatrolObj && PatrolObj.patrolObjName
      // item.dataValues.objName = objName
      // item.dataValues.id = objId
      // item.dataValues.patrolObjRegionId = patrolObjRegion
      // item.dataValues.regionPathFullName = regionPathFullName
      // item.fullPath = await this.ctx.service.common.partrolItemsPath(PatrolTaskdataItemPath)
      const objPath =
        PatrolTaskdataItemPath &&
        (await this.serviceICommon.partrolItemsPath(PatrolTaskdataItemPath, (this as any).transaction))
      // item.dataValues.PatrolTaskdata = PatrolTaskdata
      // 线下的
      if (PatrolObj && taskexecType === 2) {
        if (temp && temp.length > 0 && temp.find(ele => ele.id === objId)) {
          temp.find(ele => ele.id === objId).data.push(item)
        } else {
          const obj:any = {}
          obj.id = objId
          obj.objName = objName
          obj.patrolObjRegion = patrolObjRegion
          obj.regionPathFullName = regionPathFullName
          obj.objTypeName = PatrolObjType && PatrolObjType.objTypeName
          obj.objTypeId = objTypeId
          obj.objPath = objPath
          obj.data = []
          obj.data.push(item)
          // obj.problemNum = obj.data && obj.data.length
          temp.push(obj)
        }
      }
    }
    responseData.total = temp.length
    responseData.list = temp
    return responseData
  }

  /**
   * 更新
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async getFirstPatrolItemListByPerson (params:any,userId:any): Promise<any> {
    // 同一个场景不同对象 展示多条
    // '1: 问题复核 2：问题整改 3：整改审核'
    const { type } = params

    // 从问题流程表获得该用户是执行人的数据 跟据 type 跟 status 匹配
    if (![ '1', '2', '3' ].includes(type)) {
      throw Error(this.ctx.__('patrolTaskItem.inTypeNotBelong') + type)
    } else if (!userId) {
      throw Error(this.ctx.__('patrolTaskItem.userIdNotExit'))
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
    responseData = await (this as any).query('TransactionFlow', 'queryVaildAgentList', [ userId, status ])
    console.log('responseDataresponseData', responseData)
    // 找到用户下所有的问题 并且归并成巡检结论的列表
    const temp = []
    for (const item of responseData.list) {
      const exe:any = {}
      exe.where = { pointResultId: item.relativeId }
      const data = await (this as any).query('TaskExecSchema', 'queryDetail', [ exe ])
      const patrolTaskItemId = data && data.patrolTaskItemId
      if (!patrolTaskItemId) {
        const taskItem:any = {}
        taskItem.list = []
        taskItem.total = 0
        throw Error(this.ctx.__('patrolTaskItem.noFindCorresponding'))
      }
      const taskItemCondition:any = {}
      console.log('未找到对应的任务巡检项未找到对应的任务巡检项', patrolTaskItemId)
      taskItemCondition.where = { patrolTaskItemId }

      const PatrolTaskdata = await (this as any).query('PatrolTaskItem', 'findOneData', [ taskItemCondition ])
      const patrolTaskId = PatrolTaskdata && PatrolTaskdata.patrolTaskId
      const taskCondition:any = {}
      taskCondition.where = { patrolTaskId }
      const PatrolTask = await (this as any).query('Task', 'findOneData', [ taskCondition ])
      const taskexecType = PatrolTask && PatrolTask.execType
      const PatrolTaskdataItemPath = PatrolTaskdata && PatrolTaskdata.path
      const patrolObjRelId = PatrolTaskdata && PatrolTaskdata.patrolObjRelId
      const objReiCondition:any = {}
      objReiCondition.where = { patrolObjRelId }
      const PatrolObjRel = await (this as any).query('PatrolObjRel', 'findOneData', [ objReiCondition ])
      let objName = ''
      // if (PatrolObjRel && PatrolObjRel.patrolObjId) {
      const objId = PatrolObjRel && PatrolObjRel.patrolObjId
      const onjCondition:any = {}
      onjCondition.where = { patrolObjId: objId }
      const PatrolObj = await (this as any).query('PatrolObj', 'queryDataById', [ onjCondition ])

      console.log('PatrolObjPatrolObj++++++++', PatrolObj)
      console.log('PatrolObjPatrolObj++++Name++++', PatrolObj.patrolObjName)
      objName = PatrolObj && PatrolObj.patrolObjName
      if (!PatrolTaskdataItemPath) {
        throw Error(this.ctx.__('patrolTaskItem.noFindCorrespondingUrl'))
      }
      // }

      const reg = /^\@|\@$/g
      const _regionPathArr = PatrolTaskdataItemPath.replace(reg, '').split('@')
      if (_regionPathArr && _regionPathArr.length <= 0) {
        throw Error(this.ctx.__('patrolTaskItem.noFindCorrespondingFather'))
      }
      const parntItemId = _regionPathArr[1]
      const firstObj:any = {}
      const ItemCondition:any = {}
      ItemCondition.where = { itemId: parntItemId }
      const regionFullPath = await this.pdmsService.treePath(
        PatrolObj.regionPath || '',
        (this as any).transaction
      )

      const itemInfo = await (this as any).query('Item', 'queryDetail', [ ItemCondition ])
      firstObj.itemId = parntItemId
      firstObj.itemContent = itemInfo && itemInfo.itemContent
      firstObj.regionFullPath = regionFullPath
      firstObj.patrolObjId = objId
      firstObj.patrolObjRelId = patrolObjRelId
      const objPath =
        PatrolTaskdataItemPath &&
        (await this.serviceICommon.partrolItemsPath(PatrolTaskdataItemPath, (this as any).transaction))
      // 同一个场景不同对象 展示多条 -----------------------------------------因此要根据对象归并
      // 问题整改列表的筛选改为筛选巡检对象，默认展示所有巡检对象下有问题的一级巡检项，筛选巡检对象后，展示该巡检对象的一级巡检项
      if (taskexecType === 2) {
        if (
          temp &&
          temp.length > 0 &&
          temp.find(
            ele => ele.objId === firstObj.patrolObjId && ele.id === (firstObj && firstObj.itemId)
          )
        ) {
          temp
            .find(
              ele => ele.objId === firstObj.patrolObjId && ele.id === (firstObj && firstObj.itemId)
            )
            .data.push(item)
        } else {
          const obj:any = {}
          obj.id = firstObj && firstObj.itemId
          obj.objName = objName
          obj.regionFullPath = regionFullPath
          obj.patrolObjRegion = PatrolObj.patrolObjRegion
          obj.firstItemName = firstObj.itemContent
          obj.patrolObjRelId = patrolObjRelId
          obj.objPath = objPath
          obj.objId = firstObj.patrolObjId
          obj.data = []
          obj.data.push(item)
          temp.push(obj)
        }

        // 根据对象id 筛选该对象下的所有一级巡检项（相同对象）
      }
    }
    let regionArr = []
    const regionL:any = {}
    if (temp && temp.length > 0 && params.objId) {
      regionArr = temp.filter(ele => ele.objId === params.objId)
      regionL.list = regionArr
      regionL.total = regionArr.length
      return regionL
    }
    responseData.total = temp.length
    responseData.list = temp
    return responseData
    // strs = str.split(',')
  }

  /**
   * 更新
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async update (params = {}) {}

  @Transactional
  async getChildrenTaskResult (params:any): Promise<any> {
    const { patrolTaskId, patrolItemId, patrolObjRelId } = params
    // 一级巡检项 以及 状态是 未完成的
    if (!patrolTaskId || !patrolObjRelId) {
      throw new Error(this.ctx.__('patrolTaskItem.putTaskIdObjId'))
    }
    const condition = {
      where: {
        patrolTaskId,
        patrolObjRelId,
        level: { [Op.or]: [ 2, 3, 4 ] },
        path: { [Op.iLike]: `%%${patrolItemId}%%` }
        // status: 0
      }
    }

    const itemList = await (this as any).query('PatrolTaskItem', 'queryList', [ condition ])

    const condition1 = {
      where: {
        patrolTaskId,
        patrolObjRelId,
        level: { [Op.or]: [ 1 ] },
        path: { [Op.iLike]: `%%${patrolItemId}%%` }
        // status: 0
      }
    }
    const firstTaskItem = await (this as any).query('PatrolTaskItem', 'findOneData', [ condition1 ])
    const exceCondition2 = { where: { patrolTaskItemId: firstTaskItem.patrolTaskItemId } }
    const execFirResult = await (this as any).query('TaskExecSchema', 'queryDetail', [ exceCondition2 ])
    let resModle = null
    if (execFirResult && execFirResult.patrolResult) {
      // console.log('execFirResult.patrolResult', execFirResult.patrolResult)
      const ObjTypeRes = {
        where: { orId: execFirResult.patrolResult },
        attributes: [ 'orName', 'triggerNext' ]
      }
      resModle = await (this as any).query('ObjTypeResult', 'findOneData', [ ObjTypeRes ])
    }

    for (const i of itemList.list) {
      const exceCondition = { where: { patrolTaskItemId: i.dataValues.patrolTaskItemId } }
      if (i.dataValues.patrolResult) {
        const ObjTypeRes = {
          where: { orId: i.dataValues.patrolResult },
          attributes: [ 'orName', 'triggerNext', 'orId' ]
        }
        const ObjectRes = await (this as any).query('ObjTypeResult', 'findOneData', [ ObjTypeRes ])

        i.dataValues.patrolResult = ObjectRes
      } else {
        i.dataValues.patrolResult = null
      }
      const execResult = await (this as any).query('TaskExecSchema', 'queryDetail', [ exceCondition ])

      if (execResult) {
        const problemImages = []
        i.dataValues.patrolScore = execResult.patrolScore
        i.dataValues.resultDesc = execResult.resultDesc
        i.dataValues.nextHandlePeople = execResult.nextHandlePeople
        i.dataValues.nextCopyPeople = execResult.nextCopyPeople
        i.dataValues.resultDesc = execResult.resultDesc
        i.dataValues.regionPathFullName = await this.serviceICommon.partrolItemsPath(
          i.dataValues.path,
          (this as any).transaction
        )
        if (execResult.picUrls) {
          const picIds = execResult.picUrls.split(',')
          for (const i of picIds) {
            if (i) {
              const pic = await this.serviceIpicture.getRealPic(i, (this as any).transaction)
              problemImages.push(pic)
            }
          }
          i.dataValues.problemImages = problemImages
        }

        // delete i.dataValues.itemScore
        delete i.dataValues.isRelPatrolPoint
        delete i.dataValues.path
        delete i.dataValues.picUrls
        delete i.dataValues.createTime
        delete i.dataValues.updateTime
        delete i.dataValues.taskItemReportId
        // delete i.dataValues.patrolItemId
        // delete i.dataValues.objTypeId
        // delete i.dataValues.patrolObjRelId
        // delete i.dataValues.patrolTaskId
        // delete i.dataValues.itemParentId
        delete i.dataValues.itemOrder
        delete i.dataValues.patrolObjRegion
      }
    }
    itemList.reslutModel = resModle
    return itemList
  }

  /**
   * 巡查考评中获取所有的场景列表 （可以理解成拉取taskiitems里面 level 是 1 的所有item项）
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async getScenceList (params:any): Promise<any> {
    // 根据id去重
    const secenceCondition = {
      where: { level: 1 },
      attributes: [
        [ Sequelize.fn('DISTINCT', Sequelize.col('patrol_task_item_id')), 'patrolTaskItemId' ],
        'patrolTaskId',
        'itemName'
      ]
    }
    const senceList = await (this as any).query('PatrolTaskItem', 'queryData', [ secenceCondition ])
    console.log('secenlist', senceList)
    return senceList
  }
  /**
   * app 获取 巡检任务巡检项详情 （已经做过提交的任务巡检项详情）
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async getTaskItemDetailByIdForApp (params:any): Promise<any> {
    const { patrolTaskItemId } = params
    if (!patrolTaskItemId) {
      throw Error(this.ctx.__('patrolTaskItem.noCorresponding'))
    }
    const TaskItem = await (this as any).query(
      'PatrolTaskItem',
      'findOneDataByPatrolTaskItemServiceGetTaskItemDetailByIdForApp',
      [ params ]
    )
    const patrolItemId = TaskItem && TaskItem.patrolItemId
    const patrolItemPath = TaskItem && TaskItem.path
    if (!patrolItemId) {
      throw Error(this.ctx.__('patrolTaskItem.noCorresponding'))
    }
    const patrolTaskId = TaskItem && TaskItem.patrolTaskId
    const taskContent = await (this as any).query('PatrolTaskItem', 'getObjIdByPatrolTaskItemId', [
      patrolTaskItemId
    ])
    // const patrolTaskId = taskContent.patrolTaskId
    const taskCondition1 = { where: { patrolTaskId } }
    const taskData = await (this as any).query('Task', 'findOneData', [ taskCondition1 ])
    let planData
    if (taskData && taskData.planId) {
      const planCondition = { where: { patrolPlanId: taskData.planId } }
      planData = await (this as any).query('PatrolPlan', 'queryOne', [ planCondition ])
    }

    let _PathArr = []
    // 直接一级巡检项上一串的itemid 都去找一把参考图片
    if (patrolItemPath) {
      const reg = /^\@|\@$/g
      _PathArr = patrolItemPath.replace(reg, '').split('@')
    }
    // 根据参考图的id去重  还有一条是针对这个问题或者任务巡检项对应的巡检对象id下
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
          const pic = await this.serviceIpicture.getRealPic(i.refPicUrl, (this as any).transaction)
          referImages.push(pic)
        }
      }
    }

    const taskCondition = {
      where: {
        patrolTaskId,
        objectId: taskContent && taskContent.patrolObjId
      },
      order: [[ 'processType', 'ASC' ]]
    }
    const PatrolTaskPerson = await (this as any).query('PatrolTaskPerson', 'queryManyAll', [ taskCondition ])
    if (PatrolTaskPerson && PatrolTaskPerson.length > 1) {
      // 升序排列即 有下一个步骤
      const personItem = PatrolTaskPerson[1]
      let taskRoleName = ''
      let extraNextPersonOn = ''
      if (personItem.processType === 1) {
        extraNextPersonOn = await (this as any).query('Process', 'getExtraNextPersonOnByTaskId', [
          patrolTaskId,
          1
        ])
        taskRoleName = this.ctx.__('patrolTaskItem.reviewer')
      } else if (personItem.processType === 2) {
        extraNextPersonOn = await (this as any).query('Process', 'getExtraNextPersonOnByTaskId', [
          patrolTaskId,
          1
        ])
        taskRoleName = this.ctx.__('patrolTaskItem.rectifiers')
      } else if (personItem.processType === 3) {
        extraNextPersonOn = await (this as any).query('Process', 'getExtraNextPersonOnByTaskId', [
          patrolTaskId,
          1
        ])
        taskRoleName = this.ctx.__('patrolTaskItem.looker')
      } else {
        throw Error(this.ctx.__('patrolTaskItem.roleWrongful'))
      }
      TaskItem.dataValues.extraNextPersonOn = extraNextPersonOn
      TaskItem.dataValues.taskRoleName = taskRoleName
      TaskItem.dataValues.defaultExecPerson = personItem.currentPerson
    }
    // 变电站中 任务巡检项对应 唯一的 巡检结论
    TaskItem.dataValues.patrolItemPath = await this.serviceICommon.partrolItemsPath(
      TaskItem.dataValues.path,
      (this as any).transaction
    )
    TaskItem.dataValues.scoreStatus = (planData && planData.scoreStatus) || 0
    TaskItem.dataValues.referImages = referImages || []
    TaskItem.dataValues.pageJson = (TaskItem.dataValues.pageJson && JSON.parse(TaskItem.dataValues.pageJson)) || null
    // TaskItem.dataValues.problemImages = await ctx.service.patrolTaskItem.getCapturedPicForXunJian(patrolTaskItemId, null, this.transaction) // 问题的处理图片
    TaskItem.dataValues.patrolObjItemStatus = TaskItem.patrolResult // 处理备注
    if (TaskItem.dataValues.taskExecList && TaskItem.taskExecList.patrolResult) {
      const copy = TaskItem.taskExecList.patrolResult
      const ObjTypeRes = {
        where: { orId: copy },
        attributes: [ 'orName', 'triggerNext' ]
      }
      const res = await (this as any).query('ObjTypeResult', 'findOneData', [ ObjTypeRes ])

      TaskItem.dataValues.taskExecList.patrolResult = {
        orId: copy,
        orName: res.orName,
        triggerNext: res.triggerNext
      }
      TaskItem.dataValues.taskExecList.execStatus = TaskItem.dataValues.taskExecList.status
    }
    TaskItem.dataValues.patrolObjItemStatus = TaskItem.patrolResult // 处理备注
    const problemImages = []
    if (TaskItem.taskExecList && TaskItem.taskExecList.picUrls) {
      const picIds = TaskItem.taskExecList.picUrls.split(',')
      for (const i of picIds) {
        if (i) {
          const pic = await this.serviceIpicture.getRealPic(i, (this as any).transaction)
          problemImages.push(pic)
        }
      }
      TaskItem.dataValues.problemImages = problemImages
    }
    // const TaskExec = await this.query('TaskExecSchema', 'queryDetail', [ patrolTaskItemCondition ])

    // TaskItem.dataValues.reCheckers = TaskExec.nextHandlePeople //
    // TaskItem.dataValues.copyMans = TaskExec.nextCopyPeople //
    // TaskItem.dataValues.result = TaskExec.recResult // 识别结果
    // TaskItem.dataValues.conclusion = TaskExec.resultDesc // 巡检备注
    TaskItem.dataValues.patrolObjId = taskContent.patrolObjId
    // 1.2 的需求 要在详情中 展示对象名称
    if (taskContent.patrolObjId) {
      const patrolObjIdCondition = { where: { patrolObjId: taskContent.patrolObjId } }
      const PatrolObj = await (this as any).query('PatrolObj', 'queryDataById', [ patrolObjIdCondition ])
      TaskItem.dataValues.patrolObjName = PatrolObj.patrolObjName
    }

    return TaskItem
  }

  /**
   * 根据巡检任务查巡检得分
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async getTaskItem (params:any): Promise<any> {
    const condition = { where: { patrolItemId: { [Op.or]: params } } }
    const result = await (this as any).query('PatrolTaskItem', 'queryManyAll', [ condition ])
    return result
  }
  @Transactional
  async getTaskItemByTaskId (params:any): Promise<any> {
    const condition = { where: { patrolTaskId: { [Op.or]: params } } }
    const result = await (this as any).query('PatrolTaskItem', 'queryManyAll', [ condition ])
    return result
  }
  /**
   * 查询巡检任务的总得分
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async countScoreByTaskId (params:any): Promise<any> {
    const { taskId, patrolObjRelId } = params
    let score = 0
    const condition:any = {
      where: { patrolTaskId: taskId },
      attributes: [ 'patrolScore' ]
    }
    if (patrolObjRelId) condition.where.patrolObjRelId = patrolObjRelId
    const data = await (this as any).query('PatrolTaskItem', 'queryManyAll', [ condition ])
    for (const item of data) {
      if (item.patrolScore) {
        score += item.patrolScore
      }
    }

    return score
  }
  @Transactional
  async queryOne (params:any): Promise<any> {
    const result = await (this as any).query('PatrolTaskItem', 'queryOneAndInfo', [ params ])
    // 查询当前任务的下一个环节是什么，一并在详情里返回
    const _taskExecResult = await this.serviceItaskExecResult.getExecResultByTask(
      { patrolTaskItemId: params.patrolTaskItemId },
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
      result.dataValues.nextFlowInfo = {
        processType,
        currentPerson: _nextFlowInfo.nextHandlePeople
      }
      if (_nextFlowInfo.nextHandlePeople) {
        const res = await this.serviceICommon.getUserInfoByUserIds(
          { userIds: _nextFlowInfo.nextHandlePeople },
          (this as any).transaction
        )
        result.dataValues.nextFlowInfo.personList = res.list
      } else result.dataValues.nextFlowInfo.personList = []
    } else {
      result.dataValues.nextFlowInfo = {
        processType: null,
        currentPerson: '',
        personList: []
      }
    }
    const excelist = result.dataValues.taskExecList
    result.dataValues.flowStatus =
      excelist &&
      excelist.taskFlowStatus &&
      excelist.taskFlowStatus.length > 0 &&
      excelist.taskFlowStatus[0] &&
      excelist.taskFlowStatus[0].status
    return result
  }
  /**
   * 根据任务巡检项id获取关联监测点的参考图
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async getCapturedPicByTaskItemId (taskItemId, taskPointId) {
    let res
    if (!taskPointId) {
      res = await (this as any).query('PlannedCapture', 'getCapturedPicByItemId', [ taskItemId ])
    } else {
      res = await (this as any).query('PlannedCapture', 'getCapturedPicByPointId', [ taskPointId ])
    }
    for (const item of res) {
      const realUrl =
        item.picUrl &&
        (await this.serviceICommon.getImageUrlForBS(item.picUrl, (this as any).transaction))
      item.picId = item.picUrl
      item.picUrl = realUrl && realUrl.picUrl
      item.cameraId = realUrl && realUrl.cameraId
      item.captureTime = realUrl && realUrl.createTime
    }

    return res
  }
  /**
   * 根据任务巡检项ID获取任务巡检项信息
   * @param {object} params
   * @return {string} - object
   * @author renxiaojian
   */
  @Transactional
  async getTaskItemInfo (params:any): Promise<any> {
    const result = await (this as any).query('PatrolTaskItem', 'getTaskItemInfo', [ params ])
    return result
  }
  /**
   * 获取当前任务巡检项关联的直接子级列表接口
   * @param {object} params
   * @return {string} - object
   * @author renxiaojian
   */
  @Transactional
  async getTaskItemTree (params:any): Promise<any> {
    let result = await (this as any).query('PatrolTaskItem', 'getTaskItemTree', [ params ])
    const patrolTaskItemIdArr = result.map(v => v.patrolTaskItemId)
    const condition = {
      attributes: [ 'patrolTaskItemId', 'pointResultId', 'patrolResult', 'nextCopyPeople', 'picUrls', 'resultDesc', 'patrolScore', 'pageJson' ],
      where: { patrolTaskItemId: { [Op.or]: patrolTaskItemIdArr } },
      raw: true
    }
    const submitedData = await (this as any).query('TaskExecSchema', 'queryManyAll', [ condition ])
    result = result.map(item => {
      const submitInfo = submitedData.find(v => v.patrolTaskItemId === item.patrolTaskItemId)
      if (submitInfo) {
        const submitItem:any = {
          pointResultId: submitInfo.pointResultId ? submitInfo.pointResultId : null,
          patrolResult: submitInfo.patrolResult ? submitInfo.patrolResult : null,
          picUrls: submitInfo.picUrls ? submitInfo.picUrls : null,
          resultDesc: submitInfo.resultDesc ? submitInfo.resultDesc : null,
          patrolScore: submitInfo.patrolScore ? submitInfo.patrolScore : null,
          nextCopyPeople: submitInfo.nextCopyPeople ? submitInfo.nextCopyPeople : null
        }
        if (submitInfo.pageJson) submitItem.pageJson = submitInfo.pageJson
        item = Object.assign({}, item, submitItem)
      }
      item.submitted = submitedData
        .map(submitItem => submitItem.patrolTaskItemId)
        .includes(item.patrolTaskItemId)
      return item
    })
    for (const v of result) {
      if (v.picUrls) {
        const arr = v.picUrls.split(',')
        const picArrInfo = []
        for (const n of arr) {
          const urlInfo = await this.serviceICommon.getImageUrlForBS(
            n,
            (this as any).transaction
          )
          if (typeof urlInfo === 'object') {
            urlInfo.base64 = urlInfo.picUrl
            picArrInfo.push(urlInfo)
          }
        }
        v.picUrl = picArrInfo
      } else v.picUrl = []
    }
    return result
  }
}
