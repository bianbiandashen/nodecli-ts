import {  Context, inject, provide} from 'midway';
import { IpatrolTaskPointService } from '../app/interface/patrolTaskPointInterface';
import { ICommonService } from '../app/interface/commonInterface';
const moment = require('moment')
const Sequelize = require('sequelize')
const { Op } = Sequelize
const { Transactional } = require('../app/core/transactionalDeco/index')

@provide('patrolPointService')
export class PatrolPointService implements IpatrolTaskPointService {
  @inject()
  ctx: Context;

  @inject('commonService')
  serviceICommon: ICommonService;

  @Transactional
  async getTaskPointDetail(params:any): Promise<any> {
    const condition = {
      where: {
        patrolTaskPointId: params.taskPointId
      }
    }
    const result = await (this as any).query('PatrolTaskPoint', 'findOneData', [condition])
    return result
  }
  /**
   * 通过 transactionId 查询全部的检测点
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async queryTaskPointAllListByTransactionId(params:any): Promise<any> {
    const { transactionId } = params

    const condition = {
      where: {
        transactionId
      }
      // attributes: []
    }
    const response = await (this as any).query('TransactionFlow', 'findOneData', [condition])
    // 获取 releativeId
    const relativeId = response && response.relativeId
    if (!relativeId) {
      throw Error(this.ctx.__('patrolTaskPoint.errorIdNotExit'))
    }

    const execCondition = {
      where: {
        pointResultId: relativeId
      }
    }
    const TaskExec = await (this as any).query('TaskExecSchema', 'queryDetail', [execCondition])
    const patrolTaskItemId = TaskExec && TaskExec.patrolTaskItemId
    const execCreateTime = TaskExec && TaskExec.createTime
    if (!patrolTaskItemId) {
      throw Error(this.ctx.__('patrolTaskPoint.notExit'))
    }

    const pointCondition = {
      where: {
        patrolTaskItemId
      },
      attributes: [
        'patrolTaskPointId',
        'pointName',
        'cameraId',
        'cameraPtz',
        'cameraPreset',
        'trackParams',
        'modelName'
      ]
    }
    const result = await (this as any).query('PatrolTaskPoint', 'queryData', [pointCondition])
    for (const item of result.list) {
      item.dataValues.execCreateTime = execCreateTime
    }

    return result
  }

  /**
   * 通过PatrolTaskItemId 查询全部的检测点 【app的接口】
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async queryTaskPointAllListByPatrolTaskItemId(params:any): Promise<any> {
    const { patrolTaskItemId } = params
    if (!patrolTaskItemId) {
      throw Error(this.ctx.__('patrolTaskPoint.patrolTaskItemIdNotExit'))
    }
    const taskCondition = {
      where: {
        patrolTaskItemId
      }
    }
    const TaskItem = await (this as any).query('PatrolTaskItem', 'findOneData', [taskCondition])
    const execCondition = {
      where: {
        patrolTaskItemId
      }
    }
    const TaskExec = await (this as any).query('TaskExecSchema', 'queryDetail', [execCondition])

    // 需要通过taskitem 去找objid
    const relCOndition = {
      where: {
        patrolObjRelId: TaskItem.patrolObjRelId
      }
    }
    const PatrolObjRelData = await (this as any).query('PatrolObjRel', 'findOneData', [relCOndition])
    // =============================
    const execCreateTime = TaskExec && TaskExec.createTime
    const patrolItemPath = TaskItem && TaskItem.path
    let _PathArr = []
    // 找到整条链路上 所有的patrolponit 然后 去重cameraid
    if (patrolItemPath) {
      const reg = /^\@|\@$/g
      _PathArr = patrolItemPath.replace(reg, '').split('@')
    }
    const ItemRefCondition = {
      where: {
        patrolItemId: {
          [Op.or]: _PathArr
        },
        patrolObjId: PatrolObjRelData.patrolObjId,
        isDelete: 0
      },

      attributes: [
        [Sequelize.fn('DISTINCT', Sequelize.col('camera_id')), 'cameraId'],
        'patrolPointId',
        'pointName',
        'createTime',
        // 'cameraId',
        'cameraPtz',
        'cameraPreset',
        'trackParams',
        'modelName'
      ]
    }
    const result = await (this as any).query('PatrolPoint', 'queryDataById', [ItemRefCondition])
    // 一个
    for (const item of result.list) {
      const list = await this.serviceICommon.getCameraObj(
        {
          cameraId: item.dataValues.cameraId || ''
        },
        (this as any).transaction
      )
      const cameraList = list && list.data
      item.dataValues.trackParams =
        cameraList && cameraList.list && cameraList.list.length > 0 && cameraList.list[0]

      // item.dataValues.submitTime = moment(item.dataValues.submitTime).format('YYYY-MM-DD HH:mm:ss')
      item.dataValues.execCreateTime = moment(execCreateTime).format('YYYY-MM-DD HH:mm:ss')
    }
    return result
  }
}
