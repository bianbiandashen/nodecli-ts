import { Context, inject, provide, Application } from 'midway'
import { controller, get} from '../../../decorator/openApi'
import { BaseController } from '../../core/base_controller'
import { IUnderService } from '../../interface/plugins/underInterface'
@provide()
@controller('/plugins/under')
export class UnderController extends BaseController {
  @inject()
  app: Application;
  @inject()
  ctx: Context;
  @inject('underService')
  serviceIUnder: IUnderService;
  /**
   * @summary 获取摄像头所属区域树
   * @description 获取摄像头所属区域树
   * @Router Get /plugins/under/getUnderPicList
   */
  @get('/getUnderPicList')
  async getUnderPicList () {
    const { ctx } = this
    try {
      const result = await ctx.serviceIUnder.getUnderPicList(ctx.request.query)
      this.success(result)
    } catch (error) {
      throw new Exception(error.message, error.code, error.transaction)
    }
  }
}