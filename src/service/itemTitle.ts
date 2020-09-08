'use strict'
import {  Context, inject, provide, Application} from 'midway';
import { 
  IItemTitleService,
} from '../app/interface/itemTitleInterface';
const { Transactional } = require('../app/core/transactionalDeco')
@provide('itemTitleService')
export class ItemTitleService implements IItemTitleService {
  @inject()
  ctx: Context;
  app: Application;

  /**
   * 巡检项标题查询
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async itemTitleService (params:any = {}): Promise<any> {
    const condition = {
      where: {
        objTypeId: params.objTypeId,
        isDelete: 0
      }
    }
    const result = await (this as any).query('ItemTitle', 'itemTitleModel', [condition])
    return result
  }
}

