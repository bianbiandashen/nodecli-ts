'use strict'
import { Context, inject, provide, Application } from 'midway'
import { controller, post, get, options} from '../../../decorator/openApi'
import { BaseController } from '../../core/base_controller'
import { IPlannedCaptureServer } from '../../interface/plugins/plannedCaptureInterface'

const Exception = require('../../core/Exception')
/**
 * @Controller PlannedCapture
 */
@provide()
@controller('/plugins/plannedCapture')
export class PlannedCaptureController extends BaseController {
  @inject()
  app: Application;
  ctx: Context;

  @inject('plannedCaptureServer')
  plannedCapture: IPlannedCaptureServer;

  /**
   * @summary 获取参考图片列表
   * @description 获取参考图片列表
   * @Router Get /plugins/plannedCapture/getReferPics
   * @request body getReferPicsRequest *body
   * @response 200 getReferPicsResponse 成功
   */
  @get('/getReferPics')
  async getReferPics () {
    const itemId = this.ctx.query.itemId
    const partrolObjId = this.ctx.query.patrolObjId
    const result = await this.plannedCapture.getRefPics(itemId, partrolObjId)
    this.success(result)
    this.operateLog(
      'log.moduleId.plannedCapture.displayName',
      'log.objectType.plannedCapture.displayName',
      this.ctx.__('plugins.getReferPicsOperateLog1'),
      'log.action.query.displayName',
      this.ctx.__('plugins.getReferPicsOperateLog2'),
      'log.actionMessageId.get_all_refpics.message',
      1
    )
  }
  @get('/getReferPicsByTask')
  async getReferPicsByTask () {
    const taskItemId = this.ctx.query.taskItemId
    const result = await this.plannedCapture.getRefPicsBytaskItemId(taskItemId)
    this.success(result)
  }
  @get('/getReferPicsByTaskPoint')
  async getReferPicsByTaskPoint () {
    // 存在taskPointId为空时查询参考图报错,所以增加taskItemId去查参考图,两者都为null时直接返回null
    const taskPointId = this.ctx.query.taskPointId
    const taskItemId = this.ctx.query.taskItemId
    const result = await this.plannedCapture.getReferPicsByTaskPoint(taskPointId, taskItemId)
    this.success(result)
  }
  /**
   * @summary 添加/替换对应检测点参考图
   * @description 添加/替换对应检测点参考图
   * @Router Post /plugins/plannedCapture/addReferPicsByCamera
   * @request body addReferPicsByCameraRequest *body
   * @response 200 addReferPicsByCameraResponse 成功
   */
  @post('/addReferPicsByCamera')
  async addReferPicsByCamera () {

  }

  @post('/uploadReferPic')
  async uploadReferPic () {
    try {
      const stream = await this.ctx.getFileStream()
      const itemId = this.ctx.query.itemId
      const partrolObjId = this.ctx.query.patrolObjId
      await this.plannedCapture.saveRefPic(stream, itemId, partrolObjId)
      this.operateLog(
        'log.moduleId.plannedCapture.displayName',
        'log.objectType.plannedCapture.displayName',
        this.ctx.__('plugins.uploadReferPicOperateLog1'),
        'log.action.save.displayName',
        this.ctx.__('plugins.uploadReferPicOperateLog2'),
        'log.actionMessageId.save_refpic.message',
        1
      )
      this.success({ success: true })
    } catch (error) {
      this.operateLog(
        'log.moduleId.plannedCapture.displayName',
        'log.objectType.plannedCapture.displayName',
        this.ctx.__('plugins.uploadReferPicOperateLog1'),
        'log.action.save.displayName',
        this.ctx.__('plugins.uploadReferPicOperateLog2'),
        'log.actionMessageId.save_refpic.message',
        0
      )
      throw new Exception(error.message, error.code, error.transaction)
    }
  }

  @get('/deletePic')
  async deletePic () {
    try {
      const refPicId = this.ctx.query.refPicId
      await this.plannedCapture.deletePic(refPicId)
      this.operateLog(
        'log.moduleId.plannedCapture.displayName',
        'log.objectType.plannedCapture.displayName',
        this.ctx.__('plugins.deletePicOperateLog1'),
        'log.action.delete.displayName',
        this.ctx.__('plugins.deletePicOperateLog2'),
        'log.actionMessageId.del_refpic.message',
        1
      )
      this.success({ success: true })
    } catch (error) {
      this.operateLog(
        'log.moduleId.plannedCapture.displayName',
        'log.objectType.plannedCapture.displayName',
        this.ctx.__('plugins.deletePicOperateLog1'),
        'log.action.delete.displayName',
        this.ctx.__('plugins.deletePicOperateLog2'),
        'log.actionMessageId.del_refpic.message',
        0
      )
      throw new Exception(error.message, error.code, error.transaction)
    }
  }

  /**
   * @summary 获取抓图结果
   * @description 获取抓图结果
   * @Router Get /plugins/plannedCapture/getCapturedPic
   * @request body getCapturedPicRequest *body
   * @response 200 getCapturedPicResponse 成功
   */
  @get('/getCapturedPic')
  async getCapturedPic () {
    const type = this.ctx.query.type
    if (type === 'xunjian') {
      const taskItemId = this.ctx.query.taskItemId
      const taskPointId = this.ctx.query.taskPointId === 'null' ? null : this.ctx.query.taskPointId
      const res = await this.plannedCapture.getCapturedPicForXunJian(taskItemId, taskPointId)
      this.success(res)
    } else {
      const taskItemId = this.ctx.query.taskItemId
      const taskPointId = this.ctx.query.taskPointId === 'null' ? null : this.ctx.query.taskPointId
      const res = await this.plannedCapture.getCapturedPicForProblem(taskItemId, taskPointId)
      this.success(res)
    }
  }

  @post('/getZhengGaiPic')
  async getZhengGaiPic () {
    this.success(await this.plannedCapture.getZhengGaiPic(this.app.req.body.data))
  }
  /**
   * @summary 设置监测点
   * @description 设置监测点
   * @Router Post /plugins/plannedCapture/setPatrolPoint
   * @request body setPatrolPointRequest *body
   * @response 200 setPatrolPointResponse 成功
   */
  @post('/setPatrolPoint')
  async setPatrolPoint () {

  }
  @get('/preview')
  async preview () {

    const cookies = this.app.req.headers.cookie.split(';')
    let CTGC

    for (const item of cookies) {
      // 去空格后匹配CASTGC，否则当cookie中CASTGC前面有其他内容时，会导致这里多一个空格，进而导致无法匹配CASTGC
      if (item.split('=')[0].replace(/^\s+|\s+$/g, '') === 'CASTGC') {
        CTGC = item.split('=')[1]
      }
    }
    if (!CTGC) {
      this.operateLog(
        'log.moduleId.plannedCapture.displayName',
        'log.objectType.plannedCapture.displayName',
        this.ctx.__('plugins.previewOperateLog1'),
        'log.action.plannedCapture.displayName',
        this.ctx.__('plugins.previewOperateLog2'),
        'log.actionMessageId.camera_playback.message',
        0
      )
      throw Error(this.ctx.__('plugins.CTGCIsNotExist'))
    }
    this.operateLog(
      'log.moduleId.plannedCapture.displayName',
      'log.objectType.plannedCapture.displayName',
      this.ctx.__('plugins.previewOperateLog1'),
      'log.action.plannedCapture.displayName',
      this.ctx.__('plugins.previewOperateLog2'),
      'log.actionMessageId.camera_playback.message',
      1
    )
    this.success(await this.plannedCapture.preview(this.app.req.query.cameraId, CTGC))


  }
  @get('/playback')
  async playback () {
    const cookies = this.app.req.headers.cookie.split(';')
    let CTGC
    for (const item of cookies) {
      if (item.trim().split('=')[0] === 'CASTGC') {
        CTGC = item.split('=')[1]
      }
    }
    if (!CTGC) {
      this.operateLog(
        'log.moduleId.plannedCapture.displayName',
        'log.objectType.plannedCapture.displayName',
        this.ctx.__('plugins.playbackOperateLog1'),
        'log.action.plannedCapture.displayName',
        this.ctx.__('plugins.playbackOperateLog2'),
        'log.actionMessageId.camera_preview.message',
        0
      )
      throw Error(this.ctx.__('plugins.CTGCIsNotExist'))
    }
    this.operateLog(
      'log.moduleId.plannedCapture.displayName',
      'log.objectType.plannedCapture.displayName',
      this.ctx.__('plugins.playbackOperateLog1'),
      'log.action.plannedCapture.displayName',
      this.ctx.__('plugins.playbackOperateLog2'),
      'log.actionMessageId.camera_preview.message',
      1
    )
    this.success(await this.plannedCapture.playBack(this.app.req.query, CTGC))
  }
  @post('/cameraControl')
  async cameraControl () {
    this.success(await this.plannedCapture.cameraControl(this.app.req.body.params))
  }
  @post('/goToPtz')
  async goToPtz () {
    this.success(await this.plannedCapture.goToPtz(this.app.req.body.params))
  }
  @get('/getTaskDetail')
  async getTaskDetail () {
    this.success(await this.plannedCapture.getTaskDetail(this.app.req.query))
  }
  @options('/cameraControl')
  async cameraControlOption () {
    this.app.res._headers = {
      'Access-Control-Allow-Headers': 'content-type',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Max-Age': '1800',
      Allow: 'GET, HEAD, POST, PUT, DELETE, OPTIONS, PATCH'
    }
  }
  @post('/getPTZ')
  async getPTZ () {

    this.success(await this.plannedCapture.getPTZ(this.app.req.body.data.params))
  }
  @post('/capturePicForRefPic')
  async capturePicForRefPic () {

    this.success(await this.plannedCapture.capturePicForRefPic(this.app.req.body.data))
  }
  @get('/getCameraDetail')
  async getCameraDetail () {
    try {
      this.success(await this.plannedCapture.getCameraDetail(this.app.req.query))
      this.operateLog(
        'log.moduleId.plannedCapture.displayName',
        'log.objectType.plannedCapture.displayName',
        this.ctx.__('plugins.getCameraDetailOperateLog1'),
        'log.action.query.displayName',
        this.ctx.__('plugins.getCameraDetailOperateLog2'),
        'log.actionMessageId.camera_detail.message',
        1
      )
    } catch (error) {
      this.operateLog(
        'log.moduleId.plannedCapture.displayName',
        'log.objectType.plannedCapture.displayName',
        this.ctx.__('plugins.getCameraDetailOperateLog1'),
        'log.action.query.displayName',
        this.ctx.__('plugins.getCameraDetailOperateLog2'),
        'log.actionMessageId.camera_detail.message',
        0
      )
      throw new Exception(error.message, error.code, error.transaction)
    }
  }

  @post('/getCameraByRegion')
  async getCameraByRegion () {
    // 设备类型：ai, 可见光, 热成像 待补充
    // const capability = [ '@', '@ai_open_platform', '@', '@' ][this.app.req.body.data.type || 0]
    // this.success(await this.plannedCapture.getCameraByRegion({ ...this.app.req.body.data, capability }))
    this.success(await this.plannedCapture.getCameraByRegion(this.app.req.body.data))
  }
  @post('/savePoint')
  async savePoint () {
    try {
      const ret = []
      for (const key in this.app.req.body.data.point) {
        for (const item of this.app.req.body.data.point[key]) {
          // if (item.orbitalId) {
          //   await this.plannedCapture.savePointWithOrbital(item)
          // } else {
          const result = await this.plannedCapture.savePoint(item)
          if (result === 'duplicate') {
            ret.push(item.cameraName + (item.patrolPointName ? '_' + item.patrolPointName : ''))
          }
          // }
        }
      }
      this.operateLog(
        'log.moduleId.plannedCapture.displayName',
        'log.objectType.plannedCapture.displayName',
        this.ctx.__('plugins.savePointOperateLog1'),
        'log.action.save.displayName',
        this.ctx.__('plugins.savePointOperateLog2'),
        'log.actionMessageId.save_point.message',
        1
      )
      this.success(ret)
    } catch (error) {
      this.operateLog(
        'log.moduleId.plannedCapture.displayName',
        'log.objectType.plannedCapture.displayName',
        this.ctx.__('plugins.savePointOperateLog1'),
        'log.action.save.displayName',
        this.ctx.__('plugins.savePointOperateLog2'),
        'log.actionMessageId.save_point.message',
        0
      )
      throw new Exception(error.message, error.code, error.transaction)
    }
  }
  @get('/getPointTable')
  async getPointTable () {
    try {
      this.success(await this.plannedCapture.getPointTable(this.app.req.query))
      this.operateLog(
        'log.moduleId.plannedCapture.displayName',
        'log.objectType.plannedCapture.displayName',
        this.ctx.__('plugins.getPointTableOperateLog1'),
        'log.action.query.displayName',
        this.ctx.__('plugins.getPointTableOperateLog2'),
        'log.actionMessageId.get_all_point.message',
        1
      )
    } catch (error) {
      this.operateLog(
        'log.moduleId.plannedCapture.displayName',
        'log.objectType.plannedCapture.displayName',
        this.ctx.__('plugins.getPointTableOperateLog1'),
        'log.action.query.displayName',
        this.ctx.__('plugins.getPointTableOperateLog2'),
        'log.actionMessageId.get_all_point.message',
        0
      )
      throw new Exception(error.message, error.code, error.transaction)
    }
  }
  @get('/pointDelete')
  async pointDelete () {
    try {
      this.success(await this.plannedCapture.pointDelete(this.app.req.query))
      this.operateLog(
        'log.moduleId.plannedCapture.displayName',
        'log.objectType.plannedCapture.displayName',
        this.ctx.__('plugins.pointDeleteOperateLog1'),
        'log.action.delete.displayName',
        this.ctx.__('plugins.pointDeleteOperateLog2'),
        'log.actionMessageId.del_point.message',
        1
      )
    } catch (error) {
      this.operateLog(
        'log.moduleId.plannedCapture.displayName',
        'log.objectType.plannedCapture.displayName',
        this.ctx.__('plugins.pointDeleteOperateLog1'),
        'log.action.delete.displayName',
        this.ctx.__('plugins.pointDeleteOperateLog2'),
        'log.actionMessageId.del_point.message',
        0
      )
      throw new Exception(error.message, error.code, error.transaction)
    }
  }
  @post('/pointMove')
  async pointMove () {
    try {
      this.success(await this.plannedCapture.pointMove(this.app.req.body.data))
      this.operateLog(
        'log.moduleId.plannedCapture.displayName',
        'log.objectType.plannedCapture.displayName',
        this.ctx.__('plugins.pointMoveOperateLog1'),
        'log.action.move.displayName',
        this.ctx.__('plugins.pointMoveOperateLog2'),
        'log.actionMessageId.move_point.message',
        1
      )
    } catch (error) {
      this.operateLog(
        'log.moduleId.plannedCapture.displayName',
        'log.objectType.plannedCapture.displayName',
        this.ctx.__('plugins.pointMoveOperateLog1'),
        'log.action.move.displayName',
        this.ctx.__('plugins.pointMoveOperateLog2'),
        'log.actionMessageId.move_point.message',
        0
      )
      throw new Exception(error.message, error.code, error.transaction)
    }
  }

  @post('/urlToBase64')
  async urlToBase64 () {
    this.success(await this.plannedCapture.urlToBase64(this.app.req.body.data))
  }
  @get('/getOrbitalByCamera')
  async getOrbitalByCamera () {
    this.success(await this.plannedCapture.getOrbitalByCamera(this.app.req.query))
  }
  @post('/orbitalControl')
  async orbitalControl () {
    this.success(await this.plannedCapture.orbitalControl(this.app.req.body.data))
  }
  @get('/getOrbitalPosition')
  async getOrbitalPosition () {
    this.success(await this.plannedCapture.getOrbitalPosition(this.app.req.query))
  }
  @post('/savePointWithOrbital')
  async savePointWithOrbital () {
    this.success(await this.plannedCapture.savePointWithOrbital(this.app.req.body.data))
  }
  @post('/saveOrbitalPreset')
  async saveOrbitalPreset () {
    try {
      const res = await this.plannedCapture.saveOrbitalPreset(this.app.req.body.data)
      this.operateLog(
        'log.moduleId.plannedCapture.displayName',
        'log.objectType.plannedCapture.displayName',
        this.ctx.__('plugins.saveOrbitalPresetOperateLog1'),
        'log.action.save.displayName',
        this.ctx.__('plugins.saveOrbitalPresetOperateLog2'),
        'log.actionMessageId.save_orbital_point.message',
        1
      )
      this.success(res.data)
    } catch (error) {
      this.operateLog(
        'log.moduleId.plannedCapture.displayName',
        'log.objectType.plannedCapture.displayName',
        this.ctx.__('plugins.saveOrbitalPresetOperateLog1'),
        'log.action.save.displayName',
        this.ctx.__('plugins.saveOrbitalPresetOperateLog2'),
        'log.actionMessageId.save_orbital_point.message',
        0
      )
      throw new Exception(error.message, error.code, error.transaction)
    }
  }

  @get('/getItemFullPathName')
  async getItemFullPathName () {
    this.success(await this.plannedCapture.getItemFullPathName(this.app.req.query))
  }
  @get('/getItemNameByTaskItem')
  async getItemNameByTaskItem () {
    this.success(await this.plannedCapture.getItemNameByTaskItem(this.app.req.query))
  }
  @get('/getAllRefPic')
  async getAllRefPic () {
    try {
      this.success(await this.plannedCapture.getAllRefPic(this.app.req.query))
      this.operateLog(
        'log.moduleId.plannedCapture.displayName',
        'log.objectType.plannedCapture.displayName',
        this.ctx.__('plugins.getAllRefPicOperateLog1'),
        'log.action.save.displayName',
        this.ctx.__('plugins.getAllRefPicOperateLog2'),
        'log.actionMessageId.get_all_refpics.message',
        1
      )
    } catch (error) {
      this.operateLog(
        'log.moduleId.plannedCapture.displayName',
        'log.objectType.plannedCapture.displayName',
        this.ctx.__('plugins.getAllRefPicOperateLog1'),
        'log.action.save.displayName',
        this.ctx.__('plugins.getAllRefPicOperateLog2'),
        'log.actionMessageId.get_all_refpics.message',
        0
      )
      throw new Exception(error.message, error.code, error.transaction)
    }
  }
  @get('/getMethodNameByMethodId')
  async getMethodNameByMethodId () {
    this.success(await this.plannedCapture.getMethodNameByMethodId(this.app.req.query))
  }

  @get('/getCameraIdByTaskPoint')
  async getCameraIdByTaskPoint () {
    this.success(await this.plannedCapture.getCameraIdByTaskPoint(this.app.req.query))
  }
  @post('/cropperRefPic')
  async cropperRefPic () {
    try {
      this.success(await this.plannedCapture.cropperRefPic(this.app.req.body.data))
      this.operateLog(
        'log.moduleId.plannedCapture.displayName',
        'log.objectType.plannedCapture.displayName',
        this.ctx.__('plugins.cropperRefPicOperateLog1'),
        'log.action.save.displayName',
        this.ctx.__('plugins.cropperRefPicOperateLog2'),
        'log.actionMessageId.save_cropic.message',
        1
      )
    } catch (error) {
      this.operateLog(
        'log.moduleId.plannedCapture.displayName',
        'log.objectType.plannedCapture.displayName',
        this.ctx.__('plugins.cropperRefPicOperateLog1'),
        'log.action.save.displayName',
        this.ctx.__('plugins.cropperRefPicOperateLog2'),
        'log.actionMessageId.save_cropic.message',
        0
      )
      throw new Exception(error.message, error.code, error.transaction)
    }
  }
  @get('/getCameraListByTaskItem')
  async getCameraListByTaskItem () {
    this.success(await this.plannedCapture.getCameraListByTaskItem(this.app.req.query))
  }
}
