<<<<<<< HEAD
'use strict'
import {  Context, inject, provide, Application} from 'midway';
import { 
  IPatrolObjService,
} from '../app/interface/patrolObjInterface';
const UUID = require('uuid')
const parse = require('csv-parse/lib/sync') // csv处理
const iconv = require('iconv-lite') // 处理gbk文件中文乱码
const Sequelize = require('sequelize')
const fs = require('fs')
const path = require('path')
const qr = require('qr-image')
const gm = require('gm')
const regularStr = /\'|\/|\\|:|\*|\?|"|<|>|\|/
// const png = require('to-png')
// const TextToSVG = require('text-to-svg');
const compressing = require('compressing')
const {
  DATE_FORMATTER
} = require('myjs-common')
const formatData = function (result) {
  return result.reduce((a, b, c) => {
    if (c) {
      a.push(a[c - 1] + b + '@')
    } else {
      a.push('@' + b + '@')
    }
    return a
  }, [])
}

function delDir (path) {
  let files = []
  if (fs.existsSync(path)) {
    files = fs.readdirSync(path)
    files.forEach(file => {
      const curPath = path + '/' + file
      if (fs.statSync(curPath).isDirectory()) {
        delDir(curPath) // 递归删除文件夹
      } else {
        fs.unlinkSync(curPath) // 删除文件
      }
    })
  }
}
const { Op } = Sequelize
const { Transactional } = require('../app/core/transactionalDeco')
// 数组去重
function dedupe (array) {
  return Array.from(new Set(array))
}

function bufferToJson (data) {
  return Buffer.isBuffer(data) ? JSON.parse(data.toString()) : {}
}
@provide('patrolObjService')
export  class PatrolObjService implements IPatrolObjService {

  @inject()
  ctx: Context;
  app: Application;
  /**
   * 同步巡检对象
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async asyncPatrolService (data): Promise<any> {
    const { ctx } = this
    ctx.header.appid = 'public'
    let result = await ctx.service.common.getAppIdByPublicBySchema({}, (this as any).transaction)
    // let result = await (this as any).query('PatrolObj', 'pdmsMqModel', [])
    result = result.appId
    const objList = []
    // 寻找该模型下的巡检对象类型
    for (const obj of result) {
      let resultDate = await (this as any).query('PatrolObj', 'pdmsMqObjTypeModel', [[ obj ]])
      // 判断需要同步的类型
      resultDate = resultDate.filter(res => String(res.manualsynctag) === '0')
      if (resultDate.length > 0) {
        objList.push({
          id: obj,
          value: resultDate
        })
      }
    }
    // 开始同步
    if (objList.length) {
      let regionId = ''
      let regionPath = ''
      // 先获取根节点regionId
      const regionList = (await ctx.service.pdms.asyncRegionTree({}, (this as any).transaction)) || {}
      if (regionList.rows && regionList.rows.length) {
        regionId = regionList.rows[0].regionId
        regionPath = regionList.rows[0].regionPath
      }
      // 筛选场景
      for (const per of objList) {
        // 筛选对象类型+添加巡检对象
        for (const iterator of per.value) {
          ctx.header.appid = per.id
          ;(await ctx.service.patrolObj.device(
            {
              regionId,
              regionPath,
              checkChanged: true,
              rmCode: iterator.rmcode,
              rmColumnName: iterator.rmcolumnname,
              rmColumnValue: iterator.rmcolumnvalue,
              objNameColumn: iterator.objnamecolumn,
              objUnicodeColumn: iterator.objunicodecolumn,
              type: per.id,
              objTypeId: iterator.objtypeid
            },
            (this as any).transaction
          )) || {}
        }
      }
    }
  }
  /**
   * 设备区域查询添加
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async device (params, transaction): Promise<any> {
    const { ctx } = this
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
      minData = bufferToJson(midResult.data).data.list.map(res => res.region_id)
      regionList = bufferToJson(midResult.data).data.list.map(res => {
        return {
          regionId: res.region_id,
          regionPath: res.region_path
        }
      })
      const total = bufferToJson(midResult.data).data.total
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
        minData = minData.concat(bufferToJson(midResult.data).data.list.map(res => res.region_id))
        regionList = regionList.concat(
          bufferToJson(midResult.data).data.list.map(res => {
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
    // 获取已添加的设备(删除与未删除都有)
    const alreadyList = await ctx.service.patrolObj.queryObjDeviceAllList(transaction)
    // 获取设备
    const pdmsStr = `/pdms/api/v1/model/${rmCode}/records`
    // region_id
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
    const responseData = bufferToJson(result.data)
    const totalDevice = bufferToJson(result.data).data.total || 0
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
      responseData.data.list = responseData.data.list.concat(bufferToJson(result.data).data.list)
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
      obj.objTypeId = params.objTypeId
      return obj
    })
    if (responseData.data.list.length) {
      // await (this as any).query('PatrolObj', 'createListData', [responseData.data.list])
      await ctx.service.patrolObj.patrolObjServiceAdd(responseData.data.list, transaction)
      if (params.type === 'eris') {
        // 自定义导入pdms（地图）
        const dataParams = responseData.data.list.map(res => {
          const obj = {
            model_identify: res.rmCode,
            is_custom_device: '1',
            patrol_obj_name: res.patrolObjName,
            model_data_id: res.modelDataId
          }
          return obj
        })
        await this.ctx.service.pdms.patrolObjPdmsAdd(dataParams, transaction)
      }
    }
  }
  /**
   * 根据modelId查询patrolObjId
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async patrolObjServiceAdd (params): Promise<any> {
    await (this as any).query('PatrolObj', 'createListData', [ params ])
  }
  /**
   * 根据modelId查询patrolObjId
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async modelIdByPatrolObjId (params): Promise<any> {
    const condition = { where: { modelDataId: params } }
    const result = await (this as any).query('PatrolObj', 'queryManyData', [ condition ])
    return result
  }
  /**
   * 获取巡检对象类型模型
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async pdmsMqUpdate (params, modelType = [], model, objTypeResuout): Promise<any> {
    // 删除
    if (params.operate === 'delete') {
      for (const type of modelType) {
        for (const obj of params.data.modelDataIds) {
          // 区域的删除多一步-删除该区域及其以下下挂的对象
          if (model === 'tb_region') {
            // 删除下挂区域本地与计划
            await (this as any).query('PatrolObj', 'deleteByRegionModel', [ obj, type ])
          }
          // 删除任务
          await (this as any).query('PatrolObj', 'deletePlanModel', [ obj, type ])
          // 删除本地
          await (this as any).query('PatrolObj', 'deleteModel', [ obj, type ])
          if (type === 'eris') {
            // 删除地图
            await this.ctx.service.pdms.patrolObjPdmsDel(obj, (this as any).transaction)
          }
        }
      }
      // 修改
    } else if (params.operate === 'update') {
      for (const type of modelType) {
        for (const obj of params.data.modelDataIds) {
          let fieldData:any = {}
          for (const iterator of objTypeResuout) {
            if (model === iterator.rmcode) {
              fieldData = iterator
              break
            }
          }
          if (!Object.keys(fieldData).length) {
            break
          }
          const { objunicodecolumn, objnamecolumn } = fieldData
          // 先查询修改
          const data = {
            pageNo: 1,
            pageSize: 1000,
            fields: objnamecolumn,
            filedOptions: [
              {
                fieldName: objunicodecolumn,
                fieldValue: obj,
                type: 'eq'
              }
            ]
          }
          const pdmsStr = '/pdms/api/v1/model/' + model + '/records'
          const updataNameList = await this.ctx.service.pdms.patrolObjPdmsCumAdd(data, pdmsStr)
          let name = ''
          if (updataNameList.data.list.length > 0) {
            name = updataNameList.data.list[0][objnamecolumn]
          }
          // 修改本地
          await (this as any).query('PatrolObj', 'updateModel', [ obj, type, name ])
          const dataParams = [
            {
              model_data_id: obj,
              patrol_obj_name: name
            }
          ]
          if (type === 'eris') {
            // 修改地图
            await this.ctx.service.pdms.patrolObjPdmsUpdate(dataParams, (this as any).transaction)
          }
        }
      }
      for (const iterator of objTypeResuout) {
        if (String(iterator.manualsynctag) === '0' && params.modelCode === iterator.rmcode) {
          // 同步巡检对象
          await this.ctx.service.patrolObj.asyncPatrolService({}, (this as any).transaction)
          break
        }
      }
    } else if (params.operate === 'add') {
      for (const iterator of objTypeResuout) {
        if (String(iterator.manualsynctag) === '0' && params.modelCode === iterator.rmcode) {
          // 同步巡检对象
          await this.ctx.service.patrolObj.asyncPatrolService({}, (this as any).transaction)
          break
        }
      }
    }
  }
  /**
   * 获取巡检对象类型模型
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async pdmsMq (): Promise<any> {
    // 获取场景信息
    // let result = (await (this as any).query('PatrolObj', 'pdmsMqModel', [])) || []
    // result = result.map(res => res.identify)
    let result = await this.ctx.service.common.getAppIdByPublicBySchema({}, (this as any).transaction)
    result = result.appId
    result = dedupe(result)
    // 获取类型信息----rmCode：模型  objUnicodeColumn：主键名称  objNameColumn：对象名称字段
    const objTypeResuout = (await (this as any).query('PatrolObj', 'pdmsMqObjTypeModel', [ result ])) || []
    let rmcode = objTypeResuout.map(res => res.rmcode)
    rmcode = dedupe(rmcode)
    return { result, rmcode, objTypeResuout }
  }
  /**
   * 巡检方法查询
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async aitypeService (params): Promise<any> {
    const result = await (this as any).query('PatrolObj', 'aitypeModel', [ params ])
    return result
  }
  /**
   * 动环环境量删除
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async quantityAddService (params:any = {}): Promise<any> {
    const modelName = 'tb_sensor_info'
    const {
      rightData = [], patrolObjId, itemId, itemName, mannerId
    } = params.data
    for (const iterator of rightData) {
      const {
        deviceName = '',
        sensorName = '',
        name = '',
        sensorType = '',
        alarmHigh = '',
        alarmLow = '',
        indexCode = ''
      } = iterator
      const sensorNameNew = sensorName ? sensorName.name : sensorName
      const deviceNameNew = deviceName ? deviceName.name : deviceName
      // 设备ID
      const deviceNameID = deviceName ? deviceName.model_data_id : ''
      // 传感器id
      const sensorNameID = sensorName ? sensorName.model_data_id : ''
      const condition = {
        isDelete: '0',
        // pdms标志ID
        extendColumn3: indexCode,
        // 上限
        extendColumn4: alarmHigh,
        // 下限
        extendColumn5: alarmLow,
        // 环境量类型
        eventType: sensorType,
        // 环境量名称
        pointName: name,
        // 传感器名称
        extendColumn2: sensorNameNew,
        // 设备名称
        cameraName: deviceNameNew,
        // 对象ID
        patrolObjId,
        // 项ID
        patrolItemId: itemId,
        // 巡检方法ID
        patrolMethodId: mannerId,
        // 模型名称
        modelName,
        // 项名称
        extendColumn1: itemName,
        // 设备ID
        deviceId: deviceNameID,
        // 传感器id
        orbitalId: sensorNameID,
        // 给动环插件增加执行类型
        execType: '0'
      }
      await (this as any).query('PatrolPoint', 'createData', [ condition ])
    }
    return {}
  }
  /**
   * 动环环境量删除
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async quantityDeleteService (params): Promise<any> {
    if (!params.data) {
      // edit by bian 使用多语言
      throw new Error(this.ctx.__('uncorrelatedCheckpoint'))
    }
    const patrolPointId = params.data.patrolPointId
    const condition = { isDelete: '-1' }
    const where = { patrolPointId }
    const result = await (this as any).query('PatrolPoint', 'updateData', [ condition, where ])
    return result
  }

  /**
   * 动环环境量查询
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async taskExecService (params:any = {}): Promise<any> {
    const { itemId } = params
    const value = await (this as any).query('TaskExecSchema', 'queryResultListByItem', [
      { taskItemIds: [ itemId ] }
    ])
    return value
  }
  /**
   * 任务动环环境量查询
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async quantityTaskService (params:any = {}): Promise<any> {
    const {
      pageNo, pageSize, itemId = '', mannerId = ''
    } = params
    const condition:any = { where: {} }
    // 项ID
    if (itemId) {
      condition.where.patrolTaskItemId = itemId
    }
    // 巡检方法ID
    if (mannerId) {
      condition.where.patrolMethodId = mannerId
    }
    if (pageNo && pageSize) {
      condition.limit = pageSize
      condition.offset = (pageNo - 1) * pageSize
    }
    const result = await (this as any).query('PatrolTaskPoint', 'queryData', [ condition ])
    return result
  }
  /**
   * 动环环境量查询
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async quantityService (params:any = {}): Promise<any> {
    const {
      pageNo, pageSize, patrolObjId = '', itemId = '', mannerId = ''
    } = params
    const condition:any = { where: { isDelete: '0' } }
    // 对象ID
    if (patrolObjId) {
      condition.where.patrolObjId = patrolObjId
    }
    // 项ID
    if (itemId) {
      condition.where.patrolItemId = itemId
    }
    // 巡检方法ID
    if (mannerId) {
      condition.where.patrolMethodId = mannerId
    }
    if (pageNo && pageSize) {
      condition.limit = pageSize
      condition.offset = (pageNo - 1) * pageSize
    }
    const result = await (this as any).query('PatrolPoint', 'findAllModel', [ condition ])
    return result
  }

  /**
   * 删除常用温度
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async usedDelService (params): Promise<any> {
    const condition = { isDelete: '-1' }
    const where = { usedId: params.usedId }
    const result = await (this as any).query('HisTemUsed', 'updateData', [ condition, where ])
    return result
  }

  /**
   * 查询常用温度
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async usedSeaService (): Promise<any> {
    const condition = { where: { isDelete: '0' } }
    const result = await (this as any).query('HisTemUsed', 'findAllModel', [ condition ])
    return result
  }

  /**
   * 保存常用温度
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async usedService (params:any = {}): Promise<any> {
    const usedStartTime = params.date ? params.date[0] : ''
    const usedEndTime = params.date ? params.date[1] : ''
    const thermometric = params.tree
    const patrolObjId = params.id
    const usedName = params.name
    const condition = {
      isDelete: 0,
      usedStartTime,
      usedEndTime,
      thermometric,
      patrolObjId,
      usedName
    }
    const result = await (this as any).query('HisTemUsed', 'createData', [ condition ])
    return result
  }

  /**
   * 温度查询
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async temperatureService (params = {}): Promise<any> {
    const patrolPointId = [ '1', '2' ]
    const resultList = []
    for (const iterator of patrolPointId) {
      const condition = {
        where: { patrolPointId: iterator },
        order: [[ 'submitTime' ]],
        attributes: [ 'eventValue', 'submitTime', 'pointName' ]
      }
      const dataList = {}
      let pointName = ''
      let length = 0
      const result = await (this as any).query('PatrolTaskPoint', 'queryData', [ condition ])
      result.list.forEach(res => {
        pointName = res.dataValues.pointName
        dataList[res.dataValues.submitTime.format(DATE_FORMATTER.DATE_FORMAT)] =
          res.dataValues.eventValue
      })
      length = Object.keys(dataList).length
      resultList.push({
        dataList,
        length,
        pointName
      })
    }
    return resultList
  }

  /**
   * 测温位查询
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async thermometryService (params:any = {}): Promise<any> {
    const patrolObjId = params.patrolObjId
    const condition = {
      where: {
        patrolObjId,
        isDelete: 0
      }
    }
    const result = await (this as any).query('PatrolPoint', 'queryDataById', [ condition ])
    return result
  }

  /**
   * 巡检结论获取
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async conclusionService (params:any = {}): Promise<any> {
    const objTypeId = params.objTypeId
    const condition = {
      where: {
        objTypeId,
        isDelete: 0
      }
    }
    const result = await (this as any).query('ObjTypeResult', 'findAndCountAllData', [ condition ])
    return result
  }

  /**
   * 通过多个组织id查对象
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async reginIdArray (params:any = {}): Promise<any> {
    const { regionIds } = params
    let likeRegionIds = null
    if (regionIds) {
      const arr = regionIds.split(',')
      likeRegionIds = arr.map(item => '%' + item + '%')
    }
    const condition = {
      where: { regionPath: { [Op.like]: { [Op.any]: likeRegionIds } } },
      attributes: [ 'patrolObjName', 'patrolObjId' ]
    }
    const result = await (this as any).query('PatrolObj', 'queryManyData', [ condition ])
    return result
  }
  /**
   * 查询设备标志巡检对象-针对所有包括已删除
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async queryObjDeviceAllList (): Promise<any> {
    const condition = { where: {} }
    const result = await (this as any).query('PatrolObj', 'queryManyData', [ condition ])
    return result
  }
  /**
   * 查询设备标志巡检对象
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async queryObjDeviceList (): Promise<any> {
    const condition = { where: { isDelete: '0' } }
    const result = await (this as any).query('PatrolObj', 'queryManyData', [ condition ])
    return result
  }
  /**
   * 通过巡检对象唯一id查详情
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async objectsSingleService (params = {}): Promise<any> {
    const result = await (this as any).query('PatrolObj', 'objectsSingleModel', [ params ])
    result.dataValues.objTypeName = result.dataValues.patrolObjType
      ? result.dataValues.patrolObjType.dataValues.objTypeName
      : ''
    const regionPath = result.dataValues.regionPath
    const reginValue = regionPath.substring(1, regionPath.length - 1).split('@')
    let str = ''
    for (const reginValueObj of formatData(reginValue)) {
      const strObj = await this.ctx.service.pdms.synchTreeDataById(
        { regionPath: reginValueObj },
        (this as any).transaction
      )
      str += strObj.dataValues && strObj.dataValues.regionName + '/'
    }
    result.dataValues.regionPathName = str ? str.slice(0, str.length - 1) : ''
    return result
  }
  /**
   * 通过巡检区域ID查询巡检对象
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async queryObjByRegionId (condition): Promise<any> {
    const result = await (this as any).query('PatrolObj', 'queryManyData', [ condition ])
    return result
  }
  /**
   * 通过巡检对象ID查询多条
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async queryObjManyList (params = {}): Promise<any> {
    const result = await (this as any).query('PatrolObj', 'queryManyDataByPlan', [ params ])
    return result
  }
  /**
   * 通过巡检对象id查检测点列表
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async objectsPointService (params:any = {}): Promise<any> {
    const condition = {
      where: {
        patrolObjId: params.id,
        isDelete: '0'
      }
    }
    const result = await (this as any).query('PatrolPoint', 'queryDataById', condition)
    return result
  }

  /**
   * 通过巡检对象唯一id查巡检项
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async objectsTaskService (params:any = {}): Promise<any> {
    // 查询已结束的任务
    const { id, pageNo, pageSize } = params
    const condition1 = {
      where: {
        patrolObjId: id,
        status: { [Op.in]: [ 1, 2 ] }
      }
    }
    const result = await (this as any).query('PatrolObjRel', 'queryTaskById', [ condition1 ])
    const taskCondition = result.rows.map(res => res.patrolObjRelId)
    const whereTask:any = {}
    if (params.patrolTaskName) {
      whereTask.patrolTaskName = { [Op.like]: `%${params.patrolTaskName}%` }
    }
    if (params.dataTime.length) {
      whereTask.startTime = { [Op.between]: params.dataTime }
    }
    const wherePonit:any = {}
    if (params.patrolResult) {
      wherePonit.patrolResult = params.patrolResult
    }
    // 获取任务巡检项
    const data = await (this as any).query('PatrolTaskItem', 'queryDataModel', [
      taskCondition,
      pageSize,
      pageNo,
      wherePonit,
      whereTask
    ])
    for (const iteratorObj of data.list) {
      const params = iteratorObj.dataValues
      // 获取巡检类型
      const psNameObj =
        (await this.ctx.service.planSchema.queryPlanSchemaDetail(
          { psId: params.Task.dataValues.ps_id },
          (this as any).transaction
        )) || {}
      const psName = psNameObj && psNameObj.dataValues && psNameObj.dataValues.psName
      // 获取项集合
      const result = (await this.ctx.service.item.itemServiceByPath(params, (this as any).transaction)) || {}
      // 获取点位
      const itemId = params.path && params.path.split('@') && params.path.split('@')[2]
      const itemPoint = await this.ctx.service.item.queryItemName({ itemId }, (this as any).transaction)
      iteratorObj.dataValues.itemList = result.rows || []
      iteratorObj.dataValues.itemPoint = itemPoint
      iteratorObj.dataValues.psName = psName
    }
    const resultBody = await this.ctx.service.patrolObj.conclusionService(
      this.ctx.request.body,
      (this as any).transaction
    )
    const orObj = {}
    resultBody.list.forEach(res => {
      orObj[res.dataValues.orId] = res.dataValues.orName
    })
    data.list = data.list.map(res => {
      res.dataValues.taskExecList.dataValues.patrolResultName =
        orObj[res.dataValues.taskExecList.dataValues.patrolResult] ||
        res.dataValues.taskExecList.dataValues.patrolResult
      return res
    })
    return data
  }
  /**
   * 巡查对象添加接口-自定义
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async objectsCustomCreateService (params:any = {}): Promise<any> {
    const appid = this.ctx.header.appid
    // 自定义添加
    if (params.isCustomDevice === '0') {
      const {
        isCustomDevice = '',
        objTypeId = '',
        patrolObjEquipmentFacturer = '',
        patrolObjEquipmentNumber = '',
        patrolObjName = '',
        patrolObjRegion = '',
        patrolObjRemarks = '',
        regionPath = '',
        patrolObjNameLable
      } = params
      const id = UUID.v1()
      const paramsValue:any = Object.assign(
        {},
        {
          isCustomDevice,
          objTypeId,
          patrolObjEquipmentFacturer,
          patrolObjEquipmentNumber,
          patrolObjName,
          patrolObjRegion,
          patrolObjRemarks,
          regionPath,
          isDelete: '0',
          modelIdentify: 'tb_patrol_obj',
          patrolObjId: id,
          modelDataId: id
        }
      )
      const condition = {
        where: {
          patrolObjName,
          regionPath,
          isDelete: '0'
        }
      }
      // 对象名称、区域重复性校验
      const resultList = await (this as any).query('PatrolObj', 'queryData', [ condition ])
      if (resultList.total > 0) {
        throw new Error(this.ctx.__('patrolObj.somethingIsNotSame', patrolObjNameLable))
      }
      if (appid === 'hpp') {
        for (const obj of regionPath.split('@')) {
          if (obj) {
            const regionType =
              (await this.ctx.service.pdms.getRegionEduRegionType(
                { regionId: obj },
                (this as any).transaction
              )) || {}
            if (String(regionType.eduRegionType) === '2') {
              paramsValue.patrolObjExtend1 = regionType.modelDataId
              paramsValue.patrolObjExtend2 = regionType.regionName
              break
            }
          }
        }
      }
      const result = await (this as any).query('PatrolObj', 'createData', [ paramsValue ])
      const dataParams = [
        {
          model_data_id: result.dataValues.patrolObjId,
          patrol_obj_name: result.dataValues.patrolObjName,
          is_custom_device: result.dataValues.isCustomDevice,
          model_identify: 'tb_patrol_obj'
        }
      ]
      if (appid === 'eris') {
        // 自定义导入pdms（地图）
        await this.ctx.service.pdms.patrolObjPdmsAdd(dataParams, (this as any).transaction)
      }
      // 自定义导入pdms
      // 模型名称与筛选条件字段
      const dataParamsValue = []
      dataParamsValue.push({
        [params.objUnicodeColumn]: id,
        [params.objNameColumn]: params.patrolObjName,
        region_id: params.patrolObjRegion
      })
      if (params.rmColumnName) {
        dataParamsValue[0][params.rmColumnName] = params.rmColumnValue
      }
      const pdmsStr = `/pdms/api/v1/model/${params.rmCode}/add`
      await this.ctx.service.pdms.patrolObjPdmsCumAdd(dataParamsValue, pdmsStr, (this as any).transaction)
      return result
      // 设备添加
    } else if (params.isCustomDevice === '1') {
      for (const obj of params.seviceArray) {
        const resultPath =
          (await this.ctx.service.pdms.getRegionInfo(
            { regionId: obj.regionId },
            (this as any).transaction
          )) || {}
        const paramsObj = {
          regionPath: resultPath.regionPath,
          patrolObjRegion: obj.regionId,
          modelDataId: obj.modelDataId,
          objTypeId: params.objTypeId,
          patrolObjName: obj.patrolObjName,
          isDelete: '0',
          isCustomDevice: params.isCustomDevice,
          modelIdentify: params.rmCode
        }
        await (this as any).query('PatrolObj', 'createData', [ paramsObj ])
      }
      // 自定义导入pdms（地图）
      const dataParams = params.seviceArray.map(res => {
        const obj = {
          model_identify: params.rmCode,
          is_custom_device: params.isCustomDevice,
          patrol_obj_name: res.patrolObjName,
          model_data_id: res.modelDataId
        }
        return obj
      })
      if (appid === 'eris') {
        await this.ctx.service.pdms.patrolObjPdmsAdd(dataParams, (this as any).transaction)
      }
      return params.seviceArray
    }
  }
  /**
   * 任
   * 巡查对象查询接口
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async queryPatrolObjByPlan (params:any = {}): Promise<any> {
    const { ctx } = this
    const userId = ctx.getUserId()
    if (params.isContainSameName && params.isContainSameName === 1) {
      // 巡检类型列表
      const objectTypeList = await ctx.service.patrolObjType.objectTypeListByPlan(
        { objTypeIds: params.objTypeIds },
        (this as any).transaction
      )
      const objTypeNameList = objectTypeList.map(v => v.dataValues.objTypeName)
      // 根据类型名称列表查询巡检类型集合，适配同步过来的巡检对象类型
      const resultObjectTypeList = await ctx.service.patrolObjType.objectTypeListByName(
        { objTypeNames: objTypeNameList },
        (this as any).transaction
      )
      const objTypeIdCollection = resultObjectTypeList.map(v => v.dataValues.objTypeId)
      params.objTypeIds = objTypeIdCollection
    }
    let regionLimit = []
    let result = await (this as any).query('PatrolObj', 'queryAllDataByPatrolPlan', [ params ])
    // 获取该用户有权限的区域列表
    if (userId) {
      const regionList = await ctx.service.pdms.getAllRegionByUserName(
        { userId },
        (this as any).transaction
      )
      if (regionList) {
        regionLimit = regionList.filter(v => v.regionStatus === 1).map(item => item.regionIndexCode)
      }
    }
    result = result.filter(v => regionLimit.includes(v.patrolObjRegion))
    return result
  }
  @Transactional
  async queryPatrolObjCountByPlan (params:any = {}): Promise<any> {
    const { ctx } = this
    const userId = ctx.getUserId()
    if (params.isContainSameName && params.isContainSameName === 1) {
      // 巡检类型列表
      const objectTypeList = await ctx.service.patrolObjType.objectTypeListByPlan(
        { objTypeIds: params.objTypeIds },
        (this as any).transaction
      )
      const objTypeNameList = objectTypeList.map(v => v.dataValues.objTypeName)
      // 根据类型名称列表查询巡检类型集合，适配同步过来的巡检对象类型
      const resultObjectTypeList = await ctx.service.patrolObjType.objectTypeListByName(
        { objTypeNames: objTypeNameList },
        (this as any).transaction
      )
      const objTypeIdCollection = resultObjectTypeList.map(v => v.dataValues.objTypeId)
      params.objTypeIds = objTypeIdCollection
    }
    let regionLimit = []
    let result = await (this as any).query('PatrolObj', 'queryAllDataByPatrolPlan', [ params ])
    // 获取该用户有权限的区域列表
    if (userId) {
      const regionList = await ctx.service.pdms.getAllRegionByUserName(
        { userId },
        (this as any).transaction
      )
      if (regionList) {
        regionLimit = regionList.filter(v => v.regionStatus === 1).map(item => item.regionIndexCode)
      }
    }
    result = result.filter(v => regionLimit.includes(v.patrolObjRegion))
    return result.length
  }
  /**
   * 巡查对象查询接口
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async patrolObjQueryService (params:any = {}): Promise<any> {
    const { ctx } = this
    // 获取该用户有权限的区域列表
    if (params.userId) {
      const regionList = await ctx.service.pdms.getRegionByUserName(
        { userId: params.userId },
        (this as any).transaction
      )
      if (regionList && regionList.list) {
        const regionIdLimit = regionList.list
          .filter(v => v.regionStatus === 1)
          .map(item => `%${item.regionIndexCode}%`)
        params.regionIdLimit = regionIdLimit
      }
    }
    const pointCon = { where: { isDelete: '0' } }
    let pointListIds = []
    // 点位
    if (params.patrolObjCheckpoint) {
      const pointList = await (this as any).query('PatrolPoint', 'findAllModel', [ pointCon ])
      pointListIds = pointList.list.map(res => res.dataValues.patrolObjId)
      pointListIds = dedupe(pointListIds)
    }
    const result = await (this as any).query('PatrolObj', 'queryDataModelTwo', [ params, pointListIds ])
    const regionNameArray = []
    for (const obj of result.list) {
      // 同一个区域 查一次就好
      if (regionNameArray.some(res => res.name === obj.dataValues.regionPath)) {
        obj.dataValues.regionName = regionNameArray.filter(
          res => res.name === obj.dataValues.regionPath
        )[0].value
      } else {
        let pathStr = ''
        for (const regionId of obj.dataValues.regionPath.split('@')) {
          if (regionId) {
            const resultPath =
              (await ctx.service.pdms.getRegionInfo({ regionId }, (this as any).transaction)) || {}
            if (pathStr) {
              pathStr = pathStr + '/' + resultPath.regionName
            } else {
              pathStr = resultPath.regionName
            }
          }
        }
        obj.dataValues.regionName = pathStr
        regionNameArray.push({
          name: obj.dataValues.regionPath,
          value: pathStr
        })
      }
    }
    result.list = result.list.map(res => {
      res.dataValues.objTypeName =
        res.dataValues.patrolObjType && res.dataValues.patrolObjType.dataValues.objTypeName
      return res
    })
    return result
  }

  /**
   * 巡查登录人有权限的对象接口
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async patrolObjQueryByQuestionService (): Promise<any> {
    const { ctx } = this
    const userId = ctx.getUserId()
    let regionIdLimit = []
    // 获取该用户有权限的区域列表
    if (userId) {
      const regionList = await ctx.service.pdms.getRegionByUserName(
        { userId },
        (this as any).transaction
      )
      if (regionList && regionList.list) {
        regionIdLimit = regionList.list
          .filter(v => v.regionStatus === 1)
          .map(item => `%${item.regionIndexCode}%`)
      }
    }
    console.log(`----------------------过滤权限树 ${regionIdLimit}-------------------------`)
    if (regionIdLimit.length) {
      const result = await (this as any).query('PatrolObj', 'queryDataByQuestionModel', [
        { regionIdLimit }
      ])
      return result
    }
    return []
  }

  /**
   * 删除巡检对象接口
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async deleteService (params:any = {}): Promise<any> {
    const appid = this.ctx.header.appid
    // 本地删除
    await (this as any).query('PatrolObj', 'deleteData', [ params ])
    const dataParams = params.pdmsList || []
    if (appid === 'eris') {
      // pdms地图删除
      await this.ctx.service.pdms.patrolObjPdmsDel(dataParams, (this as any).transaction)
    }
    // 计划删除
    const result = await (this as any).query('RelationObjPlan', 'deleteData', [ params ])
    return result
  }

  /**
   * 编辑巡查对象接口
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async editPatrolObjService (params:any = {}): Promise<any> {
    let paramsObj:any = {}
    // NFC
    if (params.nfcSign === '1') {
      if (params.patrolObjNfc) {
        // 判断是否绑定NFC
        const obj = await this.ctx.service.patrolObj.patrolObjQueryService(
          { patrolObjNfc: params.patrolObjNfc },
          (this as any).transaction
        )
        if (obj.list.length) {
          throw Error(this.ctx.__('patrolObj.NFCCodeBinded'))
        } else {
          paramsObj = { patrolObjNfc: params.patrolObjNfc }
        }
      } else {
        paramsObj = { patrolObjNfc: null }
      }
      // 二维码
    } else if (params.nfcSign === '2') {
      if (params.patrolObjNfc) {
        // 判断是否绑定NFC
        const obj = await this.ctx.service.patrolObj.patrolObjQueryService(
          { patrolObjCode: params.patrolObjNfc },
          (this as any).transaction
        )
        if (obj.list.length) {
          throw Error(this.ctx.__('patrolObj.QRCodeBinded'))
        } else {
          paramsObj = { patrolObjCode: params.patrolObjNfc }
        }
      } else {
        paramsObj = { patrolObjCode: null }
      }
    } else {
      paramsObj = {
        patrolObjName: params.patrolObjName,
        objTypeId: params.objTypeId,
        patrolObjEquipmentFacturer: params.patrolObjEquipmentFacturer,
        patrolObjEquipmentNumber: params.patrolObjEquipmentNumber,
        patrolObjRemarks: params.patrolObjRemarks
      }
    }
    const whereObj = { patrolObjId: params.patrolObjId }
    if (paramsObj.patrolObjName) {
      // 在校验数据库
      const condition = {
        where: {
          patrolObjName: paramsObj.patrolObjName,
          regionPath: params.regionPath,
          isDelete: '0'
        }
      }
      let resultList:any = {}
      // 对象名称、区域重复性校验
      if (params.nameSwitch) {
        resultList = await (this as any).query('PatrolObj', 'queryData', [ condition ])
        if (resultList.total > 0) {
          const patrolObjNameLable = params.patrolObjNameLable || this.ctx.__('patrolObj.patrolObjName')
          throw new Error(this.ctx.__('patrolObj.somethingIsNotSame').replace(/\{0\}/g, patrolObjNameLable))
        }
      }
    }
    const result = await (this as any).query('PatrolObj', 'editPatrolObj', [ paramsObj, whereObj ])
    const typeResuld = await this.ctx.service.patrolObjType.objectTypeService(
      { ids: params.objTypeId },
      (this as any).transaction
    )
    const dataValues = typeResuld.rows[0].dataValues
    if (params.nfcSign !== '1' && params.nfcSign !== '2') {
      const dataParams = [
        {
          model_data_id: params.patrolObjId,
          patrol_obj_name: params.patrolObjName
        }
      ]
      // 改地图的
      await this.ctx.service.pdms.patrolObjPdmsUpdate(dataParams, (this as any).transaction)
      const dataAll = []
      dataAll.push({
        [dataValues.objUnicodeColumn]: params.patrolObjId,
        [dataValues.objNameColumn]: params.patrolObjName
      })
      const rmCode = `/pdms/api/v1/model/${dataValues.rmCode}/update`
      // 改pdms的
      await this.ctx.service.pdms.patrolObjPdmsUpdateAll(dataAll, rmCode, (this as any).transaction)
    }
    return result
  }

  /**
   * 生成全部二维码
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async codeAllPatrolObjService (params = {}): Promise<any> {
    const patrolObjList = await this.ctx.service.patrolObj.patrolObjQueryService(
      params,
      (this as any).transaction
    )
    delDir(path.resolve(this.app.config.static.patrolObj, 'zip'))
    for (const imgObj of patrolObjList.list) {
      const random = Math.floor(Math.random() * 1000000)
      const code = await this.ctx.service.patrolObj.codeService(imgObj.dataValues, (this as any).transaction)
      const patrolObjName = `zip/${imgObj.dataValues.patrolObjName}-${random}.png`
      code.qrcode.pipe(
        fs.createWriteStream(path.resolve(this.app.config.static.patrolObj, patrolObjName))
      )
    }
    await compressing.zip.compressDir(
      path.resolve(this.app.config.static.patrolObj, 'zip'),
      path.resolve(this.app.config.static.patrolObj, this.ctx.__('patrolObj.objErWeiMaZip'))
    )
    return {
      name: this.ctx.__('patrolObj.objErWeiMaZip'),
      path: path.resolve(this.app.config.static.patrolObj, this.ctx.__('patrolObj.objErWeiMaZip'))
    }
  }
  /**
   * 生成指定二维码
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async codeService (params:any = {}): Promise<any> {
    const qrUrl = 'patrolObjId=' + params.patrolObjId
    const qrcode = qr.image(qrUrl, {
      type: 'png',
      size: 5,
      margin: 20
    })
    return { qrcode }
  }

  /**
   * 生成二维码
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async codePatrolObjService (params:any = {}): Promise<any> {
    const patrolObj = await this.objectsSingleService({ id: params.patrolObjId })
    const obj = patrolObj.dataValues
    // const reginValue = obj.regionPath.substring(1, obj.regionPath.length - 1).split('@')
    // let str = ''
    // // 获取区域-中文拼接
    // for (const reginValueObj of formatData(reginValue)) {
    //   const strObj = await this.ctx.service.pdms.synchTreeDataById(
    //     { regionPath: reginValueObj },
    //     (this as any).transaction
    //   )
    //   str += strObj.dataValues && strObj.dataValues.regionName + '/'
    // }
    // 字体引入（bold/line）
    // const msyhl = path.resolve(this.app.config.static.patrolObj, 'font/msyhl.ttc')
    // const msyhbd = path.resolve(this.app.config.static.patrolObj, 'font/msyhbd.ttc')
    // const heiti = path.resolve(this.app.config.static.patrolObj, 'font/heiti.ttf')
    const song = path.resolve(this.app.config.static.patrolObj, 'font/song.ttf')
    // registerFont(msyhl, {
    //   family: 'Comic msyhl'
    // })
    // registerFont(msyhbd, {
    //   family: 'Comic msyhbd'
    // })
    // const canvas = createCanvas(300, 350);
    // const ctx = canvas.getContext('2d');
    // 画二维码
    const qrUrl = obj.patrolObjId
    const qrcode = qr.imageSync(qrUrl, {
      type: 'png',
      size: 5,
      margin: 20
    })

    // const textToSVG = TextToSVG.loadSync(msyhl);
    // const options = {
    //   x: 0, // 文本开头的水平位置（默认值：0）
    //   y: 0, // 文本的基线的垂直位置（默认值：0）
    //   fontSize: 36, // 字体大小
    //   anchor: 'top', // 坐标中的对象锚点
    //   // letterSpacing: "",  // 设置字母的间距
    //   attributes: {
    //     fill: '#FFFFFF' // 文字颜色
    //   }
    // }
    // const svg = textToSVG.getSVG('前端名狮', options);
    gm(qrcode)
      .resize(250, 250)
      .font(song)
      .fontSize(18)
      .fill('#000')
      .drawText(0, 20, this.ctx.__('patrolObj.zhangSan'))
      .write(path.resolve(this.app.config.static.patrolObj, 'abcdd.png'), function (err) {
        if (!err) console.log('done')
      })
    // gm(200, 400, '#ddff99f3')
    //   .font(msyhl)
    //   .fontSize(28)
    //   .fill('#ffffff')
    //   .drawText(10, 50, 'from scratch')
    //   .write(path.resolve(this.app.config.static.patrolObj, 'abcd.jpg'), function(err) {
    //     // ...
    //   });
    // const qrcodeImg = new Image();
    // qrcodeImg.src = qrcode;
    // // 这里的位置分别是（开始位置x坐标，开始位置的y坐标，二维码的宽，高）
    // ctx.drawImage(qrcodeImg, -50, 0, 400, 400);
    // ctx.font = '17px "Comic msyhbd"'
    // ctx.textAlign = 'center';
    // ctx.fillText(obj.patrolObjName, 150, 30)
    // ctx.font = '14px "Comic msyhl"'
    // ctx.fillText(str.slice(0, str.length - 1), 150, 70)
    // ctx.font = '14px "Comic msyhl"'
    // ctx.fillText('打开***app扫一扫', 150, 320)
    // const data = await promisify(canvas.toDataURL).call(canvas, 'image/png');
    // const base64 = data.replace(/^data:image\/\w+;base64,/, ''); // 去掉图片base64码前面部分data:image/png;base64
    // const picUrl = new Buffer(ddd, 'base64'); // 把base64码转成buffer对象
    return { qrcode }
  }

  /**
   * 模板下载
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async downloadTemService (params:any = {}): Promise<any> {
    let content = `${params.content.title || ''}${params.content.data &&
      params.content.data.join()}`
    content = iconv.encode(content, 'GBK')
    // 1.先将字符串转换成Buffer
    const fileContent = Buffer.from(content)
    return { fileContent }
  }

  /**
   * import
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async importService (stream:any = {}): Promise<any> {
    // 获取appId
    const appId = this.ctx.header.appid
    // 数据获取
    const regionSwitch = stream.fields && stream.fields.regionSwitch
    const regionType = stream.fields && stream.fields.regionType
    const importStr = (stream.fields && stream.fields.content) || '{}'
    const importJson = JSON.parse(importStr)
    const fieldObj = stream.fields && stream.fields.fieldObj
    const fieldObjJson = JSON.parse(fieldObj)
    const patrolObjJson = {
      nameCusDia: 'patrolObjName',
      objCusDia: 'objTypeId',
      devCusDia: 'patrolObjEquipmentFacturer',
      numCusDia: 'patrolObjEquipmentNumber',
      remCusDia: 'patrolObjRemarks'
    }
    // 获取输入字段value
    const fieldObjAll:any = {}
    fieldObjJson.forEach(res => {
      fieldObjAll[res.key] = res.label
    })
    const fieldObjKey = fieldObjJson.map(res => res.key)
    return await new Promise(async (resolve, reject) => {
      let dataStr = ''
      stream.on('data', function (data) {
        data = iconv.decode(data, 'GBK')
        dataStr += data
      })
      stream.on('end', async () => {
        dataStr = dataStr
          .split('\n')
          .filter(res => {
            return !importJson.some(resChi => {
              return res.includes(resChi)
            })
          })
          .join('\n')
        const dataJson = parse(dataStr, {
          columns: true,
          auto_parse: true
        })
        const dataJsonNew = []
        const errList = []
        // 区域集合
        const pathArray = []
        const objName = []
        for (let i = 0; i < dataJson.length; i++) {
          const res:any = dataJson[i]
          if (!res[this.ctx.__('patrolObj.belongArea')]) {
            reject(new Error(this.ctx.__('patrolObj.belongArea')))
          }
          let pathIdRegion = null
          // 相同区域只查询一次就好
          if (pathArray.some(resSome => resSome.name === res[this.ctx.__('patrolObj.belongArea')])) {
            pathIdRegion = pathArray.filter(resFil => resFil.name === res[this.ctx.__('patrolObj.belongArea')])[0].value
          } else {
            const name = res[this.ctx.__('patrolObj.belongArea')].split('/')[res[this.ctx.__('patrolObj.belongArea')].split('/').length - 1]
            // 获取区域
            let regObj = await this.region(name)
            regObj = regObj.map(res => {
              const obj:any = {}
              obj.pathName = res
                .map(resChi => {
                  return resChi[0].region_name
                })
                .join('/')
              obj.id = res.filter(resChi => {
                return resChi[0].region_name === name
              })[0][0].region_id
              obj.path = res.filter(resChi => {
                return resChi[0].region_name === name
              })[0][0].region_path
              obj.regionType = res.filter(resChi => {
                return resChi[0].region_name === name
              })[0][0].region_type
              return obj
            })
            pathIdRegion = regObj.filter(resFil => res[this.ctx.__('patrolObj.belongArea')] === resFil.pathName).length
              ? regObj.filter(resFil => res[this.ctx.__('patrolObj.belongArea')] === resFil.pathName)[0]
              : {}
            pathArray.push({
              name: res[this.ctx.__('patrolObj.belongArea')],
              value: pathIdRegion
            })
          }
          let objTypeId = null
          // 判断是否有类型
          if (fieldObjKey.some(res => res === 'objCusDia')) {
            const params:any = { objTypeName: res[fieldObjAll.objCusDia] || '' }
            if (appId === 'hpp') {
              params.regionIndexCode = pathIdRegion.id
            }
            objTypeId = await this.ctx.service.patrolObjType.objectTypeChiService(
              params,
              (this as any).transaction
            )
          } else {
            objTypeId = await this.ctx.service.patrolObjType.objectTypeService({}, (this as any).transaction)
          }
          const id = UUID.v1()
          const obj:any = {}
          obj.patrolObjRegion = pathIdRegion.id
          obj.regionPath = pathIdRegion.path
          // 入参赋值
          fieldObjKey.forEach(key => {
            if (patrolObjJson[key]) {
              // 对象类型需要的是ID
              if (patrolObjJson[key] === 'objTypeId') {
                obj.objTypeId = objTypeId.count ? objTypeId.rows[0].dataValues.objTypeId : ''
              } else {
                obj[patrolObjJson[key]] = res[fieldObjAll[key]]
                obj.objTypeId = objTypeId.count ? objTypeId.rows[0].dataValues.objTypeId : ''
              }
            }
          })
          obj.createTime = new Date()
          obj.isCustomDevice = '0'
          obj.isDelete = '0'
          obj.modelDataId = id
          obj.patrolObjId = id
          obj.modelIdentify = 'tb_patrol_obj'
          // 对象名称重复性校验
          // 先校验本地
          if (objName.some(res => res.name === obj.patrolObjName && res.path === obj.regionPath)) {
            obj.patrolObjNameRepeat = true
          } else {
            // 在校验数据库
            const condition = {
              where: {
                patrolObjName: obj.patrolObjName,
                regionPath: obj.regionPath
              }
            }
            let resultList:any = {}
            if (obj.regionPath) {
              // 对象名称、区域重复性校验
              resultList = await (this as any).query('PatrolObj', 'queryData', [ condition ])
            }
            if (resultList.total > 0) {
              obj.patrolObjNameRepeat = true
            } else {
              objName.push({
                name: obj.patrolObjName,
                path: obj.regionPath
              })
            }
          }
          // 区域判断-公共校验
          if (!obj.patrolObjRegion || !pathIdRegion.path) {
            if (res[this.ctx.__('patrolObj.belongArea')]) {
              errList.push({
                row: i + 1,
                msg: this.ctx.__('patrolObj.regionNameError')
              })
            } else {
              errList.push({
                row: i + 1,
                msg: this.ctx.__('patrolObj.regionNameIsEmpty')
              })
            }
            break
          }
          if (regionSwitch && String(regionType) !== String(pathIdRegion.regionType)) {
            errList.push({
              row: i + 1,
              msg: this.ctx.__('patrolObj.regionNotAdd')
            })
            break
          }
          // 对象名称校验
          if (fieldObjKey.some(res => res === 'nameCusDia')) {
            if (obj.patrolObjNameRepeat) {
              errList.push({
                row: i + 1,
                msg: this.ctx.__('patrolObj.somethingIsNotSame', fieldObjAll.nameCusDia.replace(/\*/g, ''))
              })
              break
            } else if (obj.patrolObjName && regularStr.test(obj.patrolObjName)) {
              errList.push({
                row: i + 1,
                msg: this.ctx.__('patrolObj.somethingHasEspecialkey', fieldObjAll.nameCusDia.replace(/\*/g, ''))
              })
              break
            } else if (obj.patrolObjName && obj.patrolObjName.length > 32) {
              errList.push({
                row: i + 1,
                msg: this.ctx.__('patrolObj.somethingMax32words', fieldObjAll.nameCusDia.replace(/\*/g, ''))
              })
              break
            } else if (!obj.patrolObjName) {
              errList.push({
                row: i + 1,
                msg: this.ctx.__('patrolObj.somethingIsNotEmpty', fieldObjAll.nameCusDia.replace(/\*/g, ''))
              })
              break
            }
          }
          // 对象类型校验
          if (fieldObjKey.some(res => res === 'objCusDia')) {
            if (!obj.objTypeId) {
              errList.push({
                row: i + 1,
                msg: this.ctx.__('patrolObj.somethingIsNotEmpty', fieldObjAll.objCusDia.replace(/\*/g, ''))
              })
              break
            } else if (!objTypeId.count) {
              errList.push({
                row: i + 1,
                msg: this.ctx.__('patrolObj.pleaseInputRightSomething', fieldObjAll.objCusDia.replace(/\*/g, ''))
              })
              break
            }
          }
          // 设备厂商
          if (fieldObjKey.some(res => res === 'devCusDia')) {
            if (obj.patrolObjEquipmentFacturer && obj.patrolObjEquipmentFacturer.length > 32) {
              errList.push({
                row: i + 1,
                msg: this.ctx.__('patrolObj.somethingMax32words', fieldObjAll.devCusDia.replace(/\*/g, ''))
              })
              break
            } else if (
              obj.patrolObjEquipmentFacturer &&
              regularStr.test(obj.patrolObjEquipmentFacturer)
            ) {
              errList.push({
                row: i + 1,
                msg: this.ctx.__('patrolObj.somethingHasEspecialkey', fieldObjAll.devCusDia.replace(/\*/g, ''))
              })
              break
            }
          }
          // 设备编号
          if (fieldObjKey.some(res => res === 'numCusDia')) {
            if (obj.patrolObjEquipmentNumber && obj.patrolObjEquipmentNumber.length > 32) {
              errList.push({
                row: i + 1,
                msg: this.ctx.__('patrolObj.somethingMax32words', fieldObjAll.numCusDia.replace(/\*/g, '') )
              })
              break
            } else if (
              obj.patrolObjEquipmentNumber &&
              regularStr.test(obj.patrolObjEquipmentNumber)
            ) {
              errList.push({
                row: i + 1,
                msg: this.ctx.__('patrolObj.somethingHasEspecialkey', fieldObjAll.numCusDia.replace(/\*/g, ''))
              })
              break
            }
          }
          // 备注
          if (fieldObjKey.some(res => res === 'remCusDia')) {
            if (obj.patrolObjRemarks && obj.patrolObjRemarks.length > 32) {
              errList.push({
                row: i + 1,
                msg: this.ctx.__('patrolObj.somethingMax32words', fieldObjAll.remCusDia.replace(/\*/g, ''))
              })
              break
            } else if (obj.patrolObjRemarks && regularStr.test(obj.patrolObjRemarks)) {
              errList.push({
                row: i + 1,
                msg: this.ctx.__('patrolObj.somethingHasEspecialkey', fieldObjAll.remCusDia.replace(/\*/g, '') )
              })
              break
            }
          }
          dataJsonNew.push(obj)
        }
        for (const params of dataJsonNew) {
          await (this as any).query('PatrolObj', 'createData', [ params ])
          // 开始同步pdms
          const dataParams = [
            {
              model_data_id: params.patrolObjId,
              patrol_obj_name: params.patrolObjName,
              is_custom_device: params.isCustomDevice,
              model_identify: 'tb_patrol_obj'
            }
          ]
          if (appId === 'eris') {
            // 自定义导入pdms（地图）
            await this.ctx.service.pdms.patrolObjPdmsAdd(dataParams, (this as any).transaction)
          }
          // 导入pdms
          const typeResuld = await this.ctx.service.patrolObjType.objectTypeService(
            { ids: params.objTypeId },
            (this as any).transaction
          )
          const dataValues = typeResuld.rows[0].dataValues || {}
          const dataAll = []
          dataAll.push({
            [dataValues.objUnicodeColumn]: params.patrolObjId,
            [dataValues.objNameColumn]: params.patrolObjName,
            region_id: params.patrolObjRegion
          })
          if (dataValues.rmColumnName) {
            dataAll[0][dataValues.rmColumnName] = dataValues.rmColumnValue
          }
          const pdmsStr = `/pdms/api/v1/model/${dataValues.rmCode}/add`
          await this.ctx.service.pdms.patrolObjPdmsCumAdd(dataAll, pdmsStr, (this as any).transaction)
        }
        const sucNum = dataJsonNew.length
        resolve({
          errList,
          sucNum
        })
      })
      stream.on('error', function (_this) {
        resolve({ value: _this.ctx.__('patrolObj.fileReadFailed') })
      })
    })
  }
  @Transactional
  async queryObjOne (params:any = {}): Promise<any> {
    const condition = {
      attributes: [ 'patrolObjId', 'objTypeId', 'patrolObjName' ],
      where: { patrolObjId: params.patrolObjId }
    }
    const result = await (this as any).query('PatrolObj', 'queryOne', [ condition ])
    return result
  }
  async region (searchName = ''): Promise<any> {
    const { ctx } = this
    let midResponseData = null
    const searchArr = []
    const { pageNo = 1, pageSize = 1000 } = ctx.request.query

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
            'parent_region_id,region_id,region_name,region_path,description,update_time,create_time,region_type',
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
    midResponseData = bufferToJson(midResult.data)
    midResponseData.data.list.forEach(item => {
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
            'parent_region_id,region_id,region_name,region_path,description,update_time,create_time,region_type',
          filedOptions: [
            {
              fieldName: 'region_id',
              fieldValue: dedupe(searchArr).join(','),
              type: 'in'
            }
          ]
        }
      }
    )
    const responseData = bufferToJson(result.data)
    return responseData.data.list
      .filter(obj => {
        return obj.region_name === searchName
      })
      .map(res => {
        const path = res.region_path
        return path
          .substring(1, path.length - 1)
          .split('@')
          .map(res => {
            return responseData.data.list.filter(resChi => {
              return resChi.region_id === res
            })
          })
      })
  }
}
=======
import {  Context, inject, provide} from 'midway';
import { PatrolObjResult, PatrolObjOptions, IPatrolObjService } from '../app/interface/partrolObjInterface';
// const Sequelize = require('sequelize')

// const { Op } = Sequelize
const { Transactional } = require('../app/core/transactionalDeco/index')

@provide('patrolObjService')
export class PatrolObjService implements IPatrolObjService {
  @inject()
  ctx: Context;


  // @inject('Transactional')
  @Transactional
  async getPatrolObjList(options: PatrolObjOptions): Promise<PatrolObjResult> {
<<<<<<<< HEAD:src/service/patrolObj.ts

========
    console.log('this---Transactional')
>>>>>>>> 2db8c7dc19290909326dc3ef26c4b686c5727c1f:src/app/service/patrolObj.ts
    const resultList = await (this  as  any).query('PatrolObj', 'queryData', [ options ])
    return resultList
    // return data
  }
  // @Transactional
  // async getPatrolObjList(options: PatrolObjOptions): Promise<PatrolObjResult> {
  //   console.log('this---Transactional',this)
  //   const resultList = await Transactional.query('PatrolObj', 'queryData', [ options ])
  //   return resultList
  // }
  
<<<<<<<< HEAD:src/service/patrolObj.ts
}
========
}
>>>>>>>> 2db8c7dc19290909326dc3ef26c4b686c5727c1f:src/app/service/patrolObj.ts
>>>>>>> 2db8c7dc19290909326dc3ef26c4b686c5727c1f
