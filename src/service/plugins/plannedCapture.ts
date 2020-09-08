'use strict'
import {  Context, inject, provide, Application} from 'midway';
import { 
  IPlannedCaptureServer,
} from '../../app/interface/plugins/plannedCaptureInterface';
const UUID = require('uuid')
const tokenStore = require('../../custom_plugin/egg-hik-consul/app/consul/tokenLocalStorage')
const { Transactional } = require('../../app/core/transactionalDeco')
function bufferToJson (data) {
  return Buffer.isBuffer(data) ? JSON.parse(data.toString()) : {}
}
@provide('plannedCaptureServer')
class PlannedCapture implements IPlannedCaptureServer {
  @inject()
  ctx: Context;
  app: Application;

  @Transactional
  async saveRefPic (fileStream, itemId, patrolObjId):Promise<any> {
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
    // 流的大小判断方式不对
    if (fileStream.readableLength > 1024 * 1024 * 10) {
      throw new Error(this.ctx.__('plugins.picSizeOverTenM'))
    }
    const splitFileName = fileStream.filename.split('.')
    const postfix = splitFileName[splitFileName.length - 1].toLowerCase()
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
          fileName: UUID.v1() + '.' + postfix,
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
    await (this  as  any).query('PlannedCapture', 'setRefPic', [ itemId, patrolObjId, '', picUrl, '' ])
    return 'success'
  }
  @Transactional
  async saveRefPicAynsc (picUrl, itemId, patrolObjId, cameraId, name):Promise<any> {
    console.log('存在临时---saveRefPicAynsc---', picUrl)
    const res = await (this  as  any).query('PlannedCapture', 'getRefPic', [ itemId, patrolObjId ])
    if (res.length >= 9) {
      throw new Error(this.ctx.__('plugins.moreNineCanNotAdd'))
    }
    await (this  as  any).query('PlannedCapture', 'setRefPic', [
      itemId,
      patrolObjId,
      '',
      picUrl,
      '',
      cameraId,
      name
    ])
    return 'success'
  }
  @Transactional
  async getRefPics (itemId, patrolObjId):Promise<any> {
    const { protocol, hostname } = this.ctx
    if (!protocol || !hostname) {
      throw new Error(this.ctx.__('plugins.notUploadHttpTypeOrHost'))
    }
    let refPics = []
    const res = await (this  as  any).query('PlannedCapture', 'getRefPic', [ itemId, patrolObjId ])
    if (res && res.length > 0) {
      // 只截取 数组的前9条记录
      refPics = res.slice(0, 9)
    }
    for (const item of refPics) {
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
  async getReferPicsByTaskPoint (taskPointId, taskItemId):Promise<any> {
    // 存在taskPointId为空时查询参考图报错,所以增加taskItemId去查参考图,两者都为null时直接返回null
    if (!taskPointId && !taskItemId) return []
    if (taskPointId === 'null' && taskItemId === 'null') return []
    let ids = []
    if (taskPointId && taskPointId !== 'null') {
      ids = await (this  as  any).query('PlannedCapture', 'getItemIdAndObjIdByTaskPoint', [ taskPointId ])
    } else {
      ids = await (this  as  any).query('PlannedCapture', 'getItemIdAndObjIdByTaskItemId', [ taskItemId ])
    }
    if (ids.length < 1) return []
    const itemId = ids[0].patrolItemId
    const patrolObjId = ids[0].patrolObjId
    const res = await (this  as  any).query('PlannedCapture', 'getRefPic', [ itemId, patrolObjId ])
    const { protocol, hostname } = this.ctx
    if (!protocol || !hostname) {
      throw new Error(this.ctx.__('plugins.notUploadHttpTypeOrHost'))
    }
    for (const item of res) {
      const realUrl = await this.ctx.service.common.getImageUrlForBS(
        item.refPicUrl,
        (this  as  any).transaction
      )
      item.src = realUrl
    }
    return res
  }

  @Transactional
  async getRefPicsBytaskItemId (taskItemId):Promise<any> {
    const ids = await (this  as  any).query('PlannedCapture', 'getItemIdAndObjId', [ taskItemId ])
    const itemId = ids[0].patrolItemId
    const patrolObjId = ids[0].patrolObjId
    const { protocol, hostname } = this.ctx
    if (!protocol || !hostname) {
      throw new Error(this.ctx.__('plugins.notUploadHttpTypeOrHost'))
    }
    const res = await (this  as  any).query('PlannedCapture', 'getRefPic', [ itemId, patrolObjId ])
    for (const item of res) {
      const realUrl = await this.ctx.service.common.getImageUrlForBS(
        item.refPicUrl,
        (this  as  any).transaction
      )
      item.src = realUrl
    }
    return res
  }
  @Transactional
  async deletePic (refPicId):Promise<any> {
    await (this  as  any).query('PlannedCapture', 'deletePic', [ refPicId ])
    return 'success'
  }
  @Transactional
  async getCapturedPicForXunJian (taskItemId, taskPointId):Promise<any> {
    let res
    if (!taskPointId) {
      console.log('taskItemIdtaskItemIdtaskItemId', taskItemId)
      res = await (this  as  any).query('PlannedCapture', 'getCapturedPicByItemId', [ taskItemId ])
      console.log('PlannedCapturePlannedCapturePlannedCapturePlannedCapture', res)
    } else {
      res = await (this  as  any).query('PlannedCapture', 'getCapturedPicByPointId', [ taskPointId ])
    }
    for (const item of res) {
      if (item.picUrl) {
        console.log('item.picUrlitem.picUrlitem.picUrlitem.picUrl', item.picUrl)
        const picIds = item.picUrl ? item.picUrl.split(',') : null
        if (picIds && picIds[0]) {
          const realUrl = await this.ctx.service.common.getImageUrlForBS(picIds[0], (this  as  any).transaction)
          console.log('realUrlrealUrlrealUrlrealUrl', realUrl)
          item.picUrl = realUrl.picUrl
          item.captureTime = realUrl.createTime
        } else item.picUrl = null
        // const realUrl = await this.ctx.service.common.getImageUrlForBS(item.picUrl, (this  as  any).transaction)
        // item.picUrl = realUrl.picUrl
        // item.captureTime = realUrl.createTime
      } else {
        item.picUrl = null
        // item.captureTime = realUrl.createTime
      }
      if (item.cameraId) {
        const result = await this.ctx.service.camera.getCameraDetail(item.cameraId, (this  as  any).transaction)
        item.cameraName = result.data.data.list && result.data.data.list[0] && result.data.data.list[0].camera_name
      }
    }
    return res
  }
  @Transactional
  async getCapturedPicForProblem (taskItemId, taskPointId):Promise<any> {
    const res = await (this  as  any).query('PlannedCapture', 'getProblemPicByTaskPointItem', [
      taskItemId,
      taskPointId
    ])
    const result = []
    if (res[0].picUrls) {
      const picUrls = res[0].picUrls.split(',')
      for (const item of picUrls) {
        if (item !== '') {
          const realUrl = await this.ctx.service.common.getImageUrlForBS(item, (this  as  any).transaction)
          result.push({
            picUrl: realUrl.picUrl,
            cameraId: realUrl.cameraId,
            captureTime: realUrl.createTime
          })
        }
      }
    }
    return result
  }
  @Transactional
  async getShenHePic (params):Promise<any> {
    const res = await (this  as  any).query('PlannedCapture', 'getShenHePic', [
      params.taskItemId,
      params.taskPointId
    ])
    if (res.length === 0) {
      return await this.ctx.service.plugins.plannedCapture.getCapturedPicForProblem(
        params.taskItemId,
        params.taskPointId,
        (this  as  any).transaction
      )
    }
    const picArray = res[0].picUrl.split(',')
    console.log('------------dddddresssssss----------', picArray)
    const result = []
    for (const pic of picArray) {
      result.push(await this.ctx.service.common.getImageUrlForBS(pic, (this  as  any).transaction))
    }
    return result
  }
  @Transactional
  async playBack (param, CTGC):Promise<any> {
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
  async preview (cameraid, CTGT):Promise<any> {
    return await this.ctx.service.camera.preview(cameraid, CTGT, (this  as  any).transaction)
  }
  @Transactional
  async cameraControl (params):Promise<any> {
    return await this.ctx.service.camera.ptzds(params, 'PTZControl', (this  as  any).transaction)
  }
  @Transactional
  async goToPtz (params):Promise<any> {
    return await this.ctx.service.camera.ptzds(params, 'SetPtzPos', (this  as  any).transaction)
  }
  @Transactional
  async getTaskDetail (params):Promise<any> {
    return await this.ctx.service.camera.getTaskDetail(params.taskId)
  }
  @Transactional
  async getPTZ (params):Promise<any> {
    return await this.ctx.service.camera.dacTrans(params, 'GetPtzPos', (this  as  any).transaction)
  }
  @Transactional
  async capturePicForRefPic (params):Promise<any> {
    const base64Pic = params.base64Pic
    const patrolObjId = params.patrolObjId
    const patrolPointId = params.patrolPointId
    const itemId = params.itemId
    let fileBuffer
    if (/^data:image\/.*;base64,.*/.test(base64Pic)) {
      fileBuffer = Buffer.from(base64Pic.split(';base64,')[1], 'base64')
    } else {
      fileBuffer = Buffer.from(base64Pic, 'base64')
    }

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
      }
    )
    this.app.resDataTrans(res)
    if (res.data.code !== '0') {
      throw Error(this.ctx.__('plugins.picSystemError') + res.data.msg)
    }

    const picUrl = res.data.data
    if (params.recapturingPic) {
      await (this  as  any).query('PlannedCapture', 'updateRefPic', [ params.recapturingPic, picUrl ])
    } else {
      await (this  as  any).query('PlannedCapture', 'setRefPic', [
        itemId,
        patrolObjId,
        patrolPointId,
        picUrl,
        '',
        params.cameraId,
        params.name
      ])
    }

    return 'success'
  }
  @Transactional
  async getCameraDetail (params):Promise<any> {
    return await this.ctx.service.camera.getCameraDetail(params.cameraId, (this  as  any).transaction)
  }
  @Transactional
  async getCameraByRegion (params):Promise<any> {
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
      regionIds = [ params.regionId ]
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
            { fieldName: 'capability', fieldValue: params.capability || '@', type: 'like' }
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
              { fieldName: 'capability', fieldValue: params.capability || '@', type: 'like' }
            ]
          }
        }
      )
      this.app.resDataTrans(resultChi)
      result.data.data.list = result.data.data.list.concat(resultChi.data.data.list)
    }
    // 可见光与红外筛选
    // if (result.data.data.list.length > 0) {
    //   result.data.data.list = result.data.data.list.filter(res => {
    //     return !res.capability.includes('event_heat')
    //   })
    //   result.data.data.total = result.data.data.list.length
    // }
    return result
  }
  @Transactional
  async savePoint (params):Promise<any> {
    const dupResult = await (this  as  any).query('PlannedCapture', 'checkNameDuplication', [
      params.patrolObjId,
      params.patrolItemId,
      params.cameraId,
      params.patrolPointName,
      params.methodId
    ])
    if (dupResult.length >= 1) {
      return 'duplicate'
    }
    let sort = 1
    const maxSort = await (this  as  any).query('PlannedCapture', 'maxSort', [
      params.patrolItemId,
      params.patrolObjId
    ])

    if (maxSort[0].sort) {
      sort = maxSort[0].sort + 1
    }
    // const res = await this.ctx.service.camera.setPresetToOrbitalWithOrms(
    //   params.orbitalId,
    //   params.orbitalPreset,
    //   (this  as  any).transaction
    // )
    // if (res.data.code !== '0') {
    //   throw new Error('向orms设置轨道机预置位失败 orbitalId' + params.orbitalId + 'orbitalPreset:' + params.orbitalPreset)
    // }
    // const orbitalPresetid = res.data.data.id
    await (this  as  any).query('PlannedCapture', 'savePoint', [
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
  async getPointTable (params):Promise<any> {
    const res = await (this  as  any).query('PlannedCapture', 'getPointTable', [
      params.patrolItemId,
      params.patrolObjId,
      params.methodId
    ])
    return res
  }
  @Transactional
  async pointDelete (params):Promise<any> {
    const res = await (this  as  any).query('PlannedCapture', 'pointDelete', [ params.patrolPointId ])

    return res
  }
  @Transactional
  async pointMove (params):Promise<any> {
    let closestRecord
    if (params.direction === 'up') {
      closestRecord = await (this  as  any).query('PlannedCapture', 'getLowerClosest', [
        params.pointOrder,
        params.patrolItemId,
        params.patrolObjId
      ])
    } else {
      closestRecord = await (this  as  any).query('PlannedCapture', 'getUpperClosest', [
        params.pointOrder,
        params.patrolItemId,
        params.patrolObjId
      ])
    }
    if (closestRecord.length === 0) {
      return 'success'
    }
    await (this  as  any).query('PlannedCapture', 'updateOrder', [
      closestRecord[0].patrolPointId,
      params.pointOrder
    ])
    await (this  as  any).query('PlannedCapture', 'updateOrder', [
      params.patrolPointId,
      closestRecord[0].pointOrder
    ])
    return 'success'
  }

  @Transactional
  async urlToBase64 (params):Promise<any> {
    return await this.ctx.service.picture.urlToBase64(params.url, (this  as  any).transaction)
  }
  @Transactional
  async getZhengGaiPic (params):Promise<any> {
    const res = await (this  as  any).query('PlannedCapture', 'getZhengGaiPic', [
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
  async getOrbitalByCamera (params):Promise<any> {
    return await this.ctx.service.camera.getOrbitalByCamera(params.cameraId, (this  as  any).transaction)
  }
  @Transactional
  async orbitalControl (params):Promise<any> {
    return await this.ctx.service.camera.ptzds(params, 'OrbitalControl', (this  as  any).transaction)
  }
  @Transactional
  async getOrbitalPosition (params):Promise<any> {
    return await (this  as  any).query('PlannedCapture', 'getOrbitalPosition', [ params.orbitalId ])
    // return await this.ctx.service.camera.getOrbitalPosition(params.orbitalId, (this  as  any).transaction)
  }
  @Transactional
  async savePointWithOrbital (params):Promise<any> {
    let sort = 1
    const maxSort = await (this  as  any).query('PlannedCapture', 'maxSort', [
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

    await (this  as  any).query('PlannedCapture', 'savePointWithOrbital', [
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
  async saveOrbitalPreset (params):Promise<any> {
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
  async getItemFullPathName (params):Promise<any> {
    const res = await (this  as  any).query('PlannedCapture', 'getItemFullPathName', [ params.itemId ])
    return res
  }
  @Transactional
  async getItemNameByTaskItem (params):Promise<any> {
    const res = await (this  as  any).query('PlannedCapture', 'getItemNameByTaskItem', [ params.taskItemId ])
    return res
  }
  @Transactional
  async getAllRefPic (params):Promise<any> {
    this.app.temp_plannedCapture_refPicTask = []
    this.app.plannedCapture_refPicTask = []
    this.app.refStatus = 0
    const res = await (this  as  any).query('PlannedCapture', 'getPointTable', [
      params.patrolItemId,
      params.patrolObjId,
      params.methodId
    ])
    for (const point of res) {
      const cameraId = point.cameraId
      const orbitalId = point.orbitalId
      const command = []
      const orbitalPreset = point.trackParams
      console.log('pointpointpoint++++++++++++++++', point)
      if (point.cameraPtz) {
        const cameraPTZ = JSON.parse(point.cameraPtz)
        command.push({
          ability: 'ptz',
          commandCode: 'SetPtzPos',
          commandParam: {
            channelIndexCode: cameraId,
            panPos: cameraPTZ.panPos,
            tiltPos: cameraPTZ.tiltPos,
            zoomPos: cameraPTZ.zoomPos,
            focus: cameraPTZ.focus,
            horizontalSpeed: 50,
            verticalSpeed: 50
          },
          order: 0
        })
      }
      if (orbitalId) {
        command.push({
          ability: 'ptz',
          commandCode: 'OrbitalPreset',
          commandParam: {
            orbitalIndexCode: orbitalId,
            orbitalPresetIndex: Number(orbitalPreset)
          },
          order: 0
        })
      }
      command.push({
        ability: 'vss',
        commandCode: 'CapturePicture',
        commandParam: { channelIndexCode: cameraId },
        order: command.length ? 1 : 0
      })

      const ptzds = await this.ctx.consulCurl(
        '/api/ptzTask/v1/manage/push',
        'ptzds',
        'ptzds-manager',
        {
          method: 'POST',
          useHttp: true,
          headers: {
            Token: tokenStore.getItem('Token').Token,
            'content-type': 'application/json'
          },
          data: {
            businessCode: 'patrolengine',
            businessPriority: 100,
            channelIndexCode: orbitalId ? orbitalId : cameraId,
            commands: command,
            needDispatch: true,
            pushTime: this.app.dateFormatter(new Date(), 'yyyy-MM-dd hh:mm:ss')
          }
        }
      )

      this.app.resDataTrans(ptzds)
      if (res.length > 0) {
        console.log('res.lengt))))))))))))))))))))))h', res)
      }
      console.log('ptzdsptzdsptzdsptzdsptzds', ptzds.data.data)
      if (this.app.plannedCapture_refPicTask) {
        this.app.plannedCapture_refPicTask.push({
          itemId: params.patrolItemId,
          patrolObjId: params.patrolObjId,
          taskId: ptzds.data.data.taskId,
          appId: this.ctx.headers.appid,
          cameraId,
          name: point.cameraName
        })
      } else {
        this.app.plannedCapture_refPicTask = [
          {
            itemId: params.patrolItemId,
            patrolObjId: params.patrolObjId,
            taskId: ptzds.data.data.taskId,
            appid: this.ctx.headers.appid,
            cameraId,
            name: point.cameraName
          }
        ]
      }
    }
  }
  @Transactional
  async getMethodNameByMethodId (params):Promise<any> {
    return (this  as  any).query('PlannedCapture', 'getMethodNameByMethodId', [ params.methodId ])
  }
  @Transactional
  async getCameraIdByTaskPoint (params):Promise<any> {
    return (this  as  any).query('PlannedCapture', 'getCameraIdByTaskPoint', [ params.taskPointId ])
  }
  @Transactional
  async cropperRefPic (params):Promise<any> {
    const base64Pic = params.base64Pic
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
    return (this  as  any).query('PlannedCapture', 'cropperRefPic', [ params.refPicId, picUrl ])
  }
  @Transactional
  async getCameraListByTaskItem (params):Promise<any> {
    return (this  as  any).query('PlannedCapture', 'getCameraListByTaskItem', [ params.taskItemId ])
  }
}

module.exports = PlannedCapture
