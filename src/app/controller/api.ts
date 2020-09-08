import { Context, inject, provide, Application } from 'midway'
import { ItaskExecResultService } from '../interface/taskExecResultInterface'
import { IPatrolObjService } from '../interface/patrolObjInterface'
import { IpictureService } from '../interface/pictureInterface'
import { ITransactionFlowService } from '../interface/transactionFlowInterface'
import { ItaskService } from '../interface/taskInterface'
import { IAnalysisService } from '../interface/analysisInterface'
import { IPatrolPlanApiService } from '../interface/patrolPlanApiInterface'
import { ItaskApiService } from '../interface/taskApiInterface'
import { IPatrolObjApiService } from '../interface/patrolObjApiInterface'
import { IPatrolPlanService } from '../interface/patrolPlanInterface'
import { IQuestionManageService } from '../interface/questionManageInterface'
import { IpatrolTaskItemService } from '../interface/patrolTaskItemInterface'

import { get, controller, post } from '../../decorator/openApi'
import { BaseController } from '../core/base_controller'
@provide()
@controller('/')
export class ApiController extends BaseController {
  @inject()
  ctx: Context;
  @inject()
  app: Application;
  @inject('taskExecResultService')
  serviceItaskExecResult: ItaskExecResultService;
  @inject('patrolObjService')
  serviceIPatrolObj: IPatrolObjService;
  @inject('pictureService')
  serviceIpicture: IpictureService;
  @inject('transactionFlowService')
  serviceItransactionFlow: ITransactionFlowService;
  @inject('taskService')
  serviceItask: ItaskService;
  @inject('analysisService')
  serviceIAnalysis: IAnalysisService;
  @inject('patrolPlanApiService')
  serviceIPatrolPlanApi: IPatrolPlanApiService;
  @inject('taskApiService')
  serviceItaskApi: ItaskApiService;
  @inject('patrolObjApiService')
  serviceIPatrolObjApi: IPatrolObjApiService;
  @inject('patrolPlanService')
  serviceIPatrolPlan: IPatrolPlanService;
  @inject('questionManageService')
  serviceIquestionManage: IQuestionManageService;
  @inject('patrolTaskItemService')
  serviceIpatrolTaskItem: IpatrolTaskItemService;
  /**
   * @summary 末级巡检项查询巡检结论
   * @description 末级巡检项查询巡检结论
   * @Router GET api/v1/item/conclusion/query
   * @request body quantitySearchRequest *body
   * @response 200 quantitySearchResponse 创建成功
   */

  @get('api/v1/item/conclusion/query')
  async conclusionQuery () {
    const { ctx } = this
    const params = ctx.request.query
    const data = await this.serviceItaskExecResult.queryByItemId(params)
    // // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 查询检测点
   * @description 查询检测点
   * @Router POST api/v1/plugins/quantity/search
   * @request body quantitySearchRequest *body
   * @response 200 quantitySearchResponse 创建成功
   */

  @post('api/v1/plugins/quantity/search')
  async quantitySearch () {
    const { ctx } = this
    const params = ctx.request.body.data
    const data = await this.serviceIPatrolObj.quantityService(params)
    // // 设置响应体和状态码
    this.success(data)
  }
  /**
   * @summary 巡检对象添加
   * @description 巡检对象添加
   * @Router POST api/v1/patrolObj/add
   * @request body patrolObjAddRequest *body
   * @response 200 successObjResponse 创建成功
   */

  @post('api/v1/patrolObj/add')
  async patrolObjAdd () {
    const { ctx } = this
    const data = await this.serviceIPatrolObj.objectsCustomCreateService(ctx.request.body)
    // // 设置响应体和状态码
    this.success(data)
  }
  /**
   * @summary 获取图片详细接口
   * @description 获取图片详细接口
   * @Router post /api/v1/common/getImageDetail
   * @request body getImageDetailRequest *body
   * @response 200 taskPauseRecordResponse 创建成功
   */
  @post('api/v1/common/getImageDetail')
  async getImageDetail () {
    const { ctx } = this
    const { imgUrl } = ctx.request.body
    const data = await this.serviceIpicture.getRealPic(imgUrl)
    this.success(data)
  }
  /**
   * @summary 获取问题列表根据流程id （app使用）
   * @description  获取问题列表根据对象id （app使用）
   * @Router get /api/v1/transactionFlow/getTransactionFlowList/search
   * @request  query  getTransactionFlowListRequest *body
   * @response 200 getTransactionFlowListResponse *body
   */

  @get('api/v1/transactionFlow/getTransactionFlowList/search')
  async getTransactionFlowList () {
    const { ctx } = this
    const response = await this.serviceItransactionFlow.getTransactionFlowList(ctx.request.query)
    // 设置响应体和状态码
    this.success(response)
  }

  /**
   * @summary 根据任务状态返回任务总数 (外部接口，国际营销)
   * @description 根据任务状态返回任务总数 (外部接口，国际营销)
   * @Router get /api/v1/getTaskTotalNumByStatus/count
   * @request  query  getTaskTotalNumByStatusReq *query
   * @response 200 taskQueryResponse *body
   */

  @get('api/v1/getTaskTotalNumByStatus/count')
  async getTaskTotalNumByStatusReq () {
    const { ctx } = this
    const response = await this.serviceItask.getlist(ctx.request.query)
    // 设置响应体和状态码
    this.success(response)
  }

  /**
   * @summary 统计分析-超时任务排行 (外部接口，国际营销)
   * @description 统计分析-超时任务排行接口 (外部接口，国际营销)
   * @Router get api/v1//analysis/timeoutRank
   * @request body analysisBaseRequest *body
   * @response 200 analysisTimeoutRankResponse 创建成功
   */
  @get('api/v1/analysis/timeoutRank')
  async timeoutRank () {
    const { ctx } = this
    const data = await this.serviceIAnalysis.timeoutRankService(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 巡检计划详情
   * @description 计划管理-巡检计划详情
   * @Router get /api/v1/patrolPlan/detail
   * @request body patrolPlanDetailRequest *body
   * @response 200 patrolPlanDetailResponse 创建成功
   */

  @get('api/v1/patrolPlan/detail')
  async patrolPlanDetail () {
    const { ctx } = this
    const data = await this.serviceIPatrolPlanApi.queryPlanDetail(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 获取计划下任务巡检对象状态统计
   * @description 获取计划下任务巡检对象状态统计
   * @Router get /api/v1/taskState/count
   * @request body taskStateCountRequest *body
   * @response 200 taskStateCountResponse 创建成功
   */

  @get('api/v1/taskState/count')
  async taskStateCount () {
    const { ctx } = this
    const data = await this.serviceItaskApi.taskStateCount(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 获取计划下任务列表
   * @description 任务管理-获取计划下任务列表
   * @Router get /api/v1/task/list
   * @request body taskListRequest *body
   * @response 200 taskListResponse 创建成功
   */

  @get('api/v1/task/list')
  async taskList () {
    const { ctx } = this
    const data = await this.serviceItaskApi.taskList(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 获取任务下巡检项巡检结果
   * @description 任务管理-获取任务下巡检项巡检结果
   * @Router get /api/v1/taskItem/list
   * @request body taskItemListRequest *body
   * @response 200 taskItemListResponse 创建成功
   */

  @get('api/v1/taskItem/list')
  async taskItemList () {
    const { ctx } = this
    const data = await this.serviceItaskApi.taskItemList(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 获取任务下问题列表
   * @description 任务管理-获取任务下问题列表
   * @Router get /api/v1/task/problem/list
   * @request body taskProblemListRequest *body
   * @response 200 taskProblemListResponse 创建成功
   */

  @get('api/v1/task/problem/list')
  async taskProblemList () {
    const { ctx } = this
    const data = await this.serviceItaskApi.taskProblemList(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 获取问题整改流程详情
   * @description 任务管理-获取问题整改流程详情
   * @Router get /api/v1/task/problem/detail
   * @request body taskProblemDetailRequest *body
   * @response 200 taskProblemDetailResponse 创建成功
   */

  @get('api/v1/task/problem/detail')
  async taskProblemDetail () {
    const { ctx } = this
    const data = await this.serviceItaskApi.taskProblemDetail(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 第二级巡检项问题统计
   * @description 第二级巡检项问题统计
   * @Router get /api/v1/task/problem/typeCount
   * @request body taskProblemTypeCountRequest *body
   * @response 200 taskProblemTypeCountResponse 创建成功
   */

  @get('api/v1/task/problem/typeCount')
  async taskProblemTypeCount () {
    const { ctx } = this
    const data = await this.serviceItaskApi.taskProblemTypeCount(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 巡检模板维度查问题分类
   * @description 巡检模板维度查问题分类
   * @Router get /api/v1/problem/planTemplate/Count
   * @request body problemPlanTemplateCountRequest *body
   * @response 200 problemPlanTemplateCountResponse 创建成功
   */

  @get('api/v1/problem/planTemplate/Count')
  async problemPlanTemplateCount () {
    const { ctx } = this
    const data = await this.serviceItaskApi.problemPlanTemplateCount(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 问题状态统计问题(已修改和未修改)
   * @description 问题状态统计问题(已修改和未修改)
   * @Router get /api/v1/patrolPlan/problem/state/Count
   * @request body problemStateCountRequest *body
   * @response 200 problemStateCountResponse 创建成功
   */

  @get('api/v1/problem/state/Count')
  async problemStateCount () {
    const { ctx } = this
    const data = await this.serviceItaskApi.problemStateCount(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 区域下计划包含巡检对象总数(看板)
   * @description 区域下计划包含巡检对象总数(看板)
   * @Router get /api/v1/patrolPlan/patrolObj
   * @request body patrolPlanObjRequest *body
   * @response 200 patrolPlanObjResponse 创建成功
   */

  @get('api/v1/patrolPlan/patrolObj')
  async patrolPlanObj () {
    const { ctx } = this
    const data = await this.serviceItaskApi.planObjList(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 任务下巡检对象列表
   * @description 任务下巡检对象列表
   * @Router POST /api/v1/partrolObj/list/bytaskId 对象列表
   * @request body objListByTaskIdRequest *body
   * @response 200 objListByTaskIdResponse 创建成功
   */

  @post('api/v1/partrolObj/list/bytaskId')
  async objListByTaskId () {
    const { ctx } = this
    const data = await this.serviceIPatrolObjApi.queryObjRelList(ctx.request.body)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 巡检记录列表(查询的任务巡检项)
   * @description 巡检记录列表(查询的任务巡检项)
   * @Router get /api/v1/taskItem/query
   * @request body taskItemQueryRequest *body
   * @response 200 taskItemQueryResponse 创建成功
   */

  @post('api/v1/taskItem/query')
  async taskItemQuery () {
    const { ctx } = this
    const data = await this.serviceItaskApi.taskItemByUse(ctx.request.body)
    // 设置响应体和状态码
    this.success(data)
  }
  /**
   * @summary 添加巡检计划
   * @description 巡检计划管理—添加巡检计划
   * @Router POST /api/v1/patrolPlan/add
   * @request body patrolplanAddPlanRequest *body
   * @response 200 patrolplanResponse 添加成功
   */
  @post('api/v1/patrolPlan/add')
  async addPatrolPlan () {
    const { ctx } = this
    const id = await this.serviceIPatrolPlan.addPatrolPlan(ctx.request.body)
    this.success(id)
  }
  /**
   * @summary 巡检计划更新
   * @description 巡检计划管理—巡检计划更新数据
   * @Router POST /api/v1/patrolPlan/update
   * @request body patrolplanUpdatePlanRequest *body
   * @response 200 patrolplanResponse 更新成功
   */
  @post('api/v1/patrolPlan/update')
  async updatePlan () {
    const { ctx } = this
    const data = await this.serviceIPatrolPlan.updatePatrolPlanInfo(ctx.request.body)
    this.success(data)
  }

  /**
   * @summary 巡检计划分页查询
   * @description 巡检计划管理—巡检计划分页查询
   * @Router get /api/v1/patrolPlan/search
   * @request body patrolPlanAndObjQueryRequest *body
   * @response 200 patrolplanQueryPlanResponse 查询成功
   */
  @get('api/v1/patrolPlan/search')
  async queryPlan () {
    const { ctx } = this
    const data = await this.serviceIPatrolPlan.queryPlanListOriginal(ctx.request.query)
    this.success(data)
  }

  /**
   * @summary 巡检计划分页列表(教育专用)
   * @description 计划管理-巡检计划分页列表(教育专用)
   * @Router get /api/v1/patrolPlan/list
   * @request body patrolPlanListRequest *body
   * @response 200 patrolPlanListResponse 创建成功
   */

  @get('api/v1/patrolPlan/list')
  async patrolPlanList () {
    const { ctx } = this
    const data = await this.serviceIPatrolPlanApi.queryPlanList(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 巡检计划详情查询
   * @description 巡检计划管理—巡检计划详情查询
   * @Router get /api/v1/patrolPlan/get/by_patrolPlanCode
   * @request body patrolplanDetailByCodeRequest *body
   * @response 200 patrolplanDetailResponse 查询成功
   */
  @get('api/v1/patrolPlan/get/by_patrolPlanCode')
  async queryAllPlanDetail () {
    const { ctx } = this
    const data = await this.serviceIPatrolPlan.queryAllPlanDetailByApi(ctx.request.query)
    this.success(data)
  }
  /**
   * @summary 删除巡检计划
   * @description 巡检计划管理—删除巡检计划
   * @Router POST /api/v1/patrolPlan/delete
   * @request body patrolplanDeleteRequest *body
   * @response 200 patrolplanResponse
   */
  @post('api/v1/patrolPlan/delete')
  async deletePlan () {
    const { ctx } = this
    const data = await this.serviceIPatrolPlan.deletePatrolPlanData(ctx.request.body)
    this.success(data)
  }

  /**
   * @summary 任务拆分接口
   * @description 任务拆分接口
   * @Router GET /api/v1/task/split
   */
  @get('api/v1/task/split')
  async planTaskSplit () {
    const { ctx } = this
    const { patrolPlanId } = ctx.request.query
    if (!patrolPlanId) {
      throw Error(this.ctx.__('api.patrolPlanIdEmpty'))
    }
    const result = await this.app.consulCurl(
      '/patrolengine-execute/api/v1/task/plan/split',
      'patrolengine',
      'patrolengine-execute',
      {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
          appId: this.ctx.header.appid
        },
        data: { planId: patrolPlanId }
      }
    )
    if (!result) {
      throw Error(this.ctx.__('api.planTaskSplitNoResponseData'))
    }
    if (!result.res) {
      throw Error(this.ctx.__('api.planTaskSplitNoResponsError'))
    }
    if (result && result.res && result.res.status !== 200) {
      throw Error(this.ctx.__('api.planTaskSplitSendError'))
    }
    const resultData = result.data && ctx.helper.bufferToJson(result.data)
    if (resultData && resultData.code !== '0') {
      throw Error(resultData.msg)
    }
    console.log(resultData)
    this.success(resultData)
  }

  // ====================================合规性教研用的task相关的接口

  /**
   * @summary 任务管理的列表查询接口
   * @description 筛选条件是任务编号 patrolTaskName  巡检计划  所属区域regionId  巡检模板 巡检执行方式 任务生成时间startTime  任务类型 任务状态
   * @Router get /api/v1/task/taskList/search
   * @request query taskQueryRequest *query
   * @response 200 taskQueryResponse
   */
  @get('api/v1/task/taskList/search')
  async query () {
    const { ctx } = this
    // 调用 service 创建一个 topic
    // ctx.req.headers.appid = 'hpp'
    try {
      if (this.app.formatChar(ctx.request.query) === false) {
        return this.fail(this.ctx.__('api.requestParamsHasEspecialWord'))
      }
      const data = await this.serviceItask.getlist(ctx.request.query)
      this.operateLog(
        'log.moduleId.patrolTask.displayName',
        'log.objectType.model_patrol_task.displayName',
        this.ctx.__('api.queryOperateLog1') + '：' + data,
        'log.action.query.displayName',
        this.ctx.__('api.queryOperateLogSuccess'),
        'log.actionMessageId.query_patrol_task_list.message',
        1
      )
      // 设置响应体和状态码
      this.success(data)
    } catch (error) {
      this.operateLog(
        'log.moduleId.patrolTask.displayName',
        'log.objectType.model_patrol_task.displayName',
        this.ctx.__('api.queryOperateLog1'),
        'log.action.query.displayName',
        this.ctx.__('api.queryOperateLogError'),
        'log.actionMessageId.query_patrol_task_list.message',
        0
      )
      throw new Exception(error.message, error.code, error.transaction)
    }
  }

  /**
   * @summary 一键巡查模块 获取对象下所有的检测点
   * @description 获取问题列表
   * @Router GET /questionManage/wad/getPointList/get
   */

  // 静态地图 mapType 传 static 主地图传gais
  @get('api/v1/questionManage/wad/getPointList/get')
  async getPointList () {
    const { ctx } = this
    try {
      console.log('------------获取检测点------------', ctx.request.query)
      const data = await this.serviceIquestionManage.getPoint(ctx.request.query)
      this.operateLog(
        'log.moduleId.map.displayName', // 模块标识
        'log.objectType.model_patrol_point.displayName',
        '',
        'log.action.query.displayName',
        this.ctx.__('api.getPointListOperateLogSuccess'),
        'log.actionMessageId.get_point_list.message',
        1
      )
      this.success(data)
    } catch (error) {
      this.operateLog(
        'log.moduleId.map.displayName', // 模块标识
        'log.objectType.model_patrol_point.displayName',
        '',
        'log.action.query.displayName',
        this.ctx.__('api.getPointListOperateLogError'),
        'log.actionMessageId.get_point_list.message',
        0
      )
      throw new Exception(error.message, error.code, error.transaction)
    }
  }
  /*
   * @summary 任务关联检测点查询接口
   * @description 筛选条件是patrolTaskId,firstItemId,pointerStatus
   * @Router get /task/pointerList/search
   * @request  query  patrolTaskId *string 巡检任务id
   * @response 200 taskDetailResponse 创建成功
   */

  @get('api/v1/pointerList/search')
  async getPointerListByTaskId () {
    const { ctx } = this
    // 校验 `ctx.request.body` 是否符合我们预期的格式
    // 调用 service 创建一个 topic
    console.log('parma++++++++++++++++', ctx.request.query)
    const data = await this.serviceItask.getPointerListByTaskId(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }
  /**
   * @summary 问题管理的列表查询接口
   * @description 筛选条件是 区域id 对象id 巡检项id 问题生成得时间 问题描述 问题状态
   * @request query questionsListRequest *query
   * @response 200 questionsListResponse
   * @Router get /api/v1/questions/questionsList/get
   */

  @get('api/v1/questions/questionsList/get')
  async queryQuestion () {
    const { ctx } = this
    // 调用 service 创建一个 topic
    // ctx.req.headers.appid = 'hpp'
    try {
      console.log('dsssdsa', ctx.request.query)
      const params = ctx.request.query
      // 修复入参_、%问题
      if (params.remark) {
        params.remark = params.remark.replace(/_/g, '\\_').replace(/%/g, '\\%')
      }
      const data = await this.serviceIquestionManage.getQuestionList(params)
      this.operateLog(
        'log.moduleId.questionManage.displayName', // 模块标识
        'log.objectType.model_transactionFlow.displayName',
        '',
        'log.action.query.displayName',
        this.ctx.__('api.queryQuestionOperateLog'),
        'log.actionMessageId.get_getQuestion_list.message',
        1
      )
      this.success(data)
    } catch (error) {
      this.operateLog(
        'log.moduleId.questionManage.displayName', // 模块标识
        'log.objectType.model_transactionFlow.displayName',
        '',
        'log.action.query.displayName',
        this.ctx.__('api.queryQuestionOperateLog'),
        'log.actionMessageId.get_getQuestion_list.message',
        0
      )
      throw new Exception(error.message, error.code, error.transaction)
    }
  }

  /**
   * @summary 更新问题进程
   * @description 更新问题条件是 流程relativeId, 判断 judge, 图片信息 info, 下步处理人 execUsers，下步抄送人 copyUsers, 当前执行人 modifier
   * @request query questionsHandleRequest *body
   * @response 200 questionsHandleResponse
   * @Router POST /api/v1/questions/handle
   */

  @post('api/v1/questions/handle')
  async nextStep () {
    const { ctx } = this
    try {
      console.log('ctx.request.body', ctx.request.body)
      const relativeId = ctx.request.body.relativeId
      const judge = ctx.request.body.judge || 'Pass'
      const info = ctx.request.body.info
      const execUsers = ctx.request.body.execUsers
      // const status = ctx.request.body.status
      const copyUsers = ctx.request.body.copyUsers || ''
      const modifier = ctx.getUserId() || ctx.request.header.currentuserid
      console.log('', relativeId)
      const result = await this.serviceItransactionFlow.nextStep(
        relativeId,
        judge,
        info,
        execUsers,
        copyUsers,
        modifier,
        // status
      )
      // this.ctx.body = result
      this.operateLog(
        'log.moduleId.questionManage.displayName',
        'log.objectType.model_transactionFlow.displayName',
        '',
        'log.action.update.displayName',
        this.ctx.__('api.nextStepOperateLogSuccess'),
        'log.actionMessageId.update_getQuestion.message',
        1
      )
      this.success(result)
      // @TODO 处理成功后，处理消息代办
      console.log(
        '问题处理结论提交完成，准备发送待办和消息的MQ，结论提交后返回结果为：',
        ctx.request.body
      )
      this.app.hikLogger.debug(
        this.ctx.__('api.nextStepOperateLogDebug'),
        ctx.request.body
      )
      const params = { pointResultIds: [ relativeId ] }
      await this.serviceIpatrolTaskItem.createTlnc(params)
    } catch (error) {
      this.operateLog(
        'log.moduleId.questionManage.displayName',
        'log.objectType.model_transactionFlow.displayName',
        '',
        'log.action.update.displayName',
        this.ctx.__('api.nextStepOperateLogError'),
        'log.actionMessageId.update_getQuestion.message',
        0
      )
      throw new Exception(error.message, error.code, error.transaction)
    }
  }

  /**
   * @summary 通过关联点获取问题所有流程按照问题版本大小倒叙排列
   * @description 获取流程参数 任务巡检项或任务检测点或流程关联id
   * @request query questionsTransRequest *query
   * @response 200 questionsTransResponse
   * @Router GET /api/v1/questions/get/by_TaskIdAndTaskItemId
   */

  @get('api/v1/questions/get/by_TaskIdAndTaskItemId')
  async getQuestionTrans () {
    const { ctx } = this
    try {
      const data = await this.serviceIquestionManage.getQuestionTrans(ctx.request.query)
      this.operateLog(
        'log.moduleId.questionManage.displayName', // 模块标识
        'log.objectType.model_transactionFlow.displayName',
        this.ctx.__('api.getQuestionTransOperateLog'),
        'log.action.query.displayName',
        this.ctx.__('api.getQuestionTransOperateLogSuccess'),
        'log.actionMessageId.get_getQuestion_flow.message',
        1
      )
      this.success(data)
    } catch (error) {
      this.operateLog(
        'log.moduleId.questionManage.displayName', // 模块标识
        'log.objectType.model_transactionFlow.displayName',
        this.ctx.__('api.getQuestionTransOperateLog'),
        'log.action.query.displayName',
        this.ctx.__('api.getQuestionTransOperateLogError'),
        'log.actionMessageId.get_getQuestion_flow.message',
        0
      )
      throw new Exception(error.message, error.code, error.transaction)
    }
  }

  /**
   * @summary 任务详情查询接口 （app 巡检任务详情）
   * @description 筛选条件是任务patrolTaskId
   * @Router get /api/v1/task/detail/get/by_TaskIdAndTaskId
   * @request  query  patrolTaskId *string 巡检任务id
   * @response 200 taskDetailResponse 创建成功
   */

  @get('api/v1/task/detail/get/by_TaskIdAndTaskId')
  async getDetailByTaskId () {
    const { ctx } = this
    // 校验 `ctx.request.body` 是否符合我们预期的格式
    // 调用 service 创建一个 topic
    try {
      if (this.app.formatChar(ctx.request.query) === false) {
        return this.fail(this.ctx.__('api.requestParamsHasEspecialWord'))
      }
      const data = await this.serviceItask.getTaskInfoByTaskId(ctx.request.query)
      this.operateLog(
        'log.moduleId.patrolTask.displayName',
        'log.objectType.model_patrol_task.displayName',
        this.ctx.__('api.queryOperateLog1') + ': ' + JSON.stringify(data),
        'log.action.detail.displayName',
        this.ctx.__('api.getDetailByTaskIdLogSuccess'),
        'log.actionMessageId.query_patrol_task_detail.message',
        1
      )
      this.success(data)
    } catch (error) {
      this.operateLog(
        'log.moduleId.patrolTask.displayName',
        'log.objectType.model_patrol_task.displayName',
        this.ctx.__('api.queryOperateLog1'),
        'log.action.detail.displayName',
        this.ctx.__('api.getDetailByTaskIdLogError'),
        'log.actionMessageId.query_patrol_task_detail.message',
        0
      )
      throw new Exception(error.message, error.code, error.transaction)
    }
  }

  /**
   * @summary 创建巡检结论BS端
   * @description 创建巡检结论，用于BS端提交巡检结论
   * @Router POST /api/v1/inspectionConclusion/add
   * @request body inspectionConclusionCreateRequest *body
   * @response 200 inspectionConclusionResponse 创建成功
   */
  @post('api/v1/inspectionConclusion/add')
  async createConclusionByBS () {
    const { ctx } = this
    // 基于token获取userId
    const userId = ctx.request.header.currentuserid || this.ctx.getUserId() || 'admin'
    // 校验 `ctx.request.body` 是否符合我们预期的格式
    // ctx.validate(rule, ctx.request.body); // 或者ctx.request.query
    // 调用 service
    try {
      if (this.app.formatChar(ctx.request.query) === false) {
        return this.fail(this.ctx.__('api.requestParamsHasEspecialWord'))
      }
      const res = await this.serviceIpatrolTaskItem.createByBs(ctx.request.body, userId)
      // 设置响应体和状态码
      this.ctx.body = res
      // 根据传入的参数，判断是暂存结论还是确认提交
      const params = ctx.request.body
      if (Array.isArray(params.patrolTaskItemList) && params.patrolTaskItemList.length > 0) {
        // 如果是参数中带有patrolTaskItemList切不为空，那么是社区的暂存结论，那么不发送mq，只有确认提交时才发送mq
        return
      }
      this.operateLog(
        'log.moduleId.patrolExeResult.displayName',
        'log.objectType.model_patrol_exe_result.displayName',
        this.ctx.__('api.createConclusionByBSOperateLog') + ': ' + JSON.stringify(res),
        'log.action.createExe.displayName',
        this.ctx.__('api.createConclusionByBSOperateLogSuccess'),
        'log.actionMessageId.add_patrol_exe_result.message',
        1
      )
    } catch (error) {
      this.operateLog(
        'log.moduleId.patrolExeResult.displayName',
        'log.objectType.model_patrol_exe_result.displayName',
        this.ctx.__('api.createConclusionByBSOperateLog'),
        'log.action.createExe.displayName',
        this.ctx.__('api.createConclusionByBSOperateLogError'),
        'log.actionMessageId.add_patrol_exe_result.message',
        0
      )
      throw new Exception(error.message, error.code, error.transaction)
    }
  }
}