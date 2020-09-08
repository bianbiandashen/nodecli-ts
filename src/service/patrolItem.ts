/*
 * @Author: renxiaojian
 * @Date: 2019-12-27 14:16:43
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-09-03 16:02:14
 */
'use strict'
import {  Context, inject, provide, Application} from 'midway';
import { 
  IPatrolItemService,
} from '../app/interface/patrolItemInterface';
const { Transactional } = require('../app/core/transactionalDeco')
const Sequelize = require('sequelize')
const { Op } = Sequelize

// 过滤对象中的某些属性
function filterObj (obj, arr,_this) {
  if (typeof (obj) !== 'object' || !Array.isArray(arr)) {
    throw new Error(_this.ctx.__('patrolItem.paramsFormatNotCorrect'))
  }
  const result = {}
  Object.keys(obj).filter(key => !arr.includes(key)).forEach(key => {
    result[key] = obj[key]
  })
  return result
}

function itemHandle (arr) {
  const map = {},
    dest = []
  for (let i = 0; i < arr.length; i++) {
    const ai = arr[i]
    if (!map[ai.itemId]) {
      const obj = {
        itemId: ai.itemId,
        parentItem: ai.parentItem,
        itemContent: ai.itemContent,
        itemOrder: ai.itemOrder,
        itemScore: ai.itemScore,
        objTypeId: ai.objTypeId,
        updateTime: ai.updateTime,
        createTime: ai.createTime,
        path: ai.path,
        level: ai.level,
        relateMonitor: ai.relateMonitor,
        mannerList: [],
        patrolPointList: []
      }
      if (ai.mannerId) {
        obj.mannerList.push({
          mannerId: ai.mannerId,
          mType: ai.mType,
          aiType: ai.aiType,
          mName: ai.mName
        })
      }
      if (ai.patrolPointId) {
        obj.patrolPointList.push({
          patrolPointId: ai.patrolPointId,
          patrolMethodId: ai.patrolMethodId,
          pointName: ai.pointName,
          cameraName: ai.cameraName,
          cameraId: ai.cameraId,
          patrolObjId: ai.patrolObjId,
          aiType: ai.aiType,
          isDelete: ai.isDelete
        })
      }
      dest.push(obj)
      map[ai.itemId] = ai
    } else {
      for (let j = 0; j < dest.length; j++) {
        const dj = dest[j]
        if (dj.itemId === ai.itemId) {
          let mannerExist = false
          let patrolPointExist = false
          for (const mannerItem of dj.mannerList) {
            if (mannerItem.mannerId === ai.mannerId) {
              mannerExist = true
            }
          }
          if (!mannerExist && ai.mannerId) {
            dj.mannerList.push({
              mannerId: ai.mannerId,
              mType: ai.mType,
              aiType: ai.aiType,
              mName: ai.mName
            })
          }
          for (const pointItem of dj.patrolPointList) {
            if (pointItem.patrolPointId === ai.patrolPointId) {
              patrolPointExist = true
            }
          }
          if (!patrolPointExist && ai.patrolPointId) {
            dj.patrolPointList.push({
              patrolPointId: ai.patrolPointId,
              patrolMethodId: ai.patrolMethodId,
              pointName: ai.pointName,
              cameraName: ai.cameraName,
              cameraId: ai.cameraId,
              patrolObjId: ai.patrolObjId,
              aiType: ai.aiType,
              isDelete: ai.isDelete
            })
          }
        }
      }
    }
  }
  return dest
}
@provide('patrolItemService')
export  class PatrolItemService implements IPatrolItemService {
  @inject()
  ctx: Context;
  app: Application;
  /**
   * 通过巡检对象类型，查询巡检项,及检测点
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async queryItemService (params): Promise<any> {
    const { executeType } = params
    const result = await (this as any).query('PatrolItem', 'queryItemModelBySql', [ params ])
    // 处理解析数据
    const list = itemHandle(result)
    let itemList = []
    let resultList = []
    // 过滤符合该任务执行方式，并且满足含有该执行方式的巡检方法的检测点
    for (const item of list) {
      const manners = item.mannerList.map(v => v.mannerId)
      item.patrolPointList = item.patrolPointList.filter(n => manners.includes(n.patrolMethodId))
    }
    if (executeType) {
      const executeTypeArr = executeType.split(',')
      // 混合模式下，不包含线下人工的时候
      if (!executeTypeArr.includes('2')) {
        // 线上方式，要过滤掉巡检项没有检测点的情况
        // if (params.executeType === '0' || params.executeType === '1') {
        itemList = list.filter(item => item.relateMonitor === 1 && item.patrolPointList.length > 0)
        const listTreeData = this.app.toTree(list, 'root', 'parentItem', 'itemId')
        const parentNodes = this.app.findNodes(itemList, listTreeData, {
          id: 'itemId',
          parentId: 'parentItem',
          rootId: 'root',
          childrenField: 'children',
          direction: 0
        })
        const childrenNodes = this.app.findNodes(itemList, listTreeData, {
          id: 'itemId',
          parentId: 'parentItem',
          rootId: 'root',
          childrenField: 'children',
          direction: 1
        })
        itemList = itemList.map(v => filterObj(v, [ 'children' ],this))
        resultList = parentNodes.concat(itemList, childrenNodes)
        return resultList
        // }
      }
    }
    return list
    // 过滤掉构不成树结构的数据
    // const listTreeData = this.app.toTree(list, 'root', 'parentItem', 'itemId')
    // const listData = this.app.deepTraversal(listTreeData)
    // return listData
  }
  /**
   * 查询巡检计划中巡检对象关联的巡检项及检测点
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async queryPlanItemsAndPoints (params = {}): Promise<any> {
    const result = await (this as any).query('PatrolItem', 'queryPlanItemsAndPointsBySql', [ params ])
    return itemHandle(result)
  }
  /**
   * 通过巡检项ID查询多条
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async queryItemManyService (params = {}): Promise<any> {
    const condition = { where: { itemId: { [Op.or]: params } } }
    const result = await (this as any).query('PatrolItem', 'queryItemManyList', [ condition ])
    return result
  }
  /**
   * 通过巡检项ID查询多条
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async queryItemManyCommon (parmas): Promise<any> {

    const { patrolObjId } = parmas
    let objTypeId:any
    let condition:any
    if (patrolObjId) {
      const objCOndition = { where: { patrolObjId } }
      const object = await (this as any).query('PatrolObj', 'queryDataById', [ objCOndition ])
      objTypeId = object && object.objTypeId
      if (!objTypeId) {
        throw Error(this.ctx.__('patrolItem.reduceObjTypeId'))
      } else {
        condition = {
          where: {
            objTypeId,
            isDelete: 0
          }
        }
      }
    }
    const result = await (this as any).query('PatrolItem', 'queryTreePathData', [ condition ])
    for (const item of result.list) {
      console.log('itemitemitemitem', item)
      if (item.dataValues.path) {
        item.dataValues.partrolItemsPath = await this.ctx.service.common.partrolItemsPath(item.dataValues.path,(this as any).transaction)
      }

    }
    return result

  }


  /**
   * 通过巡检项详情
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async queryDetail (params): Promise<any> {
    if (params && !params.patrolItemId) {
      throw Error(this.ctx.__('patrolItem.reducePatrolItemId'))
    }
    const condition = { where: { itemId: params.patrolItemId } }
    const result = await (this as any).query('Item', 'queryDetail', [ condition ])
    return result
  }
  /**
   * 异步查询巡检项
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async queryAsyncItem (params): Promise<any> {
    const result = await (this as any).query('PatrolItem', 'queryAsyncItem', [ params ])
    return result
  }
}