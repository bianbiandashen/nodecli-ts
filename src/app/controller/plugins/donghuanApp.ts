import { Context, inject, provide, Application } from 'midway'
import { controller, post} from '../../../decorator/openApi'
import { BaseController } from '../../core/base_controller'
import { IPatrolObjService } from '../../interface/patrolObjInterface'
import { IpdmsService } from '../../interface/pdmsInterface'
@provide()
@controller('/plugins/donghuanApp')
export class DonghuanAppController extends BaseController {
  @inject()
  app: Application;
  @inject()
  ctx: Context;
  @inject('patrolObjService')
  serviceIPatrolObj: IPatrolObjService;
  @inject('pdmsService')
  serviceIpdms: IpdmsService;
  /**
   * @summary
   * @description 动环展示
   * @Router POST /plugins/donghuanApp/plug/donghuan/show
   */
  @post('/plug/donghuan/show')
  async donghuanShow () {
    try {
      const { ctx } = this
      const params = ctx.request.body.data
      // 获取检测点
      const resultBody = await this.serviceIPatrolObj.quantityTaskService(params)
      let data = []
      for (const obj of resultBody.list) {
        const modelDataId = obj.dataValues.extendColumn3
        const resultPdms = await this.serviceIpdms.donghuanShowPdms({ modelDataId }) || {}
        resultPdms.list = resultPdms.list.map(res => {
          const objValue = res
          objValue.latest_value = obj.dataValues.eventValue
          return objValue
        })
        data = data.concat(resultPdms.list)
      }
      this.success({ data })
    } catch (error) {
      throw new Exception(error.message, error.code, error.transaction)
    }
  }
}