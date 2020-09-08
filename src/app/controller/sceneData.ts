'use strict';
import { Context, inject, provide,Application } from 'midway'
import { get,controller } from '../../decorator/openApi'
import { BaseController } from '../core/base_controller'
import { IsceneDataService } from '../interface/sceneDataInterface'

/**
 * @Controller report
 */
@provide()
@controller('/sceneData',{description: '巡检问题管理'})
export class SceneDataController extends BaseController {
  @inject()
  ctx: Context;
  app: Application;

  @inject('sceneDataService')
  service: IsceneDataService;

  /**
   * @summary 巡检app场景数据
   * @description 用于查询巡检项报告列表
   * @Router Get /report/patrolItem/list
   * @request body reportListPatrolItemRequest *body
   * @response 200 reportListPatrolItemResponse 查询成功
   */
  @get('/query',{description: '巡检app场景数据'})
  async querySceneData() {
    const {
      ctx
    } = this;
    const data = await this.service.findBySchemaCode({ where: { appIdentify: ctx.headers.appid }, order: [['updateTime', 'DESC']] });
    this.success(data);
  }
}
