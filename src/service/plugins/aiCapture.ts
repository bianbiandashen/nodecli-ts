
'use strict'
const UUID = require('uuid')
import {  Context, inject, provide, Application} from 'midway';
import { 
  IAiCapture,
 } from '../../app/interface/plugins/aiCaptureInterface';
// const FormStream = require('formstream')
// const Service = require('egg').Service
// const tokenStore = require('../../../custom_plugin/egg-hik-consul/app/consul/tokenLocalStorage')
// const constants = require('constants')
// const hikidentify = require('../../../hikidentify/hikidentify/index.js')
const { Transactional } = require('../../app/core/transactionalDeco')
function bufferToJson(data) {
  return Buffer.isBuffer(data) ? JSON.parse(data.toString()) : {}
}
@provide('aiCapture')
export class AiCapture implements IAiCapture {
  @inject()
  ctx: Context;
  app: Application;

  @Transactional
  async saveRefPic(fileStream, itemId, patrolObjId):Promise<any> {
    // const form = new FormStream()
    // form.stream('file', fileStream, UUID.v1() + '.jpg', 'multipart/form-data')
    // const res = await this.app.curl('http://10.15.66.13:8088/patrolengine-engine/api/v1/asw/upload', {
    //   method: 'POST',
    //   stream: form,
    //   headers: {
    //     'content-type': 'multipart/form-data;boundary=' + form._boundary
    //   },
    //   dataType: 'json'
    // })
    if (fileStream.readableLength > 1024 * 1024 * 10) {
      throw new Error(this.ctx.__('plugins.picSizeOverTenM'))
    }
    const postfix = fileStream.filename.split('.')[1].toLowerCase()
    if (postfix !== 'jpg' && postfix !== 'png' && postfix !== 'bmp') {
      throw new Error(this.ctx.__('plugins.uploadFormat'))
    }
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
    await (this  as  any).query('AiCapture', 'setRefPic', [itemId, patrolObjId, '', picUrl, ''])
    return 'success'
  }
  @Transactional
  async getRefPics(itemId, patrolObjId):Promise<any> {
    const { protocol, hostname } = this.ctx
    if (!protocol || !hostname) {
      throw new Error(this.ctx.__('plugins.notUploadHttpTypeOrHost'))
    }
    const res = await (this  as  any).query('AiCapture', 'getRefPic', [itemId, patrolObjId])
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
      // const asginPicUrl = '/pic?' + realUrl.data.data.split('/pic?')[1]
      const asginPicUrl = realUrl.data.data
      item.src = asginPicUrl
    }
    return res
  }
  @Transactional
  async getRefPicsBytaskItemId(taskItemId):Promise<any> {
    const ids = await (this  as  any).query('AiCapture', 'getItemIdAndObjId', [taskItemId])
    const itemId = ids[0].patrolItemId
    const patrolObjId = ids[0].patrolObjId
    const { protocol, hostname } = this.ctx
    if (!protocol || !hostname) {
      throw new Error(this.ctx.__('plugins.notUploadHttpTypeOrHost'))
    }
    const res = await (this  as  any).query('AiCapture', 'getRefPic', [itemId, patrolObjId])
    for (const item of res) {
      const realUrl = await this.ctx.consulCurl(
        '/patrolengine-engine/api/v1/asw/sign',
        'patrolengine',
        '/patrolengine-engine',
        {
          method: 'POST',
          dataType: 'json',
          data: {
            picUrl: '/pic' + item.refPicUrl.split('/pic')[1],
            httpType: protocol,
            host: hostname
          },
          useHttp: true
        }
      )
      item.src = realUrl.data.data
    }
    return res
  }
  @Transactional
  async deletePic(refPicId):Promise<any> {
    await (this  as  any).query('AiCapture', 'deletePic', [refPicId])
    return 'success'
  }
  @Transactional
  async getCapturedPicForXunJian(taskItemId, taskPointId):Promise<any> {
    let res
    if (!taskPointId) {
      res = await (this  as  any).query('AiCapture', 'getCapturedPicByItemId', [taskItemId])
    } else {
      res = await (this  as  any).query('AiCapture', 'getCapturedPicByPointId', [taskPointId])
    }
    for (const item of res) {
      const realUrl = await this.ctx.service.common.getImageUrlForBS(item.picUrl, (this  as  any).transaction)
      item.picUrl = realUrl.picUrl
      item.cameraId = realUrl.cameraId
      item.captureTime = realUrl.createTime
    }

    return res
  }
  @Transactional
  async getCapturedPicForProblem(taskItemId, taskPointId):Promise<any> {
    const res = await (this  as  any).query('AiCapture', 'getProblemPicByTaskPointItem', [
      taskItemId,
      taskPointId
    ])
    const result = []
    const picUrls = res[0].picUrls.split(',')
    for (const item of picUrls) {
      const realUrl = await this.ctx.service.common.getImageUrlForBS(item, (this  as  any).transaction)
      result.push({
        picUrl: realUrl.picUrl,
        cameraId: realUrl.cameraId,
        captureTime: realUrl.createTime
      })
    }
    return result
  }
  @Transactional
  async playBack(param, CTGC):Promise<any> {
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
  async getCameraDetail(params):Promise<any> {
    console.log('parammarmamr', params)
    return await this.ctx.service.camera.getCameraDetail(params.cameraId, (this  as  any).transaction)
  }
  @Transactional
  async preview(cameraid, CTGT):Promise<any> {
    return await this.ctx.service.camera.preview(cameraid, CTGT, (this  as  any).transaction)
  }
  @Transactional
  async cameraControl(params):Promise<any> {
    return await this.ctx.service.camera.ptzds(params, 'PTZControl', (this  as  any).transaction)
  }
  @Transactional
  async getPTZ(params):Promise<any> {
    return await this.ctx.service.camera.dacTrans(params, 'GetPtzPos', (this  as  any).transaction)
  }
  @Transactional
  async capturePicForRefPic(params):Promise<any> {
    const base64Pic = params.base64Pic
    const patrolObjId = params.patrolObjId
    const itemId = params.itemId
    const fileBuffer = new Buffer(base64Pic, 'base64')

    // const form = new FormStream()
    // form.buffer('file', dataBuffer, UUID.v1() + '.jpg', 'multipart/form-data')
    // const res = await this.app.curl('http://10.15.66.13:8088/patrolengine-engine/api/v1/asw/upload', {
    //   method: 'POST',
    //   stream: form,
    //   headers: {
    //     'content-type': 'multipart/form-data;boundary=' + form._boundary
    //   },
    //   dataType: 'json'
    // })

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
    if (params.recapturingPic) {
      await (this  as  any).query('AiCapture', 'updateRefPic', [params.recapturingPic, picUrl])
    } else {
      await (this  as  any).query('AiCapture', 'setRefPic', [
        itemId,
        patrolObjId,
        '',
        picUrl,
        '',
        params.cameraId,
        params.name
      ])
    }
    return 'success'
  }
  @Transactional
  async getCameraByRegion(params):Promise<any> {
    // const result = await this.ctx.consulCurl(
    //   '/pdms/api/v1/model/tb_camera/records',
    //   'pdms',
    //   'pdmsweb',
    //   {
    //     method: 'POST',
    //     data: {
    //       pageNo: params.pageNo || 1,
    //       pageSize: params.pageSize || 1000,
    //       fields:
    //         'camera_name,region_id,device_id,camera_id,treaty_type,decode_tag,camera_type,channel_no,channel_type',
    //       filedOptions: [
    //         {
    //           fieldName: 'region_id',
    //           fieldValue: params.regionId,
    //           type: 'eq'
    //         },
    //         { fieldName: 'capability', fieldValue: '@ai_open_platform', type: 'like' }
    //       ]
    //     }
    //   }
    // )
    // this.app.resDataTrans(result)
    // return result

    const page = {
      pageNo: 1,
      pageSize: 1000
    }
    let regionIds = []
    let minData = []
    if (params.checkedBoolean) {
      // 包含下级区域
      const midResult = await this.ctx.consulCurl(
        '/pdms/api/v1/model/tb_region/records',
        'pdms',
        'pdmsweb',
        {
          method: 'POST',
          data: {
            pageNo: page.pageNo,
            pageSize: page.pageSize,
            fields: 'region_id,region_path',
            filedOptions: [
              {
                fieldName: 'region_path',
                fieldValue: params.regionId,
                type: 'like'
              }
            ]
          }
        }
      )
      minData = bufferToJson(midResult.data).data.list.map(res => res.region_id)
      const total = bufferToJson(midResult.data).data.total
      const length = Math.ceil(total / page.pageSize)
      // 循环查询区域
      for (let i = 1; i < length; i++) {
        const midResult = await this.ctx.consulCurl(
          '/pdms/api/v1/model/tb_region/records',
          'pdms',
          'pdmsweb',
          {
            method: 'POST',
            data: {
              pageNo: i + 1,
              pageSize: page.pageSize,
              fields: 'region_id',
              filedOptions: [
                {
                  fieldName: 'region_path',
                  fieldValue: params.regionId,
                  type: 'like'
                }
              ]
            }
          }
        )
        minData = minData.concat(bufferToJson(midResult.data).data.list.map(res => res.region_id))
      }
      regionIds = minData
    } else {
      regionIds = [params.regionId]
    }
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_camera/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo: page.pageNo,
          pageSize: page.pageSize,
          fields:
            'camera_name,region_id,capability,device_id,camera_id,treaty_type,decode_tag,camera_type,channel_no,channel_type',
          filedOptions: [
            {
              fieldName: 'region_id',
              fieldValue: regionIds.join(),
              type: 'in'
            },
            // { fieldName: 'capability', fieldValue: '@ai_open_platform', type: 'like' }
          ]
        }
      }
    )
    this.app.resDataTrans(result)
    const resultTotal = result.data.data.total
    const resultLength = Math.ceil(resultTotal / page.pageSize)
    for (let i = 1; i < resultLength; i++) {
      const resultChi = await this.ctx.consulCurl(
        '/pdms/api/v1/model/tb_camera/records',
        'pdms',
        'pdmsweb',
        {
          method: 'POST',
          data: {
            pageNo: i + 1,
            pageSize: page.pageSize,
            fields:
              'camera_name,region_id,capability,device_id,camera_id,treaty_type,decode_tag,camera_type,channel_no,channel_type',
            filedOptions: [
              {
                fieldName: 'region_id',
                fieldValue: regionIds.join(),
                type: 'in'
              },
              // { fieldName: 'capability', fieldValue: '@ai_open_platform', type: 'like' }
            ]
          }
        }
      )
      this.app.resDataTrans(resultChi)
      result.data.data.list = result.data.data.list.concat(resultChi.data.data.list)
    }
    return result
  }
  @Transactional
  async savePoint(params, patrolItemId, patrolObjId, methodId):Promise<any> {
    let sort = 1
    const maxSort = await (this  as  any).query('AiCapture', 'maxSort', [patrolItemId, patrolObjId])

    if (maxSort[0].sort) {
      sort = maxSort[0].sort + 1
    }
    // const res = await this.ctx.service.camera.setPresetToOrbitalWithOrms(
    //   params.orbitalId,
    //   params.orbitalPreset,
    //   (this  as  any).transaction
    // )
    const exist = await (this  as  any).query('AiCapture', 'getAIPointByCameraId', [
      params.camera_id,
      methodId,
      patrolItemId,
      patrolObjId
    ])
    if (exist.length > 0) {
      throw new Error(this.ctx.__('plugins.alreadyCamera') + params.camera_name)
    }
    await (this  as  any).query('AiCapture', 'savePoint', [
      patrolItemId,
      params.camera_name,
      params.camera_id,
      params.device_id,
      patrolObjId,
      methodId,
      sort,
      null,
      params.camera_name,
      params.orbitalId,
      params.orbitalPreset
    ])
    return 'success'
  }
  @Transactional
  async getPointTable(params):Promise<any> {
    const res = await (this  as  any).query('AiCapture', 'getPointTable', [
      params.patrolItemId,
      params.patrolObjId,
      params.methodId
    ])
    return res
  }
  @Transactional
  async pointDelete(params):Promise<any> {
    const res = await (this  as  any).query('AiCapture', 'pointDelete', [params.patrolPointId])

    return res
  }
  @Transactional
  async pointMove(params):Promise<any> {
    let closestRecord
    if (params.direction === 'up') {
      closestRecord = await (this  as  any).query('AiCapture', 'getLowerClosest', [
        params.pointOrder,
        params.patrolItemId,
        params.patrolObjId
      ])
    } else {
      closestRecord = await (this  as  any).query('AiCapture', 'getUpperClosest', [
        params.pointOrder,
        params.patrolItemId,
        params.patrolObjId
      ])
    }
    if (closestRecord.length === 0) {
      return 'success'
    }
    await (this  as  any).query('AiCapture', 'updateOrder', [
      closestRecord[0].patrolPointId,
      params.pointOrder
    ])
    await (this  as  any).query('AiCapture', 'updateOrder', [
      params.patrolPointId,
      closestRecord[0].pointOrder
    ])
    return 'success'
  }

  @Transactional
  async urlToBase64(params):Promise<any> {
    return await this.ctx.service.picture.urlToBase64(params.url, (this  as  any).transaction)
  }
  @Transactional
  async getZhengGaiPic(params):Promise<any> {
    const res = await (this  as  any).query('AiCapture', 'getZhengGaiPic', [
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
  async getOrbitalByCamera(params):Promise<any> {
    return await this.ctx.service.camera.getOrbitalByCamera(params.cameraId, (this  as  any).transaction)
  }
  @Transactional
  async orbitalControl(params):Promise<any> {
    return await this.ctx.service.camera.ptzds(params, 'OrbitalControl', (this  as  any).transaction)
  }
  @Transactional
  async getOrbitalPosition(params):Promise<any> {
    return await (this  as  any).query('AiCapture', 'getOrbitalPosition', [params.orbitalId])
    // return await this.ctx.service.camera.getOrbitalPosition(params.orbitalId, (this  as  any).transaction)
  }
  @Transactional
  async savePointWithOrbital(params):Promise<any> {
    let sort = 1
    const maxSort = await (this  as  any).query('AiCapture', 'maxSort', [
      params.patrolItemId,
      params.patrolObjId
    ])

    if (maxSort[0].sort) {
      sort = maxSort[0].sort + 1
    }

    // const presetRes = await this.ctx.service.camera.setPresetToOrbital(params.orbitalId, params.orbitalPreset, (this  as  any).transaction)
    // if (presetRes.data.code !== '0') {
    //   throw Error('预置位设置失败')
    // }

    await (this  as  any).query('AiCapture', 'savePointWithOrbital', [
      params.patrolItemId,
      params.patrolPointName,
      params.cameraId,
      params.deviceId,
      params.patrolObjId,
      params.methodId,
      sort,
      params.ptz,
      params.cameraName,
      params.orbitalId,
      params.orbitalPreset
    ])
    return 'success'
  }
  @Transactional
  async saveOrbitalPreset(params):Promise<any> {
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
  async getItemFullPathName(params):Promise<any> {
    const res = await (this  as  any).query('AiCapture', 'getItemFullPathName', [params.itemId])
    return res
  }
  @Transactional
  async getItemNameByTaskItem(params):Promise<any> {
    const res = await (this  as  any).query('AiCapture', 'getItemNameByTaskItem', [params.taskItemId])
    return res
  }
  @Transactional
  async getMethodNameByMethodId(params):Promise<any> {
    return (this  as  any).query('AiCapture', 'getMethodNameByMethodId', [params.methodId])
  }
}
