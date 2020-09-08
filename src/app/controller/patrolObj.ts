import { Context, inject, provide } from 'midway'
import { IPatrolObjService } from '../interface/patrolObjInterface'
import { get, controller,Query } from '../../decorator/openApi'
import { BaseController } from '../core/base_controller'
const Exception = require('../core/Exception')

@provide()
@controller('/patrolObj',{description: '对象模块'})
 export class PatrolObjController extends BaseController{

  @inject()
  ctx: Context;

  @inject('patrolObjService')
  service: IPatrolObjService;

  @get('/list', {
    description: '巡检对象列表查询',
    responses: 'API.PatrolObjResult'
  })
  async getPatrolObjlist (
    @Query('string', {description: '巡检对象id'})
    patrolObjId: string
){
  
 
    // return patrolObjList
    try {
      const patrolObjList = await (this as any).service.getPatrolObjList({ patrolObjId })
      this.success(patrolObjList)
    }
    catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally {
      // 操作日志一般写在controller层的finally语句块
      this.operateLog(
        '巡检打卡点处理',
        '巡检打卡新增',
        `APP 巡检打卡新增 `,
        'APP 巡检打卡新增',
        'APP 巡检打卡新增 ',
        `APP 巡检打卡新增 }`,
        1
      )
    }

}
}
