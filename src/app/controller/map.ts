import { Context, Application,inject, provide } from 'midway'
import { BaseController } from '../core/base_controller'
import { get,controller } from '../../decorator/openApi'
import { IMapService } from '../interface/mapInterface';
import { ICamera } from '../interface/cameraInterface';

@provide()
@controller('/map',{description: 'map'})
export class MapController extends BaseController {
  @inject()
  ctx: Context;
  app: Application;

  @inject('mapService')
  service: IMapService;

  @inject('camera')
  cameraService: ICamera;

  @get('/wad/inspectTask/search', {
    description: '获取区域下巡检任务列表'
  })
  async inspectTask() {
    try {
      const data = await this.service.getAllList(this.ctx.request.query)
      this.success(data)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }

  @get('/wad/getPlanRelationObjService/get', {
    description: '获取巡检计划下巡检对象'
  })
  async getPlanRelationObjService() {
    try {
      const data = await this.service.getPlanRelationObjService(this.ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }

  @get('/getAllObj/get', {
    description: '获取所有的巡检对象'
  })
  async getAllObj() {
    try {
      const data = await this.service.getAllObj()
      this.success(data)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }

  @get('/previewStream/get', {
    description: '实时预览取流'
  })
  async previewStream() {
    try {
      const cookies = this.ctx.req.headers.cookie.split(';')
    let CTGT

    for (const item of cookies) {
      if (item.trim().split('=')[0] === 'CASTGC') {
        CTGT = item.split('=')[1]
      }
    }
    if (!CTGT) {
      throw new Error(this.ctx.__('map.CTGTIsExist'))
    }
    const data = await this.cameraService.preview(this.ctx.request.query.cameraid, CTGT)
    this.success(data)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }
}