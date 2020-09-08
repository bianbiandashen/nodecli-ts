'use strict';
import {  Context, inject, provide, Application} from 'midway';
import { 
  IObjPonitsCollectionService,
} from '../app/interface/objPonitsCollectionInterface';
const {
  Transactional
} = require('../app/core/transactionalDeco')
@provide('objPonitsCollectionService')
export class ObjPonitsCollectionService implements IObjPonitsCollectionService {
  @inject()
  ctx: Context;
  app: Application;

  /**
   * 通过巡检对象唯一id查详情
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async query1(params:any={}):Promise<any> {
    const condition = {
      where: {
        patrolObjId: params.id,
      }
    }
    const result = await (this as any).query('ObjPonitsCollection', 'queryData', condition)
    return result
  }
}