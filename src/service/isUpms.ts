/*
 * @作者: bianlian
 * @创建时间: 2020-01-19 11:27:49
 * @Last Modified by: bainlian
 * @Last Modified time: 2020-02-11 14:43:08
 */
'use strict'
import {  Context, inject, provide, Application} from 'midway';
import { 
  IIsupmService,
} from '../app/interface/isUpmsInterface';
const { Transactional } = require('../app/core/transactionalDeco')
const Sequelize = require('sequelize')
const { Op } = Sequelize

function bufferToJson(data) {
  return Buffer.isBuffer(data) ? JSON.parse(data.toString()) : {}
}
function unique(arr1) {
  const res = new Map()
  return arr1.filter(
    a => !res.has(a.dataValues.patrolObjId) && res.set(a.dataValues.patrolObjId, 1)
  )
}
@provide('isupmService')
export class IsupmService implements IIsupmService {
  @inject()
  ctx: Context;
  app: Application;

  /**
   * 根据用户userIds集合获取用户列表
   * @param {string} { userIds, 逗号分隔 }
   * @return {object|null} - 用户列表
   * 将被用于获取用户对应的personid -》通过 personid 再找到 personid下 所有的区域(该区域即为组织)
   */

  @Transactional
  async getPersonReigonListByUserId(userId): Promise<any> {
    console.log('userIdsssss', userId)
    const userIds = []
    userIds.push(userId)
    // 获取用户列表信息列表
    const userList = await this.ctx.consulCurl('/isupm/api/userService/v1/user', 'isupm', 'upm', {
      method: 'POST',
      data: {
        userIds
      }
    })
    const userInfo = bufferToJson(userList.data).data
    if (!userInfo || userInfo.list.length <= 0) {
      throw Error(this.ctx.__('isUpms.userDataNotExit'))
    } else {
      // 下一步 通过userinfo 的 person_id
      const parnetOrgData = await this.ctx.consulCurl(
        '/api/v1/model/tb_person/records',
        'pdms',
        'pdmsweb',
        {
          method: 'POST',
          useHttp: true,
          data: {
            pageNo: 1,
            pageSize: 1,
            fields: 'org_id',
            filedOptions: [
              {
                fieldName: 'person_id',
                fieldValue: userInfo.list[0].personId,
                type: 'eq'
              }
            ]
          }
        }
      )
      console.log('parnetOrgData', parnetOrgData)
      this.app.resDataTrans(parnetOrgData)
      console.log('parnetOrgData.data.data.list[0].org_id', parnetOrgData.data.data.list[0])
      if (
        !parnetOrgData ||
        parnetOrgData.data.data.list.length <= 0 ||
        !parnetOrgData.data.data.list[0].org_id
      ) {
        throw Error(this.ctx.__('isUpms.userOraginiNotExit'))
      } else {
        const orgList = await this.ctx.consulCurl(
          '/api/v1/model/tb_org/records',
          'pdms',
          'pdmsweb',
          {
            method: 'POST',
            useHttp: true,
            data: {
              pageNo: 1,
              pageSize: 10000,
              fields: 'org_id, org_name, parent_org_id',
              filedOptions: [
                {
                  fieldName: 'org_path',
                  fieldValue: parnetOrgData.data.data.list[0].org_id,
                  type: 'like'
                }
              ]
            }
          }
        )
        this.app.resDataTrans(orgList)
        const result = orgList && orgList.data && orgList.data.data && orgList.data.data.list
        return result
      }
    }
  }

  @Transactional
  async getObjectListByOrgId(params): Promise<any> {
    const { orgId } = params
    const orgList = await this.ctx.consulCurl('/api/v1/model/tb_org/records', 'pdms', 'pdmsweb', {
      method: 'POST',
      useHttp: true,
      data: {
        pageNo: 1,
        pageSize: 10000,
        fields: 'org_id',
        filedOptions: [
          {
            fieldName: 'org_id',
            fieldValue: orgId,
            type: 'eq'
          }
        ]
      }
    })
    this.app.resDataTrans(orgList)

    // console.log(' orgList.data.data.list', orgList.data.data.list)
    const result = orgList && orgList.data && orgList.data.data && orgList.data.data.list
    let orgIds
    if (result && result.length > 0) {
      orgIds = result.map(ele => ele.org_id)
    }

    // 找到用户的组织ids
    if (!orgIds || orgIds.length <= 0) {
      throw Error(this.ctx.__('isUpms.userNoOrigin'))
    } else {
      const condition = {
        where: {
          patrolObjRegion: {
            [Op.or]: orgIds
          }
          // isDelete: '0'
        }
      }
      console.log('orgIdsorgIdsorgIds', orgIds)
      // 得到了所有的该区域下的巡检对象
      const result = await (this as any).query('PatrolObj', 'queryData', [condition])
      console.log(this.ctx.__('isUpms.getAllOrigin'), result)
      const res:any = {}
      res.list = unique(result.list)
      res.total = (unique(result.list) && unique(result.list).length) || 0
      return result
    }
  }

  @Transactional
  async getObjectListByRegionId(params): Promise<any> {
    const { regionId } = params
    const regionList = await this.ctx.consulCurl(
      '/api/v1/model/tb_region/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        useHttp: true,
        data: {
          pageNo: 1,
          pageSize: 10000,
          fields: 'region_id',
          filedOptions: [
            {
              fieldName: 'region_id',
              fieldValue: regionId,
              type: 'eq'
            }
          ]
        }
      }
    )
    this.app.resDataTrans(regionList)
    const result =
      regionList && regionList.data && regionList.data.data && regionList.data.data.list
    let regionIds
    if (result && result.length > 0) {
      regionIds = result.map(ele => ele.region_id)
    }

    // 找到用户的组织ids
    if (!regionIds || regionIds.length <= 0) {
      throw Error(this.ctx.__('isUpms.userBelongArea'))
    } else {
      const condition = {
        where: {
          patrolObjRegion: {
            [Op.or]: regionIds
          },
          isDelete: '0'
        }
      }

      // 得到了所有的该区域下的巡检对象
      const result = await (this as any).query('PatrolObj', 'queryData', [condition])
      const res:any = {}
      res.list = unique(result.list)
      res.total = (unique(result.list) && unique(result.list).length) || 0
      return result
    }
  }

  @Transactional
  async getPatrolItemsByObjectId(params): Promise<any> {
    const { patrolObjId } = params
    const condition = {
      where: {
        patrolObjId
      }
    }
    if (!patrolObjId) {
      throw Error(this.ctx.__('isUpms.objIdNoTransmit'))
    }
    // 得到了所有的该区域下的巡检对象
    const result = await (this as any).query('PatrolObj', 'queryDataById', [condition])
    const objTypeId = result && result.objTypeId
    if (!objTypeId) {
      throw Error(this.ctx.__('isUpms.objTypeNoExit'))
    }
    const queryCondition = {
      where: {
        objTypeId
      }
    }
    const itemList = await (this as any).query('PatrolItem', 'queryTreePathData', [queryCondition])
    for (const item of itemList.list) {
      item.dataValues.patrolItemPath = await this.ctx.service.common.partrolItemsPath(
        item.dataValues.path,
        (this as any).transaction
      )
    }

    return itemList
  }
}
