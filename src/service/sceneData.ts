import {  Context, inject, provide} from 'midway'
import { IsceneDataService } from '../app/interface/sceneDataInterface'
const { Transactional } = require('../app/core/transactionalDeco/index')

@provide('sceneDataService')
export class SceneDataService implements IsceneDataService{
  @inject()
  ctx: Context;
  /**
   * 查询场景参数
   * @param {object} params 查询参数
   * @return {string} - object
   */
  @Transactional
  async findBySchemaCode (params:any = {}): Promise<any> {
    const data = await (this as any).query('SceneData', 'findBySchemaCode', [params])
    return data
  }
  @Transactional
  async getOnePageConfig (params:any = {}): Promise<any> {
    const data = await (this as any).query('SceneData', 'queryOnePageConfig', [params])
    return JSON.parse(data)
  }
  /**
   * 查询当前appId下的巡检任务处理方式
   * @param {*} [query={}] 查询参数
   * @memberof SceneDataService
   */
  @Transactional
  async getTaskDealType (query:any = {}): Promise<any> {
    const data = await (this as any).query('SceneData', 'getTaskDealTypeByAppId', [query])
    return data
  }
}
