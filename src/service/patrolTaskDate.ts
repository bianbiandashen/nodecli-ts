import {  Context, inject, provide} from 'midway';
import { IpatrolTaskDateService } from '../app/interface/patrolTaskDateInterface';
const Sequelize = require('sequelize')
const { Op } = Sequelize
const { Transactional } = require('../app/core/transactionalDeco/index')

@provide('patrolTaskDateService')
export class PatrolTaskDateService implements IpatrolTaskDateService {
  @inject()
  ctx: Context;
  /**
   * 新增任务执行时间
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async createPatrolTaskDateService (params:any): Promise<any> {
    const data = params.map(item => {
      item = Object.assign(item, { isDelete: 0 })
      return item
    })
    const result = await (this as any).query('PatrolTaskDate', 'blukCreate', [ data ])
    return result
  }
  /**
   * 更新任务执行时间
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async updatePatrolTaskDateService (params:any): Promise<any> {
    let result = {}
    for (const item of params) {
      result = await (this as any).query('PatrolTaskDate', 'updateData', [ item ])
    }
    return result
  }
  /**
   * 查询任务执行时间
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async queryPatrolTaskDate (params:any): Promise<any> {
    const condition = {
      where: {
        patrolPlanId: params.patrolPlanId,
        groupId: params.groupId,
        isDelete: { [Op.lt]: 1 }
      }
    }
    const result = await (this as any).query('PatrolTaskDate', 'queryData', [ condition ])
    return result
  }
  /**
   * 删除任务执行时间
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async deletePatrolTaskDate (params:any): Promise<any> {
    const result = await (this as any).query('PatrolTaskDate', 'deleteData', [ params ])
    return result
  }
  @Transactional
  async deleteDateByPlanIds (params:any): Promise<any> {
    const result = await (this as any).query('PatrolTaskDate', 'deleteDataByPlanIds', [ params ])
    return result
  }
  @Transactional
  async deleteDateByGroupIds (params:any): Promise<any> {
    const result = await (this as any).query('PatrolTaskDate', 'deleteDataByGroupIds', [ params ])
    return result
  }
  /**
   * 删除任务执行时间
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async deleteTaskDate (params:any): Promise<any> {
    const condition = { where: { taskExecuteId: { [Op.or]: params } } }
    const result = await (this as any).query('PatrolTaskDate', 'physicsDeleteTaskDate', [ condition ])
    return result
  }
}
