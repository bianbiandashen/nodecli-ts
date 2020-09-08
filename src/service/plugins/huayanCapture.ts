'use strict'
import {  Context, inject, provide, Application} from 'midway';
import { 
  IHuayanCapture,
} from '../../app/interface/plugins/huayanCaptureInterface';
const UUID = require('uuid')
const { Transactional } = require('../../app/core/transactionalDeco')
@provide('donghuanService')
export class HuayanCapture implements IHuayanCapture {
  @inject()
  ctx: Context;
  app: Application;
  
  @Transactional
  async saveRefPic(fileStream, itemId, patrolObjId): Promise<any> {
    const res = await this.ctx.consulCurl(
      '/patrolengine-engine/api/v1/asw/upload',
      'patrolengine',
      'patrolengine-engine',
      {
        useHttp: true,
        method: 'POST',
        file: {
          name: 'file',
          fileStream,
          fileName: UUID.v1() + '.jpg',
          type: 'stream'
        }
        // dataType: 'json'
      }
    )
    this.app.resDataTrans(res)
    if (res.data.code !== '0') {
      throw Error(this.ctx.__('plugins.picSystemError') + res.data.msg)
    }
    const picUrl = res.data.data
    await (this  as  any).query('HuayanCapture', 'setRefPic', [itemId, patrolObjId, '', picUrl, ''])
    return 'success'
  }
  @Transactional
  async getRefPics(itemId, patrolObjId): Promise<any> {
    const { protocol, hostname } = this.ctx
    if (!protocol || !hostname) {
      throw new Error(this.ctx.__('plugins.notUploadHttpTypeOrHost'))
    }
    const res = await (this  as  any).query('HuayanCapture', 'getRefPic', [itemId, patrolObjId])
    for (const item of res) {
      const realUrl = await this.ctx.consulCurl(
        '/patrolengine-engine/api/v1/asw/sign?picUrl=' +
          item.refPicUrl +
          '&&httpType=' +
          protocol +
          '&&host=' +
          hostname,
        'patrolengine',
        '/patrolengine-engine',
        {
          method: 'POST',
          data: {
            picUrl: item.refPicUrl,
            httpType: protocol,
            host: hostname
          },
          dataType: 'json',
          useHttp: true
        }
      )
      // const realUrl = await this.ctx.consulCurl('/patrolengine/api/v1/asw/sign?url=' + item.refPicUrl, 'patrolengine', 'patrolengine-app',{
      //   method: 'POST',
      //   dataType: 'json'
      // })
      item.src = realUrl.data.data
    }
    return res
  }
  @Transactional
  async getRefPicsBytaskItemId(taskItemId): Promise<any> {
    const ids = await (this  as  any).query('HuayanCapture', 'getItemIdAndObjId', [taskItemId])
    const itemId = ids[0].patrolItemId
    const patrolObjId = ids[0].patrolObjId
    const { protocol, hostname } = this.ctx
    if (!protocol || !hostname) {
      throw new Error(this.ctx.__('plugins.notUploadHttpTypeOrHost'))
    }
    const res = await (this  as  any).query('HuayanCapture', 'getRefPic', [itemId, patrolObjId])
    for (const item of res) {
      const realUrl = await this.ctx.consulCurl(
        '/patrolengine-engine/api/v1/asw/sign',
        'patrolengine',
        '/patrolengine-engine',
        {
          method: 'POST',
          data: {
            picUrl: '/pic' + item.refPicUrl.split('/pic')[1],
            httpType: protocol,
            host: hostname
          },
          dataType: 'json',
          useHttp: true
        }
      )
      item.src = realUrl.data.data
    }
    return res
  }
  @Transactional
  async deletePic(refPicId): Promise<any> {
    await (this  as  any).query('HuayanCapture', 'deletePic', [refPicId])
    return 'success'
  }
  @Transactional
  async getCapturedPicForXunJian(taskItemId, taskPointId): Promise<any> {
    let res
    if (!taskPointId) {
      res = await (this  as  any).query('HuayanCapture', 'getCapturedPicByItemId', [taskItemId])
    } else {
      res = await (this  as  any).query('HuayanCapture', 'getCapturedPicByPointId', [taskPointId])
    }
    for (const item of res) {
      const realUrl = await this.ctx.service.common.getImageUrlForBS(item.picUrl, (this  as  any).transaction)
      item.picUrl = realUrl.realUrl
      item.cameraId = realUrl.cameraId
      item.captureTime = realUrl.createTime
    }

    return res
  }
  @Transactional
  async getCapturedPicForProblem(taskItemId, taskPointId): Promise<any> {
    const res = await (this  as  any).query('HuayanCapture', 'getProblemPicByTaskPointItem', [
      taskItemId,
      taskPointId
    ])
    for (const item of res) {
      const realUrl = await this.ctx.service.common.getImageUrlForBS(item.picUrls, (this  as  any).transaction)
      item.picUrl = realUrl.realUrl
      item.cameraId = realUrl.cameraId
      item.captureTime = realUrl.createTime
    }
    return res
  }
  @Transactional
  async playBack(param, CTGC): Promise<any> {
    return await this.ctx.service.camera.playBack(
      param.cameraId,
      param.startTime,
      param.endTime,
      CTGC,
      (this  as  any).transaction
    )
    // return await this.ctx.service.camera.dacTrans(transparam, 'SearchCameraRecord')
  }
  @Transactional
  async preview(cameraid, CTGT): Promise<any> {
    return await this.ctx.service.camera.preview(cameraid, CTGT, (this  as  any).transaction)
  }
  @Transactional
  async cameraControl(params): Promise<any> {
    return await this.ctx.service.camera.ptzds(params, 'PTZControl', (this  as  any).transaction)
  }
  @Transactional
  async getPTZ(params): Promise<any> {
    return await this.ctx.service.camera.dacTrans(params, 'GetPtzPos', (this  as  any).transaction)
  }
  @Transactional
  async capturePicForRefPic(params): Promise<any> {
    const base64Pic = params.base64Pic
    const patrolObjId = params.patrolObjId
    const itemId = params.itemId
    const fileBuffer = new Buffer(base64Pic, 'base64')

    const res = await this.ctx.consulCurl(
      '/patrolengine-engine/api/v1/asw/upload',
      'patrolengine',
      'patrolengine-engine',
      {
        useHttp: true,
        method: 'POST',
        file: {
          name: 'file',
          fileBuffer,
          fileName: UUID.v1() + '.jpg',
          type: 'buffer'
        }
        // dataType: 'json'
      }
    )
    this.app.resDataTrans(res)
    if (res.data.code !== '0') {
      throw Error(this.ctx.__('plugins.picSystemError') + res.data.msg)
    }
    const picUrl = res.data.data
    await (this  as  any).query('HuayanCapture', 'setRefPic', [itemId, patrolObjId, '', picUrl, ''])
    return 'success'
  }
  @Transactional
  async getCameraByRegion(params): Promise<any> {
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_camera/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo: params.pageNo || 1,
          pageSize: params.pageSize || 1000,
          fields:
            'camera_name,region_id,device_id,camera_id,treaty_type,decode_tag,camera_type,channel_no,channel_type',
          filedOptions: [
            {
              fieldName: 'region_id',
              fieldValue: params.regionId,
              type: 'eq'
            }
          ]
        }
      }
    )
    this.app.resDataTrans(result)
    return result
  }
  @Transactional
  async savePoint(params): Promise<any> {
    let sort = 1
    const maxSort = await (this  as  any).query('HuayanCapture', 'maxSort', [
      params.patrolItemId,
      params.patrolObjId
    ])

    if (maxSort[0].sort) {
      sort = maxSort[0].sort + 1
    }

    await (this  as  any).query('HuayanCapture', 'savePoint', [
      params.patrolItemId,
      params.patrolPointName,
      params.cameraId,
      params.deviceId,
      params.patrolObjId,
      params.methodId,
      sort,
      params.ptz,
      params.cameraName,
      params.upperLimit,
      params.lowerLimit,
      params.eventType,
      params.orbitalId,
      params.orbitalPreset
    ])
    return 'success'
  }
  @Transactional
  async getPointTable(params): Promise<any> {
    const res = await (this  as  any).query('HuayanCapture', 'getPointTable', [
      params.patrolItemId,
      params.patrolObjId,
      params.methodId
    ])
    return res
  }
  @Transactional
  async pointDelete(params): Promise<any> {
    const res = await (this  as  any).query('HuayanCapture', 'pointDelete', [params.patrolPointId])

    return res
  }
  @Transactional
  async pointMove(params): Promise<any> {
    let closestRecord
    if (params.direction === 'up') {
      closestRecord = await (this  as  any).query('HuayanCapture', 'getLowerClosest', [
        params.pointOrder,
        params.patrolItemId,
        params.patrolObjId
      ])
    } else {
      closestRecord = await (this  as  any).query('HuayanCapture', 'getUpperClosest', [
        params.pointOrder,
        params.patrolItemId,
        params.patrolObjId
      ])
    }
    if (closestRecord.length === 0) {
      return 'success'
    }
    await (this  as  any).query('HuayanCapture', 'updateOrder', [
      closestRecord[0].patrolPointId,
      params.pointOrder
    ])
    await (this  as  any).query('HuayanCapture', 'updateOrder', [
      params.patrolPointId,
      closestRecord[0].pointOrder
    ])
    return 'success'
  }

  @Transactional
  async urlToBase64(params): Promise<any> {
    return await this.ctx.service.picture.urlToBase64(params.url, (this  as  any).transaction)
  }
  @Transactional
  async getZhengGaiPic(params): Promise<any> {
    const res = await (this  as  any).query('HuayanCapture', 'getZhengGaiPic', [
      params.taskPointId,
      params.taskItemId
    ])

    if (res.length === 0) {
      throw Error(
        this.ctx.__('plugins.notFindChangeRecord') + 'taskPointId:' + params.taskPointId + ',taskItemId:' + params.taskItemId
      )
    }
    if (!res[0].picUrl) {
      throw Error(
        this.ctx.__('plugins.changeDataNoPic') + 'taskPointId:' + params.taskPointId + ',taskItemId:' + params.taskItemId
      )
    }
    const picArray = res[0].picUrl.split(',')
    const result = []
    for (const pic of picArray) {
      result.push(await this.ctx.service.common.getImageUrlForBS(pic, (this  as  any).transaction))
    }
    return result
  }
  @Transactional
  async getOrbitalByCamera(params): Promise<any> {
    return await this.ctx.service.camera.getOrbitalByCamera(params.cameraId, (this  as  any).transaction)
  }
  @Transactional
  async orbitalControl(params): Promise<any> {
    return await this.ctx.service.camera.ptzds(params, 'OrbitalControl', (this  as  any).transaction)
  }
  @Transactional
  async getOrbitalPosition(params): Promise<any> {
    return await (this  as  any).query('HuayanCapture', 'getOrbitalPosition', [params.orbitalId])
  }
  @Transactional
  async savePointWithOrbital(params): Promise<any> {
    let sort = 1
    const maxSort = await (this  as  any).query('HuayanCapture', 'maxSort', [
      params.patrolItemId,
      params.patrolObjId
    ])

    if (maxSort[0].sort) {
      sort = maxSort[0].sort + 1
    }

    await (this  as  any).query('HuayanCapture', 'savePointWithOrbital', [
      params.patrolItemId,
      params.patrolPointName,
      params.cameraId,
      params.deviceId,
      params.patrolObjId,
      params.methodId,
      sort,
      params.ptz,
      params.orbitalId,
      params.orbitalPreset,
      params.cameraName,
      params.eventType
    ])
    // const presetRes = await this.ctx.service.camera.setPresetToOrbital(params.orbitalId, params.orbitalPreset, (this  as  any).transaction)
    // if (presetRes.data.code !== '0') {
    //   throw Error('预置位设置失败')
    // }
    return 'success'
  }
  @Transactional
  async saveOrbitalPreset(params): Promise<any> {
    const res = await this.ctx.service.camera.dacTrans(
      {
        channelIndexCode: params.orbitalId,
        priority: '1',
        userId: 'admin',
        presetIndex: Number(params.orbitalPreset)
      },
      'SetPreset',
      'ptz',
      'drv_encodedevice_hikorbitrobot_net',
      params.deviceId,
      (this  as  any).transaction
    )
    return res
  }
  @Transactional
  async getItemFullPathName(params): Promise<any> {
    const res = await (this  as  any).query('HuayanCapture', 'getItemFullPathName', [params.itemId])
    return res
  }
  @Transactional
  async getItemNameByTaskItem(params): Promise<any> {
    const res = await (this  as  any).query('HuayanCapture', 'getItemNameByTaskItem', [params.taskItemId])
    return res
  }
  @Transactional
  async getEventTypeOptions(): Promise<any> {
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/dataDict/child?dictCode=whayer_algorithm&includeDescendantFlag=1',
      'pdms',
      'pdmsweb',
      {
        method: 'GET',
        useHttp: true
      }
    )
    this.app.resDataTrans(result)
    return result.data
  }
  @Transactional
  async updatePointEvent(params): Promise<any> {
    const res = await (this  as  any).query('HuayanCapture', 'updatePointEvent', [
      params.eventType,
      params.upperLimit,
      params.lowerLimit,
      params.patrolPointId
    ])
    return res
  }
  @Transactional
  async getMethodNameByMethodId(params): Promise<any>{
    return (this  as  any).query('HuayanCapture', 'getMethodNameByMethodId', [params.methodId])
  }
}
