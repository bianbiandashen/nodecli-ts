import { Context, inject, provide, Application } from 'midway'
import { get, controller, post} from '../../../decorator/openApi'
import { BaseController } from '../../core/base_controller'
import { IPatrolObjService } from '../../interface/patrolObjInterface'
import { IpdmsService } from '../../interface/pdmsInterface'
import { IpdmsRegionService } from '../../interface/pdmsRegionInterface'
// 数组去重
function dedupe (array) {
  return Array.from(new Set(array))
}
// 去除数组中的 false,null,0,undefiend,NaN
function bouncer (arr) {
  return arr.filter(function (val) {
    return !(!val || val === '')
  })
}
// 下划线转换驼峰
function toHump (name) {
  return name.replace(/\_(\w)/g, function (all, letter) {
    return letter.toUpperCase()
  })
}
async function handleUserRegionTreeData (data:any) {
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
  return treeData
}
@provide()
@controller('/pdms/pdms')
export class PdmsController extends BaseController {
  @inject()
  app: Application;
  @inject()
  ctx: Context;
  @inject('patrolObjService')
  serviceIPatrolObj: IPatrolObjService;
  @inject('pdmsService')
  serviceIpdms: IpdmsService;
  @inject('pdmsRegionService')
  serviceIpdmsRegion: IpdmsRegionService;

  @post('/sensor')
  async sensor () {
    const { ctx } = this
    const {
      regionPath,
      checkBtn,
      regionId,
      patrolObjId,
      itemId = '',
      mannerId
    } = ctx.request.body.data
    let filedOptions = []
    if (checkBtn) {
      filedOptions = [
        {
          fieldName: 'region_path',
          fieldValue: regionPath,
          type: 'like'
        }
      ]
    } else {
      filedOptions = [
        {
          fieldName: 'region_id',
          fieldValue: regionId,
          type: 'eq'
        }
      ]
    }
    const result = await this.app.consulCurl(
      '/pdms/api/v1/model/tb_sensor_info/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo: 1,
          pageSize: 1000,
          fields: 'name,sensor_type,alarm_high,alarm_low,unit,index_code,parent_index_code',
          filedOptions
        }
      }
    )
    const responseData = this.ctx.helper.bufferToJson(result.data)
    const resultValue = await this.serviceIPatrolObj.quantityService({
      patrolObjId,
      itemId,
      mannerId
    })
    responseData.data.list = responseData.data.list.filter(res => {
      return !resultValue.list.some(resChi => resChi.dataValues.extendColumn3 === res.index_code)
    })
    for (const [ innerKey, innerValue ] of Object.entries(responseData.data.list)) {
      const tranDate = await this.app.consulCurl(
        '/pdms/api/v1/model/tb_transducer/records',
        'pdms',
        'pdmsweb',
        {
          method: 'POST',
          data: {
            pageNo: 1,
            pageSize: 1000,
            fields: 'name,parent_index_code',
            filedOptions: [
              {
                fieldName: 'index_code',
                fieldValue: innerValue['parent_index_code'],
                type: 'eq'
              }
            ]
          }
        }
      )
      const resultTra = this.ctx.helper.bufferToJson(tranDate.data).data.list[0] || null
      responseData.data.list[innerKey].sensorName = resultTra
      const resultTraFieldValue = resultTra ? resultTra.parent_index_code : ''
      const deviceDate = await this.app.consulCurl(
        '/pdms/api/v1/model/tb_pe_device/records',
        'pdms',
        'pdmsweb',
        {
          method: 'POST',
          data: {
            pageNo: 1,
            pageSize: 1000,
            fields: 'name',
            filedOptions: [
              {
                fieldName: 'index_code',
                fieldValue: resultTraFieldValue,
                type: 'eq'
              }
            ]
          }
        }
      )
      const resultDev = this.ctx.helper.bufferToJson(deviceDate.data).data.list[0] || null
      responseData.data.list[innerKey].deviceName = resultDev
    }
    this.success(ctx.helper.handleData(responseData.data))
  }
  /**
   * @summary 根据组织orgId获取人员
   * @description {orgId}
   * @Router GET /pdms/userList/get/by_orgId
   */
  @get('/userList/get/by_orgId')
  async getUserListByOrgId () {
    const { ctx } = this
    if (this.app.formatChar(ctx.request.query) === false) {
      return this.fail(this.ctx.__('pdms.requestParamsHasEspecialWord'))
    }
    const userList = await this.serviceIpdms.getUserListByOrgId(ctx.request.query)
    this.success(userList)
  }
  /**
   * @summary 根据用户userId集合获取相关人员
   * @description {userIds}
   * @Router POST /pdms/userList/get/by_userIds
   */
  @post('/userList/get/by_userIds')
  async getUserListByUserIds () {
    const { ctx } = this
    // debugger
    // if (this.app.formatChar(ctx.request.body) === false) {
    //   return this.fail(this.ctx.__('pdms.requestParamsHasEspecialWord'));
    // }
    const { userIds } = ctx.request.body
    console.log('ssssssssssssssssss', userIds)
    const userList = await this.serviceIpdms.getUserInfoList(userIds)
    this.success(userList)
  }
  /**
   * @summary 根据角色ID获取相关人员
   * @Router GET /pdms/roleUsers/search
   */
  @get('/roleUsers/search')
  async getRoleUsers () {
    const { ctx } = this
    if (this.app.formatChar(ctx.request.query) === false) {
      return this.fail(this.ctx.__('pdms.requestParamsHasEspecialWord'))
    }
    const { roleId } = ctx.request.query
    const personInfoList = await this.serviceIpdms.getPersonListByRoleId(roleId)
    this.success(personInfoList)
  }
  /**
   * @summary 获取角色列表-全部
   * @description {roleName} 模糊查询符合该输入条件的角色名称
   * @Router GET /pdms/rolePage/search
   */
  @get('/rolePage/search')
  async getRolePage () {
    const { ctx } = this
    if (this.app.formatChar(ctx.request.query) === false) {
      return this.fail(this.ctx.__('pdms.requestParamsHasEspecialWord'))
    }
    const result = await this.serviceIpdms.getAllRoles(ctx.request.query)
    this.success(result)
  }

  /**
   * @summary 获取用户列表
   * @description 获取用户列表
   * @Router get /pdms/userList/get
   */
  @get('/userList/get')
  async getPersons () {
    const { ctx } = this
    if (this.app.formatChar(ctx.request.query) === false) {
      return this.fail(this.ctx.__('pdms.requestParamsHasEspecialWord'))
    }
    const { regionId } = ctx.request.query
    // let userIds // 用户id集合
    // let userInfoList // 用户信息集合
    let personInfoList // 人员信息集合
    // 根据区域ID获取该区域的用户id列表集合
    const userIdsList = await this.app.consulCurl(
      '/isupm/api/privilegeService/v1/regions/users',
      'isupm',
      'upm',
      {
        method: 'GET',
        data: {
          privilegeCode: 'view',
          regionIndexCode: regionId,
          resourceType: 'region'
        }
      }
    )
    const userIds = this.ctx.helper.bufferToJson(userIdsList.data)
    // 获取用户列表信息列表
    const userInfoList = await this.serviceIpdms.getUsersByUserIds(userIds.data.list)
    const personIds = dedupe(bouncer(userInfoList.list.map(item => item.personId)))
    // 获取用户关联的人员信息列表
    let personList
    if (personIds.length > 0) {
      personList = await this.serviceIpdms.getPersonsByPersonIds({
        personIds: personIds.join(','),
        pageNo: 1,
        pageSize: 1000
      })
      personInfoList = personList.list
    } else {
      personInfoList = []
    }
    // 合并用户关联的人员信息
    userInfoList.list = userInfoList.list.map(item => {
      if (personIds.includes(item.personId)) {
        const currentInfo = personInfoList.find(v => v.personId === item.personId)
        return Object.assign({}, item, {
          gender: currentInfo.gender,
          age: currentInfo.age,
          certificateType: currentInfo.certificateType,
          orgPathName: currentInfo.orgPathName
        })
      }
      return Object.assign({}, item, {
        gender: null,
        age: null,
        certificateType: null,
        orgPathName: null
      })
    })
    // const userRoles = await this.app.consulCurl('/isupm/api/roleService/v1/user/roles', 'isupm', 'upm', {
    //   method: 'GET',
    //   data: {
    //     userName: 'renxj'
    //   }
    // })
    // console.log('userRoles==================', this.ctx.helper.bufferToJson(userRoles.data).data.list)
    this.success(userInfoList)
  }
  // 同步pdms异步树数据到巡检引擎
  @get('/synchTreeData')
  async synchTreeData () {
    const { ctx } = this
    // let responseData
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_region/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo: 1,
          pageSize: 1000,
          fields:
            'model_data_id,parent_region_id,region_id,region_name,region_path,description,update_time,create_time',
          filedOptions: []
        }
      }
    )
    const responseData = this.ctx.helper.bufferToJson(result.data)
    const list = responseData.data.list.map(item => {
      const resItem = {}
      for (const [ innerKey, innerValue ] of Object.entries(item)) {
        resItem[toHump(innerKey)] = innerValue
      }
      return resItem
    })
    await ctx.serviceIpdmsRegion.pdmsRegion.createRegionData(list)
    this.success(list)
  }

  /**
   * @summary 获取区域下得社区list
   * @description 获取区域下得社区list
   * @Router GET /pdms/region/community/get
   */

  // @get('/region/community/get')
  // async getRegionCommunity () {
  //   const { ctx } = this
  //   if (this.app.formatChar(ctx.request.query) === false) {
  //     return this.fail(this.ctx.__('pdms.requestParamsHasEspecialWord'))
  //   }
  //   const data = await this.serviceIpdms.getRegionCommunity(ctx.request.query)
  //   this.success(data)
  // }

  /**
   * @summary 区域树-同步树
   * @description 区域树-同步树
   * @Router GET /pdms/pdms/userSynchRegionTree
   * @request body synchRegionTreeRequest *body
   * @response 200 asyncTreeResponse
   */

  @get('/userSynchRegionTree')
  async userSynchRegionTree () {
    const { ctx } = this
    // let responseData
    const userId = ctx.getUserId()
    console.log('uesrId', userId)
    const result = await this.ctx.consulCurl(
      '/isupm/api/privilegeService/v1/regions/list',
      'isupm',
      'upm',
      {
        method: 'GET',
        data: {
          privilegeCode: 'view',
          pageNo: 1,
          pageSize: 1000,
          userId,
          fields: '*',
          resourceType: 'region'
        }
      }
    )
    console.log('res===========result============', result)
    const res = this.ctx.helper.bufferToJson(result.data)
    if (res && res.code !== '0') {
      throw new Error(this.ctx.__('pdms.noCorrespondingArea'))
    }
    console.log('res===========result============', res)
    const handleRes = await handleUserRegionTreeData(res.data)
    this.success(handleRes)
  }

  /**
   * @summary 区域树-同步树
   * @description 区域树-同步树
   * @Router GET /pdms/pdms/synchRegionTree
   * @request body synchRegionTreeRequest *body
   * @response 200 asyncTreeResponse
   */

  @get('/synchRegionTree')
  async synchRegionTree () {
    // let responseData
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_region/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        useHttp: true,
        data: {
          pageNo: 1,
          pageSize: 10000,
          fields:
            'model_data_id,parent_region_id,region_id,region_name,region_path,description,update_time,create_time',
          filedOptions: []
        }
      }
    )
    const responseData = this.ctx.helper.bufferToJson(result.data)
    this.success(this.ctx.helper.handleData(responseData.data))
  }

  /**
   * @summary 区域树-异步树
   * @description 区域树-异步树
   * @Router GET /pdms/pdms/asyncTree
   * @request body asyncTreeRequest *body
   * @response 200 asyncTreeResponse
   */
  @get('/asyncTree')
  async asyncTree () {
    const { ctx } = this
    if (this.app.formatChar(ctx.request.query) === false) {
      return this.fail(this.ctx.__('pdms.requestParamsHasEspecialWord'))
    }
    const result = await this.serviceIpdms.asyncRegionTree(ctx.request.query)
    this.success(result)
  }
  /**
   * @summary 区域树-异步树-有用户权限
   * @description 区域树-异步树-有用户权限
   * @Router GET /pdms/pdms/users/asyncRegionTree
   * @request body asyncTreeRequest *body
   * @response 200 asyncTreeResponse
   */
  @get('/users/asyncRegionTree')
  async asyncTreeByLimit () {
    const { ctx } = this
    if (this.app.formatChar(ctx.request.query) === false) {
      return this.fail(this.ctx.__('pdms.requestParamsHasEspecialWord'))
    }
    const result = await this.serviceIpdms.asyncTreeByLimit()
    this.success(result)
  }
  /**
   * @summary 区域树-模糊查询
   * @description 区域树-模糊查询
   * @Router GET /pdms/pdms/asyncTree/by_regionName
   * @request body asyncTreeSearchRequest *body
   * @response 200 asyncTreeResponse
   */
  @get('/asyncTree/by_regionName')
  async asyncTreeSearch () {
    const { ctx } = this
    if (this.app.formatChar(ctx.request.query) === false) {
      return this.fail(this.ctx.__('pdms.requestParamsHasEspecialWord'))
    }
    const result = await this.serviceIpdms.asyncRegionTreeSearch(ctx.request.query)
    this.success(result)
  }

  /**
   * @summary 社区列表
   * @description 社区列表
   * @Router GET /pdms/pdms/communityList
   */
  @get('/communityList')
  async visibleCommunityList () {
    const { ctx } = this
    if (this.app.formatChar(ctx.request.query) === false) {
      return this.fail(this.ctx.__('pdms.requestParamsHasEspecialWord'))
    }
    const result = await this.serviceIpdms.visibleCommunityList(ctx.request.query)
    this.success(result)
  }

  /**
   * @summary 区域树-模糊查询-有用户权限
   * @description 区域树-模糊查询-有用户权限
   * @Router GET /pdms/pdms/users/asyncRegionTree/by_regionName
   * @request body asyncTreeSearchRequest *body
   * @response 200 asyncTreeResponse
   */
  @get('/users/asyncRegionTree/by_regionName')
  async asyncTreeSearchByLimit () {
    const { ctx } = this
    if (this.app.formatChar(ctx.request.query) === false) {
      return this.fail(this.ctx.__('pdms.requestParamsHasEspecialWord'))
    }
    const result = await this.serviceIpdms.asyncTreeSearchByLimit()
    this.success(result)
  }
  /**
   * @summary 组织树-异步树
   * @description 组织树-异步树
   * @Router GET /pdms/pdms/asyncOrgTree
   * @request body asyncTreeRequest *body
   * @response 200 asyncOrgTreeResponse
   */
  @get('/asyncOrgTree')
  async asyncOrgTree () {
    const { ctx } = this
    if (this.app.formatChar(ctx.request.query) === false) {
      return this.fail(this.ctx.__('pdms.requestParamsHasEspecialWord'))
    }
    const result = await this.serviceIpdms.asyncOrgTree(ctx.request.query)
    this.success(result)
  }
  /**
   * @summary 组织树-异步树-有用户权限
   * @description 组织树-异步树-有用户权限
   * @Router GET /pdms/pdms/users/asyncOrgTree
   * @request body asyncTreeRequest *body
   * @response 200 asyncTreeResponse
   */
  @get('/users/asyncOrgTree')
  async asyncOrgTreeByLimit () {
    const { ctx } = this
    if (this.app.formatChar(ctx.request.query) === false) {
      return this.fail(this.ctx.__('pdms.requestParamsHasEspecialWord'))
    }
    const result = await this.serviceIpdms.asyncOrgTreeByLimit()
    this.success(result)
  }
  /**
   * @summary 组织树-模糊查询
   * @description 组织树-模糊查询
   * @Router GET /pdms/pdms/asyncOrgTree/by_OrgName
   * @request body asyncTreeSearchRequest *body
   * @response 200 asyncOrgTreeResponse
   */
  @get('/asyncOrgTree/by_OrgName')
  async asyncOrgTreeSearch () {
    const { ctx } = this
    if (this.app.formatChar(ctx.request.query) === false) {
      return this.fail(this.ctx.__('pdms.requestParamsHasEspecialWord'))
    }
    const result = await this.serviceIpdms.asyncOrgTreeSearch(ctx.request.query)
    this.success(result)
  }

  /**
   * @summary 组织树-模糊查询-有用户权限
   * @description 组织树-模糊查询-有用户权限
   * @Router GET /pdms/pdms/users/asyncOrgTree/by_OrgName
   * @request body asyncTreeSearchRequest *body
   * @response 200 asyncTreeResponse
   */
  @get('/users/asyncOrgTree/by_OrgName')
  async asyncOrgTreeSearchByLimit () {
    const { ctx } = this
    if (this.app.formatChar(ctx.request.query) === false) {
      return this.fail(this.ctx.__('pdms.requestParamsHasEspecialWord'))
    }
    const result = await this.serviceIpdms.asyncOrgTreeSearchByLimit()
    this.success(result)
  }

  /**
   * @summary 设备查询
   * @description 设备查询
   * @Router POST /pdms/pdms/device
   */

  @post('/device')
  async device () {
    const { ctx } = this
    const params = ctx.request.body
    const {
      regionId, checkChanged, rmCode, regionPath
    } = params
    const pageNo = 1
    const pageSize = 500
    let minData = []
    // 区域与区域ID集合
    let regionList = []
    if (checkChanged) {
      // 包含下级区域
      const midResult = await this.ctx.consulCurl(
        '/pdms/api/v1/model/tb_region/records',
        'pdms',
        'pdmsweb',
        {
          method: 'POST',
          data: {
            pageNo,
            pageSize,
            fields: 'region_id,region_path',
            filedOptions: [
              {
                fieldName: 'region_path',
                fieldValue: regionId,
                type: 'like'
              }
            ]
          }
        }
      )
      minData = this.ctx.helper.bufferToJson(midResult.data).data.list.map(res => res.region_id)
      regionList = this.ctx.helper.bufferToJson(midResult.data).data.list.map(res => {
        return {
          regionId: res.region_id,
          regionPath: res.region_path
        }
      })
      const total = this.ctx.helper.bufferToJson(midResult.data).data.total
      const length = Math.ceil(total / pageSize)
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
              pageSize,
              fields: 'region_id,region_path',
              filedOptions: [
                {
                  fieldName: 'region_path',
                  fieldValue: regionId,
                  type: 'like'
                }
              ]
            }
          }
        )
        minData = minData.concat(this.ctx.helper.bufferToJson(midResult.data).data.list.map(res => res.region_id))
        regionList = regionList.concat(
          this.ctx.helper.bufferToJson(midResult.data).data.list.map(res => {
            return {
              regionId: res.region_id,
              regionPath: res.region_path
            }
          })
        )
      }
    } else {
      minData = [ regionId ]
      regionList = [{ regionId, regionPath }]
    }
    // 获取已添加的设备
    const alreadyList = await this.serviceIPatrolObj.queryObjDeviceList({})
    // 获取设备
    const pdmsStr = `/pdms/api/v1/model/${rmCode}/records`
    const fieldsStr = `region_id,${params.objNameColumn},${params.objUnicodeColumn}`
    const filedOptions = []
    filedOptions.push({
      fieldName: 'region_id',
      fieldValue: dedupe(minData).join(','),
      type: 'in'
    })
    if (params.rmColumnName) {
      filedOptions.push({
        fieldName: params.rmColumnName,
        fieldValue: params.rmColumnValue,
        type: 'eq'
      })
    }
    const result = await this.app.consulCurl(pdmsStr, 'pdms', 'pdmsweb', {
      method: 'POST',
      data: {
        pageNo,
        pageSize,
        fields: fieldsStr,
        filedOptions
      }
    })
    const responseData = this.ctx.helper.bufferToJson(result.data)
    const totalDevice = this.ctx.helper.bufferToJson(result.data).data.total || 0
    const length = Math.ceil(totalDevice / pageSize)
    // 循环查询设备
    for (let i = 1; i < length; i++) {
      const result = await this.app.consulCurl(pdmsStr, 'pdms', 'pdmsweb', {
        method: 'POST',
        data: {
          pageNo: i + 1,
          pageSize,
          fields: fieldsStr,
          filedOptions
        }
      })
      responseData.data.list = responseData.data.list.concat(this.ctx.helper.bufferToJson(result.data).data.list)
    }
    responseData.data.list = responseData.data.list.filter(res => {
      return !alreadyList.some(obj => obj.dataValues.modelDataId === res[params.objUnicodeColumn])
    })
    responseData.data.list = responseData.data.list.map(res => {
      const obj = res
      const regionPath =
        regionList.map(resChi => resChi.regionId === res.region_id).length > 0
          ? regionList.filter(resChi => resChi.regionId === res.region_id)[0].regionPath
          : ''
      obj.objUnicodeColumn = params.objUnicodeColumn
      obj.objNameColumn = params.objNameColumn
      obj.patrolObjName = res[params.objNameColumn]
      obj.modelDataId = res[params.objUnicodeColumn]
      obj.rmCode = rmCode
      obj.regionPath = regionPath
      return obj
    })
    this.success(ctx.helper.handleData(responseData.data))
  }
}