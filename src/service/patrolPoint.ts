import {  Context, inject, provide} from 'midway';
import { IPatrolPointService } from '../app/interface/patrolPointInterface';
const Sequelize = require('sequelize')
const { Op } = Sequelize
const { Transactional } = require('../app/core/transactionalDeco/index')

@provide('patrolPointService')
export class PatrolPointService implements IPatrolPointService {
  @inject()
  ctx: Context;
  /**
   * 通过巡检项ID查询全部的检测点
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async queryPointAllList(params:any): Promise<any> {
    const result = await (this as any).query('PatrolPoint', 'queryAllDataByPlan', [params])
    return result
  }
  /**
   * 通过检测点ID查询全部的检测点
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async queryPointAllListByPointIds(params:any = {}): Promise<any> {
    const condition = {
      where: {
        patrolPointId: {
          [Op.or]: params
        }
      },
      attributes: [
        'patrolPointId', 'pointName',
        'camera_id', 'cameraPtz', 'createTime', 'updateTime'
      ]
    }
    const result = await (this as any).query('PatrolPoint', 'queryAllData', [condition])
    return result
  }
}
