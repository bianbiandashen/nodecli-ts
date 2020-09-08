import {  Context, inject, provide} from 'midway';
import { IPatrolPlanApiService } from '../app/interface/patrolPlanApiInterface';
import { IrelationObjPlanService } from '../app/interface/relationObjPlanInterface';
import { ItaskExecResultService } from '../app/interface/taskExecResultInterface';
import { IpdmsService } from '../app/interface/pdmsInterface';

const Sequelize = require('sequelize')
const { Op } = Sequelize
const { Transactional } = require('../app/core/transactionalDeco/index')

@provide('patrolPlanApiService')
export class PatrolPlanApiService implements IPatrolPlanApiService {
  @inject()
  ctx: Context;

  @inject('relationObjPlanService')
  serviceIrelationObjPlan: IrelationObjPlanService;

  @inject('taskExecResultService')
  serviceItaskExecResult: ItaskExecResultService;

  @inject('pdmsService')
  pdmsService: IpdmsService;
  /**
   * 巡检计划分页查询列表
   * @param {object} { params, pagination } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async queryPlanList(params:any): Promise<any> {
    // deleteType 是否查询已经删除的计划 0:未删除 -1:已删除, 不传查全部
    const { templateId, objId, pageNo, pageSize, isDelete } = params
    // 根据巡检模板查出巡检模板code
    this.ctx.hikLogger.info('wwwwwwwwwwwwwwwwwwww',isDelete)
    this.ctx.hikLogger.info('wwwwwwwwwwwwwwwwwwww',isDelete=== 0)
    this.ctx.hikLogger.info('wwwwwwwwwwwwwwwwwwww',typeof(isDelete))
    let psIdArr = null
    if (templateId) {
      const psIdRes = await (this as any).query('PlanSchema', 'queryAllData', [
        {
          where: {
            schemaCode: {
              [Op.in]: templateId.split(',')
            }
          }
        }
      ])
      if (psIdRes) psIdArr = psIdRes.list.map(item => item.psId)
    }
    // 根据 model_data_id查出巡检对象id
    let planIdArr = []
    if (objId) {
      const objRes = await (this as any).query('PatrolObj', 'queryOne', [
        {
          where: {
            modelDataId: objId,
            isDelete: '0'
          },
          attributes: ['patrolObjId']
        }
      ])
      // 查询巡检对象的计划,通过巡检对象查出rel->taskid -> planid
      if (objRes) {
        const planIdRes = await (this as any).query('PatrolObjRel', 'findPlanByObj', [objRes.patrolObjId])
        if (planIdRes) planIdArr = planIdRes.map(item => item['patrolTask.planId'])
      }
      if (planIdArr.length === 0) {
        return {
          total: 0,
          list: [],
          pageNo: parseInt(pageNo),
          pageSize: parseInt(pageSize)
        }
      }
    }
    const _params = Object.assign({}, params, {
      psIdArr,
      planIdArr,
      deleteType: isDelete
    })
    const result = await (this as any).query('PatrolPlan', 'queryDataByPlanApiService', [_params])
    const returnData = []
    for (const item of result.list) {
      const _relationPlanObj = await this.serviceIrelationObjPlan.queryDataAllList(
        {
          patrolPlanId: item.patrolPlanId
        },
        (this as any).transaction
      )
      const patrolObjNum = Array.from(new Set(_relationPlanObj.map(item => item.patrolObjId)))
        .length
      const problemNum = await this.serviceItaskExecResult.queryProblemByPlanId(
        { patrolPlanId: item.patrolPlanId },
        (this as any).transaction
      )
      const solveProblemNum = await this.serviceItaskExecResult.querySolvedProblemByPlanId(
        { patrolPlanId: item.patrolPlanId },
        (this as any).transaction
      )
      returnData.push(
        Object.assign({}, JSON.parse(JSON.stringify(item)), {
          problemNum,
          patrolObjNum,
          solveProblemNum
        })
      )
    }
    return {
      total: result.total,
      list: returnData,
      pageNo: result.pageNo,
      pageSize: result.pageSize
    }
  }
  /**
   * 巡检计划详情
   * @param {object} { params, pagination } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async queryPlanDetail(params:any): Promise<any> {
    const { planId } = params
    const result = await (this  as  any).query('PatrolPlan', 'queryDetailByPlanApiService', [params])
    // 查询计划下的人员数
    const planPerson = await (this  as  any).query('PatrolPlanFlow', 'queryAllData', [
      {
        where: {
          patrolPlanId: planId,
          processType: 0
        },
        attributes: ['firstPersonIds', 'secondPersonIds', 'roleId', 'planFlowId']
      }
    ])
    const personArr = []
    const planFlowIdArr = []
    const roleIdArr1 = []
    for (const elem of planPerson.values()) {
      if (elem.firstPersonIds !== '') {
        personArr.push(...elem.firstPersonIds.split(','))
      }
      if (elem.secondPersonIds !== '') {
        personArr.push(...elem.secondPersonIds.split(','))
      }
      if (elem.roleId && !roleIdArr1.includes(elem.roleId)) {
        roleIdArr1.push(elem.roleId)
      }
      if (elem.planFlowId !== '') {
        planFlowIdArr.push(elem.planFlowId)
      }
    }
    // 查询
    const relationObjPerson = await (this  as  any).query('RelationObjPerson', 'queryAllData', [
      {
        where: {
          planFlowId: { [Op.in]: planFlowIdArr }
        },
        attributes: ['personIds']
      }
    ])
    for (const elem of relationObjPerson.values()) {
      if (elem.personIds !== '') {
        personArr.push(...elem.personIds.split(','))
      }
    }
    console.log('````````````````````````````````````', personArr)
    // 通过roleId查人
    const roleIdArr = Array.from(new Set(roleIdArr1))
    console.log('````````````````````````````````````', roleIdArr)
    if (roleIdArr.length > 0) {
      // 查出计划关联的对象
      const relationObjRes = await (this  as  any).query('RelationObjPlan', 'queryAllData', [
        {
          where: {
            patrolPlanId: planId
          },
          attributes: ['patrolObjId']
        }
      ])
      const realObjRes = Array.from(new Set(relationObjRes.map(item => item.patrolObjId)))
      // 查询巡检对象关联的区域
      const realRegionRes = await (this  as  any).query('PatrolObj', 'queryManyData', [
        {
          where: {
            patrolObjId: {
              [Op.in]: realObjRes
            }
          },
          attributes: ['patrolObjRegion']
        }
      ])
      const realRegionArr = Array.from(new Set(realRegionRes.map(item => item.patrolObjRegion)))
      for (const v of roleIdArr.values()) {
        if (v) {
          const rolePersonData = await this.pdmsService.getPersonListByRoleIdNoUserId(
            v,
            (this  as  any).transaction
          )
          const arrs = rolePersonData.filter(
            item => realRegionArr.includes(item.orgId) || !item.orgId
          )
          const arrs2 = arrs.map(item => item.userId)
          personArr.push(...arrs2)
        }
      }
    }

    // 查询计划下的对象数
    const _relationPlanObj = await this.serviceIrelationObjPlan.queryDataAllList(
      {
        patrolPlanId: planId
      },
      (this  as  any).transaction
    )
    // 查询计划下问题数
    const problemNum = await this.serviceItaskExecResult.queryProblemByPlanId(
      { patrolPlanId: planId },
      (this  as  any).transaction
    )
    // 查询出单个计划有问题的对象个数
    const hasProblemObjNum = await this.serviceItaskExecResult.queryProblemObjByPlanId(
      { patrolPlanId: planId },
      (this  as  any).transaction
    )
    // 统计任务计未开始的
    // 0-未开始 1-执行中  3-已完成 4-暂停中 5-已取消'
    const taskNoStart = await (this  as  any).query('Task', 'queryCount', [
      {
        where: {
          status: 0,
          planId
        }
      }
    ])
    // 统计任务逾期
    const taskTimeOutDone = await (this  as  any).query('Task', 'queryCount', [
      {
        where: {
          status: 3,
          planId,
          timeStatus: 1
        }
      }
    ])
    const taskDone = await (this  as  any).query('Task', 'queryCount', [
      {
        where: {
          status: 3,
          planId,
          timeStatus: 0
        }
      }
    ])
    const data = Object.assign(
      {},
      {
        taskTimeOutDone,
        taskDone,
        taskNoStart,
        problemNum,
        personNum: Array.from(new Set(personArr)).length,
        hasProblemObjNum,
        patrolObjNum: Array.from(new Set(_relationPlanObj.map(item => item.patrolObjId))).length
      },
      JSON.parse(JSON.stringify(result))
    )
    return data
  }
}
