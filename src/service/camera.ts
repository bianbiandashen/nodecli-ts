'use strict'
import {  Context, inject, provide, Application} from 'midway';
import { 
  ICamera,
} from '../app/interface/cameraInterface';
const tokenStore = require('../custom_plugin/egg-hik-consul/app/consul/tokenLocalStorage')
const hikidentify = require('hikidentify')
const { Transactional } = require('../app/core/transactionalDeco')
@provide('camera')
export class Camera implements ICamera {

  @inject()
  ctx: Context;
  app: Application;
  
  // 获取配置文件中的属性值的方法
  _getConfigProperoty (key) {
    // console.log(JSON.stringify(this))
    if (this.app._configProp) {
      const valueList = this.app._configProp.filter(d => d.indexOf(key) > -1)
      if (valueList && valueList.length > 0) {
        return valueList[0].substring(valueList[0].indexOf('=') + 1)
      }
      this.app.logger.warn(key + " does't has the value")
      return key
    }
    this.app.logger.warn('configProp [' + key + '] is undefined,please check config.properties')
    return key
  }

  @Transactional
  async playBack (cameraId, startTime, endTime, CTGT): Promise<any> {
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
    // 通过核心服务 获取对应的公网域id 其实就是domainid

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
        const realIp = item.ip || item.domainName // 域名走的是domianName
        console.log('realIprealIprealIp', realIp)
        if (realIp === this.ctx.host.split(':')[0]) {
          console.log('成功了~ 老铁===============================', item)
          serviceIndex = item.domainId
          break
        }
      }
    }
    // 为什么要domainid 呢 因为 我们要通过 核心服务访问dac时 需要有对应的ip 和端口
    if (serviceIndex === null) {
      serviceIndex = serviceIndexCodeRes.data.data.list[0].address[0].domainId
      // console.log('serviceIndexCodeRes.data.data.list[0]', serviceIndexCodeRes.data.data.list[0])
    }
    console.log('边黎安测试获取网域id================================', serviceIndex)
    // 这里会调两次，/sac/sam/service/rs/v1/playback/bs/getPlaybackParam这个接口，
    // 逻辑是优先传recordStyle: 0,先从中心存储获取录像。如果中心存储无数据，那么再发一次请求，
    // 参数recordStyle: 1,即从设备存储获取录像。如果都没获取到，那么返回无录像。
    let result = await this.ctx.consulCurl(
      '/sac/sam/service/rs/v1/playback/bs/getPlaybackParam',
      'sac',
      'sac',
      {
        method: 'POST',
        useHttp: true,
        headers: {
          accept: 'application/json, application/*+json, text/json, application/octet-stream',
          'content-type': 'application/json'
        },
        data: {
          indexCode: cameraId,
          netZoneCode: serviceIndex.toString(),
          recordStyle: 0,
          startTime,
          endTime
        }
      }
    )
    console.log('回放参数:startTime', startTime)
    console.log('回放参数:endTime', endTime)
    this.app.resDataTrans(result)
    console.log('回放的 res ===================', result)
    console.log('urlurlurl', result.data.data.url)
    if (result.data.code !== '0') {
      throw new Error(result.data.msg)
    }
    if (!result.data.data.list) {
      result = await this.ctx.consulCurl(
        '/sac/sam/service/rs/v1/playback/bs/getPlaybackParam',
        'sac',
        'sac',
        {
          method: 'POST',
          useHttp: true,
          headers: {
            accept: 'application/json, application/*+json, text/json, application/octet-stream',
            'content-type': 'application/json'
          },
          data: {
            netZoneCode: serviceIndex.toString(),
            indexCode: cameraId,
            recordStyle: 1,
            startTime,
            endTime
          }
        }
      )
      this.app.resDataTrans(result)
      console.log('getPlaybackParam res:', result)
      if (!result.data.data.list) {
        throw new Error(result.data.msg)
      }
    }

    const rawToken = await this.app.curl(
      `${this._getConfigProperoty('@bic.bic.protocol')}://${this._getConfigProperoty(
        '@bic.bic.ip'
      )}:${this._getConfigProperoty('@bic.bic.port')}${this._getConfigProperoty(
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
    const encToken = hikidentify.encryption(rawToken.data.data.CT)

    return {
      encToken,
      url: result.data.data.url,
      beginTime: result.data.data.list[0].beginTime,
      endTime: result.data.data.list[0].endTime
    }
  }
  @Transactional
  async getCameraDetail (cameraid): Promise<any> {
    console.log('cameraidcameraidcameraid', cameraid)
    const filedOptions = [
      {
        fieldName: 'camera_id',
        fieldValue: cameraid,
        type: 'eq'
      }
    ]
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_camera/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo: 1,
          pageSize: 1000,
          fields:
            'treaty_type,decode_tag,capability,camera_name,camera_type,channel_no,channel_type,device_id,record_location',
          filedOptions
        }
      }
    )
    this.app.resDataTrans(result)
    // console.log('getCameraDetailgetCameraDetail', result)
    return result
  }
  @Transactional
  async preview (cameraid, CTGT): Promise<any> {
    console.log('this.ctx.host================================', this.ctx)
    console.log('this.ctx.host================================', this.ctx.host)
    // 获取服务节点
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
    // 通过核心服务 获取对应的公网域id 其实就是domainid

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
        const realIp = item.ip || item.domainName // 公网走的是domianName
        console.log('realIprealIprealIp', realIp)
        if (realIp === this.ctx.host.split(':')[0]) {
          console.log('成功了~ 老铁===============================', item)
          serviceIndex = item.domainId
          break
        }
      }
    }
    console.log(
      'vaddress================================',
      serviceIndexCodeRes.data.data.list[0].address
    )

    // 为什么要domainid 呢 因为 我们要通过 核心服务访问dac时 需要有对应的ip 和端口
    if (serviceIndex === null) {
      serviceIndex = serviceIndexCodeRes.data.data.list[0].address[0].domainId
      // console.log('serviceIndexCodeRes.data.data.list[0]', serviceIndexCodeRes.data.data.list[0])
    }
    console.log('边黎安测试获取网域id================================', serviceIndex)
    const result = await this.app.consulCurl(
      '/mls/service/rs/v1/preview/bs/getPreviewParam',
      'vnsc',
      'mls',
      {
        method: 'POST',
        useHttp: true,
        headers: {
          accept: 'application/json, application/*+json, text/json, application/octet-stream',
          'content-type': 'application/json'
        },
        data: {
          indexCode: cameraid,
          netZoneCode: serviceIndex
        }
      }
    )
    this.app.resDataTrans(result)
    if (result.data.code !== '0') {
      throw new Error(result.data.msg)
    }
    // 获取服务节点
    const serviceNodeResult = await this.ctx.consulCurl(
      '/svrService/v2/service/vnsc/mls',
      'centerService',
      'centerService',
      {
        method: 'GET',
        useHttp: true,
        headers: {
          accept: 'application/json, application/*+json, text/json, application/octet-stream',
          'content-type': 'application/json'
        }
      }
    )
    this.app.resDataTrans(serviceNodeResult)
    if (serviceNodeResult.data.code !== '0') {
      throw new Error(serviceNodeResult.data.msg)
    }
    const domainResult = await this.ctx.consulCurl(
      '/svrService/v1/serviceNodes/netdomains?serviceNodeCodes=' +
        serviceNodeResult.data.data.serviceNodeCode,
      'centerService',
      'centerService',
      {
        method: 'GET',
        useHttp: true,
        headers: {
          accept: 'application/json, application/*+json, text/json, application/octet-stream',
          'content-type': 'application/json'
        }
      }
    )
    this.app.resDataTrans(domainResult)

    // 获取加密token
    const rawToken = await this.app.curl(
      `${this._getConfigProperoty('@bic.bic.protocol')}://${this._getConfigProperoty(
        '@bic.bic.ip'
      )}:${this._getConfigProperoty('@bic.bic.port')}${this._getConfigProperoty(
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
    console.log('==============================边工调试公网')
    console.log('urlurlurl', result.data.data.url)
    // const urlSplit1 = result.data.data.url.split('/EUrl')[1]
    // const host1 = this.ctx.host.split(':')[0]
    // const tail = urlSplit1.split('/')
    // const fullUrl = `rtsp://${host1}:15012/EUrl${urlSplit1}`
    // console.log('fullUrlfullUrl', fullUrl)
    const encToken = hikidentify.encryption(rawToken.data.data.CT)
    return {
      encToken,
      url: result.data.data.url
    }
  }
  @Transactional
  async dacTrans (params, method, ability = 'ptz', driveId = null, deviceId = ''): Promise<any> {
    const cameraid = params.channelIndexCode
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

    const dacAddress = await this.ctx.consulCurl(
      '/dac/dms/v2/das?serviceIndexCode=' +
        appIndexCode +
        '&deviceIndexCode=' +
        deviceId +
        '&channelIndexCode=' +
        (deviceId ? '' : cameraid) +
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
    this.app.resDataTrans(dacAddress)
    let host
    for (const item of dacAddress.data.data.address) {
      if (item.state === 'enable' && item.key === 'webPort') {
        host = item.netprotocol + '://' + item.ip + ':' + item.port
        break
      }
    }

    const res = await this.app.curl(host + '/daf/v1/transparentchannel', {
      method: 'POST',
      headers: {
        Accept: 'application/json;charset=UTF-8',
        channelIndexCode: cameraid,
        Ability: ability,
        'Content-Type': 'application/json;charset=UTF-8',
        TreatyType: null,
        DrvId: driveId,
        Token: tokenStore.getItem('Token').Token
      },
      data: {
        method,
        params
      }
    })

    this.app.resDataTrans(res)
    return res
  }
  @Transactional
  async ptzds (params, method): Promise<any> {
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
          channelIndexCode: params.channelIndexCode || params.orbitalIndexCode,
          commands: [
            {
              ability: 'ptz',
              commandCode: method,
              commandParam: params,
              order: 0
            }
          ],
          needDispatch: true,
          pushTime: this.app.dateFormatter(new Date(), 'yyyy-MM-dd hh:mm:ss')
        }
      }
    )
    this.app.resDataTrans(ptzds)

    return ptzds
  }
  @Transactional
  async getTaskDetail (tid): Promise<any> {
    const ptzds = await this.ctx.consulCurl(
      '/api/ptzTask/v1/manage/get',
      'ptzds',
      'ptzds-manager',
      {
        method: 'GET',
        useHttp: true,
        headers: {
          Token: tokenStore.getItem('Token').Token,
          'content-type': 'application/json'
        },
        data: { taskId: tid }
      }
    )
    this.app.resDataTrans(ptzds)
    return ptzds
  }
  @Transactional
  async getOrbitalByCamera (cameraId): Promise<any> {
    console.log('cameraIdcameraId', cameraId)
    const orms = await this.ctx.consulCurl('/orms/api/orbital/v1/resource', 'orms', 'ormsweb', {
      method: 'POST',
      useHttp: true,
      headers: {
        Token: tokenStore.getItem('Token').Token,
        'content-type': 'application/json'
      },
      data: { indexCodeList: [ cameraId ] }
    })

    this.app.resDataTrans(orms)

    console.log('ormsormsorms', orms)
    return orms
  }
  @Transactional
  async getOrbitalPosition (orbitalId): Promise<any> {
    const ormsPresets = await this.ctx.consulCurl(
      '/orms/api/orbital/v1/presets?orbitalIndexCode=' + orbitalId,
      'orms',
      'ormsweb',
      {
        method: 'GET',
        useHttp: true,
        headers: {
          Token: tokenStore.getItem('Token').Token,
          'content-type': 'application/json'
        }
      }
    )
    this.app.resDataTrans(ormsPresets)

    return ormsPresets
  }

  @Transactional
  async setPresetToOrbitalWithOrms (orbitalId, preset): Promise<any> {
    // const deletionRes = await this.ctx.consulCurl('/api/orbital/v1/preset/deletion', 'orms', 'ormsweb', {
    //   method: 'POST',
    //   useHttp: true,
    //   headers: {
    //     Token: tokenStore.getItem('Token').Token,
    //     'content-type': 'application/json'
    //   },
    //   data: {
    //     id: orbitalId,
    //     preset
    //   }
    // })
    // this.app.resDataTrans(deletionRes)
    const ormsPresets = await this.ctx.consulCurl(
      '/api/orbital/v1/preset/save',
      'orms',
      'ormsweb',
      {
        method: 'POST',
        useHttp: true,
        headers: {
          Token: tokenStore.getItem('Token').Token,
          'content-type': 'application/json'
        },
        data: {
          orbitalIndexCode: orbitalId,
          orbitalPresetIndex: preset,
          presetIndexName: 'preset' + preset
        }
      }
    )
    this.app.resDataTrans(ormsPresets)
    return ormsPresets
  }
}

