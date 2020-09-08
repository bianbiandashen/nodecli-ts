import {  Context, inject, provide} from 'midway';
import { IprocessService } from '../app/interface/processInterface';
const { Transactional } = require('../app/core/transactionalDeco/index')

@provide('processService')
export class ProcessService implements IprocessService{
  @inject()
  ctx: Context;
  /**
   * 获取巡检计划的流程信息
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async getProcess(params:any): Promise<any> {
    const condition = {
      where: {
        psId: params.psId,
        isDelete: 0
      }
    }
    const result = await (this as any).query('Process', 'queryManyData', [condition])
    const flowList = []
    for (const item of result) {
      const obj = this.ctx.helper.filterObj(item.dataValues, [
        'processType',
        'processId',
        'secondPersonOn',
        'inspectorAsReviewer',
        'reviewerAsVerifier',
        'inspectorAsVerfier',
        'maxFirstConductor',
        'maxSecondConductor',
        'executorAssignPattern',
        'executorAssignStrategy',
        'regionIsolated',
        'taskPersonStrategy',
        'allowAdjustExecutor',
        'expireTime'
      ])
      flowList.push(obj)
    }
    return flowList
  }
  /**
   * 获取巡检计划的流程信息2
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async getProcessAllInfo(params:any): Promise<any> {
    const condition = {
      where: {
        psId: params.psId,
        isDelete: 0
      }
    }
    const result = await (this as any).query('Process', 'queryManyData', [condition])
    return result
  }
}
