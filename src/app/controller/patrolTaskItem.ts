import { Context, Application,inject, provide } from 'midway'
import { BaseController } from '../core/base_controller'
import { get,controller } from '../../decorator/openApi'

import { IpatrolTaskItemService } from '../interface/patrolTaskItemInterface';


@provide()
@controller('/patrolTaskItem',{description: '任务巡检项'})
export class PatrolTaskItemController extends BaseController {
  @inject()
  ctx: Context;
  app: Application;

  @inject('patrolTaskItemService')
  service: IpatrolTaskItemService;

  @get('/getScenceList/get', {
    description: 'getScenceList'
  })
  async getScenceList(){
    try {
      const data = await this.service.getScenceList(this.ctx.request.query)
      this.success(data)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }

  @get('/getTaskItem/by_patrolTaskItemId', {
    description: 'getTaskItem'
  })
  async getTaskItem(){
    try {
      const data = await this.service.queryOne(this.ctx.request.query)
      this.success(data)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }

  @get('/taskItemTree/get', {
    description: '获取当前任务巡检项关联的直接子级列表接口'
  })
  async getTaskItemTree(){
    try {
      const data = await this.service.getTaskItemTree(this.ctx.request.query)
      this.success(data)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }
}