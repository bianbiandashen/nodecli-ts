'use strict'
import { Context, inject, provide,Application } from 'midway'
import { get,post,controller } from '../../decorator/openApi'
import { BaseController } from '../core/base_controller'
import { ItaskService } from '../interface/taskInterface';
import { IpatrolTaskItemService } from '../interface/patrolTaskItemInterface';
import { IpauseRecordsService } from '../interface/pauseRecordsInterface';
import { IpatrolTaskPointService } from '../interface/patrolTaskPointInterface';


const Exception = require('../core/Exception')
/**
 * @Controller task
 */
@provide()
@controller('/task',{description: '巡检问题管理'})
export class TaskController extends BaseController {

  @inject()
  ctx: Context;
  app: Application;

  @inject('taskService')
  service: ItaskService;

  @inject('patrolTaskItemService')
  patrolTaskItem: IpatrolTaskItemService;

  @inject('pauseRecordsService')
  pauseRecords: IpauseRecordsService;

  @inject('patrolPointService')
  patrolTaskPoint: IpatrolTaskPointService;

  /**
   * @summary 消息代办查询
   * @description 消息代办查询
   * @Router POST /task/newsagency/search
   */

  @post('/newsagency/search',{description: '消息代办查询'})
  async newsagency () {
    const { ctx } = this
    const appid = ctx.req.headers.appid
    const result = await this.service.newsagencyService(ctx.request.body,appid)
    this.ctx.body = result
  }

  /**
   * @summary 任务指派
   * @description 任务指派
   * @Router GET /task/assign
   * @request body sitePlanInspectionRequset *body
   * @response 200 sitePlanInspectionResponse 创建成功
   */
  @get('/assign',{description: '任务指派'})
  async assign () {
    const { ctx } = this
    //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
    // 调用 service 创建一个 topic
    //    try {
    // 基于token获取userId
    const userId = ctx.getUserId()
    // const userId = ctx.req.headers.userid
    const id = await this.service.assignTask(ctx.request.query, userId)
    // 设置响应体和状态码
    this.success(id)
  }
  /**
   * @TODO bian弃用，移动至appApi
   * @summary 现场计划巡检 app list 接口 变电站
   * @description 现场计划巡检 app list 接口 变电站
   * @Router GET /task/sitePlanInspection/search
   * @request body sitePlanInspectionRequset *body
   * @response 200 sitePlanInspectionResponse 创建成功
   */
  @get('/sitePlanInspectionList/search',{description: '巡检问题管理'})
  async sitePlanInspectionList () {
    const { ctx } = this
    //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
    // 调用 service 创建一个 topic
    //    try {
    const userId = ctx.req.headers.userid
    const id = await this.service.sitePlanInspectionList(ctx.request.query, userId)
    // 设置响应体和状态码
    this.success(id)
  }

  /**
   * @summary 通过问题id所有的检测点 （对应app 通过问题id所有的检测点
   * @description  通过问题id所有的检测点（对应app  通过问题id所有的检测点
   * @Router GET /task/queryTaskPointAllListByTransactionId/search
   * @request  query  transactionId *string 流程id
   */
  @get('/queryTaskPointAllListByTransactionId/search',{description: '通过问题id所有的检测点 （对应app 通过问题id所有的检测点'})
  async queryTaskPointAllListByTransactionId () {
    const { ctx } = this
    // const userId = ctx.req.headers.userid
    const id = await this.patrolTaskPoint.queryTaskPointAllListByTransactionId(
      ctx.request.query
    )

    //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
    // 调用 service 创建一个 topic
    //    try {
    // const id = await this.service.create(ctx.request.body);
    // 设置响应体和状态码
    this.success(id)
  }
  /**
   * @summary 通过taskitemid所有的检测点 （对应app 通过通过taskitemid所有的检测点所有的检测点
   * @description  通过通过taskitemid所有的检测点所有的检测点（对应app  通过通过taskitemid所有的检测点所有的检测点
   * @Router GET /task/queryTaskPointAllListByPatrolTaskItemId/search
   * @request  query  patrolTaskItemId *string 流程id
   */
  @get('/queryTaskPointAllListByPatrolTaskItemId/search',{description: '巡检问题管理'})
  async queryTaskPointAllListByPatrolTaskItemId () {
    const { ctx } = this
    // const userId = ctx.req.headers.userid
    const id = await this.patrolTaskPoint.queryTaskPointAllListByPatrolTaskItemId(
      ctx.request.query
    )

    //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
    // 调用 service 创建一个 topic
    //    try {
    // const id = await this.service.create(ctx.request.body);
    // 设置响应体和状态码
    this.success(id)
  }
  /**
   * @TODO bian弃用，移动至appApi
   * @summary 获取人下面关联的所有一级巡检项 （对应app 获取人下面关联的所有一级巡检项 app社区
   * @description  获取人下面关联的所有一级巡检项  （对应app  获取人下面关联的所有一级巡检项
   * @Router GET /task/getFirstPatrolItemListByPerson/search
   * @request body getFirstPatrolItemListByPersonRequset *body
   * @response 200 getFirstPatrolItemListByPersonResponse 创建成功
   */
  // @get('/getFirstPatrolItemListByPerson/search',{description: '巡检问题管理'})
  // async getFirstPatrolItemListByPerson () {
  //   const { ctx } = this
  //   const userId = ctx.req.headers.userid
  //   const id = await this.patrolTaskItem.getFirstPatrolItemListByPerson(
  //     ctx.request.query,
  //     userId
  //   )

  //   //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
  //   // 调用 service 创建一个 topic
  //   //    try {
  //   // const id = await this.service.create(ctx.request.body);
  //   // 设置响应体和状态码
  //   this.success(id)
  // }
  /**
   * @summary 临时任务创建
   * @description 临时任务创建
   * @Router POST /task/temporaryTaskCreation/add
   * @request body taskCreationRequest *body
   * @response 200 taskCreationResponse 创建成功
   */
  @post('/temporaryTaskCreation/add',{description: '巡检问题管理'})
  async temporaryTaskCreation () {
    const { ctx } = this
    try {
      //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
      // 调用 service 创建一个 topic
      //    try {
      const id = await this.service.temporaryTaskCreation(ctx.request.body)
      // 设置响应体和状态码
      this.ctx.body = id
      this.operateLog(
        'log.moduleId.patrolTask.displayName',
        'log.objectType.model_patrol_task.displayName',
        this.ctx.__('task.temporaryTaskCreation'),
        'log.action.patrolTask.displayName',
        this.ctx.__('task.temporaryTaskCreationOperateLogSuccess'),
        'log.actionMessageId.recevie_patrol_task.message',
        1
      )
      // 设置响应体和状态码
    } catch (error) {
      this.operateLog(
        'log.moduleId.pauseRecords.displayName',
        'log.objectType.model_pause_records.displayName',
        this.ctx.__('task.temporaryTaskCreation'),
        'log.action.pauseRecords.displayName',
        this.ctx.__('task.temporaryTaskCreationOperateLogError'),
        'log.actionMessageId.recevie_patrol_task.message',
        0
      )
      throw new Exception(error.message, error.code, error.transaction)
    }
  }

  // -------------------------------------------暂停模块 -----------------------------
  /**
   * @summary 新增暂停或者恢复的记录
   * @description 新增暂停或者恢复的记录
   * @Router Post /task/pauseOrRestore/add
   * @request body taskPauseRecordRequest *body
   * @response 200 taskPauseRecordResponse 创建成功
   */
  @post('/pauseOrRestore/add',{description: '新增暂停或者恢复的记录'})
  async pauseOrRestore () {
    const { ctx } = this
    // 校验 `ctx.request.body` 是否符合我们预期的格式
    // ctx.validate(ctx.rule.taskPauseRecordRequest, ctx.request.body)
    const deffer = {
      0: this.ctx.__('task.suspend'),
      1: this.ctx.__('task.continue'),
      2: this.ctx.__('task.cancel'),
      4: this.ctx.__('task.oneClickSuspend')
    }
    const { execMethod } = ctx.request.body
    // 调用 service 创建一个 topic
    try {
      const data = await this.pauseRecords.create(ctx.request.body)
      console.log('pauseRecordspauseRecords', data)
      this.operateLog(
        'log.moduleId.patrolTask.displayName',
        'log.objectType.model_patrol_task.displayName',
        `任务${deffer[execMethod]}`,
        'log.action.patrolTask.displayName',
        `任务${deffer[execMethod]}成功`,
        'log.actionMessageId.update_pause_records.message',
        1
      )
      console.log('actionMessageIdactionMessageId', data)
      // 设置响应体和状态码
      this.success(data)
    } catch (error) {
      this.operateLog(
        'log.moduleId.patrolTask.displayName',
        'log.objectType.model_patrol_task.displayName',
        this.ctx.__('task.pauseOrRestoreOperateLog'),
        'log.action.patrolTask.displayName',
        this.ctx.__('task.pauseOrRestoreOperateLogError'),
        'log.actionMessageId.update_pause_records.message',
        0
      )
      throw new Exception(error.message, error.code, error.transaction)
    }
  }

  /**
   * @summary 暂停恢复列表查询接口
   * @description 暂停恢复列表查询接口 不需要入参
   * @Router get /task/pauseRecordList/search
   * @request query  patrolTaskId *string 巡检任务id
   * @response 200 pauseRecordQueryResponse 创建成功
   */
  @get('/pauseRecordList/search',{description: '暂停恢复列表查询接口'})
  async getPauseRecordList () {
    const { ctx } = this
    try {
      // 校验 `ctx.request.body` 是否符合我们预期的格式
      // ctx.validate(ctx.rule.taskQueryRequest, ctx.request.query);
      // 调用 service 创建一个 topic
      const queryData = ctx.request.query
      const data = await this.pauseRecords.getlist(queryData)
      // 设置响应体和状态码

      this.operateLog(
        'log.moduleId.pauseRecords.displayName',
        'log.objectType.model_pause_records.displayName',
        this.ctx.__('task.getPauseRecordList'),
        'log.action.pauseRecords.displayName',
        this.ctx.__('task.getPauseRecordListOperateLogSuccess'),
        'log.actionMessageId.recevie_patrol_task.message',
        1
      )
      this.success(data)
    } catch (error) {
      this.operateLog(
        'log.moduleId.pauseRecords.displayName',
        'log.objectType.model_pause_records.displayName',
        this.ctx.__('task.getPauseRecordList'),
        'log.action.pauseRecords.displayName',
        this.ctx.__('task.getPauseRecordListOperateLogError'),
        'log.actionMessageId.recevie_patrol_task.message',
        0
      )
      throw new Exception(error.message, error.code, error.transaction)
    }
  }
  /**
   * @summary 任务暂停
   * @description 任务暂停
   * @Router POST /task/stop/all
   * @response 200 taskCreationResponse 创建成功
   */
  // @post('/stop/all',{description: '巡检问题管理'})
  // async taskStopAll () {
  //   const { ctx } = this
  //   //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
  //   // 调用 service 创建一个 topic
  //   //    try {
  //   const id = await this.service.taskStopAll(ctx.request.body)
  //   // 设置响应体和状态码
  //   this.ctx.body = id
  // }

  /**
   * @summary 任务取消
   * @description 任务取消
   * @Router POST /task/cancel
   * @response 200 taskCreationResponse 创建成功
   */
  // @post('/cancel',{description: '巡检问题管理'})
  // async taskCancel () {
  //   const { ctx } = this
  //   //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
  //   // 调用 service 创建一个 topic
  //   //    try {
  //   const id = await this.service.taskCancel(ctx.request.body)
  //   // 设置响应体和状态码
  //   this.ctx.body = id
  // }
  // -------------------------------------------暂停模块 -----------------------------

  /**
   * @TODO bian弃用，移动至appApi
   * @summary 问题上报（ 问题上报）
   * @description 问题上报 （对应app 问题上报）
   * @Router POST /task/createQuestionByApp/add
   * @request body questionAddRequest *body
   * @response 200 taskCreationResponse 创建成功
   */
  // @post('/createQuestionByApp/add',{description: '巡检问题管理'})
  // async createQuestionByApp () {
  //   const { ctx } = this

  //   const userId = ctx.req.headers.userid
  //   const id = await this.service.createQuestionByApp(ctx.request.body, userId)
  //   // 设置响应体和状态码
  //   this.ctx.body = id
  // }

  /**
   * @TODO bian弃用，移动至appApi
   * @summary 接收巡检任务（对应app 接收巡检任务）
   * @description 接收巡检任务 （对应app 接收巡检任务）
   * @Router POST /task/taskRecive/add
   * @request body taskRecieveRequest *body
   * @response 200 taskCreationResponse 接收成功
   */
  // @post('/taskRecive/add',{description: '巡检问题管理'})
  // async taskRecive () {
  //   const { ctx } = this
  //   const userId = ctx.req.headers.userid
  //   //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
  //   // 调用 service 创建一个 topic
  //   try {
  //     const id = await this.service.taskRecive(ctx.request.body, userId)
  //     // 设置响应体和状态码
  //     this.ctx.body = id
  //     this.operateLog(
  //       'log.moduleId.patrolTask.displayName',
  //       'log.objectType.model_patrol_task.displayName',
  //       this.ctx.__('task.taskRecive') + '：' + id,
  //       'log.action.recive.displayName',
  //       this.ctx.__('task.taskReciveOperateLogSuccess'),
  //       'log.actionMessageId.recevie_patrol_task.message',
  //       1
  //     )
  //   } catch (error) {
  //     this.operateLog(
  //       'log.moduleId.patrolTask.displayName',
  //       'log.objectType.model_patrol_task.displayName',
  //       this.ctx.__('task.taskRecive'),
  //       'log.action.recive.displayName',
  //       this.ctx.__('task.taskReciveOperateLogError'),
  //       'log.actionMessageId.recevie_patrol_task.message',
  //       0
  //     )
  //     throw new Exception(error.message, error.code, error.transaction)
  //   }
  // }

  /**
   * @TODO bian弃用
   * @summary 更新任务信息
   * @description 暂时需求 更新任务状态
   * @Router POST /task/updateTask/update
   * @request body taskUpdateRequest *body
   * @response 200 taskUpdateResponse 更新成功
   */
  // @post('/updateTask/update',{description: '巡检问题管理'})
  // async update () {
  //   const { ctx } = this
  //   ctx.validate(ctx.rule.taskUpdateRequest) // 或者ctx.request.query
  //   // 调用 service 创建一个 topic
  //   const data = await this.service.update(ctx.request.body)
  //   // 需要处理下data数据格式
  //   this.success(data)
  // }
  /**
   * @summary 任务管理的列表查询接口
   * @description 筛选条件是任务编号 patrolTaskName  巡检计划  所属区域regionId  巡检模板 巡检执行方式 任务生成时间startTime  任务类型 任务状态
   * @Router Get /task/taskList/search
   * @request query taskQueryRequest *query
   * @response 200 taskQueryResponse
   */
  @get('/taskList/search',{description: '任务管理的列表查询接口'})
  async query () {
    const { ctx } = this
    // 调用 service 创建一个 topic
    // ctx.req.headers.appid = 'hpp'
    const data = await this.service.getlist(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 实现 社区场景下 获取task 下所有的一级巡检项
   * @description 实现 社区场景下 获取task 下所有的一级巡检项
   * @Router Get /task/getTaskItemsByTaskId/by_TaskId
   * @request  query  patrolTaskId *string 巡检任务id
   * @response 200 taskDetailResponse 创建成功
   */
  // @get('/getTaskItemsByTaskId/by_TaskId',{description: '巡检问题管理'})
  // async getTaskItemsByTaskId () {
  //   const { ctx } = this
  //   // 校验 `ctx.request.body` 是否符合我们预期的格式
  //   // 调用 service 创建一个 topic
  //   console.log('parma++++++++++++++++', ctx.request.query)
  //   const data = await this.service.getTaskItemsByTaskId(ctx.request.query)
  //   // 设置响应体和状态码
  //   this.success(data)
  // }

  /**
   * @summary 任务详情查询接口 （app 巡检任务详情）
   * @description 筛选条件是任务patrolTaskId
   * @Router Get /task/detail/get/by_TaskIdAndTaskId
   * @request  query  patrolTaskId *string 巡检任务id
   * @response 200 taskDetailResponse 创建成功
   */

  @get('/detail/get/by_TaskId',{description: '巡检问题管理'})
  async getDetailByTaskId () {
    const { ctx } = this
    // 校验 `ctx.request.body` 是否符合我们预期的格式
    // 调用 service 创建一个 topic
    console.log('parma++++++++++++++++', ctx.request.query)
    const data = await this.service.getTaskInfoByTaskId(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 任务详情查询接口 （app 巡检任务详情）
   * @description 筛选条件是任务patrolTaskId
   * @Router Get /task/detail/get/by_TaskIdAndTaskId
   * @request  query  patrolTaskId *string 巡检任务id
   * @response 200 taskDetailResponse 创建成功
   */

  @get('/detail/getSubstation/by_TaskId',{description: '巡检问题管理'})
  async getSubstationDetailByTaskId () {
    const { ctx } = this
    // 校验 `ctx.request.body` 是否符合我们预期的格式
    // 调用 service 创建一个 topic
    const data = await this.service.getDetailByTaskId(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }

  @get('/getObjList/hasPonits/by_TaskId',{description: '巡检问题管理'})
  async getObjlistHavePonitByTaskId () {
    const { ctx } = this
    // 校验 `ctx.request.body` 是否符合我们预期的格式
    // 调用 service 创建一个 topic
    const data = await this.service.getObjlistHavePonitByTaskId(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 任务巡检项列表详情查询接口 （app 巡检任务详情）
   * @description 筛选条件是任务patrolTaskId
   * @Router Get /task/detail/getTaskItemsByTaskId/by_TaskId
   * @request  query  patrolTaskId *string 巡检任务id
   * @response 200 taskDetailResponse 创建成功
   */

  @get('/detail/getTaskItemsByTaskId/by_TaskId',{description: '巡检问题管理'})
  async getTaskItemsByTaskIdByBs () {
    const { ctx } = this
    // 校验 `ctx.request.body` 是否符合我们预期的格式
    // 调用 service 创建一个 topic
    console.log('parma++++++++++++++++', ctx.request.query)
    const data = await this.service.getTaskItemsByTaskIdByBs(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 获取任务的巡检项列表  通过对象id 和 任务id （app 巡检任务巡检项列表）
   * @description 获取任务的巡检项列表  通过对象id 和 任务id （app 巡检任务巡检项列表）
   * @Router get /task/getTaskItemListbyTaskIdAndObjId/search
   * @request query  patrolTaskId *string 巡检项任务ID  patrolObjId *string 对象id
   */

  @get('/getTaskItemListbyTaskIdAndObjId/search',{description: '获取任务的巡检项列表  通过对象id 和 任务id （app 巡检任务巡检项列表）'})
  async getTaskItemList () {
    const { ctx } = this
    const data = await this.patrolTaskItem.getTaskItemListbyTaskIdAndObjId(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 获取任务巡检项详情  通过patrolTaskItemId （app 获取任务巡检项详情
   * @description 获取任务巡检项详情  通过patrolTaskItemId （app 获取任务巡检项详情
   * @Router get /task/getTaskItemDetailByIdForApp/getDetailByTaskItemId/get
   * @request query  patrolTaskItemId *string 任务巡检项ID
   */
  @get('/getTaskItemDetailByIdForApp/getDetailByTaskItemId/get',{description: '获取任务巡检项详情  通过patrolTaskItemId （app 获取任务巡检项详情'})
  async getTaskItemDetailByIdForApp () {
    const { ctx } = this
    const data = await this.patrolTaskItem.getTaskItemDetailByIdForApp(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }

  /*
   * @summary 任务关联检测点查询接口
   * @description 筛选条件是patrolTaskId,firstItemId,pointerStatus
   * @Router Get /task/pointerList/search
   * @request  query  patrolTaskId *string 巡检任务id
   * @response 200 taskDetailResponse 创建成功
   */

  @get('/pointerList/search',{description: '任务关联检测点查询接口'})
  async getPointerListByTaskId () {
    const { ctx } = this
    // 校验 `ctx.request.body` 是否符合我们预期的格式
    // 调用 service 创建一个 topic
    console.log('parma++++++++++++++++', ctx.request.query)
    const data = await this.service.getPointerListByTaskId(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 任务关联一级巡检项列表查询接口
   * @description 筛选条件是patrolTaskId
   * @Router Get /task/firstLevelItemList/get
   * @request  query  patrolTaskId *string 巡检任务id
   * @response 200 taskDetailResponse 创建成功
   */
  @get('/firstLevelItemList/get',{description: '任务关联一级巡检项列表查询接口'})
  async getFirstLevelItemListByTaskId () {
    const { ctx } = this
    // 校验 `ctx.request.body` 是否符合我们预期的格式
    // 调用 service
    // const data = await this.service.getFirstLevelItemListByTaskId(ctx.request.query)
    const data = await this.service.getTaskFirstItemsByTaskId(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }
  @get('/asyncItemList/get',{description: '巡检问题管理'})
  async getSyncTaskItemList () {
    const { ctx } = this
    const data = await this.service.getSyncTaskItemList(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }
  /**
   * @summary 查询当前任务下已处理和未处理抓图的数量信息
   * @description 筛选条件是patrolTaskId
   * @Router Get /task/resolveInfo/get
   * @request  query  patrolTaskId *string 巡检任务id
   * @response 200 taskDetailResponse 查询成功
   */
  @get('/resolveInfo/get',{description: '查询当前任务下已处理和未处理抓图的数量信息'})
  async getResolveInfoByTaskId () {
    const { ctx } = this
    // 校验 `ctx.request.body` 是否符合我们预期的格式
    // 调用 service
    const data = await this.service.getResolveInfoByTaskId(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 查询当前任务下已处理和未处理巡检项的信息
   * @description 筛选条件是patrolTaskId
   * @Router Get /task/resolveInfo/item/get
   * @request  query  patrolTaskId *string 巡检任务id
   * @response 200 taskDetailResponse 查询成功
   */
  @get('/resolveInfo/item/get',{description: '查询当前任务下已处理和未处理巡检项的信息'})
  async getResolveItemInfoByTaskId () {
    const { ctx } = this
    // 校验 `ctx.request.body` 是否符合我们预期的格式
    // 调用 service
    const data = await this.service.getResolveItemInfoByTaskId(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 查询当前任务下检测点的详细信息
   * @description 筛选条件是patrolTaskId和pointId
   * @Router Get /task/pointDetail/get
   * @request  query  patrolTaskId *string 巡检任务id
   * @response 200 taskDetailResponse 查询成功
   */
  @get('/pointDetail/get',{description: '查询当前任务下检测点的详细信息'})
  async getPointDetail () {
    const { ctx } = this
    // 校验 `ctx.request.body` 是否符合我们预期的格式
    // 调用 service
    const data = await this.service.getPointDetail(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 通过任务查询计划流程信息
   * @description 筛选条件是patrolTaskId
   * @Router Get /task/pointDetail/get
   * @request  query  patrolTaskId *string 巡检任务id
   * @response 200 taskDetailResponse 查询成功
   */
  @get('/process/get',{description: '通过任务查询计划流程信息'})
  async getProcess () {
    const { ctx } = this
    // 校验 `ctx.request.body` 是否符合我们预期的格式
    // 调用 service
    const data = await this.service.getProcess(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 查询当前巡检点位巡检的结果
   * @description 筛选条件是patrolTaskId和pointId
   * @Router Get /task/pointDetail/get
   * @request  query  patrolTaskId *string 巡检任务id
   * @response 200 taskDetailResponse 查询成功
   */
  // v1.1.0新增(用于巡检结果编辑的数据回显)
  @get('/pointPatrolDetail/get',{description: '查询当前巡检点位巡检的结果'})
  async getPointPatrolDetail () {
    const { ctx } = this
    // 校验 `ctx.request.body` 是否符合我们预期的格式
    // 调用 service
    const data = await this.service.getPointPatrolDetail(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }


  /**
   * @summary 查询当前任务下巡检项的详细信息
   * @description 筛选条件是patrolTaskItemId
   * @Router Get /task/itemDetail/get
   */
  @get('/itemDetail/get',{description: '查询当前任务下巡检项的详细信息'})
  async getItemDetail () {
    const { ctx } = this
    // 校验 `ctx.request.body` 是否符合我们预期的格式
    // 调用 service
    const data = await this.service.getItemDetail(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }
  /**
   * @summary 查询检测点关联巡检项的所有子项
   * @description 筛选条件是patrolPointId
   * @Router Get /task/pointItemTree/get
   * @request  query  patrolPointId *string 检测点id
   * @response 200 taskDetailResponse 查询成功
   */
  @get('/pointItemTree/get',{description: '查询检测点关联巡检项的所有子项'})
  async getPointItemTree () {
    const { ctx } = this
    // 校验 `ctx.request.body` 是否符合我们预期的格式
    // 调用 service
    const data = await this.service.getPointItemTree(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }
  /**
   * @summary 查询任务下的巡检对象列表
   * @description 需要传入patrolTaskId
   * @Router Get /task/patrolObj/get
   * @request  query  patrolTaskId *string 巡检任务id
   * @response 200 taskDetailResponse 查询成功
   */
  @get('/patrolObj/get',{description: '查询任务下的巡检对象列表'})
  async getPatrolObj () {
    const { ctx } = this
    // 校验 `ctx.request.body` 是否符合我们预期的格式
    // 调用 service
    const data = await this.service.getObjListByTaskId(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }

}
