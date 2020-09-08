'use strict';
import {  Context, inject, provide, Application} from 'midway';
import { 
  IRemoteDevopsService,
} from '../../app/interface/plugins/remoteDevopsInterface';
const {
  Transactional
} = require('../../app/core/transactionalDeco')
@provide('remoteDevopsService')
export class RemoteDevopsService implements IRemoteDevopsService {
  @inject()
  ctx: Context;
  app: Application;

  @Transactional
  async remoteDevopsShow(params):Promise<any> {
    const { pageNo = 1, pageSize = 1000, taskItemId = '', mannerId = '' } = params
    const condition:any = {
      where: {}
    }
    // 项ID
    if (taskItemId) {
      condition.where.patrolTaskItemId = taskItemId
    }
    // 巡检方法ID
    if (mannerId) {
      condition.where.patrolMethodId = mannerId
    }
    if (pageNo && pageSize) {
      condition.limit = pageSize
      condition.offset = (pageNo - 1) * pageSize
    }
    const result = await (this  as  any).query('PatrolTaskPoint', 'queryData', [condition])
    return result
  }
  @Transactional
  async remoteDevopsSavePoint(params):Promise<any> {
    params = Object.assign({}, params, {
      isDelete: 0
    })
    const result = await (this  as  any).query('PatrolPoint', 'createData', [params])
    return result
  }
  @Transactional
  async remoteDevopsQueryPoint(params):Promise<any> {
    const { patrolItemId, patrolObjId, patrolMethodId } = params
    const condition:any = {
      where: {
      }
    }
    if (patrolItemId) condition.where.patrolItemId = patrolItemId
    if (patrolObjId) condition.where.patrolObjId = patrolObjId
    if (patrolMethodId) condition.where.patrolMethodId = patrolMethodId
    const result = await (this  as  any).query('PatrolPoint', 'queryAllData', [condition])
    return result
  }
  @Transactional
  async getMannerInfo(params):Promise<any> {
    const condition = {
      where: {
        mId: params.mannerId
      },
      attributes: ['mId', 'mType', 'aiType', 'mName']
    }
    const result = await (this  as  any).query('InspectionManner', 'queryOne', [condition])
    return result
  }
}
