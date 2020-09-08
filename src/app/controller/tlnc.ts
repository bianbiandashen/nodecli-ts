/*
 * @作者: songxiaodong
 * @创建时间: 2020-2-11 10:33:38
 * @Last Modified by: songxiaodong
 * @Last Modified time: 2020-2-11 10:33:38
 */
import { Context, inject, provide,Application } from 'midway'
import { post,controller } from '../../decorator/openApi'
import { BaseController } from '../core/base_controller'
function bufferToJson(data) {
  return Buffer.isBuffer(data) ? JSON.parse(data.toString()) : {}
}
@provide()
@controller('/tlnc',{description: '代办'})
export class TlncController extends BaseController {
  @inject()
  ctx: Context;
  app: Application;
  
  // 代办删除接口
  @post('/agency/delete')
  async agencyDelete() {
    const {
      ctx
    } = this;
    const {} = ctx.request.body
    const result = await this.app.consulCurl('/tlnc/api/v2/todo/delete', '', '', {
      method: 'POST',
      data: {
        apiType: 'app',
        messageId: 'pes_pc_4',
        userId: 'admin'
      }
    })
    this.success(bufferToJson(result.data))
  }

  // 消息删除接口
  @post('/message/delete')
  async messageDelete() {
    const {
      ctx
    } = this;
    const {} = ctx.request.body
    const result = await this.app.consulCurl('/tlnc/api/v2/message/delete', '', '', {
      method: 'POST',
      data: {
        apiType: 'app',
        messageId: 'customer_1_1',
        userId: 'admin'
      }
    })
    this.success(bufferToJson(result.data))
  }
}

