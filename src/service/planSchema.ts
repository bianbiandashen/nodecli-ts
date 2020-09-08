import {  Context, inject, provide} from 'midway';
import { IplanSchemaService } from '../app/interface/planSchemaInterface';
import { IprocessService } from '../app/interface/processInterface';
import { IpschemaObjectTypeRelationService } from '../app/interface/pschemaObjectTypeRelationInterface';
import { IPatrolObjTypeService } from '../app/interface/patrolObjTypeInterface';
import { IpdmsService } from '../app/interface/pdmsInterface';
const { Transactional } = require('../app/core/transactionalDeco/index')

@provide('planSchemaService')
export class PlanSchemaService implements IplanSchemaService{
  @inject()
  ctx: Context;

  @inject('processService')
  serviceIprocess: IprocessService;

  @inject('pschemaObjectTypeRelationService')
  serviceIpschemaObjectTypeRelation: IpschemaObjectTypeRelationService;

  @inject('patrolObjTypeService')
  serviceIPatrolObjType: IPatrolObjTypeService;

  @inject('pdmsService')
  serviceIpdms: IpdmsService;
  @Transactional
  async planTempIsExist (params:any): Promise<any> {
    const result = await (this as any).query('PlanSchema', 'queryDataByPsId', [ params ])
    return result
  }
  @Transactional
  async planTempDetailByPlan (params:any): Promise<any> {
    const result = await (this as any).query('PlanSchema', 'queryDataDetailByPlan', [ params ])
    return result
  }
  /**
   * 查询巡检模板—全部
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async queryAllPlanTemp (): Promise<any> {
    const condition = {
      order: [
        [ 'createTime', 'DESC' ]
      ],
      where: { isDelete: 0 }
    }
    const result = await (this as any).query('PlanSchema', 'queryAllData', [ condition ])
    return result
  }
  /**
   * 查询巡检详情
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async queryPlanSchemaDetail (params:any): Promise<any> {
    const condition = {
      order: [
        [ 'createTime', 'DESC' ]
      ],
      where: {
        psId: params.psId,
        isDelete: 0
      }
    }
    const result = await (this as any).query('PlanSchema', 'queryDetailData', [ condition ])
    return result
  }
  /**
   * 查询巡检详情
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async queryPlanTempDetail (params:any): Promise<any> {
    const { ctx } = this
    const condition = {
      order: [
        [ 'createTime', 'DESC' ]
      ],
      where: {
        psId: params.psId
        // isDelete: 0
      }
    }
    const result = await (this as any).query('PlanSchema', 'queryDetailData', [ condition ])
    const processList = await this.serviceIprocess.getProcessAllInfo({ psId: params.psId }, (this as any).transaction)
    const objTypeRelation = await this.serviceIpschemaObjectTypeRelation.getPschemaObjTypeList({ psId: params.psId }, (this as any).transaction)
    const objTypeIds = objTypeRelation.map(item => item.objTypeId)
    const objTypeList = await this.serviceIPatrolObjType.getObjectTypeList(objTypeIds, (this as any).transaction)
    const roleList = await this.serviceIpdms.getAllRoles(ctx.request.query, (this as any).transaction)
    result.dataValues.objTypeList = objTypeList
    result.dataValues.processList = processList.map(item => {
      const currentInfo = roleList && Array.isArray(roleList) ? roleList.find(v => v.roleId === item.dataValues.roleId) : null
      item.dataValues.roleName = currentInfo && currentInfo.roleName ? currentInfo.roleName : ''
      return item
    })
    return result
  }
}
