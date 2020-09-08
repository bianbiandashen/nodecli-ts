'use strict';
import {  Context, inject, provide, Application} from 'midway';
import { 
  IPatrolObjRelService,
} from '../app/interface/patrolObjRelInterface';
const {
  Transactional
} = require('../app/core/transactionalDeco')
const Sequelize = require('sequelize')
@provide('patrolObjRelService')
export class PatrolObjRelService implements IPatrolObjRelService {
  @inject()
  ctx: Context;
  app: Application;
  /**
  * 巡检对象类型查询
  * @param {object}
  * @return {string} - object
  */

  @Transactional
  async queryOne(params = {}): Promise<any> {
    const result = await (this as any).query('PatrolObjRel', 'findOneDataModel', [params, Sequelize])
    return result
  }
}
