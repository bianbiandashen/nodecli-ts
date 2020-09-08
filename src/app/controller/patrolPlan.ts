import { Context, inject, provide } from 'midway'
import { IPatrolPlanService } from '../interface/patrolPlanInterface';
import { IPatrolPlanGroupService } from '../interface/patrolPlanGroupInterface';
import { IPatrolObjService } from '../interface/patrolObjInterface';
import { IPatrolItemService } from '../interface/patrolItemInterface';
import { IPatrolPointService } from '../interface/patrolPointInterface';

import { get,post,controller,Query,Header,Body } from '../../decorator/openApi'
import { BaseController } from '../core/base_controller'
const Exception = require('../core/Exception')

@provide()
@controller('/patrolPlan',{description: '巡检计划模块'})
export class PatrolPlanController extends BaseController {
  @inject()
  ctx: Context;

  @inject('patrolPlanService')
  service: IPatrolPlanService;

  @inject('patrolPlanGroupService')
  patrolPlanGroupService: IPatrolPlanGroupService;

  @inject('patrolObjService')
  patrolObjService: IPatrolObjService;

  @inject('patrolItemService')
  patrolItemService: IPatrolItemService;

  @inject('patrolPointService')
  patrolPointService: IPatrolPointService;

  /*
   * @description 巡检计划任务拆分接口
  */
  @get('/task/split', {
    description: '巡检计划任务拆分接口',
    responses: 'API.SuccessRes'
  })
  async planTaskSplit () {
    try {
      this.success('planTaskSplit')
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }
  /*
   * @description 获取巡检计划编号
  */
  @get('/patrolPlanUuid/get', {
    description: '获取巡检计划编号',
    responses: 'API.SuccessRes'
  })
  async getPatrolPlanUuid () {
    try {
      const uuid = await this.service.getPatrolPlanUuid()
      this.success(uuid)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }
  /*
   * @description 巡检计划编号校验
  */
  @get('/planName/isExist', {description: '巡检计划编号（名称）校验'})
  async planNameIsExist (
    @Header('string',{description:'应用标识'})
    appid:string,
    @Query('string', {description: '巡检计划编号（名称）'})
    patrolPlanName:string
  ) {
    try {
      // if (this.app.formatChar(ctx.request.query) === false) {
      //   return this.fail(this.ctx.__('patrolPlan.requestParamsHasEspecialWord'))
      // }
      const plan = await this.service.planNameIsExist(patrolPlanName)
      const isExist = plan.length > 0
      this.success(isExist)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }
  /*
   * @description 巡检计划列表查询（分页）
  */
  @get('/search', {description: '巡检计划列表查询（分页）'})
  async queryPlanList (
    @Header('string',{ description:'应用标识' }) appid:string,
    @Query('string',{ description:'巡检计划编号（名称）' }) patrolPlanName:string,
    @Query('string',{ description:'所属区域' }) patrolAreaIds:string,
    @Query('string',{ description:'任务执行方式' }) executeType:string,
    @Query('string',{ description:'计划状态' }) patrolPlanStatus:string,
    @Query('string',{ description:'计划模板编号' }) psId:string,
    @Query('string',{ description:'计划有效期开始时间' }) planEffectiveStart:string,
    @Query('string',{ description:'计划有效期结束时间' }) planEffectiveEnd:string,
    @Query('string',{ description:'计划创建开始时间' }) createTimeStart:string,
    @Query('string',{ description:'计划创建结束时间' }) createTimeEnd:string,
    @Query('string',{ description:'页码' }) pageNo:string,
    @Query('string',{ description:'每页条数' }) pageSize:string
  ) {
    try {
      // if (this.app.formatChar(ctx.request.query) === false) {
      //   return this.fail(this.ctx.__('patrolPlan.requestParamsHasEspecialWord'))
      // }
      const data = await this.service.queryPlanList(this.ctx.request.query)
      this.operateLog(
        'log.moduleId.patrolPlan.displayName',
        'log.objectType.model_patrol_plan.displayName',
        this.ctx.__('patrolPlan.queryPlanPatrolPlan'),
        'log.action.query.displayName',
        this.ctx.__('patrolPlan.queryPlanOperateLogSuccess'),
        'log.actionMessageId.query_patrol_plan_list.message',
        1
      )
      this.success(data)
    } catch (err) {
      this.operateLog(
        'log.moduleId.patrolPlan.displayName',
        'log.objectType.model_patrol_plan.displayName',
        this.ctx.__('patrolPlan.queryPlanPatrolPlan'),
        'log.action.query.displayName',
        this.ctx.__('patrolPlan.queryPlanOperateLogError'),
        'log.actionMessageId.query_patrol_plan_list.message',
        0
      )
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }
  /*
   * @description 巡检计划列表查询（全量）
  */
  @get('/search/all', {description: '巡检计划列表查询（全量）'})
  async queryAllPlanList (
    @Header('string',{ description:'应用标识' }) appid:string
  ){
    try {
      // if (this.app.formatChar(ctx.request.query) === false) {
      //   return this.fail(this.ctx.__('patrolPlan.requestParamsHasEspecialWord'))
      // }
      const data = await this.service.queryPlanAllList(this.ctx.request.query)
      this.operateLog(
        'log.moduleId.patrolPlan.displayName',
        'log.objectType.model_patrol_plan.displayName',
        this.ctx.__('patrolPlan.queryPlanAllPatrolPlan'),
        'log.action.query.displayName',
        this.ctx.__('patrolPlan.queryPlanAllOperateLogSuccess'),
        'log.actionMessageId.query_patrol_plan_list.message',
        1
      )
      this.success(data)
    } catch (err) {
      this.operateLog(
        'log.moduleId.patrolPlan.displayName',
        'log.objectType.model_patrol_plan.displayName',
        this.ctx.__('patrolPlan.queryPlanAllPatrolPlan'),
        'log.action.query.displayName',
        this.ctx.__('patrolPlan.queryPlanAllOperateLogError'),
        'log.actionMessageId.query_patrol_plan_list.message',
        0
      )
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }
  /*
   * @description 删除巡检计划
  */
 @post('/delete', {description: '删除巡检计划'})
 async deletePlan (
   @Header('string',{ description:'应用标识' }) appid:string,
   @Body('string',{ description:'计划ID集合' }) ids:string
 ) {
  try {
    // if (this.app.formatChar(ctx.request.body) === false) {
    //   return this.fail(this.ctx.__('patrolPlan.requestParamsHasEspecialWord'))
    // }
    const ids = await this.service.deletePatrolPlanData(this.ctx.request.body)
    this.operateLog(
      'log.moduleId.patrolPlan.displayName',
      'log.objectType.model_patrol_plan.displayName',
       this.ctx.__('patrolPlan.patrolPlan'),
      'log.action.delete.displayName',
      this.ctx.__('patrolPlan.deletePlanOperateLogSuccess'),
      'log.actionMessageId.delete_patrol_plan.message',
      1
    )
    this.success(ids)
  } catch (err) {
    this.operateLog(
      'log.moduleId.patrolPlan.displayName',
      'log.objectType.model_patrol_plan.displayName',
      this.ctx.__('patrolPlan.patrolPlan'),
      'log.action.delete.displayName',
      this.ctx.__('patrolPlan.deletePlanOperateLogError'),
      'log.actionMessageId.delete_patrol_plan.message',
      0
    )
    throw new Exception(err.message, err.code, err.transaction)
  } finally{}
 }
 /*
  * @description 巡检计划状态更新
  */
 @post('/planStatus/update', {description: '巡检计划状态更新'})
 async setPlanStatus (
  @Header('string',{ description:'应用标识' }) appid:string,
  @Body('string',{ description:'计划id' }) patrolPlanId:string,
  @Body('number',{ description:'计划状态' }) patrolPlanStatus:number
 ) {
  // const { patrolPlanId, patrolPlanStatus } = this.ctx.request.body
  try {
    // if (this.app.formatChar(ctx.request.body) === false) {
    //   return this.fail(this.ctx.__('patrolPlan.requestParamsHasEspecialWord'))
    // }
    const data = await this.service.updatePatrolStatus(this.ctx.request.body)
    // this.operateLog(
    //   'log.moduleId.patrolPlan.displayName',
    //   'log.objectType.model_patrol_plan.displayName',
    //   this.ctx.__('patrolPlan.patrolPlan') + ':' + patrolPlanId,
    //   `log.action.${patrolPlanStatus === 0 ? 'stopUse' : 'startUp'}.displayName`,
    //   this.ctx.__('patrolPlan.patrolPlan') + patrolPlanStatus === 0 ? this.ctx.__('patrolPlan.stopUseSuccess') : this.ctx.__('patrolPlan.startUseSuccess'),
    //   `log.actionMessageId.${patrolPlanStatus === 0 ? 'stopUse' : 'startUp'}_patrol_plan.message`,
    //   1
    // )
    this.success(data)
  } catch (err) {
    // this.operateLog(
    //   'log.moduleId.patrolPlan.displayName',
    //   'log.objectType.model_patrol_plan.displayName',
    //   this.ctx.__('patrolPlan.patrolPlan') + ':' + patrolPlanId,
    //   `log.action.${patrolPlanStatus === 0 ? 'stopUse' : 'startUp'}.displayName`,
    //   this.ctx.__('patrolPlan.patrolPlan') + patrolPlanStatus === 0 ? this.ctx.__('patrolPlan.stopUseError') : this.ctx.__('patrolPlan.startUseError'),
    //   `log.actionMessageId.${patrolPlanStatus === 0 ? 'stopUse' : 'startUp'}_patrol_plan.message`,
    //   0
    // )
    throw new Exception(err.message, err.code, err.transaction)
  } finally{}
 }
 /*
  * @description 添加巡检计划
  */
 @post('/add', {description: '添加巡检计划'})
 async addPatrolPlan (
  @Header('string',{ description:'应用标识' }) appid:string
 ) {
  try {
    // if (this.app.formatChar(ctx.request.query) === false) {
    //   return this.fail(this.ctx.__('patrolPlan.requestParamsHasEspecialWord'))
    // }
    const id = await this.service.addPatrolPlan(this.ctx.request.body)
    this.operateLog(
      'log.moduleId.patrolPlan.displayName',
      'log.objectType.model_patrol_plan.displayName',
      this.ctx.__('patrolPlan.patrolPlan'),
      'log.action.save.displayName',
      this.ctx.__('patrolPlan.addPatrolPlanOperateLogSuccess'),
      'log.actionMessageId.save_patrol_plan.message',
      1
    )
    this.success(id)
  } catch (err) {
    this.operateLog(
      'log.moduleId.patrolPlan.displayName',
      'log.objectType.model_patrol_plan.displayName',
      this.ctx.__('patrolPlan.patrolPlan'),
      'log.action.save.displayName',
      this.ctx.__('patrolPlan.addPatrolPlanOperateLogError'),
      'log.actionMessageId.save_patrol_plan.message',
      0
    )
    throw new Exception(err.message, err.code, err.transaction)
  } finally{}
 }
 /*
  * @description 更新巡检计划
  */
  @post('/update', {description: '更新巡检计划'})
  async updatePlan () {
    try {
      // if (this.app.formatChar(ctx.request.body) === false) {
      //   return this.fail(this.ctx.__('patrolPlan.requestParamsHasEspecialWord'))
      // }
      const id = await this.service.updatePatrolPlanInfo(this.ctx.request.body)
      this.operateLog(
        'log.moduleId.patrolPlan.displayName',
        'log.objectType.model_patrol_plan.displayName',
        this.ctx.__('patrolPlan.patrolPlan') + ':' + this.ctx.request.body.patrolPlanId,
        'log.action.update.displayName',
        this.ctx.__('patrolPlan.updatePlanOperateLogSuccess'),
        'log.actionMessageId.update_patrol_plan.message',
        1
      )
      this.success(id)
    } catch (err) {
      this.operateLog(
        'log.moduleId.patrolPlan.displayName',
        'log.objectType.model_patrol_plan.displayName',
        this.ctx.__('patrolPlan.patrolPlan') + ':' + this.ctx.request.body.patrolPlanId,
        'log.action.update.displayName',
        this.ctx.__('patrolPlan.updatePlanOperateLogError'),
        'log.actionMessageId.update_patrol_plan.message',
        0
      )
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }
   /*
  * @description 巡检计划详情全部信息查询(不包括巡检项和检测点)
  */
  @get('/getDetail/by_patrolPlanId', {description: '巡检计划详情全部信息查询(不包括巡检项和检测点)'})
  async queryPlanDetail () {
    try {
      // if (this.app.formatChar(ctx.request.query) === false) {
      //   return this.fail(this.ctx.__('patrolPlan.requestParamsHasEspecialWord'))
      // }
      const data = await this.service.queryPlanDetail(this.ctx.request.query)
      this.operateLog(
        'log.moduleId.patrolPlan.displayName',
        'log.objectType.model_patrol_plan.displayName',
        this.ctx.__('patrolPlan.queryAllPlanDetailPatrolPlan'),
        'log.action.query.displayName',
        this.ctx.__('patrolPlan.queryAllPlanDetailOperateLogSuccess'),
        'log.actionMessageId.query_patrol_plan_detail.message',
        1
      )
      this.success(data)
    } catch (err) {
      this.operateLog(
        'log.moduleId.patrolPlan.displayName',
        'log.objectType.model_patrol_plan.displayName',
        this.ctx.__('patrolPlan.queryAllPlanDetailPatrolPlan'),
        'log.action.query.displayName',
        this.ctx.__('patrolPlan.queryAllPlanDetailOperateLogError'),
        'log.actionMessageId.query_patrol_plan_detail.message',
        0
      )
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }
  /*
  * @description 巡检计划详情全部信息查询(包括巡检项和检测点)
  */
  @get('/getAllDetail/by_patrolPlanId', {description: '巡检计划详情全部信息查询(包括巡检项和检测点)'})
  async queryAllPlanDetail () {
    try {
      // if (this.app.formatChar(ctx.request.query) === false) {
      //   return this.fail(this.ctx.__('patrolPlan.requestParamsHasEspecialWord'))
      // }
      const data = await this.service.queryAllPlanDetail(this.ctx.request.query)
      this.operateLog(
        'log.moduleId.patrolPlan.displayName',
        'log.objectType.model_patrol_plan.displayName',
        this.ctx.__('patrolPlan.queryAllPlanDetailPatrolPlan'),
        'log.action.query.displayName',
        this.ctx.__('patrolPlan.queryAllPlanDetailOperateLogSuccess'),
        'log.actionMessageId.query_patrol_plan_detail.message',
        1
      )
      this.success(data)
    } catch (err) {
      this.operateLog(
        'log.moduleId.patrolPlan.displayName',
        'log.objectType.model_patrol_plan.displayName',
        this.ctx.__('patrolPlan.queryAllPlanDetailPatrolPlan'),
        'log.action.query.displayName',
        this.ctx.__('patrolPlan.queryAllPlanDetailOperateLogError'),
        'log.actionMessageId.query_patrol_plan_detail.message',
        0
      )
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }
  /*
  * @description 巡检计划详情分步查询(第二步包括巡检项和检测点)
  */
 @get('/getAllDetailStep/by_patrolPlanId', {description: '巡检计划详情分步查询(第二步包括巡检项和检测点)'})
  async queryPlanAllDetailStep () {
    try {
      // if (this.app.formatChar(ctx.request.query) === false) {
      //   return this.fail(this.ctx.__('patrolPlan.requestParamsHasEspecialWord'))
      // }
      const data = await this.service.queryPlanAllDetailStep(this.ctx.request.query)
      this.operateLog(
        'log.moduleId.patrolPlan.displayName',
        'log.objectType.model_patrol_plan.displayName',
        this.ctx.__('patrolPlan.queryPlanDetailStepPatrolPlan'),
        'log.action.query.displayName',
        this.ctx.__('patrolPlan.queryPlanDetailStepOperateLogSuccess'),
        'log.actionMessageId.query_patrol_plan_step_detail.message',
        1
      )
      this.success(data)
    } catch (err) {
      this.operateLog(
        'log.moduleId.patrolPlan.displayName',
        'log.objectType.model_patrol_plan.displayName',
        this.ctx.__('patrolPlan.queryPlanDetailStepPatrolPlan'),
        'log.action.query.displayName',
        this.ctx.__('patrolPlan.queryPlanDetailStepOperateLogError'),
        'log.actionMessageId.query_patrol_plan_step_detail.message',
        0
      )
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }
  /*
  * @description 巡检计划详情分步查询(第二步不包括巡检项和检测点)
  */
  @get('/getDetailStep/by_patrolPlanId', {description: '巡检计划详情分步查询(第二步不包括巡检项和检测点)'})
  async queryPlanDetailStep () {
    try {
      // if (this.app.formatChar(ctx.request.query) === false) {
      //   return this.fail(this.ctx.__('patrolPlan.requestParamsHasEspecialWord'))
      // }
      const data = await this.service.queryPlanDetailStep(this.ctx.request.query)
      this.operateLog(
        'log.moduleId.patrolPlan.displayName',
        'log.objectType.model_patrol_plan.displayName',
        this.ctx.__('patrolPlan.queryPlanDetailStepPatrolPlan'),
        'log.action.query.displayName',
        this.ctx.__('patrolPlan.queryPlanDetailStepOperateLogSuccess'),
        'log.actionMessageId.query_patrol_plan_step_detail.message',
        1
      )
      this.success(data)
    } catch (err) {
      this.operateLog(
        'log.moduleId.patrolPlan.displayName',
        'log.objectType.model_patrol_plan.displayName',
        this.ctx.__('patrolPlan.queryPlanDetailStepPatrolPlan'),
        'log.action.query.displayName',
        this.ctx.__('patrolPlan.queryPlanDetailStepOperateLogError'),
        'log.actionMessageId.query_patrol_plan_step_detail.message',
        0
      )
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }
  /*
  * @description 巡检计划分组信息详情查询
  */
  @get('/getDetailPlanGroup/by_patrolPlanId', {description: '巡检计划分组信息详情查询'})
  async queryPlanDetailPlanGroup () {
    try {
      // if (this.app.formatChar(ctx.request.query) === false) {
      //   return this.fail(this.ctx.__('patrolPlan.requestParamsHasEspecialWord'))
      // }
      const data = await this.patrolPlanGroupService.queryPlanGroupDetail(this.ctx.request.query)
      this.success(data)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }
  /*
   * @description 获取满足计划可添加的巡检对象数量
  */
  @post('/patrolObjCount/get', {description: '获取满足计划可添加的巡检对象数量'})
  async getPatrolObjCount () {
    try {
      // if (this.app.formatChar(ctx.request.body) === false) {
      //   return this.fail(this.ctx.__('patrolPlan.requestParamsHasEspecialWord'))
      // }
      const data = await this.patrolObjService.queryPatrolObjCountByPlan(this.ctx.request.body)
      this.success(data)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }
  /*
   * @description 获取巡检计划中某对象类型下符合要求要添加的巡检项
  */
  @get('/items/get/by_objTypeId', {description: '获取巡检计划中某对象类型下符合要求要添加的巡检项'})
  async getPlanItemsFromObjType () {
    // if (this.app.formatChar(ctx.request.query) === false) {
    //   return this.fail(this.ctx.__('patrolPlan.requestParamsHasEspecialWord'))
    // }
    const data = await this.service.queryPlanItemsFromObjType(this.ctx.request.query)
    this.success(data)
  }
  /*
   * @description 获取巡检计划中某对象下的巡检项及该巡检项的检测点
  */
  @post('/items/get', {description: '获取巡检计划中某对象下的巡检项及该巡检项的检测点'})
  async getPlanItemsAndPoints () {
    try {
      // if (this.app.formatChar(ctx.request.body) === false) {
      //   return this.fail(this.ctx.__('patrolPlan.requestParamsHasEspecialWord'))
      // }
      const data = await this.patrolItemService.queryPlanItemsAndPoints(this.ctx.request.body)
      this.success(data)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }
  /*
   * @description 获取巡检计划中某对象下的巡检项结构
  */
  @get('/itemsTitle/get', {description: '获取巡检计划中某对象下的巡检项结构'})
  async getPlanItemsTitle () {
    try {
      // if (this.app.formatChar(ctx.request.body) === false) {
      //   return this.fail(this.ctx.__('patrolPlan.requestParamsHasEspecialWord'))
      // }
      const data = await this.service.queryPlanItemsTitle(this.ctx.request.query)
      this.success(data)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }
  /*
   * @description 获取巡检项下的检测点
  */
  @get('/patrolItemPoint/get', {description: '获取巡检项下的检测点'})
  async getItemPoints () {    
    try {
      // if (this.app.formatChar(ctx.request.body) === false) {
      //   return this.fail(this.ctx.__('patrolPlan.requestParamsHasEspecialWord'))
      // }
      const data = await this.patrolPointService.queryPointAllList(this.ctx.request.query)
      this.success(data)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }
  /*
   * @description 查询巡检计划流程
  */
  @get('/process/by_planId', {description: '查询巡检计划流程'})
  async getProcessList () {
    try {
      // if (this.app.formatChar(ctx.request.body) === false) {
      //   return this.fail(this.ctx.__('patrolPlan.requestParamsHasEspecialWord'))
      // }
      const data = await this.service.getProcessList(this.ctx.request.query)
      this.success(data)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }
}