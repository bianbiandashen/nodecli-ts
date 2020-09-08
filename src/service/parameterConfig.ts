'use strict';
import {  Context, inject, provide, Application} from 'midway';
import { 
  IParameterConfigService,
} from '../app/interface/parameterConfigInterface';
const {
  Transactional
} = require('../app/core/transactionalDeco')
@provide('parameterConfigService')
export class ParameterConfigService implements IParameterConfigService {
  @inject()
  ctx: Context;
  app: Application;
  /**
   * 新增xx
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async paramsConfigCreateService(): Promise<any> {
  }
  /**
   * 查询
   * @param {object} params
   * @return {string} - list
   */
  @Transactional
  async paramsConfigQueryService(): Promise<any> {
    // const {
    //   app
    // } = this;
    return await (this as any).query('ParameterConfig', 'queryData')
  }
  /**
   * 更新
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async parameterConfigUpdateService(params:any = {}): Promise<any> {
    let result = {}
    let data = {}
    for (const item of params) {
      result = await (this as any).query('ParameterConfig', 'queryFindOne', [item])
      if (!result) {
        data = await (this as any).query('ParameterConfig', 'createData', [item])
      } else {
        data = await (this as any).query('ParameterConfig', 'updateData', [item])
      }
    }
    return data
  }
  @Transactional
  async findOneConfig(params): Promise<any> {
    const { ctx } = this
    ctx.header.appid = params.appid
    const result = await (this as any).query('ParameterConfig', 'queryFindOne', [params])
    return result
  }
}