import {  Context, inject, provide} from 'midway';
import { IpunchService } from '../app/interface/punchInterface';
const { Transactional } = require('../app/core/transactionalDeco/index')

@provide('punchService')
export class PunchService implements IpunchService{
  @inject()
  ctx: Context;
  /**
   * 根据巡检项查询巡检方法
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async punchAdd (params:any = {}): Promise<any> {
    return await (this as any).query('PunchResult', 'createData', [ params ])

  }
  @Transactional
  async getItemManner (params:any = {}): Promise<any> {
    const result = await (this as any).query('ItemEvent', 'queryManner', [ params ])
    return result
  }
}
