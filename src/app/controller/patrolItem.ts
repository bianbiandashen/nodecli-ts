import { Context, Application,inject, provide } from 'midway'
import { BaseController } from '../core/base_controller'
import { post,get,controller } from '../../decorator/openApi'
import { IPatrolObjService } from '../interface/patrolObjInterface';
import { IPatrolItemService } from '../interface/patrolItemInterface';


@provide()
@controller('/patrolItem',{description: '巡检项'})
export class ItemController extends BaseController {
  @inject()
  ctx: Context;
  app: Application;

  @inject('patrolItemService')
  service: IPatrolItemService;

  @inject('patrolObjService')
  patrolObjService: IPatrolObjService;

  @post('/quantity/add', {
    description: '环境量新增接口'
  })
  async quantityAdd() {
    try {
      const id = await this.patrolObjService.quantityAddService(this.ctx.request.body)
      this.success(id)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }

  @post('/quantity/delete', {
    description: '动环环境量删除'
  })
  async quantityDelete() {
    try {
      const id = await this.patrolObjService.quantityDeleteService(this.ctx.request.body)
      this.success(id)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }

  @post('/quantity/search', {
    description: '动环环境量查询'
  })
  async quantitySearch() {
    try {
      const params = this.ctx.request.body.data
      const id = await this.patrolObjService.quantityService(params)
      this.success(id)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }

  @get('/detail/get/by_patrolItemId', {
    description: '获取巡检项详情(对应app 获取巡检项详情)'
  })
  async getItemInfobyId() {
    try {
      const id = await this.service.queryDetail(this.ctx.request.query)
      this.success(id)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }

  @get('/list/search', {
    description: '获取所有巡检项列表(对应app 获取巡检项列表)'
  })
  async getItemList() {
    try {
      const id = await this.service.queryItemManyCommon(this.ctx.request.query)
      this.success(id)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }

  @get('/async/list/search', {
    description: '异步获取巡检项列表'
  })
  async getAsyncItemList() {
    try {
      const id = await this.service.queryAsyncItem(this.ctx.request.query)
      this.success(id)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }
}