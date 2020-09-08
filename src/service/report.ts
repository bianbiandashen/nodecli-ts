import {  Context, inject, provide} from 'midway';
import { IreportService } from '../app/interface/reportInterface';
import { IpdmsService } from '../app/interface/pdmsInterface';
import { IpatrolTaskPointService } from '../app/interface/patrolTaskPointInterface';
import { ICommonService } from '../app/interface/commonInterface';
import { ItaskService } from '../app/interface/taskInterface';

const fs = require('fs')
const path = require('path')
const moment = require('moment')
const compressing = require('compressing')
const tokenStore = require('../custom_plugin/egg-hik-consul/app/consul/tokenLocalStorage')
const Sequelize = require('sequelize')
const { Op } = Sequelize
const { Transactional } = require('../app/core/transactionalDeco/index')
// 数组对象根据属性值（数字比较）排序
function compare (property) {
  return function (a, b) {
    const value1 = Number(a[property])
    const value2 = Number(b[property])
    return value2 - value1
  }
}
function arrAreagroup (arr, id) {
  const map = {},
    dest = []
  for (let i = 0; i < arr.length; i++) {
    const ai = arr[i]
    if (!map[ai[id]]) {
      dest.push({
        regionId: ai[id],
        regionPath: ai.regionPath,
        data: [ ai ]
      })
      map[ai[id]] = ai
    } else {
      for (let j = 0; j < dest.length; j++) {
        const dj = dest[j]
        if (dj[id] === ai[id]) {
          dj.data.push(ai)
          break
        }
      }
    }
  }
  return dest
}
function PrefixInteger (num, m) {
  return (Array(m).join('0') + num).slice(-m)
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
function reportTypeFilter (val, that) {
  let text = ''
  switch (val) {
    case 1:
      text = that.ctx.__('report.dailyReport'); break
    case 2:
      text = that.ctx.__('report.weekReport'); break
    case 3:
      text = that.ctx.__('report.monthReport'); break
    case 4:
      text = that.ctx.__('report.yearReport'); break
    default:
      text = '--'; break
  }
  return text
}
function arrProblemGroup (arr, id) {
  const map = {},
    dest = []
  for (let i = 0; i < arr.length; i++) {
    const ai = arr[i]
    if (!map[ai[id]]) {
      dest.push({
        relativeId: ai[id],
        data: [ ai ]
      })
      map[ai[id]] = ai
    } else {
      for (let j = 0; j < dest.length; j++) {
        const dj = dest[j]
        if (dj[id] === ai[id]) {
          dj.data.push(ai)
          break
        }
      }
    }
  }
  return dest
}
function arrObjTypegroup (arr, id) {
  const map = {},
    dest = []
  for (let i = 0; i < arr.length; i++) {
    const ai = arr[i]
    if (!map[ai[id]]) {
      dest.push({
        objTypeId: ai[id],
        objTypeName: ai.objTypeName,
        data: [ ai ]
      })
      map[ai[id]] = ai
    } else {
      for (let j = 0; j < dest.length; j++) {
        const dj = dest[j]
        if (dj[id] === ai[id]) {
          dj.data.push(ai)
          break
        }
      }
    }
  }
  return dest
}
@provide('reportService')
export class ReportService implements IreportService{
  @inject()
  ctx: Context;

  @inject('pdmsService')
  serviceIpdms: IpdmsService;

  @inject('IpatrolTaskPointService')
  serviceIpatrolTaskPoint: IpatrolTaskPointService;

  @inject('commonService')
  serviceICommon: ICommonService;

  @inject('taskService')
  serviceItask: ItaskService;
  /**
   * 查询方法ID
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async queryFunIdService (params:any): Promise<any> {
    const { methodName } = params
    const data = await (this as any).query('Report', 'getMethodIdModel', [ methodName ])
    return data
  }
  /**
   * 获取报告-对象
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async hongwaiTemperatureService (params:any): Promise<any> {
    const result = await this.ctx.consulCurl(
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
    const resultData = this.ctx.helper.bufferToJson(result.data)
    this.ctx.helper.throwErrorByOtherComponents(result, resultData.message)
    this.ctx.hikLogger.info(resultData)
    return resultData
  }
  /**
   * 获取报告-对象
   * @param {object}
   * @return {string} - object
   */

  @Transactional
  async reportListObjService (params:any): Promise<any> {
    // 是否过滤漏检项，默认是false
    params.isFilterMiss = false
    // 是否过滤没有结论的巡检项，默认是false
    params.isFilterNonResult = true
    // 场景
    const realAppid = this.ctx.header.appid
    // 调用外部接口
    const result = await this.ctx.consulCurl(
      '/patrolengine-engine/api/v1/record/itemDetailList/query',
      'patrolengine',
      'patrolengine-engine',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          appId: realAppid
        },
        data: params
      }
    )
    const resultData = this.ctx.helper.bufferToJson(result.data)
    this.ctx.helper.throwErrorByOtherComponents(result, resultData.message)
    this.ctx.hikLogger.info(resultData)
    return resultData
  }
  /**
   * 新增xx
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async create (params:any = {}): Promise<any> {
    (this as any).query('Report', 'createData', params)
  }
  /**
   * 查询巡检项报告
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async getPatrolItemReport (params:any = {}): Promise<any> {
    const data = await (this as any).query('PatrolTaskItem', 'queryDataByReportService', [ params ])
    data.list = data.list.map(item => {
      const _data = this.ctx.helper.filterObj(item.dataValues, [ 'taskItemExec', 'patrolObj' ])
      const _taskItemExec = item.dataValues.taskItemExec
      const patrolObjInfo =
        item.dataValues.patrolObj && item.dataValues.patrolObj.partrolObjItem
          ? item.dataValues.patrolObj.partrolObjItem
          : null

      _data.patrolObjId = patrolObjInfo.patrolObjId || ''
      _data.patrolObjName = patrolObjInfo.patrolObjName || ''
      _data.regionPath = patrolObjInfo.regionPath || ''
      _data.itemPatrolResult =
        _taskItemExec && _taskItemExec.itemPatrolResult ? _taskItemExec.itemPatrolResult.orName : ''
      _data.execUserId = _taskItemExec && _taskItemExec.execUser ? _taskItemExec.execUser : ''
      _data.patrolTime = _taskItemExec && _taskItemExec.updateTime ? _taskItemExec.updateTime : ''
      if (_taskItemExec.taskFlowStatus) {
        const reviewerObj = _taskItemExec.dataValues.taskFlowStatus
          .filter(v => v.dataValues.status === '1' || v.dataValues.status === '2')
          .sort(compare('version'))[0]
        const rectificatorObj = _taskItemExec.dataValues.taskFlowStatus
          .filter(v => v.dataValues.status === '4')
          .sort(compare('version'))[0]
        const auditorObj = _taskItemExec.dataValues.taskFlowStatus
          .filter(v => v.dataValues.status === '6' || v.dataValues.status === '7')
          .sort(compare('version'))[0]
        const reviewerId = reviewerObj ? reviewerObj.modifier : null
        const rectificatorId = rectificatorObj ? rectificatorObj.modifier : null
        const auditorId = auditorObj ? auditorObj.modifier : null
        _data.reviewerId = reviewerId || ''
        _data.rectificatorId = rectificatorId || ''
        _data.auditorId = auditorId || ''
      } else {
        _data.reviewerId = ''
        _data.rectificatorId = ''
        _data.auditorId = ''
      }
      item.dataValues = _data
      return item
    })
    // 组装巡检区域名称字段
    for (const item of data.list) {
      item.dataValues.regionPathName = await this.serviceIpdms.treePath(
        item.dataValues.regionPath || '',
        (this as any).transaction
      )
      if (item.dataValues.execUserId) {
        const res = await this.serviceIpdms.getUsersByUserIds(
          [ item.dataValues.execUserId ],
          (this as any).transaction
        )
        item.dataValues.execUser = this.ctx.helper.bouncer(res.list.map(item => item.personName)).join(',')
      } else item.dataValues.execUser = ''
      if (item.dataValues.reviewerId) {
        const res = await this.serviceIpdms.getUsersByUserIds(
          [ item.dataValues.reviewerId ],
          (this as any).transaction
        )
        item.dataValues.reviewer = this.ctx.helper.bouncer(res.list.map(item => item.personName)).join(',')
      } else item.dataValues.reviewer = ''
      if (item.dataValues.rectificatorId) {
        const res = await this.serviceIpdms.getUsersByUserIds(
          [ item.dataValues.rectificatorId ],
          (this as any).transaction
        )
        item.dataValues.rectificator = this.ctx.helper.bouncer(res.list.map(item => item.personName)).join(',')
      } else item.dataValues.rectificator = ''
      if (item.dataValues.auditorId) {
        const res = await this.serviceIpdms.getUsersByUserIds(
          [ item.dataValues.auditorId ],
          (this as any).transaction
        )
        item.dataValues.auditor = this.ctx.helper.bouncer(res.list.map(item => item.personName)).join(',')
      } else item.dataValues.auditor = ''
    }
    return data
  }
  /**
   * 查询巡检项报告详情
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async getPatrolItemDetailReport (params:any = {}): Promise<any> {

    const data = await (this as any).query('PatrolTaskItem', 'findOneDataByReport', [ params ])
    const result:any = {
      patrolObjName: data.patrolObj.partrolObjItem.patrolObjName,
      regionPath: data.patrolObj.partrolObjItem.regionPath,
      patrolObjId: data.patrolObj.partrolObjItem.patrolObjId,
      reportId: data.taskItemReportId,
      itemName: data.itemName,
      patrolResult: data.itemResult.orName,
      execUserId: data.taskItemExec.execUser,
      referencePictures: data.taskItemExec.referencePictures,
      picUrls: data.taskItemExec.picUrls,
      recResult: data.taskItemExec.recResult,
      resultDesc: data.taskItemExec.resultDesc,
      taskPointId: data.taskItemExec.taskPointId,
      updateTime: data.taskItemExec.updateTime,
      patrolItemId: data.patrolItemId,
      patrolObjRelId: data.patrolObjRelId,
      patrolTaskId: data.patrolTaskId,
      patrolTaskItemId: data.patrolTaskItemId,
      patrolTime: data.Task.startTime,
      createTime: data.createTime,
      regionName: await this.serviceIpdms.treePath(
        data.patrolObj.partrolObjItem.regionPath || '',
        (this as any).transaction
      )
    }
    if (result.taskPointId) {
      const res = await this.serviceIpatrolTaskPoint.getTaskPointDetail(
        { taskPointId: result.taskPointId },
        (this as any).transaction
      )
      result.taskPointName = res.pointName
    }
    if (result.picUrls) {
      const picArr = result.picUrls.split(',')
      const resultPicArr = []
      for (const item of picArr) {
        const realUrl = await this.serviceICommon.getImageUrlForBS(item, (this as any).transaction)
        resultPicArr.push(realUrl.realUrl)
      }
      result.resultPicArr = resultPicArr
    }
    if (result.execUserId) {
      const res = await this.serviceIpdms.getUsersByUserIds([ result.execUserId ], (this as any).transaction)
      result.execUser = this.ctx.helper.bouncer(res.list.map(item => item.personName)).join(',')
    } else result.execUser = ''
    const reviewerObj =
      data.taskItemExec.taskFlowStatus
        .filter(item => item.status === '1' || item.status === '2')
        .sort(compare('version'))[0] || null
    const rectificatorObj =
      data.taskItemExec.taskFlowStatus
        .filter(item => item.status === '4')
        .sort(compare('version'))[0] || null
    const auditorObj =
      data.taskItemExec.taskFlowStatus
        .filter(item => item.status === '6' || item.status === '7')
        .sort(compare('version'))[0] || null
    if (reviewerObj && reviewerObj.dataValues && reviewerObj.dataValues.modifier) {
      const res = await this.serviceIpdms.getUsersByUserIds(
        [ reviewerObj.dataValues.modifier ],
        (this as any).transaction
      )
      reviewerObj.dataValues.reviewer = this.ctx.helper.bouncer(res.list.map(item => item.personName)).join(',')
    } else if (reviewerObj && reviewerObj.dataValues) reviewerObj.dataValues.reviewer = ''
    if (rectificatorObj && rectificatorObj.dataValues && rectificatorObj.dataValues.modifier) {
      const res = await this.serviceIpdms.getUsersByUserIds(
        [ rectificatorObj.dataValues.modifier ],
        (this as any).transaction
      )
      rectificatorObj.dataValues.rectificator = this.ctx.helper.bouncer(res.list.map(item => item.personName)).join(
        ','
      )
    } else if (rectificatorObj && rectificatorObj.dataValues) { rectificatorObj.dataValues.rectificator = '' }
    if (auditorObj && auditorObj.dataValues && auditorObj.dataValues.modifier) {
      const res = await this.serviceIpdms.getUsersByUserIds(
        [ auditorObj.dataValues.modifier ],
        (this as any).transaction
      )
      auditorObj.dataValues.auditor = this.ctx.helper.bouncer(res.list.map(item => item.personName)).join(',')
    } else if (auditorObj && auditorObj.dataValues) auditorObj.dataValues.auditor = ''
    result.reviewerInfo = reviewerObj
    result.rectificatorInfo = rectificatorObj
    result.auditorInfo = auditorObj
    return result
  }
  /**
   * 生成巡检统计报告
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async createPatrolStatisticsReport (params:any = {}): Promise<any> {
    const { ctx } = this
    ctx.header.appid = params.appid
    let count = 0
    const { startTime, endTime, reportType } = params
    const result = await (this as any).query('Report', 'queryStatsReportInfo', [
      {
        startTime,
        endTime
      }
    ])
    const group = arrAreagroup(result, 'regionId')
    const reportData = []
    for (const item of group) {
      count++
      const _reportCode = `XJBG${moment().format('YYYYMMDDHHmmss')}_${PrefixInteger(count, 3)}`
      const isHas = await (this as any).query('Report', 'queryAllData', [{ where: { reportCode: _reportCode } }])
      if (isHas.length <= 0) {
        const patrolItemArr = []
        const obj:any = {
          patrolAreaIds: item.regionId,
          regionPath: item.regionPath
        }
        const problemList =
        item.data && item.data.length > 0
          ? item.data.filter(v => v.transactionStatus && v.transactionStatus !== '9')
          : []
        const noRectifyProblem =
        item.data && item.data.length > 0
          ? item.data.filter(v => v.transactionStatus && v.transactionStatus === '3')
          : []
        const patrolTaskIds =
        item.data && item.data.length > 0 ? item.data.map(v => v.patrolTaskId) : []
        obj.objNum = Array.from(new Set(item.data.map(v => v.patrolObjRelId))).length || 0
        obj.objTypeNum = Array.from(new Set(item.data.map(v => v.objTypeId))).length || 0
        // 任务巡检项去重
        const _patrolItemList = item.data.reduce((cur, next) => {
          patrolItemArr[next.patrolTaskItemId] ? '' : patrolItemArr[next.patrolTaskItemId] = true && cur.push(next)
          return cur
        }, [])
        const nowTime = new Date()
        const offset = -(nowTime.getTimezoneOffset() / 60)
        // 过滤任务巡检项末级的
        const resultPatrolItemList = _patrolItemList.filter(v => v.isLeaf === 1)
        obj.patrolItemNum = resultPatrolItemList.length || 0
        obj.problemNum = problemList.length
        obj.noRectifyProblemNum = noRectifyProblem.length
        obj.patrolTaskIds = Array.from(new Set(patrolTaskIds)).join(',')
        obj.reportType = reportType
        obj.reportCode = _reportCode
        obj.isDelete = 0
        obj.createTimeZone = offset
        obj.createTimeStamp = nowTime.getTime()
        obj.updateTimeZone = offset
        obj.updateTimeStamp = nowTime.getTime()
        reportData.push(obj)
      } else {
        console.log('报告的数据已经存在：', _reportCode)
      }
    }
    return await (this as any).query('Report', 'blukCreate', [ reportData ])
  }
  /**
   * 生成巡检统计报告PDF文件
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async createPatrolStatisticsReportZip (params:any): Promise<any> {
    const { ctx } = this
    const { problemField, isShowSort } = params
    const isShowField = {
      itemNameIsShow: problemField.find(v => v.key === 'itemName').isShow,
      patrolObjNameIsShow: problemField.find(v => v.key === 'patrolObjName').isShow,
      execUserNameIsShow: problemField.find(v => v.key === 'execUserName').isShow,
      patrolResultTxtIsShow: problemField.find(v => v.key === 'patrolResultTxt').isShow,
      resultDescIsShow: problemField.find(v => v.key === 'resultDesc').isShow,
      reviewerIsShow: problemField.find(v => v.key === 'reviewer').isShow,
      rectificatorIsShow: problemField.find(v => v.key === 'rectificator').isShow,
      rectificatRemarkIsShow: problemField.find(v => v.key === 'rectificatRemark').isShow,
      auditorIsShow: problemField.find(v => v.key === 'auditor').isShow
    }
    delDir(path.resolve((this as any).app.config.static.report, 'statistics'))
    const detailContent = []
    for (const item of params.reportIds) {
      const reportDetail = await this.getPatrolStatisticsDetailReport({ reportId: item }, (this as any).transaction)
      if (reportDetail && reportDetail.dataValues) {
        const typeText = reportTypeFilter(reportDetail.dataValues.reportType,this)
        const _filename = `${reportDetail.dataValues.reportCode}_${typeText}`
        reportDetail.dataValues.filename = _filename
        reportDetail.dataValues.app = params._that.app
        reportDetail.dataValues.problemField = problemField
        reportDetail.dataValues.chartIsShow = reportDetail.dataValues.objTypeList.length > 0
        reportDetail.dataValues.isShowSort = isShowSort
        reportDetail.dataValues.objTypeList = JSON.stringify(reportDetail.dataValues.objTypeList)
        reportDetail.dataValues.problemList = reportDetail.dataValues.problemList.map(item => {
          return Object.assign({}, item, isShowField)
        })
        detailContent.push({
          filename: _filename,
          html: await ctx.renderView('report-statistics.nj', reportDetail.dataValues)
        })
      }
    }
    await params._that.createHtmlToPdf(detailContent, (this as any).transaction)
    await compressing.zip.compressDir(path.resolve((this as any).app.config.static.report, 'statistics'), path.resolve((this as any).app.config.static.report, this.ctx.__('report.reportZip')))
    return {
      name: this.ctx.__('report.reportZip'),
      path: path.resolve((this as any).app.config.static.report, this.ctx.__('report.reportZip'))
    }
  }

  /**
   * 生成巡检任务报告PDF文件
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async createPatrolTaskReportZip (params:any): Promise<any> {
    const _this = this
    debugger
    const { ctx } = this
    const { patrolTaskId } = params
    const detailContent = []
    delDir(path.resolve((this as any).app.config.static.report, 'taskReport'))
    for (const item of patrolTaskId) {
      // 获取详情
      const data = await this.serviceItask.getDetailByTaskId({ patrolTaskId: item }, (this as any).transaction)
      // 获取问题列表
      const data1 = await this.serviceItask.getTaskItemsByTaskIdByBs({
        patrolTaskId: item,
        relatePatrolPoint: data.dataValues.execType === 2 ? '0' : '1'
      }, (this as any).transaction)
      const flowStatusListClass = [
        { label: this.ctx.__('report.toBeCheck'), value: 0, pic: 'patrolDiv-icon examine', class: 'tag-daifuhe' },
        { label: this.ctx.__('report.checkSuccess'), value: 1 },
        { label: this.ctx.__('report.checkFailed'), value: 2 },
        { label: this.ctx.__('report.toBeRectified'), value: 3, pic: 'patrolDiv-icon rectify', class: 'tag-daizhenggai' },
        { label: this.ctx.__('report.rectifiedComplete'), value: 4 },
        { label: this.ctx.__('report.toBeReview'), value: 5, pic: 'patrolDiv-icon review', class: 'tag-shenghe' },
        { label: this.ctx.__('report.reviewSuccess'), value: 6 },
        { label: this.ctx.__('report.reviewFailed'), value: 7 },
        { label: this.ctx.__('report.completed'), value: 8 },
        { label: this.ctx.__('report.completed'), value: 9 }
      ]
      const judgeElementDiv = function (item) {
        const taskItemStatus = item && item.status
        const flowStatus = item && item.dataValues.flowStatus
        if ((taskItemStatus === 2 && !flowStatus) || (flowStatus === '9' || flowStatus === '8')) {
          return _this.ctx.__('report.completed')
        } else if (flowStatus && flowStatus !== '9' && flowStatus !== '8') {
          const flowStatuObj = flowStatusListClass.find(ele => ele.value.toString() === flowStatus.toString())
          const flowStatuLabel = flowStatuObj && flowStatuObj.label
          return flowStatuLabel
        } else if (!taskItemStatus && !flowStatus) {
          return _this.ctx.__('report.toPatrol')
        }
        return _this.ctx.__('report.toPatrol')

      }
      const itemPointList = data1.list.map(item => {
        return {
          regionPathName: item.dataValues.regionPathName,
          objTypeName: item.patrolObj && item.patrolObj.partrolObjItem && item.patrolObj.partrolObjItem.patrolObjType && item.patrolObj.partrolObjItem.patrolObjType.objTypeName || '',
          patrolObjName: item.patrolObj && item.patrolObj.partrolObjItem && item.patrolObj.partrolObjItem.patrolObjName || '',
          patrolItemPath: item.dataValues.patrolItemPath,
          ponitList: item.ponitList,
          recResult: item.dataValues && item.dataValues.recResult,
          patrolResult: item.status === 3 ? _this.ctx.__('report.undetected') : item.patrolResult || '--',
          status: item.status ? _this.ctx.__('report.completed') : _this.ctx.__('report.unBegin'),
          flowStatus: judgeElementDiv(item),
          resultDesc: item.dataValues.resultDesc || '--'
        }
      })
      const params1 = {
        patrolTaskName: data.dataValues.patrolTaskName,
        patrolPlanName: data.dataValues.patrolPlanName,
        psName: data.dataValues.psName,
        regionPathName: data.dataValues.regionPathName,
        taskType: data.dataValues.taskType,
        execType: data.dataValues.execType,
        startTime: data.startTime,
        patrolObjNum: data.dataValues.patrolObjNum,
        patrolPointNum: data.dataValues.patrolPointNum,
        normalReusltNum: data.dataValues.normalReusltNum,
        problemNum: data.dataValues.problemNum,
        missingCount: data.dataValues.missingCount || 0,
        problemList: itemPointList
      }
      const _filename = params1.patrolTaskName + this.ctx.__('report.taskReportL')
      detailContent.push({
        filename: _filename,
        html: await ctx.renderView('task-report.nj', params1),
        type: 'taskReport'
      })
    }
    await params._that.createHtmlToPdf(detailContent, (this as any).transaction)
    await compressing.zip.compressDir(path.resolve((this as any).app.config.static.report, 'taskReport'), path.resolve((this as any).app.config.static.report, this.ctx.__('report.taskZip')))
    return {
      name: this.ctx.__('report.reportZip'),
      path: path.resolve((this as any).app.config.static.report, this.ctx.__('report.taskZip'))
    }
  }

  /**
   * 查询巡检统计报告列表
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async getPatrolStatisticsListReport (params:any = {}): Promise<any> {
    const { ctx } = this
    const userId = ctx.getUserId()
    const appid = ctx.header.appid
    if (params.patrolAreaIds) {
      const regionLimit = await this.serviceIpdms.regionMultiverify({
        userId,
        regionIndexCodes: [ params.patrolAreaIds ]
      },(this as any).transaction)
      if (regionLimit && regionLimit.list.length <= 0) {
        const result = Object.assign({}, regionLimit, {
          pageNo: params.pageNo,
          pageSize: params.pageSize,
          jurisdiction: 0 // 0-没权限，1有权限
        })
        return result
      }
    }
    if (!params.patrolAreaIds && appid && userId) {
      // 获取该用户有权限的区域列表
      const regionList = await this.serviceIpdms.getAllRegionByUserName({ userId },(this as any).transaction)
      if (regionList) {
        const regionIdLimit = regionList
          .filter(v => v.regionStatus === 1)
          .map(item => item.regionIndexCode)
        params = Object.assign({}, params, { regionIdsArr: regionIdLimit })
      }
    }

    const result = await (this as any).query('Report', 'queryDataStatistcs', [ params ])
    for (const item of result.list) {
      item.dataValues.regionName = await this.serviceIpdms.treePath(
        item.dataValues.patrolAreaIds || '',
        (this as any).transaction
      )
    }
    return result
  }
  /**
   * 查询巡检统计报告详情
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async getPatrolStatisticsDetailReport (params:any = {}, transaction?:any): Promise<any> {
    const condition = {
      where: {
        reportId: params.reportId,
        isDelete: { [Op.lt]: 1 }
      }
    }
    const result = await (this as any).query('Report', 'queryStatistcsDetail', [ condition ])
    const taskIdArr = result.dataValues.patrolTaskIds
      ? result.dataValues.patrolTaskIds.split(',')
      : []
    result.dataValues.regionName = await this.serviceIpdms.treePath(
      result.dataValues.patrolAreaIds || '',
      (this as any).transaction
    )
    const _reportType = result.dataValues.reportType
    const _reportCreateTime = result.dataValues.createTime
    if (_reportType === 1 || _reportType === 2) {
      let startTime = ''
      let endTime = ''
      if (_reportType === 1) {
        endTime = moment(_reportCreateTime).format('YYYY-MM-DD HH:mm:ss')
        startTime = moment(new Date(_reportCreateTime).getTime() - 24 * 60 * 60 * 1000).format(
          'YYYY-MM-DD HH:mm:ss'
        )
      } else if (_reportType === 2) {
        endTime = moment(_reportCreateTime).format('YYYY-MM-DD HH:mm:ss')
        startTime = moment(new Date(_reportCreateTime).getTime() - 7 * 24 * 60 * 60 * 1000).format(
          'YYYY-MM-DD HH:mm:ss'
        )
      }
      const problemList =
        taskIdArr.length > 0
          ? await this.getPatrolStatisticsReportProblem(
            {
              startTime,
              endTime,
              patrolTaskIds: taskIdArr
            },
            (this as any).transaction
          )
          : []
      const problemGroup = arrProblemGroup(problemList, 'relativeId')
      const resultProblemList = []
      for (const item of problemGroup) {
        const obj:any = { relativeId: item.relativeId }
        const isDeleteHas = item.data.sort(compare('version'))[0]
        const reviewerObj =
          item.data.filter(v => v.status === '1' || v.status === '2').sort(compare('version'))[0] ||
          null
        const rectificatorObj =
          item.data.filter(v => v.status === '4').sort(compare('version'))[0] || null
        const auditorObj =
          item.data.filter(v => v.status === '6' || v.status === '7').sort(compare('version'))[0] ||
          null
        obj.objTypeId = isDeleteHas ? isDeleteHas.objTypeId : ''
        obj.objTypeName = isDeleteHas ? isDeleteHas.objTypeName : ''
        obj.objTypeId = isDeleteHas ? isDeleteHas.objTypeId : ''
        // obj.itemName = isDeleteHas ? isDeleteHas.itemName : ''
        obj.path = isDeleteHas ? isDeleteHas.path : ''
        obj.patrolObjName = isDeleteHas ? isDeleteHas.patrolObjName : ''
        obj.patrolResultTxt = isDeleteHas ? isDeleteHas.orName : ''
        obj.resultDesc = isDeleteHas ? isDeleteHas.resultDesc : ''
        obj.execUserId = isDeleteHas ? isDeleteHas.execUser : ''
        obj.reviewerId = reviewerObj ? reviewerObj.modifier : ''
        obj.rectificatorId = rectificatorObj ? rectificatorObj.modifier : ''
        obj.rectificatRemark = rectificatorObj ? rectificatorObj.remark : ''
        obj.auditorId = auditorObj ? auditorObj.modifier : ''
        obj.itemName = obj.path ? await this.serviceICommon.partrolItemsPath(
          obj.path,
          (this as any).transaction
        ) : ''
        const userIdArr = []
        if (obj.execUserId) userIdArr.push(obj.execUserId)
        if (obj.reviewerId) userIdArr.push(obj.reviewerId)
        if (obj.rectificatorId) userIdArr.push(obj.rectificatorId)
        if (obj.auditorId) userIdArr.push(obj.auditorId)
        const userList = await this.serviceIpdms.getUsersByUserIds(userIdArr, (this as any).transaction)
        if (userList && userList.list) {
          if (obj.execUserId) {
            const execUserObj = userList.list.find(v => v.userId === obj.execUserId)
            obj.execUserName = execUserObj ? execUserObj.personName || execUserObj.userName : ''
          } else obj.execUserName = ''
          if (obj.reviewerId) {
            const reviewerObj = userList.list.find(v => v.userId === obj.reviewerId)
            obj.reviewer = reviewerObj ? reviewerObj.personName || reviewerObj.userName : ''
          } else obj.reviewer = ''
          if (obj.rectificatorId) {
            const rectificatorObj = userList.list.find(v => v.userId === obj.rectificatorId)
            obj.rectificator = rectificatorObj
              ? rectificatorObj.personName || rectificatorObj.userName
              : ''
          } else obj.rectificator = ''
          if (obj.auditorId) {
            const auditorObj = userList.list.find(v => v.userId === obj.auditorId)
            obj.auditor = auditorObj ? auditorObj.personName || auditorObj.userName : ''
          } else obj.auditor = ''
        } else {
          obj.execUserName = ''
          obj.reviewer = ''
          obj.rectificator = ''
          obj.auditor = ''
        }
        resultProblemList.push(obj)
      }
      result.dataValues.problemList = resultProblemList
    } else result.dataValues.problemList = []
    const _problemList = result.dataValues.problemList
    if (_problemList && _problemList.length > 0) {
      const _objTypeList = arrObjTypegroup(_problemList, 'objTypeId')
      result.dataValues.objTypeList = _objTypeList.map(item => {
        return {
          objTypeId: item.objTypeId,
          objTypeName: item.objTypeName,
          objNum: item.data.length
        }
      })
    } else result.dataValues.objTypeList = []
    return result
  }
  /**
   * 查询巡检统计报告问题数目
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async getPatrolStatisticsReportProblem (params:any, transaction?:any): Promise<any> {
    const result = await (this as any).query('Report', 'queryStatsReportProblem', [ params ])
    return result
  }
  /**
   * 查询巡检统计报告某个时间段以前的报告删除
   * @param {object} params
   * @return {string} - object
   */
  @Transactional
  async deleteStatisticsReportBeforeTime (params:any): Promise<any> {
    const { ctx } = this
    ctx.header.appid = params.appid
    const reportList = await (this as any).query('Report', 'queryStatistcsDataBeforeTime', [ params ])
    const reportIdsArr = reportList.map(item => item.reportId)
    if (reportIdsArr.length > 0) {
      const result = await (this as any).query('Report', 'deleteData', [ reportIdsArr ])
      return result
    } return reportList
  }
}
