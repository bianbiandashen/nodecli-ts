import {  Context, inject, provide} from 'midway';
import { IPatrolPlanGroupService } from '../app/interface/patrolPlanGroupInterface';
const Sequelize = require('sequelize')
const { Op } = Sequelize
const { Transactional } = require('../app/core/transactionalDeco/index')

@provide('patrolPlanGroupService')
export class PatrolPlanGroupService implements IPatrolPlanGroupService{
  @inject()
  ctx: Context;
  /**
   * 新建计划分组
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async createPatrolPlanGroup(params:any): Promise<any> {
    params = Object.assign(params, { isDelete: 0 })
    return await (this as any).query('PatrolPlanGroup', 'createData', [params])
  }
  /**
   * 查询全部计划分组
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async queryAllPlanGroup(params:any): Promise<any> {
    const condition = {
      attributes: ['patrolPlanId', 'groupId', 'groupName', 'onceEffective', 'taskExecuteCycle'],
      where: {
        patrolPlanId: params.patrolPlanId,
        isDelete: {
          [Op.lt]: 1
        }
      }
    }
    const result = await (this as any).query('PatrolPlanGroup', 'queryAllData', [condition])
    return result
  }
  @Transactional
  async queryPlanGroupDetail(params:any): Promise<any> {
    const result = await (this as any).query('PatrolPlanGroup', 'queryGroupDetail', [params])
    return result
  }
  /**
   * 更新计划分组
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async updatePlanGroup(params:any): Promise<any> {
    const result = await (this as any).query('PatrolPlanGroup', 'updateData', [params])
    return result
  }
  /**
   * 软删除计划分组
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async deleteGroupDate(params:any): Promise<any> {
    const result = await (this as any).query('PatrolPlanGroup', 'deleteData', [params])
    return result
  }
  @Transactional
  async deleteGroupDateByPlanIds(params:any): Promise<any> {
    const result = await (this as any).query('PatrolPlanGroup', 'deleteDataByPlanIds', [params])
    return result
  }
  /**
   * 计划分组查询
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async queryGroupDetail(params:any): Promise<any> {
    const result = await (this as any).query('PatrolPlanGroup', 'queryGroupDetail', [params])
    return result
  }
}
