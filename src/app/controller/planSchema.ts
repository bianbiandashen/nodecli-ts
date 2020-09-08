import { Context, Application,inject, provide } from 'midway'
import { BaseController } from '../core/base_controller'
import { get,controller } from '../../decorator/openApi'

import { IplanSchemaService } from '../interface/planSchemaInterface';

@provide()
@controller('/planSchema',{description: '巡检计划模板'})
export class PlanSchemaController extends BaseController {
  @inject()
  ctx: Context;
  app: Application;

  @inject('planSchemaService')
  service: IplanSchemaService;

  @get('/planTemp/isExist', {
    description: '查询巡检计划模板是否存在'
  })
  async planTempIsExist(){
    try {
      const data = await this.service.planTempIsExist(this.ctx.request.query);
      const isTrue = !!data
      this.success(isTrue)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }

  @get('/by_psId', {
    description: '查询巡检计划模板详情（包括删除的）'
  })
  async planTempDetail(){
    try {
      const data = await this.service.planTempDetailByPlan(this.ctx.request.query);
      this.success(data);
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }

  @get('/allPlanTemp/search', {
    description: '查询巡检计划模板全部列表—不分页'
  })
  async queryAllPlanTemp(){
    try {
      const data = await this.service.queryAllPlanTemp(this.ctx.request.query);
      this.success(data);
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }

  @get('/planTempDetail/by_psId', {
    description: '查询巡检计划模板详情'
  })
  async queryPlanTempDetail(){
    try {
      const data = await this.service.queryPlanTempDetail(this.ctx.request.query);
      this.success(data);
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }
}