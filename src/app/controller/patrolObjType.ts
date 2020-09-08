import { Context, Application,inject, provide } from 'midway'
import { BaseController } from '../core/base_controller'
import { post,controller } from '../../decorator/openApi'
import { IPatrolObjTypeService } from '../interface/patrolObjTypeInterface';


@provide()
@controller('/patrolObjType',{description: '巡检对象类型'})
export class patrolObjTypeController extends BaseController {
  @inject()
  ctx: Context;
  app: Application;

  @inject('patrolObjTypeService')
  service: IPatrolObjTypeService;

  @post('/search', {
    description: '巡查对象类型查询接口'
  })
  async search() {
    try {
      const data = await this.service.objectTypeService(this.ctx.request.query)
      this.success(data)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }
}