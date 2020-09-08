'use strict';
import {  Context, inject, provide, Application} from 'midway';
import { 
  IPatrolObjApiService,
} from '../app/interface/patrolObjApiInterface';
// 巡检对象对外接口
const {
  Transactional
} = require('../app/core/transactionalDeco')
const Sequelize = require('sequelize')
const moment = require('moment')
const {
  Op
} = Sequelize
@provide('patrolObjApiService')
export class PatrolObjApiService implements IPatrolObjApiService {
  @inject()
  ctx: Context;
  app: Application;
  /**
   * 通过Relid查询巡检对象名称和类型名称
   * @param {object} { params, pagination } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async queryObjNameByRelId(params = {}):Promise<any> {
    const res = await (this as any).query('PatrolObjRel', 'queryObjNameByRelIdModel', [params])
    if (!res.partrolObjItem) {
      return null
    }
    const ress = JSON.parse(JSON.stringify(res))
    return {
      objName: ress.partrolObjItem.patrolObjName,
      typeName: ress.partrolObjItem.patrolObjType ? ress.partrolObjItem.patrolObjType.objTypeName : null
    }
  }
  /**
   * 巡检计划分页查询列表
   * @param {object} { params, pagination } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async queryObjRelList(params:any = {}):Promise<any> {
    const {
      ctx
    } = this;
    const {
      pageNo,
      pageSize,
      hasScore,
      objId,
      planId,
      state
    } = params
    let planEffectiveEnd = null
    if (planId) {
      let planDetailRes = await (this as any).query('PatrolPlan', 'queryOne', [{
        where: {
          patrolPlanId: planId,
        },
        attributes:['planEffectiveEnd']
      }])
      if (planDetailRes) planEffectiveEnd = planDetailRes.planEffectiveEnd
    }
    // return {
    //   state,
    //   planEffectiveEnd
    // }
    if ((state || state === 0) && planEffectiveEnd){
      moment().endOf('day').format('x')
      if (state === 3 && (moment(planEffectiveEnd).endOf('day').format('x') > moment().format('x'))){
        // 计划未过期查过期
        return {
          list: [],
          pageSize,
          pageNo,
          total: 0
        }
      }
      if ((state === 0 || state === 1) && (moment(planEffectiveEnd).endOf('day').format('x') < moment().format('x'))){
         // 计划过期查进行中和未开始
        return {
          list: [],
          pageSize,
          pageNo,
          total: 0
        }
      }
    }

    //根据objid查出Objid
    let realObjId = null
    if (objId) {
      let realObjIdData = await (this as any).query('PatrolObj','queryOne',[{
        where: {
          modelDataId: objId,
          isDelete: '0'
        },
        attributes:['patrolObjId']
      }])
      realObjId =  realObjIdData
      if (realObjIdData) realObjId = realObjIdData.patrolObjId
    }
    let params1 = null
    if (realObjId && planEffectiveEnd) {
      params1 = Object.assign({},params,{
        realObjId,
        planEffectiveEnd
      })
    } else if (realObjId) {
      params1 = Object.assign({},params,{
        realObjId,
      })
    } else if (planEffectiveEnd){
      params1 = Object.assign({},params,{
        planEffectiveEnd,
      })
    } else {
      params1 = params
    }
    const result = await (this as any).query('PatrolObjRel', 'findAndCountAllDataModel', [params1, Sequelize, Op])
    const returnData = []
    for (const elem of result.list.values()) {
      const res = await (this as any).query('Task', 'findOneDataModel', [elem, result, Sequelize])
      // 问题数 (传入巡检任务id和patrol_obj_rel_id)
      const problemNum = await ctx.service.taskExecResult.queryObjProblem({
        taskId: elem.patrolTaskId,
        patrolObjRelId: elem.patrolObjRelId
      }, (this as any).transaction)
      // 扣分项
      let score = 0
      if (hasScore) {
        score = await ctx.service.patrolTaskItem.countScoreByTaskId({
          taskId: elem.patrolTaskId,
          patrolObjRelId: elem.patrolObjRelId
        }, (this as any).transaction)
      }
      returnData.push(Object.assign({},
        JSON.parse(JSON.stringify(elem)),
        JSON.parse(JSON.stringify(res)),
        hasScore ?
          {
            score,
            problemNum
          } : {
            problemNum
          }
      ))
    }
    return {
      list: returnData,
      pageSize,
      pageNo,
      total: result.total
    }
  }

}
