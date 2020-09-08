/*
 * @作者: bianlian
 * @创建时间: 2020-01-19 11:28:53
 * @Last Modified by: bainlian
 * @Last Modified time: 2020-02-22 14:26:07
 */

'use strict';
import { Context, inject, provide,Application } from 'midway'
import { get,post,controller } from '../../decorator/openApi'
import { BaseController } from '../core/base_controller'
import { ITransactionFlowService } from '../interface/transactionFlowInterface';

/**
 * @Controller transactionFlow
 */
@provide()
@controller('/transactionFlow',{description: '流程'})
export class TransactionFlowController extends BaseController {
  @inject()
  ctx: Context;
  app: Application;

  @inject('transactionFlowService')
  service: ITransactionFlowService;
  /**
   * @summary 问题处理接口 创建新的问题流程 复核 整改 审核 都用这个接口
   * @description 巡检项确认是问题后，创建新的问题 复核 整改 审核 都用这个接口
   * @Router POST /transactionFlow/question/add
   * @request body transactionFlowRequest *body
   * @response 200 transactionFlowResponse 创建成功
   */
  @post('/question/add',{description: '问题处理接口 创建新的问题流程 复核 整改 审核 都用这个接口'})
  async create() {
    const {
      ctx
    } = this;
    //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
    // 调用 service 创建一个 topic
    //    try {
    const {
      relativeId,
      judge,
      info,
      execUsers,
      copyUsers
    } = ctx.request.body
    const userId = ctx.req.headers.userid
    console.log(' ctx.request.body ctx.request.body', ctx.request.body)
    console.log('execUsersexecUsersexecUsers', ctx.req.headers.userid)
    //
    const id = await this.service.nextStep(relativeId, judge, info, execUsers, copyUsers, userId);
    // 设置响应体和状态码
    this.success(id)

  }
  /**
   * @summary 接收问题
   * @description 接收问题
   * @Router POST /transactionFlow/question/acceptProblem
   * @request body transactionAcceptProblemRequest *body
   * @response 200  创建成功
   */
  @post('/question/acceptProblem',{description: '接收问题'})
  async acceptProblem() {
    const {
      ctx
    } = this;
    //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
    // 调用 service 创建一个 topic
    //    try {
    const {
      relativeId
    } = ctx.request.body
    const userId = ctx.req.headers.userid
    const id = await this.service.acceptProblem(relativeId, userId);
    // 设置响应体和状态码

    this.success(id)

  }


  /**
   * @summary 问题创建接口 java调用
   * @description 问题创建接口 java调用
   * @Router POST /transactionFlow/question/createFlow
   * @request body transactionFlowRequest *body
   * @response 200 transactionFlowResponse 创建成功
   */
  @post('/question/createFlow',{description: '问题创建接口 java调用'})
  async createFlow() {
    const {
      ctx
    } = this;
    //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
    // 调用 service 创建一个 topic
    //    try {
    const {
      relativeId,
      execUsers,
      copyUsers,
      modifier
    } = ctx.request.body
    //
    const id = await this.service.createFlow(relativeId, execUsers, copyUsers, modifier,'');
    // 设置响应体和状态码
    this.success(id);
  }
  /**
   * @summary 获取问题列表根据对象id （app变电站使用）
   * @description  获取问题列表根据对象id （app变电站使用）
   * @Router Get /transactionFlow/getTransactionFlowList/search
   * @request  query  transactionId *string 流程id
   * @response 200  创建成功
   */

  @get('/getTransactionFlowList/search',{description: '获取问题列表根据对象id （app变电站使用）'})
  async getTransactionFlowList() {
    const {
      ctx
    } = this;
    //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
    // 调用 service 创建一个 topic
    //    try {
    // const userId = ctx.req.headers.userid
    const id = await this.service.getTransactionFlowList(ctx.request.query)
    // 设置响应体和状态码
    this.success(id);
  }


  /**
   * @summary 获取问题列表根据对象id （app变电站使用）
   * @description  获取问题列表根据对象id （app变电站使用）
   * @Router Get /transactionFlow/listByObjId/search
   * @request body transactionFlowlistByObjIdRequest *body
   * @response 200  创建成功
   */
  @get('/listByObjId/search',{description: '获取问题列表根据对象id （app变电站使用）'})
  async listByObjId() {
    const {
      ctx
    } = this;
    //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
    // 调用 service 创建一个 topic
    //    try {

    const userId = ctx.req.headers.userid

    const id = await this.service.getlistByObjId(ctx.request.query, userId)
    // 设置响应体和状态码
    this.success(id);

  }

  /**
   * @summary  社区那边根据 一级巡检项 获取一级巡检项下面所有的 问题列表
   * @description   社区那边根据 一级巡检项 获取一级巡检项下面所有的 问题列表
   * @Router Get /transactionFlow/getQuestionlistByFirstTaskItemId/get
   * @request body getQuestionlistByFirstTaskItemIdRequest *body
   * @response 200  创建成功
   */

  // @get('/getQuestionlistByFirstTaskItemId/get')
  // async getQuestionlistByFirstTaskItemId() {
  //   const {
  //     ctx
  //   } = this;
  //   //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
  //   // 调用 service 创建一个 topic
  //   //    try {

  //   const userId = ctx.req.headers.userid

  //   const id = await this.service.getQuestionlistByFirstTaskItemId(ctx.request.query, userId)
  //   // 设置响应体和状态码
  //   this.success(id);

  // }


  /**
   * @summary 获取问题列表根据TransationId （app变电站使用）
   * @description  获取问题列表根据对象id （app变电站使用）
   * @Router Get /transactionFlow/getQuestionInfo/by_TransationId
   * @request body getQuestionInfoByTransationId Request *body
   * @response body getQuestionByTransationId *body
   */
  @get('/getQuestionInfo/by_TransationId')
  async getQuestionInfo() {
    const {
      ctx
    } = this;
    //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
    // 调用 service 创建一个 topic
    //    try {

    // const userId = ctx.req.headers.userid
    const id = await this.service.getQuestionInfo(ctx.request.query)
    // 设置响应体和状态码
    this.success(id)
  }


  // /**
  //  * @summary 更新流程引擎
  //  * @description 操作流程引擎
  //  * @Router POST /transactionFlow/flow/update
  //  * @request body transactionFlowUpdateRequest *body
  //  * @response 200 transactionFlowUpdateResponse 更新成功
  //  */
  // @post('/temporaryTaskCreation/update')
  // async update() {
  //   const {
  //     ctx
  //   } = this;
  //   const {
  //     relativeId,
  //     judge,
  //     info,
  //     execUsers,
  //     copyUsers,
  //     modifier
  //   } = ctx.request.body
  //   //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
  //   // 调用 service 创建一个 topic
  //   //    try {
  //   const id = await ctx.service.transactionFlow.nextStep(relativeId, judge, info, execUsers, copyUsers, modifier);
  //   // 设置响应体和状态码
  //   this.success(id);

  // }
}
