import {  Context, inject, provide} from 'midway';
import { ItlncService } from '../app/interface/tlncInterface';
const { Transactional } = require('../app/core/transactionalDeco/index')

@provide('tlncService')
export class TlncService implements ItlncService{
  @inject()
  ctx: Context;
  @Transactional
  async mq(params:any): Promise<any> {
    try {
      const destination = '/topic/tlnc.tlncweb.topic.receive.msg'
      const client = (this as any).app.tlncClient
      const {
        userId,
        listType,
        msgStatus,
        extendJson = '',
        msgTitle,
        moduleId,
        msgId,
        msgDetail,
        extendNoShow
      } = params
      let value = {}
      // 代办
      if (listType === 'todo') {
        value = {
          listType, // 代办的特殊标识
          params: {
            msgs: [
              {
                operType: '1', // 暂无说明
                comId: 'patrolengine', // app 写死
                moduleId, // 暂无说明
                uid: userId, //  userid
                msgId, //
                msgStatus, // app 写死
                msgTitle, //
                msgTime: (this as any).app.dateFormatter(new Date(), 'yyyy-MM-dd hh:mm:ss'),
                extendStr: {
                  showFlag: 1,
                  picUrl: '',
                  extendJson,
                  extendNoShow
                }
              }
            ]
          }
        }
      } else if (listType === 'message') {
        // 消息
        value = {
          listType,
          operType: 'add',
          params: [
            {
              uids: userId,
              moduleId,
              comId: 'patrolengine',
              msgs: [
                {
                  msgId,
                  msgTitle,
                  // msgStatus,
                  msgStatusStr: '',
                  msgDetail,
                  msgTime: (this as any).app.dateFormatter(new Date(), 'yyyy-MM-dd hh:mm:ss'),
                  extendStr: {
                    showFlag: 1,
                    picUrl: '',
                    extendJson,
                    extendNoShow
                  }
                }
              ]
            }
          ]
        }
      }

      if (msgId) {
        client.publish(destination, JSON.stringify(value))
      }
    } catch (error) {
      (this as any).app.hikLogger.error(error)
    }
  }
  @Transactional
  async tlncDel(params) {}
}
