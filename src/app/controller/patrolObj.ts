import { Context, inject, provide } from 'midway';
import { IPatrolObjService } from '../interface/partrolObjInterface';
import { get, Param, controller } from '../../decorator/openApi'

@provide()
@controller('/patrolObj',{
  description: '对象模块'
})
export class PatrolObjController {

  @inject()
  ctx: Context;

  @inject('patrolObjService')
  service: IPatrolObjService;

  @get('/:list', {
    description: '巡检对象列表',
    responses: 'API.PatrolObjResult',
  })
  async getPatrolObjlist(
    @Param('number', {
        minimum: 1,
        description: '巡检对象id',
    })
    patrolObjId: string
){
  
    const patrolObjList = await this.service.getPatrolObjList({ patrolObjId })
    // return patrolObjList
    this.ctx.body = {success: true, message: 'OK', data: patrolObjList};

}
}
