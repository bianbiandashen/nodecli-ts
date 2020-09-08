import { Context, Application,inject, provide } from 'midway'
import { BaseController } from '../core/base_controller'
import { get,post,controller } from '../../decorator/openApi'

import { IPatrolObjService } from '../interface/patrolObjInterface';


@provide()
@controller('/inspectionObjectView',{description: 'inspectionObjectView'})
export class InspectionObjectViewController extends BaseController {
  @inject()
  ctx: Context;
  app: Application;

  @inject('patrolObjService')
  patrolObjService: IPatrolObjService;

  @post('/used/delete', {
    description: '取消常用温度'
  })
  async usedDelete() {
    try {
      const result = await this.patrolObjService.usedDelService(this.ctx.request.body);
      this.success(result)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }

  @post('/used/search', {
    description: '查询常用温度'
  })
  async usedSearch() {
    try {
      const result = await this.patrolObjService.usedSeaService(this.ctx.request.body);
      this.success(result)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }

  @post('/used/add', {
    description: '保存常用温度'
  })
  async usedAdd() {
    try {
      const result = await this.patrolObjService.usedService(this.ctx.request.body);
      this.success(result)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }

  @post('/temperature/search', {
    description: '温度查询比较'
  })
  async temperature() {
    try {
      const result = await this.patrolObjService.temperatureService(this.ctx.request.body);
      this.success(result)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }

  @post('/thermometry/search', {
    description: '测温位查询'
  })
  async thermometry() {
    try {
      const result = await this.patrolObjService.thermometryService(this.ctx.request.body);
      this.success(result)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }

  @get('/query', {
    description: '巡检对象分页查询'
  })
  async query(){
    try {
      this.success('planTaskSplit')
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }

  @get('/single', {
    description: '巡检对象详情'
  })
  async single() {
    try {
      const patrolObjId = this.ctx.request.query.id
      const result = await this.patrolObjService.patrolObjQueryService({ patrolObjId });
      this.success(result)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }

  @post('/inspection/query', {
    description: '分页查询巡检对象巡检记录'
  })
  async inspectionQuery() {
    try {
      const result = await this.patrolObjService.objectsTaskService(this.ctx.request.body);
      this.operateLog(
        'log.moduleId.patrolObjView.displayName',
        'log.objectType.patrolObjViewType.displayName',
        '',
        'log.action.query.displayName',
        this.ctx.__('inspectionConclusion.inspectionQueryOperateLog'),
        'log.actionMessageId.query_patrol_obj_view.message',
        1
      )
      this.success(result)
    } catch (err) {
      this.operateLog(
        'log.moduleId.patrolObjView.displayName',
        'log.objectType.patrolObjViewType.displayName',
        '',
        'log.action.query.displayName',
        this.ctx.__('inspectionConclusion.inspectionQueryOperateLog'),
        'log.actionMessageId.query_patrol_obj_view.message',
        0
      )
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }

  @get('/inspection/point/query', {
    description: '分页查询巡检对象对应的检测点'
  })
  async inspectionPointQuery() {
    try {
      const result = await this.patrolObjService.objectsPointService(this.ctx.request.query);
      this.success(result)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }
}