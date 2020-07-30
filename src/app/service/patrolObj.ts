import {  Context, inject, provide} from 'midway';
import { PatrolObjResult, PatrolObjOptions, IPatrolObjService } from '../../interface/partrolObjInterface';
// const Sequelize = require('sequelize')

// const { Op } = Sequelize
const { Transactional } = require('../core/transactionalDeco/index')

@provide('patrolObjService')
export class PatrolObjService implements IPatrolObjService {
  @inject()
  ctx: Context;


  // @inject('Transactional')
  @Transactional
  async getPatrolObjList(options: PatrolObjOptions): Promise<PatrolObjResult> {
    console.log('this---Transactional',this)
    const resultList = await this.query('PatrolObj', 'queryData', [ options ])
    return resultList
    // return data
  }
  // @Transactional
  // async getPatrolObjList(options: PatrolObjOptions): Promise<PatrolObjResult> {
  //   console.log('this---Transactional',this)
  //   const resultList = await Transactional.query('PatrolObj', 'queryData', [ options ])
  //   return resultList
  // }
  
}

