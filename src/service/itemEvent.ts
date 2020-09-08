'use strict';
import {  Context, inject, provide, Application} from 'midway';
import { 
  IItemEventService,
} from '../app/interface/itemEventInterface';
const {
  Transactional
} = require('../app/core/transactionalDeco')
@provide('itemEventService')
export class ItemEventService implements IItemEventService {

  @inject()
  ctx: Context;
  app: Application;

  /**
   * 根据巡检项查询巡检方法
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async mannerService(params): Promise<any> {
    const { itemId } = params
    const condition = {
      where: {
        itemId: itemId,
        isDelete: 0
      }
    }
    const result = await (this as any).query('ItemEvent', 'findModel', [condition])
    return result
  }
  @Transactional
  async getItemManner(params = {}): Promise<any> {
    const result = await (this as any).query('ItemEvent', 'queryManner', [params])
    return result
  }
}