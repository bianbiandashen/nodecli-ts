import { Context, controller, get, inject, provide } from 'midway';
import { IPatrolObjService, PatrolObjResult } from '../../interface/partrolObjInterface';

@provide()
@controller('/patrolObj')
export class PatrolObjController {

  @inject()
  ctx: Context;

  @inject('patrolObjService')
  service: IPatrolObjService;

  @get('/list')
  async getPatrolObjlist(): Promise<void> {
    const id: number = this.ctx.params.id;
    const patrolObjList: PatrolObjResult = await this.service.getPatrolObjList({id});
    this.ctx.body = {success: true, message: 'OK', data: patrolObjList};
  }
}
