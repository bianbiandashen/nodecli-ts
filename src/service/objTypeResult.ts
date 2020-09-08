'use strict';
import {  Context, inject, provide, Application} from 'midway';
import { 
  IObjTypeResultService,
} from '../app/interface/objTypeResultInterface';

const {
  Transactional
} = require('../app/core/transactionalDeco')
@provide('objTypeResultService')
export class ObjTypeResultService implements IObjTypeResultService {
  @inject()
  ctx: Context;
  app: Application;

  /**
  * 巡检对象类型查询
  * @param {object}
  * @return {string} - object
  */

  @Transactional
  async queryOne(params:any = {}): Promise<any> {
    const condition = {
      where: {
        orId: params.orId
      }
    }
    const result = await (this as any).query('ObjTypeResult', 'findOneData', [condition])
    return result
  }
}
