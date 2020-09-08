import {  Context, inject, provide} from 'midway';
import { IrelationObjPersonService } from '../app/interface/relationObjPersonInterface';
const { Transactional } = require('../app/core/transactionalDeco/index')

@provide('relationObjPersonService')
export class RelationObjPersonService implements IrelationObjPersonService{
  @inject()
  ctx: Context;
  /**
   * 新建对象人员关联
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async createRelation(params:any = {}): Promise<any> {
    params = Object.assign(params, { isDelete: 0 })
    return await (this as any).query('RelationObjPerson', 'createData', [params])
  }
  /**
   * 批量添加巡检计划流程
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async batchCreateRelation(params:any = {}): Promise<any> {
    const result = await (this as any).query('RelationObjPerson', 'blukCreate', [params])
    return result
  }
  /**
   * 更新
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async updateRelation(params:any): Promise<any> {
    let result = {}
    for (const item of params) {
      result = await (this as any).query('RelationObjPerson', 'updateData', [item])
    }
    return result
  }
  /**
   * 查询计划流程下巡检对象和人关联的列表
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async queryAllList(params:any): Promise<any> {
    const condition = {
      where: {
        planFlowId: params.planFlowId,
        isDelete: 0
      }
    }
    const result = await (this as any).query('RelationObjPerson', 'queryAllData', [condition])
    return result
  }
  @Transactional
  async queryRelationList(params:any): Promise<any> {
    const result = await (this as any).query('RelationObjPerson', 'queryRelationData', [params])
    return result
  }
  /**
   * 删除
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async deleteDate(params:any): Promise<any> {
    const result = await (this as any).query('RelationObjPerson', 'deleteData', [params])
    return result
  }
}
