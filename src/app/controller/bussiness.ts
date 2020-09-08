import { Context, inject, provide } from 'midway'
import { get, controller } from '../../decorator/openApi'
import { BaseController } from '../core/base_controller'
import { IBussinessService } from '../interface/bussinessInterface'

@provide()
@controller('/bussiness')
export class BussinessController extends BaseController {
  @inject()
  ctx: Context;
  @inject('bussinessService')
  serviceIBussiness: IBussinessService;
  /**
   * @summary 查询应用详情
   * @description 查询应用详情
   * @Router GET /getInfo/by_identify
   */
  @get('/getInfo/by_identify')
  async getOneDetail() {
    const {
      ctx
    } = this;
    const data = await this.serviceIBussiness.queryOneDetail(ctx.request.query)
    this.success(data);
  }
}