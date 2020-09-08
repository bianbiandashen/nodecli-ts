import {  Context, inject, provide} from 'midway';
import { IpatrolTemplateService } from '../app/interface/patrolTemplateInterface';
const { Transactional } = require('../app/core/transactionalDeco/index')

@provide('patrolTemplateService')
export class PatrolTemplateService implements IpatrolTemplateService{
  @inject()
  ctx: Context;
  /**
   * 通过巡检任务id查询问题数
   * @param {object} { params, pagination } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async queryNameByTaskId(params:any): Promise<any> {
    const {
      taskId
    } = params
    let psName = null
    if (taskId) {
      const condition = {
        where: {
          patrolTaskId: taskId
        },
        attributes: ['psId'],
        raw: true
      }
      let psData = await (this as any).query('Task','findOneData',[condition])
      if(!psData) return ''
      psName = await (this as any).query('PlanSchema','queryDetailData',[{
        where: {
          psId: psData.psId
        },
        attributes: ['psName'],
      }])
    }
    return psName ? psName.psName : ''
  }
}
