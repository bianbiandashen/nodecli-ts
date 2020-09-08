import {  Context, inject, provide} from 'midway';
import { IpictureService } from '../app/interface/pictureInterface';
const { Transactional } = require('../app/core/transactionalDeco/index')

@provide('pictureService')
export class PictureService implements IpictureService {
  @inject()
  ctx: Context;
  @Transactional
  async getRealPic (picId:any): Promise<any> {
    const { protocol, hostname } = this.ctx
    if (!protocol || !hostname) {
      throw new Error(this.ctx.__('picture.noHttpTypeHost'))
    }
    if (picId && picId.indexOf('/pic') >= 0) {
      const realUrl = await this.ctx.consulCurl(
        '/patrolengine-engine/api/v1/asw/sign',
        'patrolengine',
        '/patrolengine-engine',
        {
          method: 'POST',
          dataType: 'json',
          data: {
            picUrl: '/pic' + picId.split('/pic')[1],
            httpType: protocol,
            host: hostname
          },
          useHttp: true
        }
      )
      return realUrl.data.data
    }
    const res = await (this as any).query('PatrolPic', 'getPicById', [ picId ])
    let res0:any = {}
    if (res.length === 0) {
      return { picUrl: '' }
    }
    res0 = res && res[0]
    if (res && res[0] && res[0].picUrl.indexOf('/pic') >= 0) {
      const realUrl = await this.ctx.consulCurl(
        '/patrolengine-engine/api/v1/asw/sign',
        'patrolengine',
        '/patrolengine-engine',
        {
          method: 'POST',
          dataType: 'json',
          data: {
            picUrl: '/pic' + res[0].picUrl.split('/pic')[1],
            httpType: protocol,
            host: hostname
          },
          useHttp: true
        }
      )
      const resultPic = realUrl && realUrl.data && realUrl.data.data
      res0.picUrl = resultPic
    }
    return res0
  }
  // 用于外网时，替代外网的 ip 进行请求，确保 node 能拿到
  @Transactional
  async getRealPicWithLocal (picId:any, transaction?:any): Promise<any> {
    const protocol = 'https'
    const hostname = '127.0.0.1'
    if (picId && picId.indexOf('/pic') >= 0) {
      const realUrl = await this.ctx.consulCurl(
        '/patrolengine-engine/api/v1/asw/sign',
        'patrolengine',
        '/patrolengine-engine',
        {
          method: 'POST',
          dataType: 'json',
          data: {
            picUrl: '/pic' + picId.split('/pic')[1],
            httpType: protocol,
            host: hostname
          },
          useHttp: true
        }
      )
      return realUrl.data.data
    }
    const res = await (this as any).query('PatrolPic', 'getPicById', [ picId ])
    let res0:any = {}
    if (res.length === 0) {
      return { picUrl: '' }
    }
    res0 = res && res[0] && res[0]
    if (res && res[0] && res[0].picUrl.indexOf('/pic') >= 0) {
      const realUrl = await this.ctx.consulCurl(
        '/patrolengine-engine/api/v1/asw/sign',
        'patrolengine',
        '/patrolengine-engine',
        {
          method: 'POST',
          data: {
            picUrl: '/pic' + res[0].picUrl.split('/pic')[1],
            httpType: protocol,
            host: hostname
          },
          dataType: 'json',
          useHttp: true
        }
      )
      const resultPic = realUrl && realUrl.data && realUrl.data.data
      res0.picUrl = resultPic
    }
    return res0
  }
  @Transactional
  async getPromise (realUrl:any, transaction?:any): Promise<any> {
    // 获取图片base64
    return this.ctx.helper.getBasePicFun(realUrl)
  }
  @Transactional
  async urlToBase64 (url:any): Promise<any> {
    let realUrl = url
    // 如果传进来的url是/pic开头的，那么要获取一次真实url。
    if (/^\/pic.*/.test(url)) {
      realUrl = await this.getRealPicWithLocal(url, (this as any).transaction)
    }
    const result = await this.getPromise(realUrl, (this as any).transaction)
    return result
  }
}
