import { Context, Application,inject, provide } from 'midway'
import { BaseController } from '../../core/base_controller'
import { post,controller } from '../../../decorator/openApi'

import { IRemoteDevopsService } from '../../interface/plugins/remoteDevopsInterface';

@provide()
@controller('/plugins/remoteDevops',{description: '远程运维巡检'})
export class remoteDevopsController extends BaseController {
  @inject()
  ctx: Context;
  app: Application;

  @inject('remoteDevopsService')
  service: IRemoteDevopsService;

  @post('/plug/show', {
    description: '远程运维智能巡检数据'
  })
  async remoteDevopsShow() {
    try {
      const params = this.ctx.request.body.data
      const result = await this.service.remoteDevopsShow(params);
      for (const item of result.list) {
        item.dataValues.eventValue = JSON.parse(item.dataValues.eventValue)
      }
      this.success(result)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }

  @post('/plug/savePoint', {
    description: '远程运维智能添加检测点'
  })
  async remoteDevopsSavePoint() {
    try {
      const params = this.ctx.request.body.data
      const result = await this.ctx.service.remoteDevopsSavePoint(params);
      this.success(result)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }

  @post('/plug/queryPoint', {
    description: '远程运维智能查询检测点'
  })
  async remoteDevopsQueryPoint() {
    try {
      const params = this.ctx.request.body.data
      const result = await this.ctx.service.remoteDevopsQueryPoint(params);
      this.success(result)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }

  @post('/plug/by_mannerId', {
    description: '远程运维智能查询方法'
  })
  async getMannerInfo() {
    try {
      const params = this.ctx.request.body.data
      const result = await this.ctx.service.getMannerInfo(params);
      this.success(result)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }
}