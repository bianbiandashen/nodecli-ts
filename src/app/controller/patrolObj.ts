import { Context, inject, provide } from 'midway'
<<<<<<< HEAD
import { IPatrolObjService } from '../interface/patrolObjInterface'
=======
import { IPatrolObjService } from '../interface/partrolObjInterface'
>>>>>>> 2db8c7dc19290909326dc3ef26c4b686c5727c1f
import { get, controller,Query } from '../../decorator/openApi'
import { BaseController } from '../core/base_controller'
const Exception = require('../core/Exception')

@provide()
<<<<<<< HEAD
@controller('/patrolObj',{description: '对象模块'})
=======
@controller('/patrolObj',{
  description: '对象模块'
})
>>>>>>> 2db8c7dc19290909326dc3ef26c4b686c5727c1f
 export class PatrolObjController extends BaseController{

  @inject()
  ctx: Context;

  @inject('patrolObjService')
  service: IPatrolObjService;

  @get('/list', {
    description: '巡检对象列表查询',
<<<<<<< HEAD
    responses: 'API.PatrolObjResult'
  })
  async getPatrolObjlist (
    @Query('string', {description: '巡检对象id'})
=======
    responses: 'API.PatrolObjResult',
  })
  async getPatrolObjlist(
    @Query('string', {
        description: '巡检对象id',
    })
>>>>>>> 2db8c7dc19290909326dc3ef26c4b686c5727c1f
    patrolObjId: string
){
  
 
    // return patrolObjList
    try {
<<<<<<< HEAD
      const patrolObjList = await (this as any).service.getPatrolObjList({ patrolObjId })
=======
      const patrolObjList = await this.service.getPatrolObjList({ patrolObjId })
>>>>>>> 2db8c7dc19290909326dc3ef26c4b686c5727c1f
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
