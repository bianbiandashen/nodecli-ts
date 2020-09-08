'use strict'
import {  Context, inject, provide, Application} from 'midway';
import { 
  IPatrolObjService,
} from '../app/interface/itemInterface';
const Sequelize = require('sequelize')
const { Op } = Sequelize
const { Transactional } = require('../app/core/transactionalDeco')
@provide('patrolObjService')
export class PatrolObjService implements IPatrolObjService {

  @inject()
  ctx: Context;
  app: Application;
  /**
   * 巡检项通过path查询
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async itemServiceByPath(params:any = {}): Promise<any> {
    const condition = {
      where: {
        objTypeId: params.objTypeId,
        isDelete: 0,
        path: {
          [Op.like]: params.path
        }
      }
    }
    const result = await (this as any).query('Item', 'itemModel', [condition])
    return result
  }
  /**
   * 巡检项查询
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async itemService(params:any = {}): Promise<any> {
    const { patrolObjId } = params
    const condition = {
      where: {
        objTypeId: params.objTypeId,
        isDelete: 0
      }
    }
    const result = await (this as any).query('Item', 'itemPointModel', [condition, patrolObjId])
    return result
  }

  /**
   * 通过巡检项path查namepath
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async itemPathNameService(params:any = {}): Promise<any> {
    const { path } = params
    const pathArr = path.split('@').filter(item => {
      if (item !== '') {
        return item
      }
    })
    const itemNamePath = []
    for (const elem of pathArr.values()) {
      const result = await (this as any).query('Item', 'queryOneById', [
        {
          where: {
            itemId: elem
          },
          attributes: ['itemContent']
        }
      ])
      if (result && result.itemContent) {
        itemNamePath.push(result.itemContent)
      }
    }
    return itemNamePath.join('/')
  }

  /**
   * 根据任务的巡检项id查巡检项pathName
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async queryPathByTaskItemId(params): Promise<any> {
    const { taskItemId } = params

    const condition = {
      where: {
        patrolTaskItemId: taskItemId
      },
      attributes: ['path', 'itemParentId']
    }
    const result = await (this as any).query('PatrolTaskItem', 'findOneData', [condition])
    if (result) {
      const pathName = await this.itemPathNameService({ path: result.path })
      return {
        path: pathName,
        id: result.itemParentId
      }
    }
    return null

  }

  /**
   * 根据任务的巡检项id查巡检项pathName
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async queryItemName(params): Promise<any> {
    const { itemId } = params

    const condition = {
      where: {
        itemId
      },
      attributes: ['itemContent']
    }
    const result = await (this as any).query('Item', 'queryOneById', [condition])
    return result ? result.itemContent : ''
  }
}
