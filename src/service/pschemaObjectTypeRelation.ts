import {  Context, inject, provide} from 'midway';
import { IpschemaObjectTypeRelationService } from '../app/interface/pschemaObjectTypeRelationInterface';
const { Transactional } = require('../app/core/transactionalDeco/index')

@provide('pschemaObjectTypeRelationService')
export class PschemaObjectTypeRelationService implements IpschemaObjectTypeRelationService{
  @inject()
  ctx: Context;
  /**
   * 获取巡检计划的流程信息2
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async getPschemaObjTypeList(params:any): Promise<any> {
    const condition = {
      where: {
        psId: params.psId
      }
    }
    const result = await (this as any).query('PschemaObjectTypeRelation', 'queryManyData', [ condition ])
    return result
  }
}
