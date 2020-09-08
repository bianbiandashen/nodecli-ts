import {  Context, inject, provide} from 'midway';
import { IPatrolPlanFlowService } from '../app/interface/patrolPlanFlowInterface';
const Sequelize = require('sequelize')
const { Op } = Sequelize
const { Transactional } = require('../app/core/transactionalDeco/index')

@provide('patrolPlanFlowService')
export class PatrolPlanFlowService implements IPatrolPlanFlowService {
  @inject()
  ctx: Context;
  /**
   * 添加巡检计划流程
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async createPatrolPlanFlow(params:any = {}): Promise<any>{
    return await (this  as  any).query('PatrolPlanFlow', 'createData', [params])
  }
  /**
   * 批量添加巡检计划流程
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async createPatrolPlanFlowService(params:any): Promise<any> {
    const result = await (this  as  any).query('PatrolPlanFlow', 'blukCreate', [params])
    return result
  }
  /**
   * 更新计划流程
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async updatePatrolPlanFlowService(params:any): Promise<any> {
    let result = {}
    for (const item of params) {
      result = await (this  as  any).query('PatrolPlanFlow', 'updateData', [item])
    }
    return result
  }
  /**
   * 查询计划的流程
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async queryDataAllList(params:any = {}): Promise<any> {
    const condition:any = {
      where: {
        patrolPlanId: params.patrolPlanId
      }
    }
    if (params.planFlowId) condition.where.planFlowId = params.planFlowId
    const result = await (this  as  any).query('PatrolPlanFlow', 'queryAllData', [condition])
    return result
  }
  /**
   * 查询多条计划的流程
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async queryManyDataList(params:any = {}): Promise<any> {
    const condition = {
      where: {
        patrolPlanId: {
          [Op.or]: params
        }
      }
    }
    const result = await (this  as  any).query('PatrolPlanFlow', 'queryAllData', [condition])
    return result
  }
  /**
   * 删除计划的流程记录
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async physicsDeleteData(params:any = {}): Promise<any> {
    const condition = {
      where: {
        planFlowId: {
          [Op.or]: params
        }
      }
    }
    const result = await (this  as  any).query('PatrolPlanFlow', 'physicsDeleteData', [condition])
    return result
  }
}
