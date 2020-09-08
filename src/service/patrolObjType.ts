'use strict'
import {  Context, inject, provide, Application} from 'midway';
import { 
  IPatrolObjTypeService,
} from '../app/interface/patrolObjTypeInterface';

const { Transactional } = require('../app/core/transactionalDeco')
const Sequelize = require('sequelize')
const { Op } = Sequelize
@provide('patrolObjTypeService')
export class PatrolObjTypeService implements IPatrolObjTypeService {
  @inject()
  ctx: Context;
  app: Application;
  /**
   * 巡检对象类型查询
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async objectTypeService(params:any = {}): Promise<any> {
    const condition:any = {
      where: {
        isDelete: 0
      }
    }
    if (params.ids) {
      condition.where.objTypeId = params.ids
    }
    const result = await (this as any).query('PatrolObjType', 'objectTypeSearch', [condition])
    return result
  }
  /**
   * 根据巡检对象类型ID查询名称
   */
  @Transactional
  async objectTypeNameById(data): Promise<any> {
    const params = {
      where: {
        // isDelete: 0,
        objTypeId: data.objTypeId
      }
    }
    const result = await (this as any).query('PatrolObjType', 'queryOneData', [params])
    return result
  }
  /**
   * 巡检对象名称查询根据名称查询ID
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async objectTypeChiService(data): Promise<any> {
    const params:any = {
      where: {
        isDelete: 0,
        objTypeName: data.objTypeName
      }
    }
    // 处理类型有区域权限的
    if (data.regionIndexCode) {
      params.where.regionIndexCode = data.regionIndexCode
    }
    const result = await (this as any).query('PatrolObjType', 'objectTypeSearch', [params])
    return result
  }
  @Transactional
  async getObjectTypeList(params = {}): Promise<any> {
    const condition = {
      order: [['createTime', 'DESC']],
      attributes: ['objTypeId', 'objTypeName'],
      where: {
        objTypeId: {
          [Op.or]: params
        },
        isDelete: 0
      }
    }
    const result = await (this as any).query('PatrolObjType', 'queryAllData', [condition])
    return result
  }
  /**
   * 巡检对象类型查询类型ID
   */
  @Transactional
  async objectTypeListByPlan(params): Promise<any> {
    const condition = {
      where: {
        isDelete: 0,
        objTypeId: {
          [Op.or]: params.objTypeIds
        }
      }
    }
    const result = await (this as any).query('PatrolObjType', 'queryAllData', [condition])
    return result
  }
  /**
   * 巡检对象类型查询名称
   */
  @Transactional
  async objectTypeListByName(params): Promise<any> {
    const condition = {
      where: {
        isDelete: 0,
        objTypeName: {
          [Op.or]: params.objTypeNames
        }
      }
    }
    const result = await (this as any).query('PatrolObjType', 'queryAllData', [condition])
    return result
  }
}
