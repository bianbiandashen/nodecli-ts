/*
 * @Author: renxiaojian
 * @Date: 2019-12-27 14:16:43
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-03-10 20:55:40
 */
'use strict';
import {  Context, inject, provide, Application} from 'midway';
import { 
  IPatrolItemTitleService,
} from '../app/interface/patrolItemTitleInterface';
const {
  Transactional
} = require('../app/core/transactionalDeco')
@provide('patrolItemTitleService')
export class PatrolItemTitleService implements IPatrolItemTitleService {

  @inject()
  ctx: Context;
  app: Application;

  /**
   * 通过巡检对象类型ID查询巡检项结构
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async queryItemTitleManyService(params:any = {}): Promise<any> {
    const condition = {
      order: [
        ['level', 'ASC']
      ],
      where: {
        objTypeId: params.objTypeId,
        isDelete: 0
      }
    }
    const result = await (this as any).query('PatrolItemTitle', 'queryItemTitleManyList', [condition])
    return result
  }
}