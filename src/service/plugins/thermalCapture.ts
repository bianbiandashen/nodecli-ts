'use strict'
import {  Context, inject, provide, Application} from 'midway';
import { 
  IThermalCapture,
} from '../../app/interface/plugins/thermalCaptureInterface';
const UUID = require('uuid')
const tokenStore = require('../../custom_plugin/egg-hik-consul/app/consul/tokenLocalStorage')
// const hikidentify = require('../../hikidentify/index.ts')
const { Transactional } = require('../../app/core/transactionalDeco')
function bufferToJson (data) {
  return Buffer.isBuffer(data) ? JSON.parse(data.toString()) : {}
}
@provide('thermalCapture')
export class ThermalCapture implements IThermalCapture {

  @inject()
  ctx: Context;
  app: Application;
  
  /**
   * mq红外可见光同步功能
   */

  @Transactional
  async thermalPlannedMQ (params, modelType = [], model):Promise<any> {
    // 删除
    const pageNo = 1
    const pageSize = 1000
    if (params.operate === 'delete') {
      for (const type of modelType) {
        for (const obj of params.data.modelDataIds) {
          // 删除设备
          await (this  as  any).query('ThermalCapture', 'mqDeleteModel', [ obj, type, model ])
        }
      }
      // 更新
    } else if (params.operate === 'update') {
      for (const type of modelType) {
        for (const obj of params.data.modelDataIds) {
          // 先查询改了什么
          const result = await this.ctx.consulCurl(
            '/pdms/api/v1/model/tb_camera/records',
            'pdms',
            'pdmsweb',
            {
              method: 'POST',
              data: {
                pageNo,
                pageSize,
                fields: 'camera_name,model_data_id,camera_id',
                filedOptions: [
                  {
                    fieldName: 'model_data_id',
                    fieldValue: obj,
                    type: 'eq'
                  }
                ]
              }
            }
          )
          const data = bufferToJson(result.data)
          const list = data.data.list
          for (const iterator of list) {
            await (this  as  any).query('ThermalCapture', 'mqUpdateModel', [ type, iterator ])
          }
        }
      }
    }
  }
  /**
   * 入参：
   * channelNo：监控点编号
   * 出参：
   * id：预置位uuid
   * channelNo：设备通道号
   * presetNo：预置点编号1-300
   * presetName：已关联的预置点名称
   * eleDeviceId：已关联的电气设备id
   * status：预置点关联状态（0-有效 1-无效）
   * devicePresetName：该预置点在设备上的名称
   * ruleNum：该预置位下测温位数量
   */

  @Transactional
  async presetInfoGetService (params):Promise<any> {
    try {
      const result = await this.ctx.consulCurl(
        '/api/presetService/v1/presetInfo/get?channelNo=' + params.cameraId,
        'itms',
        'itms-handle',
        {
          useHttp: true,
          method: 'GET',
          headers: { 'content-type': 'text/html' }
        }
      )
      console.log('itms-handleitms-handle11', result)
      if (Buffer.isBuffer(result.data)) {
        result.data = JSON.parse(this.app.Utf8ArrayToStr(result.data))
        console.log('result.data result.data result.data ', result.data)
        return result.data
      }
    } catch (error) {
      throw new Error(this.ctx.__('plugins.noItms'))
    }
  }
  /**
   * 入参：
   * channelNo：监控点编号
   * 出参：
   * inUseFlag：是否已经被设置 boolean
   * index：预置点编号 string
   * name：预置点名称 string
   * presetName：已关联的预置点名称 string
   */

  @Transactional
  async allPreSetInfoGetService (params):Promise<any> {
    const result = await this.ctx.consulCurl(
      '/api/presetService/v1/allPreSetInfo/get?channelNo=' + params.cameraId,
      'itms',
      'itms-handle',
      {
        useHttp: true,
        method: 'GET',
        headers: { 'content-type': 'text/html' }
      }
    )
    return this.app.resDataTrans(result)
  }
  @Transactional
  async getAllRefPic (params):Promise<any> {
    const res = await (this  as  any).query('ThermalCapture', 'getPointTable', [
      params.patrolItemId,
      params.patrolObjId,
      params.methodId
    ])
    for (const point of res) {
      const cameraId = point.cameraId
      const orbitalId = point.orbitalId
      const command = []
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
      // if (orbitalId) {
      //   command.push({
      //     ability: 'ptz',
      //     commandCode: 'OrbitalPreset',
      //     commandParam: {
      //       orbitalIndexCode: orbitalId,
      //       orbitalPresetIndex: Number(orbitalPreset)
      //     },
      //     order: 0
      //   })
      // }
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
      if (this.app.thermalCapture_refPicTask) {
        this.app.thermalCapture_refPicTask.push({
          itemId: params.patrolItemId,
          patrolObjId: params.patrolObjId,
          taskId: ptzds.data.data.taskId,
          appId: this.ctx.headers.appid,
          cameraId,
          name: point.cameraName
        })
      } else {
        this.app.thermalCapture_refPicTask = [
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
      console.log('this.app.thermalCapture_refPicTask', this.app.thermalCapture_refPicTask)
    }
  }
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
    await (this  as  any).query('ThermalCapture', 'setRefPic', [ itemId, patrolObjId, '', picUrl, '' ])
    return 'success'
  }
  @Transactional
  async getRefPics (itemId, patrolObjId):Promise<any> {
    const { protocol, hostname } = this.ctx
    if (!protocol || !hostname) {
      throw new Error(this.ctx.__('plugins.notUploadHttpTypeOrHost'))
    }
    const res = await (this  as  any).query('ThermalCapture', 'getRefPic', [ itemId, patrolObjId ])
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
      // const asginPicUrl = '/pic?' + realUrl.data.data.split('/pic?')[1]
      const asginPicUrl = realUrl.data.data
      item.src = asginPicUrl
    }
    return res
  }
  @Transactional
  async getRefPicsBytaskItemId (taskItemId):Promise<any> {
    const ids = await (this  as  any).query('ThermalCapture', 'getItemIdAndObjId', [ taskItemId ])
    const itemId = ids[0].patrolItemId
    const patrolObjId = ids[0].patrolObjId
    const { protocol, hostname } = this.ctx
    if (!protocol || !hostname) {
      throw new Error(this.ctx.__('plugins.notUploadHttpTypeOrHost'))
    }
    const res = await (this  as  any).query('ThermalCapture', 'getRefPic', [ itemId, patrolObjId ])
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
  async deletePic (refPicId):Promise<any> {
    await (this  as  any).query('ThermalCapture', 'deletePic', [ refPicId ])
    return 'success'
  }
  @Transactional
  async saveRefPicAynsc (picUrl, itemId, patrolObjId, cameraId, name):Promise<any> {
    const res = await (this  as  any).query('ThermalCapture', 'getRefPic', [ itemId, patrolObjId ])
    if (res.length >= 9) {
      throw new Error(this.ctx.__('plugins.moreNineCanNotAdd'))
    }
    await (this  as  any).query('ThermalCapture', 'setRefPic', [
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
  async getCapturedPicForXunJian (taskItemId, taskPointId):Promise<any> {
    let res
    if (!taskPointId) {
      res = await (this  as  any).query('ThermalCapture', 'getCapturedPicByItemId', [ taskItemId ])
    } else {
      res = await (this  as  any).query('ThermalCapture', 'getCapturedPicByPointId', [ taskPointId ])
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
  async getCapturedPicForProblem (taskItemId, taskPointId):Promise<any> {
    const res = await (this  as  any).query('ThermalCapture', 'getProblemPicByTaskPointItem', [
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
  async getPTZ (params):Promise<any> {
    return await this.ctx.service.camera.dacTrans(params, 'GetPtzPos', (this  as  any).transaction)
  }
  @Transactional
  async getPresets (params):Promise<any> {
    return await this.ctx.service.camera.dacTrans(params, 'GetPresets', (this  as  any).transaction)
  }
  @Transactional
  async getSavedPresets (params):Promise<any> {
    return await (this  as  any).query('ThermalCapture', 'getSavedPresets', [ params.channelIndexCode ])
  }

  @Transactional
  async capturePicForRefPic (params):Promise<any> {
    const base64Pic = params.base64Pic
    const patrolObjId = params.patrolObjId
    const patrolPointId = params.patrolPointId
    const itemId = params.itemId
    const fileBuffer = Buffer.from(base64Pic, 'base64')
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
    console.log('抓取参考图片不使用涂鸦的情况下的结果', res)
    const picUrl = res.data.data
    await (this  as  any).query('PlannedCapture', 'setRefPic', [
      itemId,
      patrolObjId,
      patrolPointId,
      picUrl,
      '',
      params.cameraId,
      params.name
    ])
    return 'success'
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
            { fieldName: 'capability', fieldValue: params.capability || 'event_heat', type: 'like' }
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
              {
                fieldName: 'capability',
                fieldValue: params.capability || 'event_heat',
                type: 'like'
              }
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
  async savePoint (params, cameraType):Promise<any> {
    if (params.preset || params.preset === 0) {
      // 判断是枪机
      if (cameraType === '0' || cameraType === 0) {
        const realPonits = await this.presetInfoGetService(
          { cameraId: params.cameraId }
        )
        const realPl = realPonits.data.list
        const ponitList = await this.getPointTableAndCameraId(params)
        // 如果有预置位但是 自己本地的 ponit表里没有该camera 对应的预置位 则
        if (realPl.length > 0 && ponitList.length === 0) {
          let sort = 1
          const maxSort = await (this  as  any).query('ThermalCapture', 'maxSort', [
            params.patrolItemId,
            params.patrolObjId
          ])

          if (maxSort[0].sort) {
            sort = maxSort[0].sort + 1
          }
          const presetInfoId = realPl[0].id
          const presetName = realPl[0].presetName || this.ctx.__('plugins.defaultPresetBit')
          // 枪机获取已有的预置位作为添加的预置位
          // 枪机不能有 预置位 cameraprz 的信息
          await (this  as  any).query('ThermalCapture', 'savePoint', [
            params.patrolItemId,
            presetName,
            params.cameraId,
            params.deviceId,
            params.patrolObjId,
            params.methodId,
            sort,
            params.preset,
            // 枪机 不能增加 camera_ptz 无法转动
            null,
            params.cameraName,
            params.orbitalId,
            params.orbitalPreset,
            presetInfoId
          ])
          return 'success'
        } else if (realPl.length > 0 && ponitList.length > 0) {
          // 枪机的 presetNo 要等于1  个人感觉这边完全是为了适配设备
          throw new Error(this.ctx.__('plugins.deviceCanNotAddMorePoint'))
        } else if (realPl.length === 0 && ponitList.length === 0) {
          // 如果有两边都不存在预置位 则
          // 枪机的 presetNo 要等于1  个人感觉这边完全是为了适配设备
          params.preset = 1
          const result = await this.ctx.consulCurl(
            '/api/presetService/v1/preSetInfo/add?channelNo=' +
              params.cameraId +
              '&presetNo=' +
              params.preset +
              '&presetName=' +
              params.patrolPointName +
              '&eleDeviceId=' +
              params.patrolObjId,
            'itms',
            'itms-handle',
            {
              useHttp: true,
              method: 'GET',
              headers: { 'content-type': 'text/html' }
            }
          )
          this.app.resDataTrans(result)
          if (result.data.code !== '0') {
            throw new Error(this.ctx.__('plugins.addPointFailed'))
          }
          const presetInfoId = result.data.data
          let sort = 1
          const maxSort = await (this  as  any).query('ThermalCapture', 'maxSort', [
            params.patrolItemId,
            params.patrolObjId
          ])

          if (maxSort[0].sort) {
            sort = maxSort[0].sort + 1
          }
          console.log('球机的热成像信息+++++++++++++++', params)
          await (this  as  any).query('ThermalCapture', 'savePoint', [
            params.patrolItemId,
            params.patrolPointName,
            params.cameraId,
            params.deviceId,
            params.patrolObjId,
            params.methodId,
            sort,
            params.preset,
            params.ptz,
            params.cameraName,
            params.orbitalId,
            params.orbitalPreset,
            presetInfoId
          ])
          return 'success'
        }
      } else {
        // 球机的情况就 是需要找出已有列表黎 max 的 presetid + 1 不然会预置位冲突的情况出现
        const result = await this.ctx.consulCurl(
          '/api/presetService/v1/preSetInfo/add?channelNo=' +
            params.cameraId +
            '&presetNo=' +
            params.preset +
            '&presetName=' +
            params.patrolPointName +
            '&eleDeviceId=' +
            params.patrolObjId,
          'itms',
          'itms-handle',
          {
            useHttp: true,
            method: 'GET',
            headers: { 'content-type': 'text/html' }
          }
        )
        this.app.resDataTrans(result)
        if (result.data.code !== '0') {
          throw new Error(this.ctx.__('plugins.addPointFailed'))
        }
        const presetInfoId = result.data.data
        let sort = 1
        const maxSort = await (this  as  any).query('ThermalCapture', 'maxSort', [
          params.patrolItemId,
          params.patrolObjId
        ])

        if (maxSort[0].sort) {
          sort = maxSort[0].sort + 1
        }

        await (this  as  any).query('ThermalCapture', 'savePoint', [
          params.patrolItemId,
          params.patrolPointName,
          params.cameraId,
          params.deviceId,
          params.patrolObjId,
          params.methodId,
          sort,
          params.preset,
          params.ptz,
          params.cameraName,
          params.orbitalId,
          params.orbitalPreset,
          presetInfoId
        ])
        return 'success'
      }
    }
  }

  @Transactional
  async getPointTable (params):Promise<any> {
    const res = await (this  as  any).query('ThermalCapture', 'getPointTable', [
      params.patrolItemId,
      params.patrolObjId,
      params.methodId
    ])
    return res
  }
  @Transactional
  async getPointTableAndCameraId (params):Promise<any> {
    const res = await (this  as  any).query('ThermalCapture', 'getPointTableCamearId', [
      params.patrolItemId,
      params.patrolObjId,
      params.methodId,
      params.cameraId
    ])
    return res
  }
  @Transactional
  async pointDelete (params):Promise<any> {
    const presetInfoId = await (this  as  any).query('ThermalCapture', 'getPointById', [ params.patrolPointId ])

    const result = await this.ctx.consulCurl(
      '/api/presetService/v1/preSetInfo/del',
      'itms',
      'itms-handle',
      {
        useHttp: true,
        method: 'POST',
        data: [ presetInfoId[0].extendColumn3 ],
        headers: { 'content-type': 'application/json' }
      }
    )
    this.app.resDataTrans(result)
    console.log(result)
    if (result && result.data && result.data.code !== '0') {
      throw new Error(this.ctx.__('plugins.itmsDelFailed'))
    }
    const res = await (this  as  any).query('ThermalCapture', 'pointDelete', [ params.patrolPointId ])

    return res
  }
  @Transactional
  async pointMove (params):Promise<any> {
    let closestRecord
    if (params.direction === 'up') {
      closestRecord = await (this  as  any).query('ThermalCapture', 'getLowerClosest', [
        params.pointOrder,
        params.patrolItemId,
        params.patrolObjId
      ])
    } else {
      closestRecord = await (this  as  any).query('ThermalCapture', 'getUpperClosest', [
        params.pointOrder,
        params.patrolItemId,
        params.patrolObjId
      ])
    }
    if (closestRecord.length === 0) {
      return 'success'
    }
    await (this  as  any).query('ThermalCapture', 'updateOrder', [
      closestRecord[0].patrolPointId,
      params.pointOrder
    ])
    await (this  as  any).query('ThermalCapture', 'updateOrder', [
      params.patrolPointId,
      closestRecord[0].pointOrder
    ])
    return 'success'
  }

  @Transactional
  async urlToBase64 (params):Promise<any> {
    console.log('service =======rul', params)
    return await this.ctx.service.picture.urlToBase64(params.url, (this  as  any).transaction)
  }
  @Transactional
  async getZhengGaiPic (params):Promise<any> {
    const res = await (this  as  any).query('ThermalCapture', 'getZhengGaiPic', [
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
    return await this.ctx.service.camera.getOrbitalPosition(params.orbitalId, (this  as  any).transaction)
  }
  @Transactional
  async savePointWithOrbital (params):Promise<any> {
    let sort = 1
    const maxSort = await (this  as  any).query('ThermalCapture', 'maxSort', [
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

    await (this  as  any).query('ThermalCapture', 'savePointWithOrbital', [
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
      params.upperLimit,
      params.lowerLimit
    ])
    return 'success'
  }
  @Transactional
  async saveOrbitalPreset (params):Promise<any> {
    return await this.ctx.service.camera.dacTrans(
      {
        channelIndexCode: params.orbitalId,
        priority: '1',
        userId: 'admin',
        presetIndex: Number(params.orbitalPreset)
      },
      'SetPreset',
      'ptz',
      'drv_encodedevice_hikorbitrobot_net',
      (this  as  any).transaction
    )
  }
  @Transactional
  async getItemFullPathName (params):Promise<any> {
    const res = await (this  as  any).query('ThermalCapture', 'getItemFullPathName', [ params.itemId ])
    return res
  }
  @Transactional
  async getItemNameByTaskItem (params):Promise<any> {
    const res = await (this  as  any).query('ThermalCapture', 'getItemNameByTaskItem', [ params.taskItemId ])
    return res
  }
  @Transactional
  async goPreset (params):Promise<any> {
    return await this.ctx.service.camera.ptzds(
      {
        channelIndexCode: params.indexCode,
        presetIndex: Number(params.preset)
      },
      'GotoPreset',
      (this  as  any).transaction
    )
  }
  @Transactional
  async savePresetToCamera (params):Promise<any> {
    return await this.ctx.service.camera.dacTrans(
      {
        channelIndexCode: params.channelIndexCode,
        priority: '1',
        userId: 'admin',
        presetIndex: Number(params.preset)
      },
      'SetPreset',
      (this  as  any).transaction
    )
  }
  @Transactional
  async getPtzdsTaskInfo (params):Promise<any> {
    const res = await this.ctx.consulCurl(
      '/api/ptzTask/v1/manage/get?taskID=' + params.taskId,
      'ptzds',
      'ptzds-manager',
      {
        method: 'GET',
        useHttp: true,
        headers: {
          Token: tokenStore.getItem('Token').Token,
          'content-type': 'application/json'
        }
      }
    )
    this.app.resDataTrans(res)
    return res
  }
  @Transactional
  async setThermalConfig (params):Promise<any> {
    const res = await this.ctx.consulCurl(
      '/api/ruleConfigService/v1/ruleInfo/set',
      'itms',
      'itms-handle',
      {
        method: 'POST',
        useHttp: true,
        headers: {
          Token: tokenStore.getItem('Token').Token,
          'content-type': 'application/json'
        },
        data: {
          ruleInfoList: params.ruleInfoList,
          presetInfoId: params.presetInfoId
        }
      }
    )
    this.app.resDataTrans(res)
    if (res.data.code !== '0') {
      throw new Error(this.ctx.__('plugins.temperatureSettingFailed') + res.data.msg)
    }
    return res

    //
  }
  @Transactional
  async getThermalConfig (params):Promise<any> {
    const res = await this.ctx.consulCurl(
      '/api/ruleConfigService/v1/ruleInfo/get?presetInfoId=' + params.presetInfoId,
      'itms',
      'itms-handle',
      {
        method: 'GET',
        useHttp: true,
        headers: {
          Token: tokenStore.getItem('Token').Token,
          'content-type': 'text/html'
        }
      }
    )
    this.app.resDataTrans(res)
    return res
  }
  @Transactional
  async getMethodNameByMethodId (params):Promise<any> {
    return (this  as  any).query('ThermalCapture', 'getMethodNameByMethodId', [ params.methodId ])
  }
  @Transactional
  async getParamsForGotoPreset (params):Promise<any> {
    const cookies = this.ctx.req.headers.cookie.split(';')
    let CTGT

    for (const item of cookies) {
      if (item.trim().split('=')[0] === 'CASTGC') {
        CTGT = item.split('=')[1]
      }
    }
    if (!CTGT) {
      throw new Error(this.ctx.__('plugins.ctgtNotExit'))
    }
    console.log('this.app._configProp', this.app.getConfigProperoty('@bic.bic.ip'))
    const rawToken = await this.app.curl(
      `${this.app.getConfigProperoty('@bic.bic.protocol')}://${this.app.getConfigProperoty(
        '@bic.bic.ip'
      )}:${this.app.getConfigProperoty('@bic.bic.port')}${this.app.getConfigProperoty(
        '@bic.bic.context'
      )}/ssoService/v1/applyCT`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
          // Token: tokenStore.getItem('Token')
        },
        data: {
          CTGT,
          type: '1',
          userCode: null,
          content: null
        }
      }
    )
    this.app.resDataTrans(rawToken)
    // const token = hikidentify.encryption(rawToken.data.data.CT)
    let appIndex
    if (!this.app._installationProp) {
      appIndex = 1
    } else {
      for (const item of this.app._installationProp) {
        if (item.indexOf('patrolengine-app.@index') !== -1) {
          appIndex = item.split('=')[1]
          break
        }
      }
    }

    let appIndexCode
    for (const item of this.app._configProp) {
      if (item.indexOf('patrolengine-app.' + appIndex + '.@indexCode') !== -1) {
        appIndexCode = item.split('=')[1]
        break
      }
    }
    const centralURL =
      this.app.config.consul.cibServerIp + ':' + this.app.config.consul.cibServerPort
    const serviceIndexCodeRes = await this.app.curl(
      'http://' +
        centralURL +
        '/bic/svrService/v1/serviceNodes/netdomains?serviceNodeCodes=' +
        appIndexCode,
      {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
          Token: tokenStore.getItem('Token').Token
        }
      }
    )

    this.app.resDataTrans(serviceIndexCodeRes)
    let serviceIndex = null
    for (const item of serviceIndexCodeRes.data.data.list[0].address) {
      if (item.state === 'enable' && item.key === 'webPort') {
        if (item.ip + ':' + item.port === this.ctx.host) {
          serviceIndex = item.domainId
          break
        }
      }
    }
    if (serviceIndex === null) {
      serviceIndex = serviceIndexCodeRes.data.data.list[0].address[0].domainId
    }

    // const dacAddress = await this.ctx.consulCurl('/svrService/v1/proxyed/address', 'centerService', 'centerService', {
    //   method: 'POST',
    //   useHttp: true,
    //   headers: {
    //     Token: tokenStore.getItem('Token').Token
    //   },
    //   data: {
    //     services: [
    //       {
    //         componentId: 'dac',
    //         serviceType: 'dms',
    //         serviceNodeCode: appIndexCode
    //       }
    //     ],
    //     domainId: serviceIndex
    //   }
    // })
    // this.app.resDataTrans(dacAddress)
    const dacIndex = await this.ctx.consulCurl(
      '/dac/dms/v2/das?serviceIndexCode=' +
        appIndexCode +
        '&deviceIndexCode=&channelIndexCode=' +
        params.cameraId +
        '&multiRouteId=' +
        serviceIndex,
      'dac',
      'dms',
      {
        method: 'GET',
        useHttp: true,
        headers: { Token: tokenStore.getItem('Token').Token }
      }
    )
    this.app.resDataTrans(dacIndex)
    const indexCode = dacIndex.data.data.indexCode
    const dacAddress = await this.app.curl(
      'http://' +
        centralURL +
        '/bic/svrService/v1/serviceNodes/netdomains?serviceNodeCodes=' +
        indexCode,
      {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
          Token: tokenStore.getItem('Token').Token
        }
      }
    )
    this.app.resDataTrans(dacAddress)
    let dasIpStr
    let type
    for (const item of dacAddress.data.data.list[0].address) {
      if (item.state === 'enable' && item.key === 'webPort') {
        if (!item.domainName) {
          dasIpStr = item.netprotocol + '://' + item.domainName + ':' + item.port
        } else {
          dasIpStr = item.netprotocol + '://' + item.ip + ':' + item.port
        }

        if (item.netprotocol === 'http') {
          type = 0
        } else {
          type = 1
        }
        break
      }
    }
    return {
      dasIpStr,
      type,
      // token: hikidentify.encryption(tokenStore.getItem('Token').Token),
      CTGT
    }
  }
}
