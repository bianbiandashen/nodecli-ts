import {  Context, inject, provide} from 'midway';
import { IpauseRecordsService } from '../app/interface/pauseRecordsInterface';
const { Transactional } = require('../app/core/transactionalDeco/index')

@provide('pauseRecordsService')
export class pauseRecordsService implements IpauseRecordsService {
  @inject()
  ctx: Context;
  /**
   * 任务取消 web 端的
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async taskCancel (params:any): Promise<any> {
    const { taskId } = params

    const condition = { where: { patrolTaskId: taskId } }
    const taskItem = await (this as any).query('Task', 'findOneData', [ condition ])
    if (taskItem && taskItem.execType !== 1) {
      throw Error(this.ctx.__('pauseRecords.noAutoTaskCan'))
    }

    const ptTaskStop = Object.assign({}, params, { patrolTaskId: taskId })

    await (this as any).query('PauseRecords', 'createData', [ ptTaskStop ])
    // const result = await this.app.curl('http://10.15.66.12:8082/patrolengine/api/v1/task/accept', {
    const result = await this.ctx.consulCurl(
      '/patrolengine-execute/api/v1/task/cont',
      'patrolengine',
      'patrolengine-execute',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          appId: this.ctx.header.appid
        },
        data: { taskId }
      }
    )
    const resultData = result && result.data && this.ctx.helper.bufferToJson(result.data)
    return resultData
  }

  @Transactional
  async taskStopAll (params:any = {}): Promise<any> {
    // 任务是自动且状态为执行中的才可以暂停
    const condition = {
      where: {
        status: 1,
        execType: 1
      }
    }
    const data = await (this as any).query('Task', 'queryAllData', [ condition ])
    if (!data || data.list.length <= 0) {
      throw Error(this.ctx.__('pauseRecords.noPauseTask'))
    } else {
      // 遍历所有的taskids 执行暂停操作

      const patrolTaskIds = data.list.map(ele => ele.patrolTaskId)
      for (const item of patrolTaskIds) {
        const ptTaskStop = Object.assign({}, params, { patrolTaskId: item })

        await (this as any).query('PauseRecords', 'createData', [ ptTaskStop ])

        const result = await this.ctx.consulCurl(
          '/patrolengine-execute/api/v1/task/stop',
          'patrolengine',
          'patrolengine-execute',
          {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              appId: this.ctx.header.appid
            },
            data: { taskId: item }
          }
        )
        const resultData = result && result.data && this.ctx.helper.bufferToJson(result.data)
        console.log('realUrlrealUrlrealUrlrealUrlrealUrl', resultData)
        return resultData
      }
    }
  }
  /**
   * 新增xx
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async create (params:any): Promise<any> {
    const {
      // execMethod 0 暂停 1 恢复
      execMethod,
      taskId,
      remark } = params
    // 任务继续的逻辑
    if (execMethod === 1) {
      // 执行恢复的操作
      const userId = this.ctx.getUserId() && Buffer.from(this.ctx.getUserId()).toString('base64')
      const result = await this.ctx.consulCurl(
        '/patrolengine-execute/api/v1/task/cont',
        'patrolengine',
        'patrolengine-execute',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            userId,
            appId: this.ctx.header.appid
          },
          data: {
            taskId,
            remark
          }
        }
      )
      const resultData = result && result.data && this.ctx.helper.bufferToJson(result.data)
      // console.log('realUrlrealUrlrealUrlrealUrlrealUrl', resultData)
      return resultData

      // 任务取消的逻辑
    } else if (execMethod === 2) {
      const userId = this.ctx.getUserId() && Buffer.from(this.ctx.getUserId()).toString('base64')
      const result = await this.ctx.consulCurl(
        '/patrolengine-execute/api/v1/task/cancel',
        'patrolengine',
        'patrolengine-execute',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            userId,
            appId: this.ctx.header.appid
          },
          data: {
            taskId,
            remark
          }
        }
      )
      const resultData = result && result.data && this.ctx.helper.bufferToJson(result.data)
      return resultData
    } else if (execMethod === 0) {
      // 任务暂停的逻辑
      const userId = this.ctx.getUserId() && Buffer.from(this.ctx.getUserId()).toString('base64')
      const result = await this.ctx.consulCurl(
        '/patrolengine-execute/api/v1/task/stop',
        'patrolengine',
        'patrolengine-execute',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            userId,
            appId: this.ctx.header.appid
          },
          data: {
            taskId,
            remark
          }
        }
      )
      const resultData = result && result.data && this.ctx.helper.bufferToJson(result.data)
      return resultData
    } else if (execMethod === 4) {
      const userId = this.ctx.getUserId() && Buffer.from(this.ctx.getUserId()).toString('base64')
      const result = await this.ctx.consulCurl(
        '/patrolengine-execute/api/v1/task/stop/all',
        'patrolengine',
        'patrolengine-execute',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            userId,
            appId: this.ctx.header.appid
          },
          data: {}
        }
      )
      const resultData = result && result.data && this.ctx.helper.bufferToJson(result.data)
      return resultData
    }
  }
  /**
   * 删除xx
   * @param {object}
   * @return {string} - objec
   */
  @Transactional
  async delete ({ id }) {}
  /**
   * 查询
   * @param {object} params
   * @return {string} - list
   */
  @Transactional
  async getlist (params:any): Promise<any> {
    const { patrolTaskId } = params
    const condition = {
      where: { patrolTaskId }
    }

    const data = await (this as any).query('PauseRecords', 'queryData', [ condition ])
    return data
  }
  /**
   * 更新
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async update (params = {}) {}
}
