/*
 * @Author: renxiaojian
 * @Date: 2020-02-23 09:29:55
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-03-06 21:34:53
 */
'use strict'
import {  Context, inject, provide, Application} from 'midway';
import { 
  IBussinessService,
} from '../app/interface/bussinessInterface';
const { Transactional } = require('../app/core/transactionalDeco')
@provide('bussinessService')
export class BussinessService implements IBussinessService {

  @inject()
  ctx: Context;
  app: Application;

  /**
   * 应用详情
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async queryOneDetail (params): Promise<any> {
    const { ctx } = this
    const result = await (this as any).query('Bussiness', 'queryOne', [ params ])
    if (result) {
      const planSchemaDetail = await ctx.service.planSchema.queryPlanSchemaDetail({ psId: result.dataValues.defaultSchema }, (this as any).transaction)
      result.dataValues.planSchemaDetail = planSchemaDetail
    }
    return result
  }
  /**
   * 应用详情
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async queryAllApp (params): Promise<any> {
    const { ctx } = this
    ctx.header.appid = 'public'
    const result = await (this as any).query('Bussiness', 'queryAllData', [ params ])
    return result
  }
}
