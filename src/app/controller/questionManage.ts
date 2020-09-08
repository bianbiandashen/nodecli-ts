'use strict'
import { Context, inject, provide,Application } from 'midway'
import { get,post,controller } from '../../decorator/openApi'
import { BaseController } from '../core/base_controller'
import { IQuestionManageService } from '../interface/questionManageInterface';
import { IPatrolObjService } from '../interface/patrolObjInterface';
import { IpdmsService } from '../interface/pdmsInterface';
import { ITransactionFlowService } from '../interface/transactionFlowInterface';
import { IpatrolTaskItemService } from '../interface/patrolTaskItemInterface';
const Exception = require('../core/Exception')
/**
 * @Controller questionManage
 */
@provide()
@controller('/questionManage',{description: '巡检问题管理'})
export class QuestionController extends BaseController {
  @inject()
  ctx: Context;
  app: Application;

  @inject('questionManageService')
  service: IQuestionManageService;

  @inject('patrolObjService')
  patrolObj: IPatrolObjService;

  @inject('pdmsService')
  pdms: IpdmsService;

  @inject('transactionFlowService')
  transactionFlow: ITransactionFlowService;

  @inject('patrolTaskItemService')
  patrolTaskItem: IpatrolTaskItemService;
  /**
   * @summary 获取问题列表
   * @description 根据筛选条件获取问题列表
   * @Router Post /questionManage/getQuestion/search
   */
  @post('/getQuestion/search', {description: '获取问题列表'})
  async getQuestionSearch () {
    try {
      const params = this.ctx.request.body
      const data = await this.service.getQuestionService(params)
      this.success(data)
    } catch (error) {
      throw new Exception(error.message, error.code, error.transaction)
    }
  }
  /**
   * @summary 通过关联点获取问题所有流程按照问题版本大小倒叙排列
   * @description 通过关联点获取问题所有流程按照问题版本大小倒叙排列
   * @Router GET /questionManage/getQuestionTrans/search
   */

  @get('/getQuestionTrans/search',{description: '通过关联点获取问题所有流程按照问题版本大小倒叙排列'})
  async getQuestionTrans () {
    try {
      const data = await this.service.getQuestionTrans(this.ctx.request.query)
      this.operateLog(
        'log.moduleId.questionManage.displayName', // 模块标识
        'log.objectType.model_transactionFlow.displayName',
        this.ctx.__('questionManage.getQuestionTrans'),
        'log.action.query.displayName',
        this.ctx.__('questionManage.getQuestionTransOperateLogSuccess'),
        'log.actionMessageId.get_getQuestion_flow.message',
        1
      )
      this.success(data)
    } catch (error) {
      this.operateLog(
        'log.moduleId.questionManage.displayName', // 模块标识
        'log.objectType.model_transactionFlow.displayName',
        this.ctx.__('questionManage.getQuestionTrans'),
        'log.action.query.displayName',
        this.ctx.__('questionManage.getQuestionTransOperateLogError'),
        'log.actionMessageId.get_getQuestion_flow.message',
        0
      )
      throw new Exception(error.message, error.code, error.transaction)
    }
  }

  /**
   * @summary 通过任务检测点Id，或任务巡检项id， 或结论表taskId 获取计划模板，在process 获取全部的进程
   * @description 通过关联点获取问题所有流程按照问题版本大小倒叙排列
   * @Router GET /questionManage/getPsProcess/get
   */

  @get('/getPsProcess/get',{description: '通过任务检测点Id，或任务巡检项id， 或结论表taskId 获取计划模板，在process 获取全部的进程'})
  async getPsProcess () {
    try {
      const data = await this.service.getPsProcess(this.ctx.request.query)
      this.success(data)
    } catch (error) {
      throw new Exception(error.message, error.code, error.transaction)
    }
  }

  /**
   * @summary 一键巡查模块地图 分页获取区域下得对象
   * @description 获取区域下得对象
   * @Router GET /questionManage/wad/getObjPage/search
   */

  @get('/wad/getObjPage/search',{description:'获取区域下得对象'})
  async getObjPage () {
    try {
      const params = this.ctx.request.query
      params.patrolObjName = params.patrolObjName.replace(/_/g, '\\_').replace(/%/g, '\\%')
      const data = await this.service.getObjPage(params)
      this.operateLog(
        'log.moduleId.map.displayName', // 模块标识
        'log.objectType.model_patrol_obj.displayName',
        '',
        'log.action.query.displayName',
        this.ctx.__('questionManage.getObjPageOperateLogSuccess'),
        'log.actionMessageId.get_patrol_obj.message',
        1
      )
      this.success(data)
    } catch (error) {
      this.operateLog(
        'log.moduleId.map.displayName', // 模块标识
        'log.objectType.model_patrol_obj.displayName',
        '',
        'log.action.query.displayName',
        this.ctx.__('questionManage.getObjPageOperateLogError'),
        'log.actionMessageId.get_patrol_obj.message',
        0
      )
      throw new Exception(error.message, error.code, error.transaction)
    }
  }

  /**
   * @summary 获取任务巡检项和任务检测点
   * @description 获取任务巡检项和任务检测点
   * @Router GET /questionManage/getPatrolTaskId/get
   */

  @get('/getPatrolTaskId/get',{description:'获取任务巡检项和任务检测点'})
  async getPatrolTaskId () {
    const data = await this.service.getPatrolTaskId(this.ctx.request.query)
    this.success(data)
  }

  /**
   * @summary 获取获取用户权限的巡检对象
   * @description 获取获取用户权限的巡检对象
   * @Router GET /questionManage/getPatrolObjLimit/get
   */

  @get('/getPatrolObjLimit/get',{description:'获取获取用户权限的巡检对象'})
  async getPatrolObjLimit () {
    const data = await this.patrolObj.patrolObjQueryByQuestionService()
    this.success(data)
  }

  /**
   * @summary 根据组织orgId获取人员
   * @description {orgId}
   * @Router GET /questionManage/wad/pdms/pdms/userList/get/by_orgId
   */

  @get('/wad/pdms/pdms/userList/get/by_orgId',{description:'根据组织orgId获取人员'})
  async getUserListByOrgId () {
    const userList = await this.pdms.getUserListByOrgId(this.ctx.request.query)
    this.success(userList)
  }

  /**
   * @summary 根据角色ID获取相关人员
   * @Router GET /questionManage/wad/pdms/pdms/roleUsers/search
   */

  @get('/wad/pdms/pdms/roleUsers/search',{description:'根据角色ID获取相关人员'})
  async getRoleUsers () {
    const { roleId } = this.ctx.request.query
    const personInfoList = await this.pdms.getPersonListByRoleId(roleId)
    this.success(personInfoList)
  }

  /**
   * @summary 获取角色列表-全部
   * @description {roleName} 模糊查询符合该输入条件的角色名称
   * @Router GET /questionManage/wad/pdms/pdms/rolePage/search
   */

  @get('/wad/pdms/pdms/rolePage/search',{description:'模糊查询符合该输入条件的角色名称'})
  async getRolePage () {
    const result = await this.pdms.getAllRoles(this.ctx.request.query)
    this.success(result)
  }

  /**
   * @summary 组织树-异步树-有用户权限
   * @description 组织树-异步树-有用户权限
   * @Router GET /questionManage/wad/pdms/pdms/users/asyncOrgTree
   * @request body asyncTreeRequest *body
   * @response 200 asyncTreeResponse
   */

  @get('/wad/pdms/pdms/users/asyncOrgTree',{description:'组织树-异步树-有用户权限'})
  async asyncOrgTreeByLimit () {
    const result = await this.pdms.asyncOrgTreeByLimit()
    this.success(result)
  }

  /**
   * @summary 组织树-模糊查询-有用户权限
   * @description 组织树-模糊查询-有用户权限
   * @Router GET /questionManage/wad/pdms/pdms/users/asyncOrgTree/by_OrgName
   * @request body asyncTreeSearchRequest *body
   * @response 200 asyncTreeResponse
   */

  @get('/wad/pdms/pdms/users/asyncOrgTree/by_OrgName',{description:'组织树-模糊查询-有用户权限'})
  async asyncOrgTreeSearchByLimit () {
    const result = await this.pdms.asyncOrgTreeSearchByLimit()
    this.success(result)
  }

  /**
   * @summary wad 区域树-异步树
   * @description 区域树-异步树
   * @Router GET /questionManage/wad/pdms/pdms/asyncTree
   * @request body asyncTreeRequest *body
   * @response 200 asyncTreeResponse
   */

  @get('/wad/pdms/pdms/asyncTree',{description:'区域树-异步树'})
  async asyncTree () {
    // const result = await ctx.service.questionManage.asyncRegionTree(ctx.request.query)
    const result = await this.pdms.asyncTreeByLimit()
    this.success(result)
  }

  /**
   * @summary wad 区域树-异步树模糊搜索
   * @description 区域树-异步树
   * @Router GET /questionManage/wad/pdms/pdms/asyncTree/by_regionName
   * @request body asyncTreeRequest *body
   * @response 200 asyncTreeResponse
   */

  @get('/wad/pdms/pdms/asyncTree/by_regionName',{description:'区域树-异步树模糊搜索'})
  async asyncTreeSearch () {
    const result = await this.pdms.asyncTreeSearchByLimit()
    this.success(result)
  }

  /**
   * @summary 获取区域下得对象
   * @description 获取区域下得对象
   * @Router GET /questionManage/getObjList/search
   */

  @get('/getObjList/search',{description:'获取区域下得对象'})
  async getObjList () {
    const { ctx } = this
    try {
      // 参数处理_、%
      const params = ctx.request.query || {}
      if (params.patrolObjName) {
        params.patrolObjName = params.patrolObjName.replace(/_/g, '\\_').replace(/%/g, '\\%')
      }
      const data = await this.service.getObjList(params)
      this.success(data)
    } catch (error) {
      throw new Exception(error.message, error.code, error.transaction)
    }
  }

  /**
   * @summary 获取下步执行人 （app使用）
   * @description  获取问题详情 （app使用）
   * @Router Get /questionManage/transactionFlow/getQuestionInfo/by_TransationId
   */

  @get('/transactionFlow/getQuestionInfo/by_TransationId',{description:'获取下步执行人 （app使用）'})
  async getQuestionInfo () {
    const { ctx } = this
    //   ctx.validate(ctx.rule.taskCreationRequest); // 或者ctx.request.query
    // 调用 service 创建一个 topic
    //    try {

    // const userId = ctx.req.headers.userid
    const response = await this.transactionFlow.getQuestionInfo(ctx.request.query)
    // 设置响应体和状态码
    this.success(response)
  }

  /**
   * @summary 获取问题图片
   * @description 获取区域下得对象
   * @Router GET /questionManage/getQuestionImg/get
   */

  @get('/getQuestionImg/get',{description:'获取问题图片'})
  async getQuestionImg () {
    const { ctx } = this
    const data = await this.service.getQuestionImg(ctx.request.query)
    this.success(data)
  }

  /**
   * @summary 更新问题进程
   * @description 更新问题进程
   * @Router POST /questionManage/nextStep/post
   */

  @post('/nextStep/post',{description:'更新问题进程'})
  async nextStep () {
    const { ctx } = this
    try {
      console.log('ctx.request.body', ctx.request.body)
      const relativeId = ctx.request.body.relativeId
      const judge = ctx.request.body.judge || 'Pass'
      const info = ctx.request.body.info
      // const status = ctx.request.body.status
      const execUsers = ctx.request.body.execUsers
      const copyUsers = ctx.request.body.copyUsers || ''
      // const modifier = ctx.session.cas.userinfo || '22'   // 线上一定要打开不然是默认值
      const modifier = ctx.getUserId() || ctx.request.header.currentuserid
      // const modifier = 'bianbian'
      console.log('', relativeId)
      const result = await this.transactionFlow.nextStep(
        relativeId,
        judge,
        info,
        execUsers,
        copyUsers,
        modifier
        // status
      )
      // this.ctx.body = result
      this.operateLog(
        'log.moduleId.questionManage.displayName',
        'log.objectType.model_transactionFlow.displayName',
        '',
        'log.action.update.displayName',
        this.ctx.__('questionManage.nextStepOperateLogSuccess'),
        'log.actionMessageId.update_getQuestion.message',
        1
      )
      this.success(result)
      // @TODO 处理成功后，处理消息代办
      console.log(
        this.ctx.__('questionManage.nextStepDebug'),
        ctx.request.body
      )
      this.app.hikLogger.debug(
        this.ctx.__('questionManage.nextStepDebug'),
        ctx.request.body
      )
      const transactionFlow = await this.transactionFlow.getTransactionOneResultProblem(relativeId)
      console.log('========controller中nextStep结束，查询transaction flow状态=========')
      console.log(transactionFlow)
      const params = {
        pointResultIds: [ relativeId ],
        type: 'questionSubmit'
      }
      await this.patrolTaskItem.createTlnc(params)
    } catch (error) {
      this.operateLog(
        'log.moduleId.questionManage.displayName',
        'log.objectType.model_transactionFlow.displayName',
        '',
        'log.action.update.displayName',
        this.ctx.__('questionManage.nextStepOperateLogError'),
        'log.actionMessageId.update_getQuestion.message',
        0
      )
      throw new Exception(error.message, error.code, error.transaction)
    }
  }

  /**
   * @summary 更新问题进程
   * @description 更新问题进程
   * @Router GET /questionManage/getSingleQuestionDetail
   */
  @get('/getSingleQuestionDetail',{description:'获取问题详情'})
  async getSingleQuestionDetail () {
    const { ctx } = this
    const data = await this.service.getSingleQuestionDetail(ctx.request.query)
    this.success(data)
  }
  /**
   * @summary 获取下一步问题处理人
   * @description 获取下一步问题处理人
   * @Router GET /questionManage/getQuestionNextHandlePerson/get
   */

  @get('/getQuestionNextHandlePerson/get',{description:'获取下一步问题处理人'})
  async getQuestionNextHandlePerson () {
    const { ctx } = this
    const data = await this.service.getQuestionNextHandlePrerson(ctx.request.query)
    this.success(data)
  }

  /**
   * @summary 获取问题列表
   * @description 获取问题列表
   * @Router GET /questionManage/getQuestionList/search
   */

  @get('/getQuestionList/search',{description:'获取问题列表'})
  async getQuestionList () {
    const { ctx } = this
    try {
      const params = ctx.request.query
      // 修复入参_、%问题
      if (params.remark) {
        params.remark = params.remark.replace(/_/g, '\\_').replace(/%/g, '\\%')
      }
      const data = await this.service.getQuestionList(params)
      const queMsg = {
        0: this.ctx.__('questionManage.toBeCheck'),
        1: this.ctx.__('questionManage.checkSuccess'),
        2: this.ctx.__('questionManage.checkFailed'),
        3: this.ctx.__('questionManage.toBeRectified'),
        4: this.ctx.__('questionManage.rectifiedComplete'),
        5: this.ctx.__('questionManage.toBeReview'),
        6: this.ctx.__('questionManage.reviewSuccess'),
        7: this.ctx.__('questionManage.questionFinish'),
        8: this.ctx.__('questionManage.completed')
      }
      this.operateLog(
        'log.moduleId.questionManage.displayName', // 模块标识
        'log.objectType.model_transactionFlow.displayName',
        '',
        'log.action.query.displayName',
        queMsg[params.status] || this.ctx.__('questionManage.questionSearch'),
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
        this.ctx.__('questionManage.getQuestionList'),
        'log.actionMessageId.get_getQuestion_list.message',
        0
      )
      throw new Exception(error.message, error.code, error.transaction)
    }
  }

  /**
   * @summary 获取所有对象类型
   * @description 获取问题列表
   * @Router GET /questionManage/getAllObjType/get
   */

  @get('/getAllObjType/get',{description:'获取巡检对象类型'})
  async getAllObjType () {
    const { ctx } = this
    const data = await this.service.getAllObjType(ctx.request.query)
    this.success(data)
  }

  /**
   * @summary 一键巡查模块 获取对象下所有的检测点
   * @description 获取问题列表
   * @Router GET /questionManage/wad/getPointList/get
   */

  @get('/wad/getPointList/get',{description:'获取对象下所有的检测点'})
  async getPointList () {
    const { ctx } = this
    try {
      console.log('------------获取检测点------------', ctx.request.query)
      const data = await this.service.getPoint(ctx.request.query)
      this.operateLog(
        'log.moduleId.map.displayName', // 模块标识
        'log.objectType.model_patrol_point.displayName',
        '',
        'log.action.query.displayName',
        this.ctx.__('questionManage.getPointListpOperateLogSuccess'),
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
        this.ctx.__('questionManage.getPointListpOperateLogError'),
        'log.actionMessageId.get_point_list.message',
        0
      )
      throw new Exception(error.message, error.code, error.transaction)
    }
  }

  /**
   * 社区 巡查考评获取对象下的全部一级巡检项
   * @description 巡查考评获取对象下的全部一级巡检项
   * @Router GET /questionManage/getInspectionItemAll/get
   */

  @get('/getInspectionItemAll/get',{description:'巡查考评获取对象下的全部一级巡检项'})
  async getInspectionItemAll () {
    const { ctx } = this
    const data = await this.service.getInspectionItemAll(ctx.request.query)
    this.success(data)
  }

  /**
   * 图片巡查一键巡查生成临时任务
   * @description 获取pdms 所有人员
   * @Router GET /questionManage/wad/temporary/task/create
   */

  @get('/wad/temporary/task/create',{description:'图片巡查一键巡查生成临时任务'})
  async temporaryTask () {
    const { ctx } = this
    console.log('dasdasdasdas', ctx.request)
    try {
      const data = await this.service.temporaryTask(ctx.request.query)
      this.operateLog(
        'log.moduleId.map.displayName', // 模块标识
        'log.objectType.model_patrol_point.displayName',
        '',
        'log.action.save.displayName',
        this.ctx.__('questionManage.temporaryTaskOperateLogSuccess'),
        'log.actionMessageId.get_point_list.message',
        1
      )
      this.success(data)
    } catch (error) {
      this.operateLog(
        'log.moduleId.map.displayName', // 模块标识
        'log.objectType.model_patrol_point.displayName',
        '',
        'log.action.save.displayName',
        this.ctx.__('questionManage.temporaryTaskOperateLogError'),
        'log.actionMessageId.get_point_list.message',
        0
      )
      throw new Exception(error.message, error.code, error.transaction)
    }
  }
  /**
   * 批量复核问题
   * @description
   * @Router GET /questionManage/batch/review
   */
  @post('/batch/review',{description:'批量复核问题'})
  async batchReview () {
    const { ctx } = this
    const data = await this.service.batchReview(ctx.request.body, Exception)
    this.success(data)
  }
}
