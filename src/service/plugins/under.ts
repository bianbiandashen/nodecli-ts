'use strict'
import {  Context, inject, provide, Application} from 'midway';
import { 
  IUnderService,
} from '../../app/interface/plugins/underInterface';
const { Transactional } = require('../../app/core/transactionalDeco')
@provide('underService')
export class UnderService implements IUnderService {

  @inject()
  ctx: Context;
  app: Application;

  /**
  * 线下人工获取任务巡检项图片列表
  * @param {object}
  * @return {string} - object
  */
  @Transactional
  async getUnderPicList (params): Promise<any> {
    const { ctx } = this
    const { patrolTaskItemId } = params
    if (!patrolTaskItemId) {
      throw new Error(ctx.__('plugins.taskPatrolTIdCannotEmpty'))
    }
    const taskExecResult = await ctx.service.taskExecResult.getExecResultByTaskItemId(patrolTaskItemId, (this  as  any).transaction)
    if (taskExecResult && taskExecResult.picUrls) {
      const picIdArr = taskExecResult.picUrls.split(',')
      const picList = await (this  as  any).query('PatrolPic', 'getPicListByIds', [ picIdArr ])
      for (const item of picList) {
        const realUrl = await ctx.service.common.getRealPic({ picUrl: item.picUrl }, (this  as  any).transaction)
        item.realUrl = realUrl
      }
      return picList
    }
    return []
  }
}
