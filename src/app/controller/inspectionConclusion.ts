import { Context, Application,inject, provide } from 'midway'
import { IpatrolTaskItemService } from '../interface/patrolTaskItemInterface';
import { ItaskService } from '../interface/taskInterface';
import { IInspectionConclusionService } from '../interface/inspectionConclusionInterface';

import { BaseController } from '../core/base_controller'
import { get,post,controller } from '../../decorator/openApi'
const Exception = require('../core/Exception')
@provide()
@controller('/inspectionConclusion',{description: '巡检结论'})
export class InspectionConclusionController extends BaseController {
  @inject()
  ctx: Context;
  app: Application;

  @inject('inspectionConclusionService')
  service: IInspectionConclusionService;

  @inject('patrolTaskItemService')
  patrolTaskItemService: IpatrolTaskItemService;

  @inject('taskService')
  taskService: ItaskService;

  /*
   * @description 创建巡检结论APP端
  */
  @post('/add', {
    description: '创建巡检结论(APP)'
  })
  async createConclusionByApp () {
    try {
    const userId = this.ctx.req.headers.userid
    const id = await this.patrolTaskItemService.createByApp(this.ctx.request.body, userId)
    this.ctx.body = id
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }
  /*
   * @description 创建巡检结论BS端
  */
  @post('/online/add', {
    description: '创建巡检结论(BS)'
  })
  async createConclusionByBS () {
    const userId = this.ctx.getUserId()
    const res = await this.patrolTaskItemService.createByBs(this.ctx.request.body, userId)
    this.ctx.body = res
    const data = await this.taskService.getProcess({ patrolTaskId: this.ctx.request.body.patrolTaskId })
    // 根据传入的参数，判断是暂存结论还是确认提交
    const params = this.ctx.request.body
    if (
      ((params.result &&
        params.result.triggerNext &&
        Array.isArray(params.patrolTaskItemList) &&
        params.patrolTaskItemList.length > 0) ||
      (params.result && !params.result.triggerNext)) && data.dataValues.taskResultEditable === 1
    ) {
      // 如果是社区的暂存结论，那么不发送mq，只有确认提交时才发送mq
      // 此时要写操作日志
      this.operateLog(
        'log.moduleId.taskManage.displayName',
        'log.objectType.taskManage.displayName',
        this.ctx.__('inspectionConclusion.createConclusionByBSOperateLog1'),
        'log.action.save.displayName',
        this.ctx.__('inspectionConclusion.createConclusionByBSOperateLog2'),
        'log.actionMessageId.save_conclusion.message',
        1
      )
      return
    }
    // 到这里说明是提交
    // 写操作日志
    this.operateLog(
      'log.moduleId.taskManage.displayName',
      'log.objectType.taskManage.displayName',
      this.ctx.__('inspectionConclusion.createConclusionByBSOperateLog1'),
      'log.action.submit.displayName',
      this.ctx.__('inspectionConclusion.createConclusionByBSOperateLog2'),
      'log.actionMessageId.submit_conclusion.message',
      1
    )
    // 结论确认提交完成后，准备发送tlnc
    const resultData = res.data
    // 如果传入任务id，那么代表结论提交，需要发送消待办（即使没有问题，也要到待办中把之前的任务待办删除，因为这里把任务处理完成了）
    if (this.ctx.request.body.patrolTaskId && resultData) {
      const pointResultIds = resultData.list.map(ele => ele.pointResultId)
      const tlncParams = {
        pointResultIds,
        patrolTaskId: this.ctx.request.body.patrolTaskId,
        type: data.dataValues.taskResultEditable === 1 ? 'taskSubmit' : 'itemSumit' // 传入操作标识，这里是任务提交，那么在待办中处理时，基于此进行删除任务的待办
      }
      // 结论提交成功后，发起待办和消息的mq
      // console.log(this.ctx.__('inspectionConclusion.createConclusionByBSLog', [ resultData ]))
      // this.app.hikLogger.debug(this.ctx.__('inspectionConclusion.createConclusionByBSLog', [ resultData ]))
      await this.ctx.service.patrolTaskItem.createTlnc(tlncParams)
    }
  }
  /*
   * @description 获取巡检结论详情 （app 巡检任务巡检项详情）
  */
  @get('/detail/get/by_patrolTaskItemId', {
    description: '获取巡检结论详情 （app 巡检任务巡检项详情）'
  })
  async getDetail () {
    try {
      const data = await this.patrolTaskItemService.getTaskItemDetailByIdForApp(this.ctx.request.query)
      this.success(data)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }
  /*
   * @description 获取任务下的巡检项列表 （app 巡检任务巡检项列表）
  */
  @get('/getTaskItemList/search', {
    description: '获取任务下的巡检项列表 （app 巡检任务巡检项列表）'
  })
  async getTaskItemList () {
    try {
      const data = await this.patrolTaskItemService.getlist(this.ctx.request.query)
      this.success(data)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }
  /*
   * @description 查询任务巡检项处理的详情信息
  */
  @get('/operateDetail/get', {
    description: '查询任务巡检项处理的详情信息'
  })
  async getOperateDetail () {
    try {
      const data = await this.service.getOperateDetail(this.ctx.request.query)
      this.success(data)
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }
  /*
   * @description 创建巡检结论BS端
  */
  @post('/onlineCommon/add', {
    description: '创建巡检结论(BS)-多对多'
  })
  async createCommonConclusionByBS () {
    try {
      const userId = this.ctx.getUserId()
      const res = await this.patrolTaskItemService.createConclusionByBs(this.ctx.request.body, userId)
      this.ctx.body = res
      const data = await this.taskService.getProcess({ patrolTaskId: this.ctx.request.body.patrolTaskId })
      if (data.dataValues.taskResultEditable === 1) {
        // 如果是社区的暂存结论，那么不发送mq，只有确认提交时才发送mq
        // 此时要写操作日志
        this.operateLog(
          'log.moduleId.taskManage.displayName',
          'log.objectType.taskManage.displayName',
          this.ctx.__('inspectionConclusion.createConclusionByBSOperateLog1'),
          'log.action.save.displayName',
          this.ctx.__('inspectionConclusion.createConclusionByBSOperateLog2'),
          'log.actionMessageId.save_conclusion.message',
          1
        )
        return
      }
      // 到这里说明是提交
      // 写操作日志
      this.operateLog(
        'log.moduleId.taskManage.displayName',
        'log.objectType.taskManage.displayName',
        this.ctx.__('inspectionConclusion.createConclusionByBSOperateLog1'),
        'log.action.submit.displayName',
        this.ctx.__('inspectionConclusion.createConclusionByBSOperateLog2'),
        'log.actionMessageId.submit_conclusion.message',
        1
      )
      // 结论确认提交完成后，准备发送tlnc
      const resultData = res.data
      // 如果传入任务id，那么代表结论提交，需要发送消待办（即使没有问题，也要到待办中把之前的任务待办删除，因为这里把任务处理完成了）
      if (this.ctx.request.body.patrolTaskId && resultData) {
        const pointResultIds = resultData.list.map(ele => ele.pointResultId)
        const tlncParams = {
          pointResultIds,
          patrolTaskId: this.ctx.request.body.patrolTaskId,
          type: data.dataValues.taskResultEditable === 1 ? 'taskSubmit' : 'itemSumit' // 传入操作标识，这里是任务提交，那么在待办中处理时，基于此进行删除任务的待办
        }
        // 结论提交成功后，发起待办和消息的mq
        // console.log(this.ctx.__('inspectionConclusion.createConclusionByBSLog', [ resultData ]))
        // this.app.hikLogger.debug(this.ctx.__('inspectionConclusion.createConclusionByBSLog', [ resultData ]))
        await this.ctx.service.patrolTaskItem.createTlnc(tlncParams)
      }
    } catch (err) {
      throw new Exception(err.message, err.code, err.transaction)
    } finally{}
  }
}