/*
 * @Author: renxiaojian
 * @Date: 2019-12-27 14:16:43
 * @Last Modified by: bainlian
 * @Last Modified time: 2020-02-24 22:07:48
 */
'use strict'
import {  Context, inject, provide, Application} from 'midway';
import { 
  IAgentPersonService,
} from '../app/interface/agentPersonInterface';
const { Transactional } = require('../app/core/transactionalDeco')

function bufferToJson(data) {
  return Buffer.isBuffer(data) ? JSON.parse(data.toString()) : {}
}
function uniqueArr(arr1, arr2) {
  // 合并两个数组
  arr1.push(...arr2) // 或者arr1 = [...arr1,...arr2]
  // 去重
  const arr3 = Array.from(new Set(arr1)) // let arr3 = [...new Set(arr1)]
  console.log(arr3)
  return arr3
}
function dedupe(array) {
  return Array.from(new Set(array))
}
function getDate(time) {
  const d = new Date(time)
  const y = d.getFullYear() // 年份
  const m = (d.getMonth() + 1).toString().padStart(2, '0') // 月份
  const r = d
    .getDate()
    .toString()
    .padStart(2, '0') // 日子
  return `${y}/${m}/${r}`
}
@provide('agentPersonService')
export class AgentPersonService implements IAgentPersonService {
  @inject()
  ctx: Context;
  app: Application;

  /**
   * 需求是：
   * 选择代理人：获取当前组织的其他人（展示当前组织的其他人，由于数量不多，无需搜索，权限移交给被人的人不展示）
   * 具体实现：
   * 1 通过操作人的id， 找对对应 用户详情
   * 2 通过详情中的personid 找到对应的 orgid 组织id
   * 3 通过path的模糊查询找到 对应的该组织下的其他人
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async judgeAgentInfo(userId): Promise<any> {
    if (userId === 'admin') {
      throw new Error(this.ctx.__('agentPerson.adminCanNotPerMove'))
    }
    // 获取当前用户是否有进行中的代理任务和发起的代理
    // 1.获取当前用户是否有进行中的代理任务
    // 判断这个人是否存在 未退回  未删除 且 endtime 《 现在的
    const res = {
      hasJudgeTask: 0,
      hasSubmitAgent: 0,
      whoSubmitByYou: ''
    }
    const condition = {
      userId,
      isDelete: 0,
      recoveryStatus: 0
    }
    const result = await (this  as  any).query('AgentPerson', 'queryDataById2', [condition])
    if (result.length > 0) {
      res.hasJudgeTask = 1
      res.whoSubmitByYou = result[0].submitterUserId
    }
    // 2.获取当前用户是否有发起的代理   判断这个人是否存在 未退回  未删除 且 endtime 《 现在的
    const condition1 = {
      userId,
      isDelete: 0,
      recoveryStatus: 0
    }
    const result1 = await (this  as  any).query('AgentPerson', 'queryDataById1', [condition1])
    if (result1.length > 0) {
      res.hasSubmitAgent = 1
    }

    return res
  }

  @Transactional
  async getUserIdsBySubmiiters(userIds): Promise<any> {
    // 获取当前用户是否有进行中的代理任务和发起的代理
    // 1.获取当前用户是否有进行中的代理任务
    // 判断这个人是否存在 未退回  未删除 且 endtime 《 现在的
    let userList = []
    userList = userIds
    for (const i of userIds) {
      const condition = {
        userId: i,
        isDelete: 0,
        recoveryStatus: 0
      }

      const result = await (this  as  any).query('AgentPerson', 'queryDataById1', [condition])
      if (result.length > 0) {
        userList.push(result[0].agentUserId)
      }
    }
    return dedupe(userList)
  }

  @Transactional
  async getOtherPersonByUserOrgId(userId): Promise<any> {
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
    let personIdByUserId
    if (!userInfo || userInfo.list.length <= 0) {
      throw Error(this.ctx.__('agentPerson.userInfpCanNotExit'))
    } else if (!userInfo.list[0].personId) {
      throw Error(this.ctx.__('agentPerson.personCanNotExit'))
    } else {
      // 下一步 通过userinfo 的 person_id

      personIdByUserId = userInfo.list[0].personId
      // 因为 现在一个人有且仅关联一个组织
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
            fields: 'org_path',
            filedOptions: [
              {
                fieldName: 'person_id',
                fieldValue: personIdByUserId,
                type: 'eq'
              }
            ]
          }
        }
      )
      this.app.resDataTrans(parnetOrgData)

      if (
        !parnetOrgData ||
        parnetOrgData.data.data.list.length <= 0 ||
        !parnetOrgData.data.data.list[0].org_path
      ) {
        throw Error(this.ctx.__('agentPerson.userOraginCanNotExit'))
      } else {
        const likePath = parnetOrgData.data.data.list[0].org_path
        const personListInSameOrg = await this.ctx.consulCurl(
          '/api/v1/model/tb_person/records',
          'pdms',
          'pdmsweb',
          {
            method: 'POST',
            useHttp: true,
            data: {
              pageNo: 1,
              pageSize: 999,
              fields: 'org_path, name, mobile, person_id, org_id',
              filedOptions: [
                {
                  fieldName: 'org_path',
                  fieldValue: likePath,
                  type: 'like'
                }
              ]
            }
          }
        )
        this.app.resDataTrans(personListInSameOrg)
        const result =
          personListInSameOrg &&
          personListInSameOrg.data &&
          personListInSameOrg.data.data &&
          personListInSameOrg.data.data.list

        // const result = orgList && orgList.data && orgList.data.data && orgList.data.data.list
        // 找到下级组织，然后遍历组织找到人员，在根据人员ID找user
        const personIdList = result.map(ele => ele.person_id)

        // personIdsInSameOrg为人员id数组除了自己本身的其他人员  人员ID找user
        console.log('personIndexCodeListpersonIndexCodeList', personIdList)
        // http://10.13.69.225:8080/isupm/api/userService/v1/person/users
        const userList = await this.ctx.consulCurl(
          '/isupm/api/userService/v1/person/users',
          'isupm',
          'upm',
          {
            method: 'POST',
            data: {
              personIdList
            }
          }
        )
        const userlistData = bufferToJson(userList.data).data
        const usrIds =
          userlistData &&
          userlistData.list &&
          userlistData.list.length > 0 &&
          userlistData.list
            .map(ele => {
              const obj:any = {}
              obj.agentUserId = ele.userName
              obj.agentUser = ele.personName
              return obj
            })
            .filter(ele => ele.agentUserId !== userId && ele.agentUserId !== 'admin')

        // 拿到了所有的userid 然后去agentperson表中 筛选掉 （已经是代理人 且 isdelete 是 0 且 enndtime 》 newdate）
        console.log('usrIdsusrIds', usrIds)
        const agentUserIds = []
        if (usrIds && usrIds.length > 0) {
          for (const item of usrIds) {
            if (item.agentUserId) {
              const userCondition = {
                userId: item.agentUserId
              }
              const agenttResult = await (this  as  any).query('AgentPerson', 'queryDataById2', [
                userCondition
              ]) // 尝试寻找是否有agnetuserid是这个人的

              console.log('agenttResult', agenttResult)
              const submitRes = await (this  as  any).query('AgentPerson', 'queryDataById1', [userCondition]) // 尝试寻找是否有submitituserid是这个人的
              console.log('submitRes', submitRes)
              // console.log('userResultuserResultuserResult', userResult)
              if (agenttResult.length === 0 && submitRes.length === 0) {
                agentUserIds.push(item)
                console.log('agentUserIdsagentUserIds', agentUserIds)
              } else {
                console.log('不满足要求的angentid', item.agentUserId)
              }
            }
          }
        }
        return agentUserIds
      }
    }
  }

  @Transactional
  async agentSearch(userId): Promise<any> {
    const condition = {
      where: {
        submitterUserId: userId,
        isDelete: 0
      }
    }
    const condition1 = {
      where: {
        agentUserId: userId,
        isDelete: 0
      }
    }
    if (userId === 'admin') {
      throw new Error(this.ctx.__('agentPerson.systenAdminNoPer'))
    }

    // ｕｓｅｒ是代理人的角色
    const result = await (this  as  any).query('AgentPerson', 'queryDataById', [condition])
    // user 是　提交人得角色
    const result1 = await (this  as  any).query('AgentPerson', 'queryDataById', [condition1])

    // 由于列表是　归并展示因此需要归并后根据时间排序

    //
    const agentList:any = uniqueArr(result.list, result1.list).sort(function(a:any, b:any) {
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    })

    for (const item of agentList) {
      item.dataValues.timeInterval = `${getDate(item.startTime)} - ${getDate(item.endTime)}`
      if (item.recoveryStatus === 0 && new Date(item.startTime) > new Date()) {
        item.dataValues.status = 0
      } else if (
        item.recoveryStatus === 0 &&
        new Date(item.endTime) > new Date() &&
        new Date(item.startTime) < new Date()
      ) {
        item.dataValues.status = 1
      } else {
        item.dataValues.status = 2
      }
      const userIds = []
      userIds.push(item.agentUserId)
      // 获取用户列表信息列表
      const userList = await this.ctx.consulCurl('/isupm/api/userService/v1/user', 'isupm', 'upm', {
        method: 'POST',
        data: {
          userIds
        }
      })
      const userInfo = bufferToJson(userList.data).data
      console.log('userInfouserInfouserInfo', userInfo)
      if (!userInfo || userInfo.list.length <= 0) {
        throw Error((this.ctx.__('agentPerson.userInfpCanNotExit')))
      } else {
        // 下一步 通过userinfo 的 person_id
        item.dataValues.agentUser = userInfo.list[0].personName
      }

      delete item.dataValues.createTime
      delete item.dataValues.recoveryStatus
      delete item.dataValues.isDelete
      delete item.dataValues.endTime
      delete item.dataValues.startTime
      delete item.dataValues.updateTime
      delete item.dataValues.submitterUserId
      delete item.dataValues.agentUserId
    }
    console.log('result.list ', result.list)
    let sortList = []
    // 任务列表按照 status 1 2 0 排序
    if (result && result.list && result.list.length > 0) {
      const list1 = result.list.filter(ele => ele.dataValues.status === 1)
      const list2 = result.list.filter(ele => ele.dataValues.status === 0) // 已过期
      const list0 = result.list.filter(ele => ele.dataValues.status === 2)
      sortList = sortList.concat(list1, list2, list0)
    }
    console.log('sortListsortListsortListv ', sortList)
    const resList:any = {}
    resList.list = sortList
    resList.total = sortList.length

    return resList
  }

  @Transactional
  async agentGetDetail(params): Promise<any> {
    const { agentPersonId } = params

    const condition = {
      where: {
        agentPersonId
      }
    }
    const result = await (this  as  any).query('AgentPerson', 'queryOneById', [condition])

    result.dataValues.timeInterval = `${getDate(result.startTime)} - ${getDate(result.endTime)}`
    if (result.recoveryStatus === 0 && new Date(result.startTime) > new Date()) {
      result.dataValues.status = 0
    } else if (
      result.recoveryStatus === 0 &&
      new Date(result.endTime) > new Date() &&
      new Date(result.startTime) < new Date()
    ) {
      result.dataValues.status = 1
    } else {
      result.dataValues.status = 2
    }
    const userIds = []
    userIds.push(result.agentUserId)
    // 获取用户列表信息列表
    const userList = await this.ctx.consulCurl('/isupm/api/userService/v1/user', 'isupm', 'upm', {
      method: 'POST',
      data: {
        userIds
      }
    })
    const userInfo = bufferToJson(userList.data).data
    console.log('userInfouserInfouserInfo', userInfo)
    if (!userInfo || userInfo.list.length <= 0) {
      throw Error((this.ctx.__('agentPerson.userInfpCanNotExit')))
    } else {
      // 下一步 通过userinfo 的 person_id
      result.dataValues.agentUser = userInfo.list[0].personName
    }
    delete result.dataValues.createTime
    delete result.dataValues.recoveryStatus
    delete result.dataValues.isDelete
    delete result.dataValues.endTime
    delete result.dataValues.startTime
    delete result.dataValues.updateTime
    // delete result.dataValues.submitterUserId
    // delete result.dataValues.agentUserId
    return result
  }

  @Transactional
  async agentAdd(params, userId): Promise<any> {
    const { agentUserId, startTime, endTime } = params
    const condition:any = {}
    condition.endTime = endTime
    condition.agentUserId = agentUserId
    condition.isDelete = 0
    condition.recoveryStatus = 0
    condition.startTime = startTime
    condition.submitterUserId = userId
    // app端权限移交未做权限限制，未勾选任何功能权限的人员也进入模块，提交请假申请的 bug
    if (!agentUserId || agentUserId === '') {
      throw new Error(this.ctx.__('agentPerson.checkAgentPerson'))
    }

    const condition1 = {
      userId,
      isDelete: 0,
      recoveryStatus: 0
    }
    const result1 = await (this  as  any).query('AgentPerson', 'queryDataById2', [condition1])

    const result2 = await (this  as  any).query('AgentPerson', 'queryDataById1', [condition1])

    if (result1.length > 0) {
      throw new Error(this.ctx.__('agentPerson.alreadyAfentNotEnd'))
    }

    if (result2.length > 0) {
      throw new Error(this.ctx.__('agentPerson.alreadyApplyLeave'))
    }
    console.log('result1', result1)

    console.log('result2', result2)
    const result = await (this  as  any).query('AgentPerson', 'createData', [condition])

    // const mqCondition = {
    //   endTime,
    //   startTime,
    //   agentUserId,
    //   userId
    // }
    // const mq = await this.ctx.service.mq.agentHandle(mqCondition, this.transaction)

    return result
  }
  @Transactional
  async agentWithdrawalOfLeave(params): Promise<any> {
    if (params && !params.agentPersonId) {
      throw Error(this.ctx.__('agentPerson.afferentAgentId'))
    }

    const condition = {
      where: {
        agentPersonId: params.agentPersonId,
        recoveryStatus: 1
      }
    }
    const result = await (this  as  any).query('AgentPerson', 'queryDataById', [condition])

    if (result && result.recoveryStatus) {
      throw Error(this.ctx.__('agentPerson.agentBack'))
    } else {
      const params1 = {
        recoveryStatus: 1,
        agentPersonId: params.agentPersonId
      }

      return await (this  as  any).query('AgentPerson', 'updateData', [params1])
    }
  }

  @Transactional
  async agentDelete(params): Promise<any> {
    if (params && !params.agentPersonId) {
      throw Error(this.ctx.__('agentPerson.afferentAgentId'))
    }

    const condition = {
      where: {
        agentPersonId: params.agentPersonId,
        isDelete: 1
      }
    }
    const result = await (this  as  any).query('AgentPerson', 'queryDataById', [condition])
    if (result && result.recoveryStatus) {
      throw Error(this.ctx.__('agentPerson.agentDelete'))
    } else {
      const params1 = {
        isDelete: 1,
        agentPersonId: params.agentPersonId
      }
      return await (this  as  any).query('AgentPerson', 'updateData', [params1])
    }
  }
}
