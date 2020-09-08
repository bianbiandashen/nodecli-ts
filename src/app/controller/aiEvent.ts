import { Context, inject, provide } from 'midway'
import { get, controller, post } from '../../decorator/openApi'
import { BaseController } from '../core/base_controller'
@provide()
@controller('/aiEvent')
 export class AiEventController extends BaseController {
  @inject()
  ctx: Context;
 /**
   * @summary 事件类型获取
   * @Router GET /aiEvent/candidate/query
   */

  @get('/candidate/query')
  async candidateQuery () {
    const { ctx } = this
    const result = await ctx.consulCurl('/patrolengine-engine/api/v1/manner/dict/candidate/query', 'patrolengine', 'patrolengine-engine', {
      method: 'GET',
      data: ctx.request.query
    })
    const responseData = ctx.helper.bufferToJson(result.data)
    this.successItms(responseData)
  }
  /**
   * @summary AI事件订阅管理获取列表
   * @Router GET /aiEvent/list
   */

  @post('/eventManage/list')
  async query () {
    const {
      ctx
    } = this
    const result = await ctx.consulCurl('/patrolengine-engine/api/v1/eventManage/list', 'patrolengine', 'patrolengine-engine', {
      method: 'POST',
      data: ctx.request.body
    })
    const responseData = ctx.helper.bufferToJson(result.data)
    this.successItms(responseData)
  }
  /**
   * @summary AI事件订阅管理添加
   * @Router GET /aiEvent/eventType/add
   */

  @post('/eventType/add')
  async add () {
    const {
      ctx
    } = this
    const result = await ctx.consulCurl('/patrolengine-engine/api/v1/eventManage/eventType/add', 'patrolengine', 'patrolengine-engine', {
      method: 'POST',
      data: ctx.request.body
    })
    const responseData = ctx.helper.bufferToJson(result.data)
    this.successItms(responseData)
  }
  /**
   * @summary AI事件订阅管理删除
   * @Router GET /aiEvent/eventType/delete
   */

  @post('/eventType/delete')
  async delete () {
    const {
      ctx
    } = this
    const result = await ctx.consulCurl('/patrolengine-engine/api/v1/eventManage/eventType/delete', 'patrolengine', 'patrolengine-engine', {
      method: 'POST',
      data: ctx.request.body
    })
    const responseData = ctx.helper.bufferToJson(result.data)
    this.successItms(responseData)
  }
  /**
   * @summary AI事件订阅管理更新
   * @Router GET /aiEvent/eventType/Update
   */

  @post('/eventType/Update')
  async Update () {
    const {
      ctx
    } = this
    const result = await ctx.consulCurl('/patrolengine-engine/api/v1/eventManage/eventType/Update', 'patrolengine', 'patrolengine-engine', {
      method: 'POST',
      data: ctx.request.body
    })
    const responseData = ctx.helper.bufferToJson(result.data)
    this.successItms(responseData)
  }
}
