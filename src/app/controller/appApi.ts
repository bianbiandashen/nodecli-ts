import { Context, inject, provide, Application } from 'midway'
import { get, controller, post } from '../../decorator/openApi'
import { BaseController } from '../core/base_controller'
import { IsceneDataService } from '../interface/sceneDataInterface'
import { ICommonService } from '../interface/commonInterface'
import { IpunchService } from '../interface/punchInterface'
import { IPatrolObjService } from '../interface/patrolObjInterface'
import { IpdmsService } from '../interface/pdmsInterface'
import { ItlncService } from '../interface/tlncInterface'
import { IAgentPersonService } from '../interface/agentPersonInterface'
import { IIsupmService } from '../interface/isUpmsInterface'
import { ItaskService } from '../interface/taskInterface'
import { IpatrolTaskItemService } from '../interface/patrolTaskItemInterface'
import { ITransactionFlowService } from '../interface/transactionFlowInterface'
import { IMqService } from '../interface/mqInterface'
import { ItaskExecResultService } from '../interface/taskExecResultInterface'
import { IpictureService } from '../interface/pictureInterface'
import { IPatrolObjTypeService } from '../interface/patrolObjTypeInterface'
import { IPatrolItemService } from '../interface/patrolItemInterface'
import { IpatrolTaskPointService } from '../interface/patrolTaskPointInterface'

@provide()
@controller('/')
export class AppApiController extends BaseController {
  @inject()
  app: Application;
  @inject()
  ctx: Context;
  @inject('sceneDataService')
  serviceIsceneData: IsceneDataService;
  @inject('commonService')
  serviceICommon: ICommonService;
  @inject('punchService')
  serviceIpunch: IpunchService;
  @inject('patrolObjService')
  serviceIPatrolObj: IPatrolObjService;
  @inject('pdmsService')
  serviceIpdms: IpdmsService;
  @inject('tlncService')
  serviceItlnc: ItlncService;
  @inject('agentPersonService')
  serviceIAgentPerson: IAgentPersonService;
  @inject('agentPersonService')
  serviceIIsupm: IIsupmService;
  @inject('taskService')
  serviceItask: ItaskService;
  @inject('patrolTaskItemService')
  serviceIpatrolTaskItem: IpatrolTaskItemService;
  @inject('transactionFlowService')
  serviceItransactionFlow: ITransactionFlowService;
  @inject('mqService')
  serviceIMq: IMqService;
  @inject('taskExecResultService')
  serviceItaskExecResult: ItaskExecResultService;
  @inject('pictureService')
  serviceIpicture: IpictureService;
  @inject('patrolObjTypeService')
  serviceIPatrolObjType: IPatrolObjTypeService;
  @inject('patrolItemService')
  serviceIPatrolItem: IPatrolItemService;
  @inject('patrolPointService')
  serviceIpatrolTaskPoint: IpatrolTaskPointService;
  /**
   * @summary 获取app配置任务
   * @description 获取app配置任务
   * @Router GET /api/v1/appApi/config/appConfig
   */
  @get('api/v1/appApi/config/appConfig')
  async appConfig () {
    const { ctx } = this
    const data = await this.serviceIsceneData.findBySchemaCode({ where: { appIdentify: ctx.headers.appid, page: 'AppConfigure' }, order: [[ 'updateTime', 'DESC' ]] })
    this.success(data)
  }

  /**
   * @summary 获取当前服务器支持多少个场景 【1.2 新增】 1.3 改为java 获取
   * @description 获取当前服务器支持多少个场景
   * @Router GET /api/v1/appApi/common/getParkConfig
   * @response 200 searchAgentResponse 成功
   */


  @get('api/v1/appApi/common/getParkConfig')
  async getAppIdByPublicBySchema () {
    const data = await this.serviceICommon.getAppIdByPublicBySchema()
    // 设置响应体和状态码
    this.success(data)
  }
  /**
   * @summary 在扫码或者NFC打卡完后上传结果给服务端生成记录 【1.2 新增】
   * @description 在扫码或者NFC打卡完后上传结果给服务端生成记录
   * @request body punchRequest *body
   * @Router post /api/v1/appApi/task/commitPunchResult
   * @response 200 searchAgentResponse 成功
   */
  @post('api/v1/appApi/task/commitPunchResult')
  async punchAdd () {
    const { ctx } = this
    const userId = ctx.req.headers.userid
    const punchTime = this.app.dateFormatter(new Date(), 'yyyy-MM-dd hh:mm:ss')
    const punchResult = Object.assign({}, ctx.request.body, {
      punchUserId: userId,
      punchTime
    })
    try {
      const data = await this.serviceIpunch.punchAdd(punchResult)
      // 设置响应体和状态码
      this.success(data)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally {
      // 操作日志一般写在controller层的finally语句块
      this.operateLog(
        '巡检打卡点处理',
        '巡检打卡新增',
        `APP 巡检打卡新增 ----打卡时间${punchTime}`,
        'APP 巡检打卡新增',
        'APP 巡检打卡新增 ',
        `APP 巡检打卡新增 ----打卡时间${punchTime}`,
        1
      )
    }
  }
  /**
   * @summary 巡检对象添加
   * @description 巡检对象添加
   * @Router POST api/v1/appApi/patrolObj/add
   * @request body patrolObjAddRequest *body
   * @response 200 successObjResponse 创建成功
   */

  @post('api/v1/appApi/patrolObj/add')
  async patrolObjAdd () {
    const { ctx } = this
    const data = await this.serviceIPatrolObj.objectsCustomCreateService(ctx.request.body)
    // // 设置响应体和状态码
    this.success(data)
  }
  //  1、获取当前用户下的请假代理记录（返回信息：时间、人员信息、状态）
  //  2、创建请假代理（参数：时间段、人员信息）
  //  3、选择代理人：获取当前组织的其他人（展示当前组织的其他人，由于数量不多，无需搜索，权限移交给被人的人不展示）
  //  4、请假代理详情（返回信息：状态、时间段、代理人）
  //  5、收回代理
  //  6、删除请假代理信息
  /**
   * @summary 消息全部已读
   * @description 消息全部已读
   * @Router POST api/v1/appApi/message/updateAll
   * @request body messageAllRequest *body
   * @response 200 successObjResponse 创建成功
   */

  @post('api/v1/appApi/message/updateAll')
  async messageAll () {
    const { ctx } = this

    try {
      const resultBody = await this.serviceIpdms.updateAllMessageReadFlag(ctx.req.headers)
      this.success(resultBody)
    } catch (error) {
      this.fail(this.ctx.__('appApi.searchFailed'), error)
    }
  }
  /**
   * @summary 删除消息
   * @description 删除消息
   * @Router POST api/v1/appApi/message/delete
   * @request body messageDelRequest *body
   * @response 200 successObjResponse 创建成功
   */

  @post('api/v1/appApi/message/delete')
  async messageDel () {
    const { ctx } = this
    try {
      const resultBody = await this.serviceIpdms.messageDelete(ctx.request.body)
      this.success(resultBody)
    } catch (error) {
      this.fail(this.ctx.__('appApi.searchFailed'), error)
    }
  }
  /**
   * @summary 删除代办
   * @description 删除代办
   * @Router POST api/v1/appApi/agency/delete
   * @request body agencyDelRequest *body
   * @response 200 successObjResponse 创建成功
   */

  @post('api/v1/appApi/agency/delete')
  async agencyDel () {
    const { ctx } = this
    try {
      const resultBody = await this.serviceIpdms.agencyDelete(ctx.request.body)
      this.success(resultBody)
    } catch (error) {
      this.fail(this.ctx.__('appApi.searchFailed'), error)
    }
  }
  /**
   * @summary 消息代办新增
   * @description 消息代办新增接口
   * @Router POST api/v1/appApi/tlnc/mq
   * @request body mqRequest *body
   * @response 200 successObjResponse 创建成功
   */

  @post('api/v1/appApi/tlnc/mq')
  async tlnc () {
    const { ctx } = this
    try {
      const resultBody = await this.serviceItlnc.mq(ctx.request.body)
      this.success(resultBody)
    } catch (error) {
      this.fail(this.ctx.__('appApi.searchFailed'), error)
    }
  }
  /**
   * @summary 获取当前用户下的请假代理记录
   * @description 获取当前用户下的请假代理记录（返回信息：时间、人员信息、状态）
   * @Router GET api/v1/appApi/agent/search
   * @response 200 searchAgentResponse 成功
   */
  @get('api/v1/appApi/agent/search')
  async agentSearch () {
    const { ctx } = this
    const userId = ctx.req.headers.userid
    const data = await this.serviceIAgentPerson.agentSearch(userId)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 获取当前用户下的请假代理记录详情
   * @description 获取当前用户下的请假代理记录（返回信息：时间、人员信息、状态）
   * @Router GET api/v1/appApi/agent/getDetail
   * @response 200 searchAgentDetailResponse 成功
   */
  @get('api/v1/appApi/agent/getDetail')
  async agentGetDetail () {
    const { ctx } = this
    const data = await this.serviceIAgentPerson.agentGetDetail(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 获取当前用户是否有进行中的代理任务和发起的代理
   * @description 获取当前用户是否有进行中的代理任务和发起的代理
   * @Router GET api/v1/appApi/agent/judgeAgentInfo
   * @response 200 judgeAgentInfoResponse 成功
   */
  @get('api/v1/appApi/agent/judgeAgentInfo')
  async judgeAgentInfo () {
    const { ctx } = this
    const userId = ctx.req.headers.userid
    const data = await this.serviceIAgentPerson.judgeAgentInfo(userId)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 创建请假代理（参数：时间段、人员信息）
   * @description 创建请假代理（参数：时间段、人员信息）
   * @Router POST api/v1/appApi/agent/add
   * @request body addAgentRequest *body
   * @response 200 successObjResponse 创建成功
   */
  @post('api/v1/appApi/agent/add')
  async agentAdd () {
    const { ctx } = this
    const userId = ctx.req.headers.userid
    const data = await this.serviceIAgentPerson.agentAdd(ctx.request.body, userId)
    // // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 选择代理人：获取当前组织的其他人（展示当前组织的其他人，由于数量不多，无需搜索，权限移交给被人的人不展示）
   * @description  选择代理人：获取当前组织的其他人（展示当前组织的其他人，由于数量不多，无需搜索，权限移交给被人的人不展示）
   * @Router GET api/v1/appApi/agent/agentUserList
   * @response 200 agentUserListResponse 成功
   */
  @get('api/v1/appApi/agent/agentUserList')
  async agentUserList () {
    const { ctx } = this
    const userId = ctx.req.headers.userid
    const data = await this.serviceIAgentPerson.getOtherPersonByUserOrgId(userId)
    // // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 删除请假代理
   * @description  删除请假代理
   * @Router POST api/v1/appApi/agent/delete
   * @request body deleteAgentRequest *body
   * @response 200 successObjResponse 创建成功
   */
  @post('api/v1/appApi/agent/delete')
  async agentDelete () {
    const { ctx } = this
    const data = await this.serviceIAgentPerson.agentDelete(ctx.request.body)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 收回请假代理
   * @description  收回请假代理
   * @Router POST api/v1/appApi/agent/withdrawalOfLeave
   * @request body updateAgentRequest *body
   * @response 200 successObjResponse 创建成功
   */
  @post('api/v1/appApi/agent/withdrawalOfLeave')
  async agentWithdrawalOfLeave () {
    const { ctx } = this
    const data = await this.serviceIAgentPerson.agentWithdrawalOfLeave(ctx.request.body)
    // // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 巡检对象查询
   * @description 巡检对象查询
   * @Router POST api/v1/appApi/patrolObj/search
   * @request body searchObjRequest *body
   * @response 200 searchObjResponse 创建成功
   */

  @post('api/v1/appApi/patrolObj/search')
  async patrolObjSearch () {
    const { ctx } = this
    // const params = ctx.request.body || {}
    // if (formatChar(params) === false) {
    //   return this.fail('参数不能含有特殊字符！')
    // }
    const userId = ctx.req.headers.userid
    const dataPam = ctx.request.body
    dataPam.userId = userId
    const data = await this.serviceIPatrolObj.patrolObjQueryService(dataPam)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary NFC/二维码绑定到巡检对象
   * @description NFC/二维码绑定到巡检对象
   * @Router POST api/v1/appApi/patrolObj/editPatrolObj/update
   * @request body updateObjRequest *body
   * @response 200 successObjResponse 创建成功
   */

  @post('api/v1/appApi/patrolObj/editPatrolObj/update')
  async patrolObjUpdate () {
    const { ctx } = this
    const data = await this.serviceIPatrolObj.editPatrolObjService(ctx.request.body)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 区域树-异步树
   * @description 区域树-异步树
   * @Router GET api/v1/appApi/getOrgList
   * @request body asyncTreeRequest *body
   * @response 200 asyncTreeResponse
   */

  @get('api/v1/appApi/getOrgList')
  async asyncTreeRequest () {
    const { ctx } = this
    let responseData
    const { parentId = -1, pageNo = 1, pageSize = 1000 } = ctx.request.query
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_region/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo,
          pageSize,
          fields:
            'model_data_id,parent_region_id,region_id,region_name,region_path,description,update_time,create_time',
          filedOptions: [
            {
              fieldName: 'parent_region_id',
              fieldValue: parentId,
              type: 'eq'
            }
          ]
        }
      }
    )
    responseData = ctx.helper.bufferToJson(result.data)
    this.success(ctx.helper.handleData(responseData.data))
  }

  /**
   * @summary 问题上报模块获取用户对应的personid -》通过 personid 再找到 personid下 所有的区域(该区域即为组织)
   * @description 获取用户对应的personid -》通过 personid 再找到 personid下 所有的区域(该区域即为组织)
   * @Router GET /api/v1/appApi/user/getPersonReigonListByUserId/get
   * @response 200 personReigonListResponse
   */
  @get('api/v1/appApi/user/getPersonReigonListByUserId/get')
  async getPersonReigonListByUserId () {
    const { ctx } = this
    //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
    // 调用 service 创建一个 topic
    //    try {
    const userId = ctx.req.headers.userid
    const id = await this.serviceIIsupm.getPersonReigonListByUserId(userId)
    // 设置响应体和状态码
    this.success(id)
  }

  /**
   * @summary 问题上报模块获取人员组织id下的所有对象
   * @description 获取人员组织id下的所有对象
   * @Router GET /api/v1/appApi/patrolObject/getObjectListByOrgId/get
   * @request query  orgId *string 组织Id
   * @response 200 getObjectListResponse
   */
  @get('api/v1/appApi/patrolObject/getObjectListByOrgId/get')
  async getObjectListByOrgId () {
    const { ctx } = this
    //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
    // 调用 service 创建一个 topic
    //    try {
    // const userId = ctx.req.headers.userid
    const { regionId, orgId } = ctx.request.query
    let id
    if (regionId) {
      id = await this.serviceIIsupm.getObjectListByRegionId(ctx.request.query)
    } else if (orgId) {
      id = await this.serviceIIsupm.getObjectListByOrgId(ctx.request.query)
    }

    // 设置响应体和状态码
    this.success(id)
  }

  /**
   * @summary 获取任务下的对象列表
   * @description 获取任务下的对象列表
   * @Router GET /api/v1/appApi/task/getObjListByTaskId
   * @request query  patrolTaskId *string 任务id
   * @response 200 getObjectListResponse
   */
  @get('api/v1/appApi/task/getObjListByTaskId')
  async getObjListByTaskId () {
    const { ctx } = this
    const id = await this.serviceItask.getObjListByTaskId(ctx.request.query)
    // 设置响应体和状态码
    this.success(id)
  }

  /**
   * @summary 获取任务下的额外信息
   * @description 获取任务下的额外信息
   * @Router GET /api/v1/appApi/task/getExtendInfo
   * @request query  patrolTaskId *string 任务id
   * @response 200 getObjectListResponse
   */
  @get('api/v1/appApi/task/getExtendInfo')
  async getExtendInfo () {
    const { ctx } = this
    //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
    // 调用 service 创建一个 topic
    try {
      // const userId = ctx.req.headers.userid

      const id = await this.serviceItask.getExtendTaksInfo(ctx.request.query)
      // 设置响应体和状态码
      this.success(id)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally {
      // 操作日志一般写在controller层的finally语句块
      this.operateLog(
        'log.moduleId.patrolTask.displayName',
        'log.objectType.model_patrol_task.displayName',
        this.ctx.__('appApi.getExtendInfoOperateLog1'),
        'log.action.recive.displayName',
        this.ctx.__('appApi.getExtendInfoOperateLog2'),
        'log.actionMessageId.recevie_patrol_task.message',
        1
      )
    }
  }

  // getObjListByTaskId

  /**
   * @summary 问题上报模块获取对象下所有巡检项
   * @description 获取对象下所有巡检项
   * @Router GET /api/v1/appApi/patrolItems/getPatrolItemsByObjectId/get
   * @request query  patrolObjId *string 对象Id
   * @response 200 getPatrolItemsResponse
   */
  @get('api/v1/appApi/patrolItems/getPatrolItemsByObjectId/get')
  async getPatrolItemsByObjectId () {
    const { ctx } = this
    //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
    // 调用 service 创建一个 topic
    //    try {
    // const userId = ctx.req.headers.userid
    const id = await this.serviceIIsupm.getPatrolItemsByObjectId(ctx.request.query)
    // 设置响应体和状态码
    this.success(id)
  }

  /**
   * @summary 现场计划巡检列表
   * @description 现场计划巡检列表 -----任务列表接口  支持默认status 120排序，已完成的不展示
   * @Router GET /api/v1/appApi/task/sitePlanInspection/search
   * @request body sitePlanInspectionRequset *body
   * @response 200 sitePlanInspectionResponse 创建成功
   */
  @get('api/v1/appApi/task/sitePlanInspectionList/search')
  async sitePlanInspectionList () {
    const { ctx } = this
    //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
    // 调用 service 创建一个 topic
    try {
      const userId = ctx.req.headers.userid

      const id = await this.serviceItask.sitePlanInspectionList(ctx.request.query, userId)
      // 设置响应体和状态码
      this.success(id)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally {
      // 操作日志一般写在controller层的finally语句块
      this.operateLog(
        'log.moduleId.patrolTask.displayName',
        'log.objectType.model_patrol_task.displayName',
        this.ctx.__('appApi.sitePlanInspectionListOperateLog'),
        'log.action.recive.displayName',
        this.ctx.__('appApi.sitePlanInspectionListOperateLog'),
        'log.actionMessageId.recevie_patrol_task.message',
        1
      )
    }
  }

  /**
   * @summary 现场计划巡检 ->巡检任务详情  ->按照区域划分 ->  聚合巡检对象 app list 接口 变电站
   * @description 现场计划巡检 app list 接口 变电站
   * @Router GET /api/v1/appApi/task/patrolObjListInRegionByTaskId/search
   * @request body patrolObjListInRegionByTaskIdRequset *body
   * @response 200 patrolObjListInRegionByTaskIdResponse 创建成功
   */
  @get('api/v1/appApi/task/patrolObjListInRegionByTaskId/search')
  async patrolObjListInRegionByTaskIdList () {
    const { ctx } = this
    //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
    // 调用 service 创建一个 topic
    //    try {
    // const userId = ctx.req.headers.userid
    const id = await this.serviceItask.patrolObjListInRegionByTaskId(ctx.request.query)
    // 设置响应体和状态码
    this.success(id)
  }

  /**
   * @summary 任务详情查询接口 （app 巡检任务详情）
   * @description 筛选条件是任务patrolTaskId
   * @Router get /api/v1/appApi/task/detail/get/by_TaskIdAndTaskId
   * @request  query  patrolTaskId *string 巡检任务id
   * @response 200 taskDetailResponse 创建成功
   */

  @get('api/v1/appApi/task/detail/get/by_TaskId')
  async getDetailByTaskId () {
    const { ctx } = this
    // 校验 `ctx.request.body` 是否符合我们预期的格式
    // 调用 service 创建一个 topic
    console.log('parma++++++++++++++++', ctx.request.query)
    const data = await this.serviceItask.getTaskInfoByTaskId(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }
  /**
   * @summary 获取任务的巡检项列表  通过对象id 和 任务id （app 巡检任务巡检项列表）
   * @description 获取任务的巡检项列表  通过对象id 和 任务id （app 巡检任务巡检项列表）
   * @Router get /api/v1/appApi/task/getTaskItemListbyTaskIdAndObjId/search
   * @request query  patrolTaskId *string 巡检项任务ID  patrolObjId *string 对象id
   * @response 200 getTaskItemLislResponse
   */

  @get('api/v1/appApi/task/getTaskItemListbyTaskIdAndObjId/search')
  async getTaskItemList () {
    const { ctx } = this
    const data = await this.serviceIpatrolTaskItem.getTaskItemListbyTaskIdAndObjId(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 重新指派任务（app端使用）
   * @description 重新指派任务（app端使用）
   * @Router get /api/v1/appApi/task/toAssign
   * @request body taskToAssignRequest *body
   * @response 200  创建成功
   */

  @post('api/v1/appApi/task/toAssign')
  async toAssign () {
    const { ctx } = this
    const params = ctx.request.body
    params.appId = ctx.req.headers.appid
    const data = await this.serviceItask.toAssign(params)
    // 设置响应体和状态码
    this.success(data)
  }
  /**
   * @summary 获取子巡检项的结论 图片和  通过patrolTaskItemId
   * @description 获取子巡检项的结论 图片和  通过patrolTaskItemId
   * @Router get /api/v1/appApi/getChildrenTaskResult
   * @request  query  patrolItemId *string 巡检项id patrolTaskId *string 巡检任务id
   * @response 200 getTaskItemDetailResponse
   */
  @get('api/v1/appApi/getChildrenTaskResult')
  async getChildrenTaskResult () {
    const { ctx } = this

    const data = await this.serviceIpatrolTaskItem.getChildrenTaskResult(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 获取任务巡检项详情  通过patrolTaskItemId （app 获取任务巡检项详情
   * @description 获取任务巡检项详情  通过patrolTaskItemId （app 获取任务巡检项详情
   * @Router get /api/v1/appApi/task/getTaskItemDetailByIdForApp/getDetailByTaskItemId/get
   * @request query  patrolTaskItemId *string 任务巡检项ID
   * @response 200 getTaskItemDetailResponse
   */
  @get('api/v1/appApi/task/getTaskItemDetailByIdForApp/getDetailByTaskItemId/get')
  async getTaskItemDetailByIdForApp () {
    const { ctx } = this
    try {
      console.log('getTaskItemDetailByIdForAppgetTaskItemDetailByIdForApp', ctx.request.query)
      const data = await this.serviceIpatrolTaskItem.getTaskItemDetailByIdForApp(ctx.request.query)
      // 设置响应体和状态码
      this.success(data)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally {
      // 操作日志一般写在controller层的finally语句块
      this.operateLog(
        'log.moduleId.patrolTask.displayName',
        'log.objectType.model_patrol_task.displayName',
        this.ctx.__('appApi.getTaskItemDetailByIdForAppOperateLog'),
        'log.action.recive.displayName',
        this.ctx.__('appApi.getTaskItemDetailByIdForAppOperateLog'),
        'log.actionMessageId.recevie_patrol_task.message',
        1
      )
    }
  }

  /**
   * @summary 问题处理接口 创建新的问题流程 复核 整改 审核 都用这个接口
   * @description 巡检项确认是问题后，创建新的问题 复核 整改 审核 都用这个接口
   * @Router POST /api/v1/appApi/transactionFlow/question/add
   * @request body transactionFlowRequest *body
   * @response 200 transactionFlowResponse 创建成功
   */
  @post('api/v1/appApi/transactionFlow/question/add')
  async questionHandle () {
    const { ctx } = this
    const {
      relativeId, judge, info, execUsers, copyUsers
      //  status
    } = ctx.request.body
    const userId = ctx.req.headers.userid
    try {
      const data = await this.serviceItransactionFlow.nextStep(
        relativeId,
        judge,
        info,
        execUsers,
        copyUsers,
        userId,
        // status
      )
      const params = ctx.request.body
      params.appId = ctx.req.headers.appid
      // params.userId = userId
      params.relativeId = relativeId
      // 删除消息得功能　－－－－－－－－－－－－－－ 一定要加 不然的话 ios 那边 通知栏 点进去会有问题
      await this.serviceIpdms.messageDelete(params)
      // 增加删除代办的功能　－－－－－－－－－－－－
      await this.serviceIpdms.agencyDelete(params)
      //

      console.log('问题处理进入待办的数据结构====================', params)
      await this.serviceIMq.questionHandleMq(params)
      // 设置响应体和状态码
      this.success(data)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally {
      // 操作日志一般写在controller层的finally语句块
      this.operateLog(
        'log.moduleId.patrolTask.displayName',
        'log.objectType.model_patrol_task.displayName',
        this.ctx.__('appApi.questionHandleOperateLog'),
        'log.action.recive.displayName',
        this.ctx.__('appApi.questionHandleOperateLog'),
        'log.actionMessageId.recevie_patrol_task.message',
        1
      )
    }
  }

  /**
   * @summary 社区巡检任务提交完成按钮
   * @description 社区巡检任务提交完成按钮点击
   * @Router POST /api/v1/appApi/taskItem/submitFinsh/add
   * @request body taskCommunitySubmitRequest *body
   * @response 200 transactionFlowResponse 创建成功
   */
  @post('api/v1/appApi/taskItem/submitFinsh/add')
  async taskCommunitySubmit () {
    try {
      const { ctx } = this
      // const { taskId } = ctx.request.body
      const userId = ctx.req.headers.userid
      const data = await this.serviceIpatrolTaskItem.taskCommunitySubmit(ctx.request.body, userId)
      // 设置响应体和状态码
      this.success(data)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally {
      // 操作日志一般写在controller层的finally语句块
      this.operateLog(
        'log.moduleId.patrolTask.displayName',
        'log.objectType.model_patrol_task.displayName',
        this.ctx.__('appApi.taskCommunitySubmitOperateLog'),
        'log.action.recive.displayName',
        this.ctx.__('appApi.taskCommunitySubmitOperateLog'),
        'log.actionMessageId.recevie_patrol_task.message',
        1
      )
    }
  }

  /**
   * @summary 接收问题
   * @description 接收问题
   * @Router POST /api/v1/appApi/transactionFlow/question/acceptProblem
   * @request body transactionAcceptProblemRequest *body
   * @response 200  创建成功
   */
  @post('api/v1/appApi/transactionFlow/question/acceptProblem')
  async acceptProblem () {
    const { ctx } = this
    //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
    // 调用 service 创建一个 topic
    //    try {
    const { relativeId } = ctx.request.body
    const userId = ctx.req.headers.userid
    try {
      const data = await this.serviceItransactionFlow.acceptProblem(relativeId, userId)

      // 设置响应体和状态码
      this.success(data)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally {
      // 操作日志一般写在controller层的finally语句块
      this.operateLog(
        'log.moduleId.patrolTask.displayName',
        'log.objectType.model_patrol_task.displayName',
        this.ctx.__('appApi.acceptProblemOperateLog'),
        'log.action.recive.displayName',
        this.ctx.__('appApi.acceptProblemOperateLog'),
        'log.actionMessageId.recevie_patrol_task.message',
        1
      )
    }
  }

  /**
   * @summary 问题创建接口 供java端调用
   * @description
   * @Router POST /api/v1/appApi/transactionFlow/question/createFlow
   * @request body transactionFlowRequest *body
   * @response 200 transactionFlowResponse 创建成功
   */
  @post('api/v1/appApi/transactionFlow/question/createFlow')
  async createFlow () {
    const { ctx } = this
    //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
    // 调用 service 创建一个 topic
    //    try {
    const {
      relativeId, execUsers, copyUsers, modifier, pageJson
    } = ctx.request.body
    //
    try {
      const id = await this.serviceItransactionFlow.createFlow(
        relativeId,
        execUsers,
        copyUsers,
        modifier,
        pageJson
      )

      const execType = await this.serviceItaskExecResult.getExecTypeByRelativeId(relativeId)

      // 发送复核待办@TODO待调试自动巡检时复核的待办
      console.log(
        '自动巡检结论创建成功，准备发送待办和消息的MQ，结论提交参数为：',
        ctx.request.body
      )
      console.log('========复核relativeId：', relativeId)
      this.app.hikLogger.debug(
        this.ctx.__('appApi.createFlowDebug'),
        ctx.request.body
      )
      this.app.hikLogger.debug('========复核relativeId：', relativeId)
      this.app.hikLogger.debug('========execTypeexecTypeexecTypeexecTypeexecType', execType)
      // 智能巡检 只有在这里可以发送待办了
      if (execType === 0) {
        const tlncParams = {
          pointResultIds: [ relativeId ],
          type: 'questionSubmit'
        }
        await this.serviceIpatrolTaskItem.createTlnc(tlncParams)
      }

      // 设置响应体和状态码
      this.success(id)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally {
      // 操作日志一般写在controller层的finally语句块
      this.operateLog(
        'log.moduleId.patrolTask.displayName',
        'log.objectType.model_patrol_task.displayName',
        this.ctx.__('appApi.createFlowOperateLog'),
        'log.action.recive.displayName',
        this.ctx.__('appApi.createFlowOperateLog'),
        'log.actionMessageId.recevie_patrol_task.message',
        1
      )
    }
  }

  /**
   * @summary 实现 社区场景下 获取task 下所有的一级巡检项
   * @description 实现 社区场景下 获取task 下所有的一级巡检项
   * @Router get /api/v1/appApi/getTaskFirstItemsByTaskId/by_TaskId
   * @request  query  patrolTaskId *string 巡检任务id
   * @response 200 taskDetailResponse 创建成功
   */
  @get('api/v1/appApi/getTaskFirstItemsByTaskId/by_TaskId')
  async getTaskFirstItemsByTaskId () {
    const { ctx } = this
    // 校验 `ctx.request.body` 是否符合我们预期的格式
    // 调用 service 创建一个 topic
    // console.log('parma++++++++++++++++', ctx.request.query)
    const data = await this.serviceItask.getTaskFirstItemsByTaskId(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 获取人下面关联的所有对象 （对应app 获取人下面关联的所有对象 变电站
   * @description 获取人下面关联的所有对象 （对应app 获取人下面关联的所有对象
   * @Router GET /api/v1/appApi/task/getObjListByPerson/search
   * @request body getObjListByPersonRequset *body
   * @response 200 getObjListByPersonResponse 创建成功
   */
  @get('api/v1/appApi/task/getObjListByPerson/search')
  async getObjListByPerson () {
    const { ctx } = this
    //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
    // 调用 service 创建一个 topic
    //    try {
    const userId = ctx.req.headers.userid
    const id = await this.serviceIpatrolTaskItem.getObjListByPerson(ctx.request.query, userId)
    // 设置响应体和状态码
    this.success(id)
  }

  /**
   * @summary 实现 社区场景下 下所有一级巡检项 以下的 所有巡检项
   * @description 实现 社区场景下 下所有一级巡检项 以下的 所有巡检项
   * @Router get /api/v1/appApi/task/getOtherTaskItemsByFirstTaskItemId/by_TaskId
   * @request  query  patrolItemId *string 巡检项id patrolTaskId *string 巡检任务id
   * @response 200 taskDetailResponse 创建成功
   */
  @get('api/v1/appApi/getOtherTaskItemsByFirstTaskItemId/by_TaskId')
  async getOtherTaskItemsByFirstTaskItemId () {
    const { ctx } = this
    // 校验 `ctx.request.body` 是否符合我们预期的格式
    // 调用 service 创建一个 topic
    console.log('parma++++++++++++++++', ctx.request.query)
    const data = await this.serviceItask.getOtherTaskItemsByFirstTaskItemId(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 获取问题列表根据流程id （app使用）
   * @description  获取问题列表根据对象id （app使用）
   * @Router get /api/v1/appApi/transactionFlow/getTransactionFlowList/search
   * @request  query  getTransactionFlowListRequest *body
   * @response 200 getTransactionFlowListResponse *body
   */

  @get('api/v1/appApi/transactionFlow/getTransactionFlowList/search')
  async getTransactionFlowList () {
    const { ctx } = this
    //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
    // 调用 service 创建一个 topic
    //    try {   //     const userId = ctx.req.headers.use
    const response = await this.serviceItransactionFlow.getTransactionFlowList(ctx.request.query)
    // 设置响应体和状态码
    this.success(response)
  }

  /**
   * @summary 获取问题列表根据对象id聚合 （app使用）
   * @description  获取问题列表根据对象id聚合  （app使用）
   * @Router get /api/v1/appApi/transactionFlow/listByObjId/search
   * @request body transactionFlowlistByObjIdRequest *body
   * @response 200  创建成功
   */
  @get('api/v1/appApi/transactionFlow/listByObjId/search')
  async listByObjId () {
    const { ctx } = this
    //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
    // 调用 service 创建一个 topic
    //    try {

    const userId = ctx.req.headers.userid

    const response = await this.serviceItransactionFlow.getlistByObjId(ctx.request.query, userId)
    // 设置响应体和状态码
    this.success(response)
  }

  /**
   * @summary 创建巡检结论
   * @description 创建巡检结论
   * @Router POST /api/v1/appApi/inspectionConclusion/add
   * @request body inspectionConclusionCreateRequest *body
   * @response 200 inspectionConclusionResponse 创建成功
   */
  @post('api/v1/appApi/inspectionConclusion/add')
  async createConclusionByApp () {
    const { ctx } = this
    const userId = ctx.req.headers.userid
    // 校验 `ctx.request.body` 是否符合我们预期的格式
    // ctx.validate(rule, ctx.request.body); // 或者ctx.request.query
    // 调用 service 创建一个 topic
    try {
      const id = await this.serviceIpatrolTaskItem.createByApp(ctx.request.body, userId)
      // 设置响应体和状态码
      this.ctx.body = id
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally {
      // 操作日志一般写在controller层的finally语句块
      this.operateLog(
        'log.moduleId.patrolTask.displayName',
        'log.objectType.model_patrol_task.displayName',
        this.ctx.__('appApi.createConclusionByAppOperateLog'),
        'log.action.recive.displayName',
        this.ctx.__('appApi.createConclusionByAppOperateLog'),
        'log.actionMessageId.recevie_patrol_task.message',
        1
      )
    }
  }

  /**
   * @summary app 右上角提交按钮触发接口
   * @description 右上角提交按钮触发接口
   * @Router POST /api/v1/appApi/task/submit
   * @request body inspectionConclusionCreateRequest *body
   * @response 200 inspectionConclusionResponse 创建成功
   */
  @post('api/v1/appApi/task/submit')
  async taskSubmit () {
    const { ctx } = this
    const userId = ctx.req.headers.userid
    // 校验 `ctx.request.body` 是否符合我们预期的格式
    // ctx.validate(rule, ctx.request.body); // 或者ctx.request.query
    // 提交方式 0-线上 1-线下 不填默认线上
    try {
      ctx.request.body.subType = 1
      const id = await this.serviceIpatrolTaskItem.taskSubmit(ctx.request.body, userId)
      // 设置响应体和状态码
      this.ctx.body = id
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally {
      // 操作日志一般写在controller层的finally语句块
      this.operateLog(
        'log.moduleId.patrolTask.displayName',
        'log.objectType.model_patrol_task.displayName',
        this.ctx.__('appApi.taskSubmitOperateLog1'),
        'log.action.recive.displayName',
        this.ctx.__('appApi.taskSubmitOperateLog2'),
        'log.actionMessageId.recevie_patrol_task.message',
        1
      )
    }
  }

  /**
   * @summary 区域树-异步树 (有权限的区域异步树)
   * @description 区域树-异步树  (有权限的区域异步树)
   * @Router GET /api/v1/appApi/getRegionList
   * @request body asyncTreeRequest *body
   * @response 200 asyncTreeResponse
   */
  @get('api/v1/appApi/getRegionList')
  async asyncTree () {
    const { ctx } = this
    const userId = ctx.req.headers.userid
    const result = await this.serviceIpdms.asyncTreeByLimitByAPP(userId)
    this.success(result)
  }
  /**
   * @summary  社区那边根据 一级巡检项 获取一级巡检项下面所有的 问题列表
   * @description   社区那边根据 一级巡检项 获取一级巡检项下面所有的 问题列表
   * @Router get /api/v1/appApi/transactionFlow/getQuestionlistByFirstItemId/get
   * @request body getQuestionlistByFirstTaskItemIdRequest *body
   * @response 200 getQuestionlistResponse
   */

  @get('api/v1/appApi/transactionFlow/getQuestionlistByFirstItemId/get')
  async getQuestionlistByFirstTaskItemId () {
    const { ctx } = this
    // ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
    // 调用 service 创建一个 topic
    // try {
    const userId = ctx.req.headers.userid
    const response = await this.serviceItransactionFlow.getQuestionlistByFirstItemId(
      ctx.request.query,
      userId
    )
    // 设置响应体和状态码
    this.success(response)
  }

  /**
   * @summary 获取问题详情 （app使用）
   * @description  获取问题详情 （app使用）
   * @Router get /api/v1/appApi/transactionFlow/getQuestionInfo/by_TransationId
   * @request body getQuestionInfoByTransationId Request *body
   * @response body getQuestionByTransationId Request *body
   */
  @get('api/v1/appApi/transactionFlow/getQuestionInfo/by_TransationId')
  async getQuestionInfo () {
    const { ctx } = this
    //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
    // 调用 service 创建一个 topic
    //    try {

    // const userId = ctx.req.headers.userid
    const response = await this.serviceItransactionFlow.getQuestionInfo(ctx.request.query)
    // 设置响应体和状态码
    this.success(response)
  }

  // --------------------------------------------------------------------------------common ----------
  /**
   * @summary  查询全部用户
   * @description 查询全部用户-不分页
   * @Router get /api/v1/appApi/common/getUserList/search
   */
  @get('api/v1/appApi/common/getUserList/search')
  async getUserList () {
    const { ctx } = this
    console.log(this.app.baseDir)
    const data = await this.serviceICommon.getUserList(ctx.request.query)
    this.success(data)
  }

  /**
   * @summary  找到相同组织下的其他用户
   * @description 找到相同组织下的其他用户
   * @Router get /api/v1/appApi/common/getUserListInSameOrg/search
   */

  @get('api/v1/appApi/common/getUserListInSameOrg/search')
  async getUserListInSameOrg () {
    const { ctx } = this
    // console.log(this.app.baseDir)
    const userId = ctx.req.headers.userid
    const data = await this.serviceICommon.getUserListInSameOrg(ctx.request.query, userId)
    this.success(data)
  }

  /**
   * @summary  获得用户有权限的组织
   * @description 获得用户有权限的组织
   * @Router get /api/v1/appApi/common/asyncOrgTreeByLimit/search
   */

  @get('api/v1/appApi/common/asyncOrgTreeByLimit/search')
  async asyncOrgTreeByLimit () {
    const { ctx } = this
    // console.log(this.app.baseDir)
    const userId = ctx.req.headers.userid
    const result = await this.serviceIpdms.asyncOrgTreeByLimitByApp(ctx.request.query, userId)
    this.success(result)
  }

  /**
   * @summary  查询监控点详情
   * @description 查询监控点详情
   * @Router get /api/v1/appApi/common/getCameraObj/by_CameraId
   */
  @get('api/v1/appApi/common/getCameraObj/by_CameraId')
  async getCameraObj () {
    const { ctx } = this

    const data = await this.serviceICommon.getCameraObj(ctx.request.query)
    this.success(data)
  }

  /**
   * @summary  统一巡检项提交
   * @description 统一巡检项提交
   * @request body unifiedSubmitRequset *body
   * @response 200 getFirstPatrolItemListResponse
   * @Router post /api/v1/appApi/task/unified/submit
   */
  @post('api/v1/appApi/task/unified/submit')
  async unifiedSubmit () {
    const { ctx } = this
    const userId = ctx.req.headers.userid
    const data = await this.serviceItask.unifiedSubmit(ctx.request.body, userId)
    this.success(data)
  }


  /**
   * @summary 获取当前用户下面问题聚合的一级巡检项 （对应app 社区的问题一级巡检项的聚合列表
   * @description  获取当前用户下面问题聚合的一级巡检项 （对应app  社区的问题一级巡检项的聚合列表
   * @Router GET api/v1/appApi/task/getFirstPatrolItemListByPerson/search
   * @request body getFirstPatrolItemListByPersonRequset *body
   * @response 200 getFirstPatrolItemListResponse
   */
  @get('api/v1/appApi/task/getFirstPatrolItemListByPerson/search')
  async getFirstPatrolItemListByPerson () {
    const { ctx } = this
    const userId = ctx.req.headers.userid
    const id = await this.serviceIpatrolTaskItem.getFirstPatrolItemListByPerson(
      ctx.request.query,
      userId
    )

    //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
    // 调用 service 创建一个 topic
    //    try {
    // const id = await this.serviceItask.create(ctx.request.body);
    // 设置响应体和状态码
    this.success(id)
  }

  /**
   * @summary 问题上报（ 问题上报）
   * @description 问题上报 （对应app 问题上报）
   * @Router POST api/v1/appApi/task/createQuestionByApp/add
   * @request body questionAddRequest *body
   * @response 200 taskCreationResponse 创建成功
   */
  @post('api/v1/appApi/task/createQuestionByApp/add')
  async createQuestionByApp () {
    const { ctx } = this
    //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
    // 调用 service 创建一个 topic
    //    try {
    const userId = ctx.req.headers.userid
    const id = await this.serviceItask.createQuestionByApp(ctx.request.body, userId)
    // 设置响应体和状态码
    this.ctx.body = id
  }

  /**
   * @summary 接收巡检任务（对应app 接收巡检任务）
   * @description 接收巡检任务 （对应app 接收巡检任务）
   * @Router POST api/v1/appApi/task/taskRecive/add
   * @request body taskRecieveRequest *body
   * @response 200 taskCreationResponse 接收成功
   */
  @post('api/v1/appApi/task/taskRecive/add')
  async taskRecive () {
    const { ctx } = this
    const userId = ctx.req.headers.userid
    //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
    // 调用 service 创建一个 topic
    //    try {
    const id = await this.serviceItask.taskRecive(ctx.request.body, userId)
    // 设置响应体和状态码
    this.ctx.body = id
  }
  /**
   * @summary 获取用户信息根据userid ，分割
   * @description 获取用户信息根据userid ，分割
   * @Router post /api/v1/appApi/common/getUserInfoByUserIds
   * @request body getUserInfoByUserIdsRequest *body
   * @response 200 taskPauseRecordResponse 创建成功
   */
  @post('api/v1/appApi/common/getUserInfoByUserIds')
  async getUserInfoByUserIds () {
    const { ctx } = this
    const data = await this.serviceICommon.getUserInfoByUserIds(ctx.request.body)
    this.success(data)
  }

  /**
   * @summary 获取图片详细接口
   * @description 获取图片详细接口
   * @Router post /api/v1/appApi/common/getImageDetail
   * @request body getImageDetailRequest *body
   * @response 200 taskPauseRecordResponse 创建成功
   */
  @post('api/v1/appApi/common/getImageDetail')
  async getImageDetail () {
    const { ctx } = this
    const { imgUrl } = ctx.request.body
    const data = await this.serviceIpicture.getRealPic(imgUrl)
    this.success(data)
  }
  /**
   * @summary 上传图片
   * @description 用于app端图片上传
   * @Router post /api/v1/appApi/common/uploadPicToAsw
   * @request formData file *file
   * @response 200 imgUploadResponse
   */
  @post('api/v1/appApi/common/uploadPicToAsw')
  async uploadPicToAsw () {
    const { ctx } = this
    const stream = await this.ctx.getFileStream()
    console.log('uploadPicToAswuploadPicToAswuploadPicToAsw', stream)
    console.log('ctx.body', ctx.request.body)
    const data = await this.serviceICommon.uploadPicToAsw(stream, '', '')
    this.success(data)
  }
  /**
   * @summary 获取配置的巡检结论列表
   * @description 获取配置的巡检结论列表 类似通过异常待确认
   * @Router get /api/v1/appApi/common/getPatrolResultByTaskItemId
   * @request query  patrolTaskItemId *string task巡检项ID
   * @response 200 PatrolResult *body
   */
  @get('api/v1/appApi/common/getPatrolResultByTaskItemId')
  async getPatrolResultByTaskItemId () {
    const { ctx } = this

    const data = await this.serviceICommon.getPatrolResultByTaskItemId(ctx.request.query)
    this.success(data)
  }

  /**
   * @summary 巡查对象类型查询接口
   * @description 巡查对象类型查询接口
   * @Router POST /api/v1/appApi/patrolObjType/search
   * @request body searchRequest *body
   * @response 200 searchResponse 查询成功
   */

  @post('api/v1/appApi/patrolObjType/search')
  async search () {
    const { ctx } = this
    try {
      const id = await this.serviceIPatrolObjType.objectTypeService(ctx.request.body)
      // 设置响应体和状态码
      this.success(id)
    } catch (error) {
      this.fail(this.ctx.__('appApi.appApisearchFailed'), error)
    }
  }

  /**
   * @summary 获取巡检项详情 （对应app 获取巡检项详情
   * @description 获取巡检项详情 （对应app 获取巡检项详情
   * @Router GET /api/v1/appApi/patrolItem/detail/get/by_patrolItemId
   */
  @get('api/v1/appApi/patrolItem/detail/get/by_patrolItemId')
  async getItemInfobyId () {
    const { ctx } = this
    //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
    // 调用 service 创建一个 topic
    //    try {
    const id = await this.serviceIPatrolItem.queryDetail(ctx.request.query)
    // 设置响应体和状态码
    this.success(id)
  }

  /**
   * @summary 通过taskitemid所有的检测点 （对应app 通过通过taskitemid所有的检测点所有的检测点
   * @description  通过通过taskitemid所有的检测点所有的检测点（对应app  通过通过taskitemid所有的检测点所有的检测点
   * @Router GET /api/v1/appApi/task/queryTaskPointAllListByPatrolTaskItemId/search
   * @request  query  patrolTaskItemId *string 流程id
   * @response 200 queryTaskPointAllListResponse
   */
  @get('api/v1/appApi/task/queryTaskPointAllListByPatrolTaskItemId/search')
  async queryTaskPointAllListByPatrolTaskItemId () {
    const { ctx } = this //     const userId = ctx.req.headers.use
    const id = await this.serviceIpatrolTaskPoint.queryTaskPointAllListByPatrolTaskItemId(
      ctx.request.query
    )
    this.success(id)
  }

  /**
   * @summary 获取所有巡检项列表（对应app 获取巡检项列表
   * @description 获取所有巡检项列表 （对应app 获取所有巡检项列表
   * @Router GET /api/v1/appApi/patrolItem/list/search
   * @response 200 patrolItemListResponse
   */
  @get('api/v1/appApi/patrolItem/list/search')
  async getItemList () {
    const { ctx } = this
    //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
    // 调用 service 创建一个 topic
    //    try {
    const id = await this.serviceIPatrolItem.queryItemManyCommon(ctx.request.query)
    // 设置响应体和状态码
    this.success(id)
  }
}