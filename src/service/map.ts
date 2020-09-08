/*
 * @Author: xionghaima
 * @Date: 2019-12-29 17:39:20
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-09-03 15:50:59
 */

'use strict'
import {  Context, inject, provide, Application} from 'midway';
import { 
  IMapService,
} from '../app/interface/mapInterface';
const {Transactional} = require('../app/core/transactionalDeco')
function bufferToJson (data) {
  return Buffer.isBuffer(data) ? JSON.parse(data.toString()) : {}
}
@provide('mapService')
export class MapService implements IMapService {

  @inject()
  ctx: Context;
  app: Application;

  /**
   * 查询 任务
   * @param {object} params
   * @return {string} - list
   */

  @Transactional
  async getAllList (params = {}): Promise<any> {
    try {
      const data = await (this as any).query('Task', 'queryAllDataByMapServiceGetAllList', [ params ])
      return data
    } catch (error) {
      console.log(error)
    }
  }

  /**
   * 查询任务里面对象详情
   * @param {object} params
   * @return {string} - list
   */

  @Transactional
  async getTaskObjDetail (params:any = {}): Promise<any> {
    const {ctx} = this
    const {patrolTaskId} = params

    const _this = (this as any)

    //  任务详情
    function taskDetail () {
      return _this.query('Task', 'findOneDataByMapServiceGetTaskObjDetailTaskDetail', [ params ])
    }

    // 任务检测点
    function taskPoint () {
      return _this.query('PatrolTaskPoint', 'mapGetPatrolPointName', [ params ])
    }
    // 获取检测点
    function taskPerson () {
      return _this.query('PatrolTaskPerson', 'queryManyAll', [
        {
          where: {patrolTaskId},
          order: [
            [ 'processType' ]
          ]
        }
      ])
    }
    try {
      const [ taskDetailData, taskPointData, taskPersonData ] = await Promise.all([ taskDetail(), taskPoint(), taskPerson() ])
      const result:any = {
        taskDetailData,
        taskPointData
      }
      for (const item of taskPersonData) {
        const data = await ctx.service.pdms.getUserInfoList(item.firstPersonIds.split(','), (this as any).transaction)
        if (data && data.length) {
          item.dataValues.list = data
        }
      }
      result.taskPersonData = taskPersonData
      return result
    } catch (error) {
      console.log(error)
    }
  }

  /**
   * 获取巡检计划得巡检对象
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async getPlanRelationObjService (params:any = {}): Promise<any> {
    const {mapType} = params

    const patrolObj = await (this as any).query('PatrolObjRel', 'queryAllDataByMapServiceGetPlanRelationObjService', [ params ])
    const point = []
    if (patrolObj && patrolObj.length) {
      for (const item of patrolObj) {
        const patrolData:any = {
          name: (item.dataValues.partrolObjItem && item.dataValues.partrolObjItem.dataValues.patrolObjName) || '--',
          patrolObjId: item.dataValues.patrolObjId,
          objTypeName: (item.dataValues.partrolObjItem && item.dataValues.partrolObjItem.dataValues.patrolObjType && item.dataValues.partrolObjItem.dataValues.patrolObjType.dataValues.objTypeName) || '--'
        }
        const result = await this.ctx.consulCurl(`/pdms/api/v1/model/tb_patrol_obj_${mapType}_geom/records`, 'pdms', 'pdmsweb', {
          method: 'POST',
          data: {
            pageNo: 1,
            pageSize: 1000,
            fields: 'geom',
            filedOptions: [
              {
                fieldName: 'model_data_id',
                fieldValue: item.dataValues.patrolObjId,
                type: 'eq'
              }
            ]
          }
        })
        debugger
        const res = bufferToJson(result.data)
        console.log('ddddddd', res)
        if (res.data.list && res.data.list.length) {
          const geom = res.data.list[0].geom
          const geomPoint = geom.substring(6, geom.length - 1)

          patrolData.longitude = parseFloat(geomPoint.split(' ')[0])
          patrolData.latitude = parseFloat(geomPoint.split(' ')[1])
        }
        point.push(
          patrolData
        )
      }
    }

    return {point}
  }

  /**
   * 获取所有的巡检对象
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async getAllObj (): Promise<any> {
    const data = await (this as any).query('PatrolObj', 'queryManyData', [{
      where: {isDelete: '0'}
    }])
    return data
  }
}
