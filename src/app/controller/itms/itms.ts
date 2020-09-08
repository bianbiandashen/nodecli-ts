import { Context, inject, provide, Application } from 'midway'
import { get, controller, post} from '../../../decorator/openApi'
import { BaseController } from '../../core/base_controller'

@provide()
@controller('/itms/itms')
export class ItmsController extends BaseController {
  @inject()
  app: Application;
  @inject()
  ctx: Context;
  /**
   * @summary 红外查询常用功能接口
   * @Router GET /itms/itms/favoriteInfo/get
   */

  @get('/favoriteInfo/get')
  async favoriteInfoGet () {
    const { ctx } = this
    const result = await this.app.consulCurl('/itms-handle/api/favoriteService/v1/favoriteInfo/get', 'itms', 'itms-handle', {
      method: 'GET',
      data: ctx.request.query
    }, 'text/html')
    this.operateLog(
      'log.moduleId.patrolObjView.displayName',
      'log.objectType.patrolObjViewType.displayName',
      '',
      'log.action.query.displayName',
      this.ctx.__('itms.favoriteInfoGetOperateLog'),
      'log.actionMessageId.query_hongwai_patrol_obj_view.message',
      1
    )
    const responseData = this.ctx.helper.bufferToJson(result.data)
    this.successItms(responseData)
  }
  /**
   * @summary 根据电气设备编号获取预置点和测温点
   * @Router post /itms/itms/eleChannelInfo/get
   */

  @post('/eleChannelInfo/get')
  async eleChannelInfoGet () {
    const { ctx } = this
    const result = await this.app.consulCurl('/itms-handle/api/resourceService/v1/eleChannelInfo/get', 'itms', 'itms-handle', {
      method: 'POST',
      data: ctx.request.body
    })
    this.operateLog(
      'log.moduleId.patrolObjView.displayName',
      'log.objectType.patrolObjViewType.displayName',
      '',
      'log.action.query.displayName',      
      this.ctx.__('itms.eleChannelInfoGetOperateLog'),
      'log.actionMessageId.query_point_patrol_obj_view.message',
      1
    )
    const responseData = this.ctx.helper.bufferToJson(result.data)
    this.successItms(responseData)
  }
  /**
   * @summary 搜索预置点或测温点
   * @Router get /itms/itms/eleChannelInfo/query
   */

  @get('/eleChannelInfo/query')
  async eleChannelInfoQuery () {
    const { ctx } = this
    const result = await this.app.consulCurl('/itms-handle/api/resourceService/v1/eleChannelInfo/query', 'itms', 'itms-handle', {
      method: 'GET',
      data: ctx.request.query
    }, 'text/html')
    this.operateLog(
      'log.moduleId.patrolObjView.displayName',
      'log.objectType.patrolObjViewType.displayName',
      '',
      'log.action.query.displayName',      
      this.ctx.__('itms.eleChannelInfoQueryOperateLog'),
      'log.actionMessageId.query_search_patrol_obj_view.message',
      1
    )
    const responseData = this.ctx.helper.bufferToJson(result.data)
    this.successItms(responseData)
  }
  /**
   * @summary 红外历史温度查询
   * @Router POST /itms/itms/historicalTemp/get
   */

  @post('/historicalTemp/get')
  async historicalTempGet () {
    const { ctx } = this
    const result = await this.app.consulCurl('/itms-handle/api/historicalTempService/v1/historicalTemp/get', 'itms', 'itms-handle', {
      method: 'POST',
      data: ctx.request.body
    })
    this.operateLog(
      'log.moduleId.patrolObjView.displayName',
      'log.objectType.patrolObjViewType.displayName',
      '',
      'log.action.query.displayName',      
      this.ctx.__('itms.historicalTempGetOperateLog'),
      'log.actionMessageId.query_his_patrol_obj_view.message',
      1
    )
    const responseData = this.ctx.helper.bufferToJson(result.data) || {
    }
    if (responseData.msg === 'Customization takes up to one year') {
      responseData.msg = this.ctx.__('itms.lessThanOneYear')
    }
    this.successItms(responseData)
  }
  /**
   * @summary 红外加入常用功能接口
   * @Router post /itms/itms/favoriteInfo/add
   */

  @post('/favoriteInfo/add')
  async favoriteInfoAdd () {
    const { ctx } = this
    const result = await this.app.consulCurl('/itms-handle/api/favoriteService/v1/favoriteInfo/add', 'itms', 'itms-handle', {
      method: 'POST',
      data: ctx.request.body
    })
    this.operateLog(
      'log.moduleId.patrolObjView.displayName',
      'log.objectType.patrolObjViewType.displayName',
      '',
      'log.action.save.displayName',
      this.ctx.__('itms.favoriteInfoAddOperateLog'),
      'log.actionMessageId.add_hongwai_patrol_obj_view.message',
      1
    )
    const responseData = this.ctx.helper.bufferToJson(result.data)
    this.successItms(responseData)
  }
  /**
   * @summary 红外删除常用功能接口
   * @Router POST /itms/itms/favoriteInfo/del
   */

  @get('/favoriteInfo/del')
  async favoriteInfoDel () {
    const { ctx } = this
    const result = await this.app.consulCurl('/itms-handle/api/favoriteService/v1/favoriteInfo/del', 'itms', 'itms-handle', {
      method: 'GET',
      data: ctx.request.query
    }, 'text/html')
    this.operateLog(
      'log.moduleId.patrolObjView.displayName',
      'log.objectType.patrolObjViewType.displayName',
      '',
      'log.action.delete.displayName',
      this.ctx.__('itms.favoriteInfoDelOperateLog'),
      'log.actionMessageId.delete_hongwai_patrol_obj_view.message',
      1
    )
    const responseData = this.ctx.helper.bufferToJson(result.data)
    this.successItms(responseData)
  }
}