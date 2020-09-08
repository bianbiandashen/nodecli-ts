import {  Context, inject, provide} from 'midway';
import { IrelationObjPlanService } from '../app/interface/relationObjPlanInterface';
const Sequelize = require('sequelize')
const { Op } = Sequelize
const { Transactional } = require('../app/core/transactionalDeco/index')

@provide('relationObjPlanService')
export class RelationObjPlanService implements IrelationObjPlanService{
  @inject()
  ctx: Context;
  /**
   * 新增任务执行时间
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async createRelationObjPlanService(params:any): Promise<any> {
    const result = await (this as any).query('RelationObjPlan', 'blukCreate', [params])
    return result
  }
  /**
   * 更新计划关联的流程
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async updateRelationObjPlanDateService(params:any): Promise<any> {
    let result = {}
    for (const item of params) {
      result = await (this as any).query('RelationObjPlan', 'updateData', [item])
    }
    return result
  }
  /**
   * 查询计划的对象
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async queryDataAllList(params:any): Promise<any> {
    const condition:any = {
      where: {
        patrolPlanId: params.patrolPlanId
      }
    }
    if (params.groupId) condition.where.groupId = params.groupId || ''
    const result = await (this as any).query('RelationObjPlan', 'queryAllData', [condition])
    return result
  }
  /**
   * 查询计划关联数据多条
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async queryManyAllList(params:any): Promise<any> {
    const condition = {
      where: {
        patrolPlanId: params.patrolPlanId,
        groupId: params.groupId
      }
    }
    const result = await (this as any).query('RelationObjPlan', 'queryAllData', [condition])
    return result
  }
  /**
   * 查询计划下巡检对象关联的巡检项Id
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async queryPlanItemIds(params:any): Promise<any> {
    const condition = {
      where: {
        patrolPlanId: params.patrolPlanId,
        patrolObjId: params.patrolObjId
      }
    }
    const result = await (this as any).query('RelationObjPlan', 'queryItemsData', [condition])
    return result
  }
  /**
   * 查询计划下巡检对象关联的巡检项关联的检测点
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async queryPlanPointIds(params:any): Promise<any> {
    const condition = {
      where: {
        patrolPlanId: params.patrolPlanId,
        patrolObjId: params.patrolObjId,
        itemId: params.itemId
      }
    }
    const result = await (this as any).query('RelationObjPlan', 'queryItemsData', [condition])
    return result
  }
  /**
   * 查询多个计划的对象
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async queryDataManyList(patrolPlanIds:any): Promise<any> {
    const condition = {
      where: {
        patrolPlanId: {
          [Op.or]: patrolPlanIds
        }
      }
    }
    const result = await (this as any).query('RelationObjPlan', 'queryAllData', [condition])
    return result
  }
  /**
   * 删除计划的流程关联记录
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async physicsDeleteData(params:any = {}): Promise<any> {
    const condition = {
      where: {
        uuid: {
          [Op.or]: params
        }
      }
    }
    const result = await (this as any).query('RelationObjPlan', 'physicsDeleteData', [condition])
    return result
  }
  /**
   * 删除计划的流程关联记录
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async deleteDataByGroupIds(params:any = {}): Promise<any> {
    const condition = {
      where: {
        groupId: {
          [Op.or]: params
        }
      }
    }
    const result = await (this as any).query('RelationObjPlan', 'physicsDeleteData', [condition])
    return result
  }
}
