import {  Context, inject, provide} from 'midway';
import { IpdmsService } from '../app/interface/pdmsInterface';
const { Transactional } = require('../app/core/transactionalDeco/index')
async function handleUserRegionTreeData (data, that, userId) {
  const treeData:any = { lastPage: data.total <= data.pageNo * data.pageSize }
  for (const [ key, value ] of Object.entries(data)) {
    if (key === 'list') {
      if(Array.isArray(value)){
        const _value = value.map(item => {
          const resItem:any = {}
          for (const [ innerKey, innerValue ] of Object.entries(item)) {
            if (innerKey === 'parentIndexCode') {
              resItem.parentRegionId = innerValue
            } else if (innerKey === 'regionIndexCode') {
              resItem.regionId = innerValue
            } else if (innerKey === 'regionPath') {
              resItem[innerKey] = String(innerValue).replace(/,/g, '@')
            } else if (innerKey === 'childRegionStatus') {
              resItem.isLeaf = innerValue === 0
            } else {
              resItem[innerKey] = innerValue
            }
          }
          return resItem
        })
        treeData.rows = _value
      }
    } else {
      treeData[key] = value
    }
  }
  for (const i of treeData.rows) {
    const regionObj =
      (await that.treePathAndEegionType(
        i.regionPath || '',
        i.regionId || '',
        that.transaction
      )) || {}
    i.regionPathFullName = regionObj.regionPathName
    i.regionType = regionObj.regionType
  }
  if (userId) {
    const userIdArr = userId.split(',')
    console.log('2020623+++++++++++++++++', userIdArr)
    const userList = await that.getUsersByUserIds(userIdArr, that.transaction)
    console.log('2020622+++++++++++++++++', userList)
    const personIds = that.ctx.helper.dedupe(that.ctx.helper.bouncer(userList.list.map(item => item.personId)))
    const personListResult = await that.ctx.consulCurl(
      '/pdms/api/v1/model/tb_person/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo: 1,
          pageSize: 100,
          fields: '*',
          filedOptions: [
            {
              fieldName: 'person_id',
              fieldValue: personIds.join(','),
              type: 'in'
            }
          ]
        }
      }
    )
    if (personListResult) {
      const personList = that.ctx.helper.bufferToJson(personListResult && personListResult.data)

      console.log('2020621+++++++++++++++++', personList)
      const person =
        personList &&
        personList.data &&
        personList.data.list &&
        personList.data.list.length > 0 &&
        personList.data.list[0]
      console.log('2020620+++++++++++++++++', person)
      treeData.map = {}
      treeData.map.orgId = person.org_id
      treeData.map.orgPath = await that.treeOrgPath(
        person.org_path || '',
        that.transaction
      )
    }
  }
  return treeData
}
function handleUserOrgTreeData (data) {
  const treeData:any = { lastPage: data.total <= data.pageNo * data.pageSize }
  for (const [ key, value ] of Object.entries(data)) {
    if (key === 'list') {
      if(Array.isArray(value)){
        const _value = value.map(item => {
          const resItem:any = {}
          for (const [ innerKey, innerValue ] of Object.entries(item)) {
            if (innerKey === 'orgPath') {
              resItem[innerKey] = String(innerValue).replace(/\//g, '@')
            } else if (innerKey === 'childOrgStatus') {
              resItem.isLeaf = innerValue === 0
            } else {
              resItem[innerKey] = innerValue
            }
          }
          return resItem
        })
        treeData.rows = _value
      }
    } else {
      treeData[key] = value
    }
  }
  return treeData
}
@provide('pdmsService')
export class PdmsService implements IpdmsService {
  @inject()
  ctx: Context;
  @Transactional
  async getEventTypeOptions (params:any): Promise<any> {
    const dictName = []
    const { dictCodeOrDictName } = params
    if (dictCodeOrDictName) {
      const dictCode = dictCodeOrDictName.split(',')
      for (let i = 0; i <= dictCode.length; i++) {
        const result = await (this as any).app.consulCurl(
          '/pdms/api/v1/model/tb_ai_event_type/records',
          'pdms',
          'pdmsweb',
          {
            method: 'get',
            data: { dictCodeOrDictName: dictCode[i] }
          }
        );
        (this as any).app.resDataTrans(result)
        console.log('result.data', result.data)

        console.log(`获取pdms 数据字典 数据:  ${result} `)

        if (result.data.data && result.data.data.length > 0) {
          dictName.push(result.data.data[0].dictName)
        }
      }
    }
    if (dictName && dictName.length) {
      return dictName.join(',')
    }
    return ''
  }

  /**
   * 动环展示
   */

  @Transactional
  async donghuanShowPdms (params) {
    const { modelDataId } = params
    // 获取tb_sensor_info
    const filedOptions = [
      {
        fieldName: 'model_data_id',
        fieldValue: modelDataId,
        type: 'eq'
      }
    ]
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_sensor_info/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo: 1,
          pageSize: 1000,
          fields: 'name,alarm_low,alarm_high,unit,sensor_type',
          filedOptions
        }
      }
    )
    return this.ctx.helper.bufferToJson(result.data).data
  }
  /**
   * 消息全部已读
   */

  @Transactional
  async updateAllMessageReadFlag (params:any): Promise<any> {
    const { userId } = params
    const result = await this.ctx.consulCurl('/tlnc/api/v2/message/clearance', 'tlnc', 'tlncweb', {
      method: 'POST',
      data: { userId }
    })
    return this.ctx.helper.bufferToJson(result.data).data
  }
  /**
   * 代办删除接口
   */

  @Transactional
  async agencyDelete (params:any): Promise<any> {
    const {
      apiType = 'app', userId, relativeId, taskId
    } = params

    let messageId = ''
    // relativeid是问题模块得代办
    if (relativeId) {
      const condition = {
        where: {
          relativeId,
          isDelete: 0
        }
        // attributes: []
      }
      const response = await (this as any).query('TransactionFlow', 'findOneData', [ condition ])
      messageId = response && response.dataValues.transactionId
    } else if (taskId) {
      messageId = taskId
    }
    if (messageId) {
      this.ctx.hikLogger.debug(this.ctx.__('pdms.readyDeleteId') + messageId)
      this.ctx.hikLogger.debug({
        apiType,
        messageId,
        userId
      })
      const result = await this.ctx.consulCurl('/tlnc/api/v2/todo/delete', 'tlnc', 'tlncweb', {
        method: 'POST',
        data: {
          apiType,
          messageId,
          userId
        }
      })
      return this.ctx.helper.bufferToJson(result.data).data
    }
    // 获取用户列表信息列表
  }
  /**
   * 消息删除接口
   */

  @Transactional
  async messageDelete (params:any): Promise<any> {
    const {
      apiType = 'app', userId, relativeId, taskId
    } = params

    let messageId = ''
    // relativeid是问题模块得代办
    if (relativeId) {
      const condition = {
        where: {
          relativeId,
          isDelete: 0
        }
        // attributes: []
      }
      const response = await (this as any).query('TransactionFlow', 'findOneData', [ condition ])
      messageId = response && response.dataValues.transactionId
    } else if (taskId) {
      messageId = taskId
    }
    if (messageId) {
      const result = await this.ctx.consulCurl('/tlnc/api/v2/message/delete', 'tlnc', 'tlncweb', {
        method: 'POST',
        data: {
          apiType,
          messageId,
          userId
        }
      })
      return this.ctx.helper.bufferToJson(result.data).data
    }
  }
  /**
   * 消息删除接口
   */

  @Transactional
  async synchTreeData (params:any): Promise<any> {
    let result = {}
    for (const item of params) {
      result = await (this as any).query('Pdms', 'createData', [ item ])
    }
    return result
  }
  /**
   * 查询区域信息
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async getRegionInfo (params:any) {
    const pageNo = 1
    const pageSize = 1000
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_region/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo,
          pageSize,
          fields:
            'model_data_id,parent_region_id,region_id,region_name,region_path,description,update_time,create_time',
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
    if (!result) {
      const error = new Error(this.ctx.__('pdms.pmdsNoData'))
      throw error
    }
    if (result.status !== 200) {
      const error:any = new Error(this.ctx.__('pdms.pmdsServiceError'))
      error.status = result.status
      throw error
    }
    const res = this.ctx.helper.bufferToJson(result.data)
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    const responseData = this.ctx.helper.handleData(res.data)
    return responseData.rows[0]
  }

  /**
   * 获取教育类型
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */

  @Transactional
  async getAiEventTypeName (params:any): Promise<any> {
    const pageNo = 1
    const pageSize = 1000
    const { dictCodeOrDictName } = params
    this.ctx.hikLogger.info('请求数据模型/pdms/api/v1/model/tb_ai_event_type/records')
    this.ctx.hikLogger.info(params)
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_ai_event_type/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo,
          pageSize,
          fields: 'event_name',
          filedOptions: [
            {
              fieldName: 'event_type',
              fieldValue: dictCodeOrDictName,
              type: 'in'
            }
          ]
        }
      }
    )
    const responseData = this.ctx.helper.bufferToJson(result.data)
    if (responseData.code !== '0') {
      this.ctx.hikLogger.info('请求数据模型/pdms/api/v1/model/tb_ai_event_type/records失败参数')
      this.ctx.hikLogger.info(dictCodeOrDictName)
      return ''
    }
    this.ctx.hikLogger.info('请求数据模型/pdms/api/v1/model/tb_ai_event_type/records返回的参数')
    this.ctx.hikLogger.info(responseData)
    let eventNameStr = ''
    if (responseData && responseData.data && responseData.data.list && responseData.data.list && responseData.data.list.length > 0) {
      eventNameStr = responseData.data.list.map(item => item.event_name).join(',')
    }
    return eventNameStr
  }

  @Transactional
  async getRegionEduRegionType (params:any): Promise<any> {
    const pageNo = 1
    const pageSize = 1000
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_region/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo,
          pageSize,
          fields: 'model_data_id,region_name,edu_region_type',
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
    const responseData = this.ctx.helper.bufferToJson(result.data)
    const res = this.ctx.helper.handleData(responseData.data)
    return res.rows[0]
  }
  /**
   * 查询区域路径
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */

  @Transactional
  async treePath (params:string): Promise<any> {
    // 传入的参数可能为空，为空时不能读取replace方法，会报错
    if (!params) {
      return ''
    }
    const reg = /^\@|\@$/g
    const _regionPathArr = params.replace(reg, '').split('@')
    const pageNo = 1
    const pageSize = 10000
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_region/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo,
          pageSize,
          fields:
            'model_data_id,parent_region_id,region_id,region_name,region_path,description,update_time,create_time',
          filedOptions: [
            {
              fieldName: 'region_id',
              fieldValue: _regionPathArr.join(','),
              type: 'in'
            }
          ]
        }
      }
    )
    if (!result) {
      const error = new Error(this.ctx.__('pdms.pmdsServiceError'))
      throw error
    }
    if (result.status !== 200) {
      const error:any = new Error(this.ctx.__('pdms.pmdsUseError'))
      error.status = result.status
      throw error
    }
    const res = this.ctx.helper.bufferToJson(result.data)
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    const responseData = this.ctx.helper.handleData(res.data)

    responseData.rows.sort((prev, next) => {
      return _regionPathArr.indexOf(prev.regionId) - _regionPathArr.indexOf(next.regionId)
    })

    const treePath = responseData.rows.map(item => {
      return item.regionName
    })
    return this.ctx.helper.bouncer(treePath).join('/')
  }
  /**
   * 查询组织路径
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async treeOrgPath (params:any, transaction?:any): Promise<any> {
    // 传入的参数可能为空，为空时不能读取replace方法，会报错
    if (!params) {
      return ''
    }
    const reg = /^\@|\@$/g
    const _orgPathArr = params.replace(reg, '').split('@')
    const pageNo = 1
    const pageSize = 10000
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_org/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo,
          pageSize,
          fields:
            'parent_org_id,org_id,org_code,org_name,dis_order,org_path,model_data_id,update_time,create_time',
          filedOptions: [
            {
              fieldName: 'org_id',
              fieldValue: _orgPathArr.join(','),
              type: 'in'
            }
          ]
        }
      }
    )
    if (!result) {
      const error = new Error(this.ctx.__('pdms.pmdsServiceError'))
      throw error
    }
    if (result.status !== 200) {
      const error:any = new Error(this.ctx.__('pdms.pmdsUseError'))
      error.status = result.status
      throw error
    }
    const res = this.ctx.helper.bufferToJson(result.data)
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    const responseData = this.ctx.helper.handleData(res.data)

    responseData.rows.sort((prev, next) => {
      return _orgPathArr.indexOf(prev.orgId) - _orgPathArr.indexOf(next.orgId)
    })

    const treePath = responseData.rows.map(item => {
      return item.orgName
    })
    return this.ctx.helper.bouncer(treePath).join('/')
  }
  @Transactional
  async synchTreeDataById (params:any): Promise<any> {
    const condition = { where: { regionPath: params.regionPath } }
    const result = await (this as any).query('Pdms', 'queryDataById', [ condition ])
    return result
  }
  /**
   * 根据用户userIds集合获取用户列表
   * @param {string} { userIds, 逗号分隔 }
   * @return {object|null} - 用户列表
   */

  @Transactional
  async getUsersByUserIds (userIds:any, transaction?:any): Promise<any> {
    console.log('userIdsssss', userIds)
    // 获取用户列表信息列表
    const userList = await this.ctx.consulCurl('/isupm/api/userService/v1/user', 'isupm', 'upm', {
      method: 'POST',
      data: { userIds }
    })
    return this.ctx.helper.bufferToJson(userList.data).data
  }
  /**
   * 根据人员信息personId集合获取用户列表
   * @param {string} { personIndexCodeList, 数组集合 }
   * @return {object|null} - 用户列表
   */
  @Transactional
  async getUsersByPersonIds (personIds:any): Promise<any> {
    console.log('personIds', personIds)
    // 获取用户列表信息列表
    const userList = await this.ctx.consulCurl(
      '/isupm/api/userService/v1/person/users',
      'isupm',
      'upm',
      {
        method: 'POST',
        data: { personIds }
      }
    )
    return this.ctx.helper.bufferToJson(userList.data).data
  }
  /**
   * pdms
   * 根据组织获取该组织下的人员列表
   */
  @Transactional
  async getUserListByOrgId (params:any): Promise<any> {
    let {
      orgId = -1, pageNo = 1, pageSize = 1000, include
    } = params
    let total
    let totalPage
    let personList
    let resultPersonList = []
    const paramsData:any = {
      pageNo,
      pageSize,
      fields: '*'
    }
    if (include && include === '1') {
      paramsData.filedOptions = [
        {
          fieldName: 'org_path',
          fieldValue: orgId,
          type: 'like'
        }
      ]
    } else {
      paramsData.filedOptions = [
        {
          fieldName: 'org_id',
          fieldValue: orgId,
          type: 'eq'
        }
      ]
    }
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_person/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: paramsData
      }
    )
    if (!result) {
      const error = new Error(this.ctx.__('pdms.pmdsServiceError'))
      throw error
    }
    if (result.status !== 200) {
      const error:any = new Error(this.ctx.__('pdms.pmdsUseError'))
      error.status = result.status
      throw error
    }
    personList = this.ctx.helper.bufferToJson(result && result.data)
    if (personList.code !== '0') {
      const error = new Error(personList.msg)
      throw error
    }
    total = personList && personList.data && personList.data.total
    totalPage = Math.ceil(total / pageSize)
    resultPersonList = personList && personList.data && personList.data.list
    for (let i = pageNo; i < totalPage; i++) {
      pageNo = pageNo + 1
      const res = await this.ctx.consulCurl(
        '/pdms/api/v1/model/tb_person/records',
        'pdms',
        'pdmsweb',
        {
          method: 'POST',
          data: paramsData
        }
      )
      resultPersonList = [ ...resultPersonList, ...this.ctx.helper.bufferToJson(res.data).data.list ]
    }
    const resultList = []
    const personIds = resultPersonList.map(item => item.person_id)
    const userList =
      personIds && personIds.length > 0
        ? await this.getUserListByPersonIds(personIds, (this as any).transaction)
        : []
    if (userList && userList.list && userList.list.length > 0) {
      const userListData = []
      for (const item of userList.list) {
        const userRoles = await this.getUserRolesListByUserName(
          item.userName,
          (this as any).transaction
        )
        userListData.push(
          Object.assign({}, item, { roleNames: userRoles.map(item => item.roleName).join(',') })
        )
      }
      resultPersonList = resultPersonList.map(item => {
        const resItem = {}
        for (const [ innerKey, innerValue ] of Object.entries(item)) {
          resItem[this.ctx.helper.toHump(innerKey)] = innerValue
        }
        return resItem
      })
      for (const item of userListData) {
        const currentInfo = resultPersonList.find(v => v.personId === item.personId)
        item.orgName = await this.treeOrgPath(currentInfo.orgId || '', (this as any).transaction)
        if (currentInfo) {
          resultList.push(
            Object.assign({}, item, {
              orgId: currentInfo.orgId,
              mobile: currentInfo.mobile,
              jobNo: currentInfo.jobNo,
              pinyin: currentInfo.pinyin,
              sex: currentInfo.sex,
              certType: currentInfo.certType,
              certificateNo: currentInfo.certificateNo
            })
          )
        }
      }
    }
    return {
      list: resultList,
      total: resultList.length
    }
  }
  /**
   * 根据用户名userName获取该用户的角色列表
   */
  @Transactional
  async getUserRolesListByUserName (userName:any, transaction?:any): Promise<any> {
    const userRolesList = await this.ctx.consulCurl(
      '/isupm/api/roleService/v1/user/roles',
      'isupm',
      'upm',
      {
        method: 'GET',
        data: { userName }
      }
    )
    if (!userRolesList) {
      const error = new Error(this.ctx.__('pdms.isupmServiceError'))
      throw error
    }
    if (userRolesList.status !== 200) {
      const error:any = new Error(this.ctx.__('pdms.userNameGetRoleError'))
      error.status = userRolesList.status
      throw error
    }
    const res = this.ctx.helper.bufferToJson(userRolesList.data)
    if (!res) {
      const error = new Error(this.ctx.__('pdms.userNameGetRoleNoData'))
      throw error
    }
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    const roleList = res.data && res.data.list ? res.data.list : []
    return roleList
  }
  /**
   * 根据人员ID获取关联该人员的用户
   */
  @Transactional
  async getUserListByPersonIds (personIdList:any, transaction?:any): Promise<any> {
    // 获取用户列表信息列表
    const userList = await this.ctx.consulCurl(
      '/isupm/api/userService/v1/person/users',
      'isupm',
      'upm',
      {
        method: 'POST',
        data: { personIdList }
      }
    )
    if (!userList) {
      const error = new Error(this.ctx.__('pdms.isupmServiceBackError'))
      throw error
    }
    if (userList.status !== 200) {
      const error:any = new Error(this.ctx.__('pdms.isupmPersonId'))
      error.status = userList.status
      throw error
    }
    const res = this.ctx.helper.bufferToJson(userList.data)
    if (!res) {
      const error = new Error(this.ctx.__('pdms.isupmPersonIdNoDataBack'))
      throw error
    }
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    return res.data
  }
  /**
   * upm
   * 根据roleId获取该角色下的人员列表信息
   */
  @Transactional
  async getPersonListByRoleIdNoUserId (roleId:any): Promise<any> {
    const result = await this.ctx.consulCurl(
      '/isupm/api/roleService/v1/role/users',
      'isupm',
      'upm',
      {
        method: 'GET',
        data: { roleId }
      }
    )
    if (result.status !== 200) {
      const error:any = new Error(this.ctx.__('pdms.rolePersonListError'))
      error.status = result.status
      throw error
    }
    const res = this.ctx.helper.bufferToJson(result.data)
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    const personInfoList = []
    if (res.data && res.data.list && res.data.list.length > 0) {
      const personIds = this.ctx.helper.dedupe(this.ctx.helper.bouncer(res.data.list.map(item => item.personId)))
      const personList = await this.getPersonListByPersonIds(
        { personIds: personIds.join(',') },
        (this as any).transaction
      )
      for (const item of res.data.list) {
        const currentInfo = personList.find(v => v.person_id === item.personId)
        const userRoles = await this.getUserRolesListByUserName(
          item.userName,
          (this as any).transaction
        )
        if (currentInfo) {
          item.orgName = await this.treeOrgPath(
            currentInfo.org_id || '',
            (this as any).transaction
          )
          personInfoList.push(
            Object.assign({}, item, {
              sex: currentInfo.sex,
              certType: currentInfo.cert_type,
              certificateNo: currentInfo.certificate_no,
              jobNo: currentInfo.job_no,
              mobile: currentInfo.mobile,
              orgId: currentInfo.org_id,
              roleNames: userRoles.map(item => item.roleName).join(',')
            })
          )
        } else {
          item.orgName = null
          personInfoList.push(
            Object.assign({}, item, {
              sex: null,
              certType: null,
              certificateNo: null,
              jobNo: null,
              mobile: null,
              orgId: null,
              roleNames: userRoles.map(item => item.roleName).join(',')
            })
          )
        }
      }
    }
    return personInfoList
  }
  /**
   * upm
   * 根据roleId获取该角色下的人员列表信息
   */
  @Transactional
  async getPersonListByRoleId (roleId:any): Promise<any> {
    const { ctx } = this
    const result = await this.ctx.consulCurl(
      '/isupm/api/roleService/v1/role/users',
      'isupm',
      'upm',
      {
        method: 'GET',
        data: { roleId }
      }
    )
    if (!result) {
      const error = new Error(this.ctx.__('pdms.isupmServiceError'))
      throw error
    }
    if (result.status !== 200) {
      const error:any = new Error(this.ctx.__('pdms.isupmServicePersonBackError'))
      error.status = result.status
      throw error
    }
    const res = this.ctx.helper.bufferToJson(result.data)
    if (!res) {
      const error = new Error(this.ctx.__('pdms.isupmServicePersonNoData'))
      throw error
    }
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    let personInfoList = []
    if (res.data && res.data.list && res.data.list.length > 0) {
      const personIds = this.ctx.helper.dedupe(this.ctx.helper.bouncer(res.data.list.map(item => item.personId)))
      const personList = await this.getPersonListByPersonIds(
        { personIds: personIds.join(',') },
        (this as any).transaction
      )
      for (const item of res.data.list) {
        const currentInfo = personList.find(v => v.person_id === item.personId)
        const userRoles = await this.getUserRolesListByUserName(
          item.userName,
          (this as any).transaction
        )
        if (currentInfo) {
          item.orgName = await this.treeOrgPath(
            currentInfo.org_id || '',
            (this as any).transaction
          )
          personInfoList.push(
            Object.assign({}, item, {
              sex: currentInfo.sex,
              certType: currentInfo.cert_type,
              certificateNo: currentInfo.certificate_no,
              jobNo: currentInfo.job_no,
              mobile: currentInfo.mobile,
              orgId: currentInfo.org_id,
              roleNames: userRoles.map(item => item.roleName).join(',')
            })
          )
        }
      }
    }
    const userId = ctx.getUserId() || ctx.header.userids
    if (userId) {
      // 获取该用户有权限的区域列表
      const orgList = await this.getOrgByUserName(
        { userId },
        (this as any).transaction
      )
      const orgIdLimit =
        orgList && orgList.list ? orgList.list.filter(n => n.orgStatus === 1).map(v => v.orgId) : []
      personInfoList = personInfoList.filter(v => orgIdLimit.includes(v.orgId) || !v.orgId)
    }
    return personInfoList
  }
  /**
   * 根据userID聚合用户和人员信息
   */
  @Transactional
  async getUserInfoList (userIds:any): Promise<any> {
    const userList = await this.getUsersByUserIds(userIds, (this as any).transaction)
    const personIds = this.ctx.helper.dedupe(this.ctx.helper.bouncer(userList.list.map(item => item.personId)))
    const personList = await this.getPersonListByPersonIds(
      { personIds: personIds.join(',') },
      (this as any).transaction
    )
    const personInfoList = []
    for (const item of userList.list) {
      const currentInfo = personList.find(v => v.person_id === item.personId)
      const userRoles =
        (await this.getUserRolesListByUserName(item.userName, (this as any).transaction)) || []
      if (currentInfo) {
        item.orgName = await this.treeOrgPath(
          currentInfo.org_id || '',
          (this as any).transaction
        )
        personInfoList.push(
          Object.assign({}, item, {
            sex: currentInfo.sex,
            certType: currentInfo.cert_type,
            certificateNo: currentInfo.certificate_no,
            jobNo: currentInfo.job_no,
            mobile: currentInfo.mobile,
            orgId: currentInfo.org_id,
            roleNames: userRoles.map(item => item.roleName).join(',')
          })
        )
      } else {
        item.orgName = ''
        personInfoList.push(
          Object.assign({}, item, {
            sex: null,
            certType: null,
            certificateNo: null,
            jobNo: null,
            mobile: null,
            orgId: null,
            roleNames: userRoles.map(item => item.roleName).join(',')
          })
        )
      }
    }
    return personInfoList
  }
  /**
   * 获取全部角色列表
   */
  @Transactional
  async getAllRoles (params) {
    let { roleName = '', pageNo = 1, pageSize = 1000 } = params
    let total
    let totalPage
    let roleList
    let resultRoleList = []
    const result = await this.ctx.consulCurl(
      '/isupm/api/roleService/v1/role/page',
      'isupm',
      'upm',
      {
        method: 'GET',
        data: {
          roleName,
          pageNo,
          pageSize
        }
      }
    )
    roleList = this.ctx.helper.bufferToJson(result && result.data)
    total = roleList && roleList.data && roleList.data.total
    totalPage = Math.ceil(total / pageSize)
    resultRoleList = roleList && roleList.data && roleList.data.list
    for (let i = pageNo; i < totalPage; i++) {
      pageNo = pageNo + 1
      const res = await this.ctx.consulCurl('/isupm/api/roleService/v1/role/page', 'isupm', 'upm', {
        method: 'GET',
        data: {
          roleName,
          pageNo,
          pageSize
        }
      })
      resultRoleList = [ ...resultRoleList, ...this.ctx.helper.bufferToJson(res.data).data.list ]
    }
    return resultRoleList
  }
  /**
   * 根据personID获取人员信息
   */
  @Transactional
  async getPersonListByPersonIds (params:any, transaction?:any): Promise<any> {
    let { personIds = '', pageNo = 1, pageSize = 1000 } = params
    let total
    let totalPage
    let personList
    let resultPersonList = []
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_person/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo,
          pageSize,
          fields: '*',
          filedOptions: [
            {
              fieldName: 'person_id',
              fieldValue: personIds,
              type: 'in'
            }
          ]
        }
      }
    )
    personList = this.ctx.helper.bufferToJson(result && result.data)
    total = personList && personList.data && personList.data.total
    totalPage = Math.ceil(total / pageSize)
    resultPersonList = personList && personList.data && personList.data.list
    for (let i = pageNo; i < totalPage; i++) {
      pageNo = pageNo + 1
      const res = await this.ctx.consulCurl(
        '/pdms/api/v1/model/tb_person/records',
        'pdms',
        'pdmsweb',
        {
          method: 'POST',
          data: {
            pageNo,
            pageSize,
            fields: '*',
            filedOptions: [
              {
                fieldName: 'person_id',
                fieldValue: personIds,
                type: 'in'
              }
            ]
          }
        }
      )
      resultPersonList = [ ...resultPersonList, ...this.ctx.helper.bufferToJson(res.data).data.list ]
    }
    return resultPersonList
  }
  /**
   * 根据用户personIds集合获取用户关联的人员信息列表
   * @param {array} { userIds }
   * @return {object|null} - 用户列表
   */

  @Transactional
  async getPersonsByPersonIds (params:any): Promise<any> {
    console.log('getPersonsByPersonIds', params)
    const personList = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_person/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo: params.pageNo || 1,
          pageSize: params.pageSize || 1000,
          fields: '*',
          filedOptions: [
            {
              fieldName: 'person_id',
              fieldValue: params.personIds,
              type: 'in'
            }
          ]
        }
      }
    )
    return this.ctx.helper.bufferToJson(personList.data).data
  }

  /**
   * 巡检对象保存到pdms（地图）
   */

  @Transactional
  async patrolObjPdmsAdd (params:any = []): Promise<any> {
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_patrol_obj/add',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        headers: {
          comId: '1',
          userId: '2'
        },
        data: params
      }
    )
    const responseData = this.ctx.helper.bufferToJson(result.data)
    return this.ctx.helper.bufferToJson(responseData)
  }
  /**
   * 巡检对象自定义pdms
   */

  @Transactional
  async patrolObjPdmsCumAdd (dataParams:any,pdmsStr:any): Promise<any> {
    const result = await this.ctx.consulCurl(pdmsStr, 'pdms', 'pdmsweb', {
      method: 'POST',
      headers: {
        comId: '1',
        userId: '2'
      },
      data: dataParams
    })
    const responseData = this.ctx.helper.bufferToJson(result.data)
    return responseData
  }
  /**
   * 删除巡检对象pdms
   * @param {array} { userIds }
   * @return {object|null} - 用户列表
   */

  @Transactional
  async patrolObjPdmsDel (params:any = []): Promise<any> {
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_patrol_obj/delete',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        headers: {
          comId: '1',
          userId: '2'
        },
        data: { modelDataIds: params }
      }
    )
    const responseData = this.ctx.helper.bufferToJson(result.data)
    return this.ctx.helper.bufferToJson(responseData)
  }

  /**
   * 修改巡检对象pdms地图
   * @param {array} { userIds }
   * @return {object|null} - 用户列表
   */

  @Transactional
  async patrolObjPdmsUpdate (params:any = []): Promise<any> {
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_patrol_obj/update',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        headers: {
          comId: '1',
          userId: '2'
        },
        data: params
      }
    )
    const responseData = this.ctx.helper.bufferToJson(result.data)
    return this.ctx.helper.bufferToJson(responseData)
  }

  /**
   * 修改pdms
   * @param {array} { userIds }
   * @return {object|null} - 用户列表
   */

  @Transactional
  async patrolObjPdmsUpdateAll (params:any = [], str:any): Promise<any> {
    const result = await this.ctx.consulCurl(str, 'pdms', 'pdmsweb', {
      method: 'POST',
      headers: {
        comId: '1',
        userId: '2'
      },
      data: params
    })
    const responseData = this.ctx.helper.bufferToJson(result.data)
    return this.ctx.helper.bufferToJson(responseData)
  }
  /**
   * 异步区域树获取列表
   * @param {array} { parentId,pageNo,pageSize }
   * @return {object|null} - 区域列表
   */
  @Transactional
  async asyncRegionTree (params:any, transaction?:any): Promise<any> {
    const { parentId = -1, pageNo = 1, pageSize = 1000 } = params
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_region/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo,
          pageSize,
          fields:
            'model_data_id,parent_region_id,region_id,region_name,region_path,description,update_time,create_time,region_type',
          filedOptions: [
            {
              fieldName: 'parent_region_id',
              fieldValue: parentId,
              type: 'eq'
            }
          ]
        }
      }
    )
    if (!result) {
      const error = new Error(this.ctx.__('pdms.pdmsUseNoData'))
      throw error
    }
    if (result && result.status && result.status !== 200) {
      const error:any = new Error(this.ctx.__('pdms.pdmsUseError'))
      error.status = result.status
      throw error
    }
    const res = this.ctx.helper.bufferToJson(result.data)
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }

    const handleDataList = this.ctx.helper.handleData(res.data)
    for (const i of handleDataList.rows) {
      i.regionPathFullName = await this.treePath(i.regionPath || '')
    }

    return handleDataList
  }

  /**
   * 获取用户当前能用的社区列表
   */
  @Transactional
  async visibleCommunityList (params:any): Promise<any> {
    const { regionType = 2 } = params
    const userId = this.ctx.getUserId()
    const midResult = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_region/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo: 1,
          pageSize: 1000,
          filedOptions: [
            {
              fieldName: 'region_type',
              fieldValue: regionType,
              type: 'eq'
            }
          ]
        }
      }
    )
    const result = this.ctx.helper.bufferToJson(midResult.data).data.list
    console.log(`-------------------社区树${result}--------------------`)
    const region = []
    if (result.length) {
      result.forEach(item => {
        region.push(item.region_id)
      })
      return await this.getCommunityRegionByUserName(region, userId, result)
    }
    return []
  }

  // 获取用户有权限的区域同时是社区的区域
  async getCommunityRegionByUserName (indexCode:any,userId:any,regionData:any): Promise<any> {
    const result = await this.ctx.consulCurl(
      `/isupm/api/privilegeService/v1/regions/multiverify?privilegeCode=view&resourceType=region&userId=${userId}`,
      'isupm',
      'upm',
      {
        method: 'POST',
        data: indexCode
      }
    )
    if (!result) {
      const error = new Error(this.ctx.__('pdms.upmNoData'))
      throw error
    }
    if (result && result.status && result.status !== 200) {
      const error:any = new Error(this.ctx.__('pdms.userNamePerError'))
      error.status = result.status
      throw error
    }
    const res = this.ctx.helper.bufferToJson(result.data)
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    const authorityData = res.data.list
    if (authorityData.length) {
      const data = []
      regionData.forEach(item => {
        authorityData.forEach(itm => {
          item.region_id === itm && data.push(item)
        })
      })
      return data
    }
    return []
  }

  /**
   * 异步区域树获取列表查询—模糊查询
   * @param {array} { searchName }
   * @return {object|null} - 区域列表
   */
  @Transactional
  async asyncRegionTreeSearch (params:any, transaction?:any): Promise<any> {
    const { searchName, pageNo = 1, pageSize = 1000 } = params
    const searchArr = []
    const midResult = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_region/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo,
          pageSize,
          fields:
            'model_data_id,parent_region_id,region_id,region_name,region_path,description,update_time,create_time,region_type',
          filedOptions: [
            {
              fieldName: 'region_name',
              fieldValue: searchName,
              type: 'like'
            }
          ]
        }
      }
    )
    if (!midResult) {
      const error = new Error(this.ctx.__('pdms.pdmsServiceError'))
      throw error
    }
    if (midResult.status !== 200) {
      const error:any = new Error(this.ctx.__('pdms.areaErrorMidRes'))
      error.status = midResult.status
      throw error
    }
    const midRes = this.ctx.helper.bufferToJson(midResult.data)
    if (midRes.code !== '0') {
      const error = new Error(midRes.msg)
      throw error
    }
    midRes.data.list.forEach(item => {
      const reg = /^\@|\@$/g
      const _regionPath = item.region_path.replace(reg, '')
      const arr = _regionPath.split('@')
      searchArr.push(...arr)
    })
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_region/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo,
          pageSize,
          fields:
            'model_data_id,parent_region_id,region_id,region_name,region_path,description,update_time,create_time,region_type',
          filedOptions: [
            {
              fieldName: 'region_id',
              fieldValue: this.ctx.helper.dedupe(searchArr).join(','),
              type: 'in'
            }
          ]
        }
      }
    )
    if (!result) {
      const error = new Error(this.ctx.__('pdms.pdmsErrorResult'))
      throw error
    }
    if (result.status !== 200) {
      const error:any = new Error(this.ctx.__('pdms.originErrorResult'))
      error.status = result.status
      throw error
    }
    const res = this.ctx.helper.bufferToJson(result.data)
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    return this.ctx.helper.handleData(res.data)
  }
  /**
   * 异步组织树获取列表
   * @param {array} { parentId,pageNo,pageSize }
   * @return {object|null} - 区域列表
   */
  @Transactional
  async asyncOrgTree (params:any, transaction?:any): Promise<any> {
    const { parentId = -1, pageNo = 1, pageSize = 1000 } = params
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_org/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo,
          pageSize,
          fields:
            'parent_org_id,org_id,org_code,org_name,dis_order,org_path,model_data_id,update_time,create_time',
          filedOptions: [
            {
              fieldName: 'parent_org_id',
              fieldValue: parentId,
              type: 'eq'
            }
          ]
        }
      }
    )
    if (!result) {
      const error = new Error(this.ctx.__('pdms.pdmsUseNoData'))
      throw error
    }
    if (result && result.status && result.status !== 200) {
      const error:any = new Error(this.ctx.__('pdms.pdmsUseError'))
      error.status = result.status
      throw error
    }
    const res = this.ctx.helper.bufferToJson(result.data)
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    return this.ctx.helper.handleData(res.data)
  }
  /**
   * 异步组织树获取列表查询—模糊查询
   * @param {array} { searchName }
   * @return {object|null} - 区域列表
   */
  @Transactional
  async asyncOrgTreeSearch (params:any, transaction?:any): Promise<any> {
    const { searchName, pageNo = 1, pageSize = 1000 } = params
    const searchArr = []
    const midResult = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_org/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo,
          pageSize,
          fields:
            'parent_org_id,org_id,org_code,org_name,dis_order,org_path,model_data_id,update_time,create_time',
          filedOptions: [
            {
              fieldName: 'org_name',
              fieldValue: searchName,
              type: 'like'
            }
          ]
        }
      }
    )
    if (!midResult) {
      const error = new Error(this.ctx.__('pdms.pdmsServiceError'))
      throw error
    }
    if (midResult.status !== 200) {
      const error:any = new Error(this.ctx.__('pdms.originErrorMidRes'))
      error.status = midResult.status
      throw error
    }
    const midRes = this.ctx.helper.bufferToJson(midResult.data)
    if (midRes.code !== '0') {
      const error = new Error(midRes.msg)
      throw error
    }
    midRes.data.list.forEach(item => {
      const reg = /^\@|\@$/g
      const _org_path = item.org_path.replace(reg, '')
      const arr = _org_path.split('@')
      searchArr.push(...arr)
    })
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_org/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo,
          pageSize,
          fields:
            'parent_org_id,org_id,org_code,org_name,dis_order,org_path,model_data_id,update_time,create_time',
          filedOptions: [
            {
              fieldName: 'org_id',
              fieldValue: this.ctx.helper.dedupe(searchArr).join(','),
              type: 'in'
            }
          ]
        }
      }
    )
    if (!result) {
      const error = new Error(this.ctx.__('pdms.pdmsErrorResult'))
      throw error
    }
    if (result.status !== 200) {
      const error:any = new Error(this.ctx.__('pdms.originTrueResult'))
      error.status = result.status
      throw error
    }
    const res = this.ctx.helper.bufferToJson(result.data)
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    return this.ctx.helper.handleData(res.data)
  }
  /**
   * upm
   * 用户名userId获取该用户的有权限的全部区域
   * @param {array} { userId }
   * @return {object|null} - 区域列表
   */
  @Transactional
  async getAllRegionByUserName (params:any): Promise<any> {
    const { userId, pageNo = 1, pageSize = 1000 } = params
    let total
    let totalPage
    let resultList = []
    const _data = {
      pageNo,
      pageSize,
      privilegeCode: 'view',
      resourceType: 'region',
      userId
    }
    const result = await this.ctx.consulCurl(
      '/isupm/api/privilegeService/v1/regions/list',
      'isupm',
      'upm',
      {
        method: 'GET',
        data: _data
      }
    )
    if (!result) {
      const error = new Error(this.ctx.__('pdms.upmNoData'))
      throw error
    }
    if (result && result.status && result.status !== 200) {
      const error:any = new Error(this.ctx.__('pdms.userNamePerError'))
      error.status = result.status
      throw error
    }
    const res = this.ctx.helper.bufferToJson(result.data)
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    total = res && res.data && res.data.total
    totalPage = Math.ceil(total / pageSize)
    resultList = res && res.data && res.data.list
    for (let i = pageNo; i < totalPage; i++) {
      _data.pageNo = _data.pageNo + 1
      const res = await this.ctx.consulCurl(
        '/isupm/api/privilegeService/v1/regions/list',
        'isupm',
        'upm',
        {
          method: 'GET',
          data: _data
        }
      )
      resultList = [ ...resultList, ...this.ctx.helper.bufferToJson(res.data).data.list ]
    }
    return resultList
  }
  /**
   * upm
   * 用户名userId获取该用户的有权限的区域
   * @param {array} { userId }
   * @return {object|null} - 区域列表
   */
  @Transactional
  async getRegionByUserName (params:any, transaction?:any): Promise<any> {
    const {
      userId, parentIndexCode, pageNo = 1, pageSize = 1000
    } = params
    const _data:any = {
      pageNo,
      pageSize,
      privilegeCode: 'view',
      resourceType: 'region',
      userId
    }
    if (parentIndexCode) _data.parentIndexCode = parentIndexCode
    const result = await this.ctx.consulCurl(
      '/isupm/api/privilegeService/v1/regions/list',
      'isupm',
      'upm',
      {
        method: 'GET',
        data: _data
      }
    )
    if (!result) {
      const error = new Error(this.ctx.__('pdms.upmNoData'))
      throw error
    }
    if (result && result.status && result.status !== 200) {
      const error:any = new Error(this.ctx.__('pdms.userNamePerError'))
      error.status = result.status
      throw error
    }
    const res = this.ctx.helper.bufferToJson(result.data)
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    return res.data
  }
  /**
   * upm
   * 根据区域名称获取该用户的有权限的区域
   * @param {array} { userId }
   * @return {object|null} - 区域列表
   */
  @Transactional
  async getRegionLimitBySearchName (params:any, transaction?:any): Promise<any> {
    const {
      userId, regionName, pageNo = 1, pageSize = 1000
    } = params
    const result = await this.ctx.consulCurl(
      '/isupm/api/privilegeService/v1/regions/search',
      'isupm',
      'upm',
      {
        method: 'GET',
        data: {
          pageNo,
          pageSize,
          regionName,
          privilegeCode: 'view',
          resourceType: 'region',
          userId
        }
      }
    )
    if (!result) {
      const error = new Error(this.ctx.__('pdms.upmFindHavePerNoData'))
      throw error
    }
    if (result && result.status && result.status !== 200) {
      const error:any = new Error(this.ctx.__('pdms.upmFindHavePerError'))
      error.status = result.status
      throw error
    }
    const res = this.ctx.helper.bufferToJson(result.data)
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    return res.data
  }
  /**
   * upm
   * 用户名userId获取该用户的有权限的区域
   * @param {array} { userId }
   * @return {object|null} - 区域列表
   */
  @Transactional
  async getOrgByUserName (params:any, transaction?:any): Promise<any> {
    const {
      userId, parentOrgId, pageNo = 1, pageSize = 1000
    } = params
    const _data:any = {
      pageNo,
      pageSize,
      privilegeCode: 'view',
      resourceType: 'region',
      userId
    }
    if (parentOrgId) _data.parentOrgId = parentOrgId
    const result = await this.ctx.consulCurl(
      '/isupm/api/privilegeService/v1/orgs/list',
      'isupm',
      'upm',
      {
        method: 'GET',
        data: _data
      }
    )
    if (!result) {
      const error = new Error(this.ctx.__('pdms.upmFindHaveOriginNoData'))
      throw error
    }
    if (result && result.status && result.status !== 200) {
      const error:any = new Error(this.ctx.__('pdms.upmFindHaveOriginError'))
      error.status = result.status
      throw error
    }
    const res = this.ctx.helper.bufferToJson(result.data)
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    return res.data
  }
  /**
   * upm
   * 根据组织名称获取该用户的有权限的组织
   * @param {array} { userId }
   * @return {object|null} - 组织列表
   */
  @Transactional
  async getOrgLimitBySearchName (params, transaction?:any) {
    const {
      userId, orgName, pageNo = 1, pageSize = 1000
    } = params
    const result = await this.ctx.consulCurl(
      '/isupm/api/privilegeService/v1/orgs/search',
      'isupm',
      'upm',
      {
        method: 'GET',
        data: {
          pageNo,
          pageSize,
          orgName,
          userId,
          privilegeCode: 'view'
        }
      }
    )
    if (!result) {
      const error = new Error(this.ctx.__('pdms.upmOriginNoData'))
      throw error
    }
    if (result && result.status && result.status !== 200) {
      const error:any = new Error(this.ctx.__('pdms.upmOriginError'))
      error.status = result.status
      throw error
    }
    const res = this.ctx.helper.bufferToJson(result.data)
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    return res.data
  }
  /**
   * 用户名userId获取该用户的有权限的区域
   * @param {array} { userId }
   * @return {object|null} - 区域列表
   */
  @Transactional
  async asyncTreeByLimit (): Promise<any> {
    const { ctx } = this
    console.log('--------请求头部-------', ctx.header.userids, ctx.header.appid)
    const { parentId = -1, pageNo, pageSize } = ctx.request.query
    const userId = ctx.getUserId() || ctx.header.userids
    if (userId) {
      // 获取该用户有权限的区域列表
      const result = await this.getRegionByUserName(
        {
          userId,
          pageNo,
          pageSize,
          parentIndexCode: parentId
        },
        (this as any).transaction
      )
      return await handleUserRegionTreeData(result, this, undefined)
    }
    const result = await this.asyncRegionTree(ctx.request.query, (this as any).transaction)
    return result
  }
  /**
   * 用户名userId获取该用户的有权限的区域
   * @param {array} { userId }
   * @return {object|null} - 区域列表
   */
  @Transactional
  async asyncTreeByLimitByAPP (userId:any): Promise<any> {
    const { ctx } = this
    const { parentId = -1, pageNo, pageSize } = ctx.request.query

    console.log('userIduserId', userId)
    if (userId) {
      // 获取该用户有权限的区域列表
      const result = await this.getRegionByUserName(
        {
          userId,
          pageNo,
          pageSize,
          parentIndexCode: parentId
        },
        (this as any).transaction
      )
      return await handleUserRegionTreeData(result, this, userId)
    }
    console.log('asyncRegionTreeasyncRegionTree', ctx.request.query)
    const result = await this.asyncRegionTree(ctx.request.query, (this as any).transaction)

    return result
  }
  /**
   * 用户名userId获取该用户的有权限的区域_模糊查询
   * @param {array} { userId }
   * @return {object|null} - 区域列表
   */
  @Transactional
  async asyncTreeSearchByLimit (): Promise<any> {
    const { ctx } = this
    const {
      searchName, limtRootId, pageNo, pageSize, isAllPath
    } = ctx.request.query
    const userId = ctx.getUserId()
    if (userId) {
      // 获取该用户有权限的区域列表
      const result = await this.getRegionLimitBySearchName(
        {
          userId,
          regionName: searchName,
          pageNo,
          pageSize
        },
        (this as any).transaction
      )
      const regionList = await handleUserRegionTreeData(result, this, undefined)
      if (regionList && regionList.rows && limtRootId) {
        regionList.rows = regionList.rows.filter(v => v.regionPath.indexOf(limtRootId) > -1)
      }
      if (isAllPath && isAllPath === '1') {
        const searchArr = []
        const isNowRegionIds = regionList.rows.map(v => v.regionId)
        regionList.rows.forEach(item => {
          const reg = /^\@|\@$/g
          const _regionPath = item.regionPath.replace(reg, '')
          const arr = _regionPath.split('@')
          searchArr.push(...arr)
        })
        const isNoRegionIds = this.ctx.helper.dedupe(searchArr).filter(v => !isNowRegionIds.includes(v))
        const result = await this.ctx.consulCurl(
          '/pdms/api/v1/model/tb_region/records',
          'pdms',
          'pdmsweb',
          {
            method: 'POST',
            data: {
              pageNo,
              pageSize,
              fields:
                'model_data_id,parent_region_id,region_id,region_name,region_path,description,update_time,create_time,region_type',
              filedOptions: [
                {
                  fieldName: 'region_id',
                  fieldValue: isNoRegionIds.join(','),
                  type: 'in'
                }
              ]
            }
          }
        )
        if (!result) {
          const error = new Error(this.ctx.__('pdms.pdmsErrorResult'))
          throw error
        }
        if (result.status !== 200) {
          const error:any = new Error(this.ctx.__('pdms.originErrorResult'))
          error.status = result.status
          throw error
        }
        const res = this.ctx.helper.bufferToJson(result.data)
        if (res.code !== '0') {
          const error = new Error(res.msg)
          throw error
        }
        const resRegion = this.ctx.helper.handleData(res.data)
        regionList.rows = resRegion.rows.concat(regionList.rows)
      }
      // debugger
      return regionList
    }
    const result = await this.asyncRegionTreeSearch(ctx.request.query, (this as any).transaction)
    return result
  }

  /**
   * 用户名userId获取该用户的有权限的组织
   * @param {array} { userId }
   * @return {object|null} - 组织列表
   */
  @Transactional
  async asyncOrgTreeByLimitByApp (params:any,userId:any): Promise<any> {
    const { parentId = -1, pageNo, pageSize } = params
    if (userId) {
      // 获取该用户有权限的组织列表
      const result = await this.getOrgByUserName(
        {
          pageNo,
          pageSize,
          userId,
          parentOrgId: parentId
        },
        (this as any).transaction
      )
      return handleUserOrgTreeData(result)
    }
    const result = await this.asyncOrgTree(params, (this as any).transaction)
    console.log('resultresultresultresult', result)
    for (const item of result.rows) {
      item.orgPathName = await this.treeOrgPath(
        item.orgPath || '',
        (this as any).transaction
      )
    }
    return result
  }
  /**
   * 用户名userId获取该用户的有权限的组织
   * @param {array} { userId }
   * @return {object|null} - 组织列表
   */
  @Transactional
  async asyncOrgTreeByLimit (): Promise<any> {
    const { ctx } = this
    const { parentId = -1, pageNo, pageSize } = ctx.request.query
    const userId = ctx.getUserId() || ctx.header.userids
    if (userId) {
      // 获取该用户有权限的组织列表
      const result = await this.getOrgByUserName(
        {
          pageNo,
          pageSize,
          userId,
          parentOrgId: parentId
        },
        (this as any).transaction
      )
      return handleUserOrgTreeData(result)
    }
    const result = await this.asyncOrgTree(ctx.request.query, (this as any).transaction)
    return result
  }
  /**
   * 根据组织名称获取该用户的有权限的组织_模糊查询
   * @param {array} { userId }
   * @return {object|null} - 组织列表
   */
  @Transactional
  async asyncOrgTreeSearchByLimit (): Promise<any> {
    const { ctx } = this
    const { searchName, pageNo, pageSize } = ctx.request.query
    const userId = ctx.getUserId() || ctx.header.userids
    if (userId) {
      // 获取该用户有权限的组织列表
      const result = await this.getOrgLimitBySearchName(
        {
          userId,
          pageNo,
          pageSize,
          orgName: searchName
        },
        (this as any).transaction
      )
      return handleUserOrgTreeData(result)
    }
    const result = await this.asyncOrgTreeSearch(ctx.request.query, (this as any).transaction)
    return result
  }
  /**
   * 区域校验接口
   * @param {array} { userId }
   * @return {object|null} - 组织列表
   */
  @Transactional
  async regionMultiverify (params:any): Promise<any> {
    const { userId, regionIndexCodes } = params
    const result = await this.ctx.consulCurl(
      `/isupm/api/privilegeService/v1/regions/multiverify?privilegeCode=view&resourceType=region&userId=${userId}`,
      'isupm',
      'upm',
      {
        method: 'POST',
        data: regionIndexCodes
      }
    )
    if (!result) {
      const error = new Error(this.ctx.__('pdms.upmCheckNoData'))
      throw error
    }
    if (result && result.status && result.status !== 200) {
      const error:any = new Error(this.ctx.__('pdms.upmCheckError'))
      error.status = result.status
      throw error
    }
    const res = this.ctx.helper.bufferToJson(result.data)
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    return res.data
  }
  /**
   * 查询区域路径并且返回region_type
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */

  @Transactional
  async treePathAndEegionType (params:any = '',regionId:any = '', transaction?:any): Promise<any> {
    // 传入的参数可能为空，为空时不能读取replace方法，会报错
    if (!params) {
      return ''
    }
    const reg = /^\@|\@$/g
    const _regionPathArr = params.replace(reg, '').split('@')
    const pageNo = 1
    const pageSize = 10000
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_region/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo,
          pageSize,
          fields:
            'model_data_id,parent_region_id,region_id,region_name,region_path,description,update_time,create_time,region_type',
          filedOptions: [
            {
              fieldName: 'region_id',
              fieldValue: _regionPathArr.join(','),
              type: 'in'
            }
          ]
        }
      }
    )
    if (!result) {
      const error = new Error(this.ctx.__('pdms.pmdsServiceError'))
      throw error
    }
    if (result.status !== 200) {
      const error:any = new Error(this.ctx.__('pdms.pmdsUseError'))
      error.status = result.status
      throw error
    }
    const res = this.ctx.helper.bufferToJson(result.data)
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    const responseData = this.ctx.helper.handleData(res.data)

    responseData.rows.sort((prev, next) => {
      return _regionPathArr.indexOf(prev.regionId) - _regionPathArr.indexOf(next.regionId)
    })

    const treePath = responseData.rows.map(item => {
      return item.regionName
    })
    if (regionId) {
      const regionType = responseData.rows.filter(res => regionId === res.regionId)
      return {
        regionPathName: this.ctx.helper.bouncer(treePath).join('/'),
        regionType: regionType[0] ? regionType[0].regionType : ''
      }
    }
    return this.ctx.helper.bouncer(treePath).join('/')
  }
}
