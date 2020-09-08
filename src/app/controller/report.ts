'use strict'
import { Context, inject, provide,Application } from 'midway'
import { get,post,controller } from '../../decorator/openApi'
import { BaseController } from '../core/base_controller'
import { IreportService } from '../interface/reportInterface';
import { IpictureService } from '../interface/pictureInterface';
import { IPatrolObjService } from '../interface/patrolObjInterface';
import { IpdmsService } from '../interface/pdmsInterface';
import { ICommonService} from '../interface/commonInterface';

const Exception = require('../core/Exception')
// const fs = require('fs')
// function reportTypeFilter (val, _this) {
//   let text = ''
//   switch (val) {
//     case 1:
//       text = _this.ctx.__('report.dailyReport'); break
//     case 2:
//       text = _this.ctx.__('report.weekReport'); break
//     case 3:
//       text = _this.ctx.__('report.monthReport'); break
//     case 4:
//       text = _this.ctx.__('report.yearReport'); break
//     default:
//       text = '--'; break
//   }
//   return text
// }
/**
 * @Controller report
 */
@provide()
@controller('/report',{description: '巡检问题管理'})
export class ReportController extends BaseController {
  @inject()
  ctx: Context;
  app: Application;

  @inject('reportService')
  service: IreportService;

  @inject('pictureService')
  picture: IpictureService;

  @inject('patrolObjService')
  patrolObj: IPatrolObjService;

  @inject('pdmsService')
  pdms: IpdmsService;

  @inject('commonService')
  common: ICommonService;
  /**
   * @summary
   * @description 巡检项报告导出
   * @Router POST /report/item/export
   */

  @post('/item/export',{description: '巡检问题管理'})
  async itemReportExport () {
    const { ctx } = this
    const params = ctx.request.body
    const dataAll = params.dataAll
    params.dataAll.showDevice = !!(dataAll.picUrlsImages && dataAll.picUrlsImages.length && Number(dataAll.execType) === 1)
    params.dataAll.showPerson = !!(dataAll.picUrlsImages && dataAll.picUrlsImages.length && Number(dataAll.execType) === 2)
    params.dataAll.one = !!(dataAll.orName || dataAll.execAdvice || dataAll.execPerson || dataAll.execTime)
    params.dataAll.two = !!(dataAll.reviewResult || dataAll.reviewAdvice || dataAll.reviewPerson || dataAll.reviewTime)
    params.dataAll.three = !!(dataAll.rectifyAdvice || dataAll.rectifyPerson || dataAll.rectifyTime)
    params.dataAll.four = !!(dataAll.checkResult || dataAll.checkAdvice || dataAll.checkPerson || dataAll.checkTime)
    params.hongwaiArrayShow = !!(params.hongwaiArray && params.hongwaiArray.length)
    params.donghuanArrayShow = !!(params.donghuanArray && params.donghuanArray.length)
    await this.app.htmlToPdf({
      filename: '123',
      html: await ctx.renderView('item-report.nj', params)
    })
  }
  /**
   * @summary
   * @description 红外展示
   * @Router POST /report/hongwai/search
   */

  @post('/hongwai/search',{description: '巡检问题管理'})
  async hongwaiSearch () {
    try {
      const { ctx } = this
      const params = ctx.request.body
      // 根据方法名称获取方法ID
      const msDate = await this.service.queryFunIdService(params)
      const mannerId = msDate && msDate[0] && msDate[0].mId
      params.mannerId = mannerId
      // 获取红外检测点基本数据
      const data = await this.patrolObj.quantityTaskService(params)
      for (const iterator of data.list) {
        // 获取预置位
        const cameraId = iterator.dataValues.cameraId
        if (cameraId) {
          const cameras = await this.common.getCameraObj({ cameraId })
          iterator.dataValues.cameraName = cameras && cameras.data && cameras.data.list && cameras.data.list[0] && cameras.data.list[0].camera_name
        } else {
          iterator.dataValues.cameraName = ''
        }
        // 获取图片
        if (iterator.dataValues.picUrl) {
          const data = await this.common.getImageUrlForBS(iterator.dataValues.picUrl)
          iterator.dataValues.picUrlHttp = data && data.picUrl
        } else {
          iterator.dataValues.picUrlHttp = ''
        }
        // 获取测温位
        if (iterator.dataValues.extendColumn3) {
          const presetInfoId = iterator.dataValues.extendColumn3
          const data = await this.service.hongwaiTemperatureService({ presetInfoId })
          // 预置位名称
          iterator.dataValues.presetInfoName = data.code === '0' ? data.data && data.data.list && data.data.list[0] && data.data.list[0].ruleName : ''
        } else {
          iterator.dataValues.presetInfoName = ''
        }
      }
      for (const iterator of data.list) {
        const cameraId = iterator.dataValues.cameraId
        if (cameraId) {
          const cameras = await this.common.getCameraObj({ cameraId })
          iterator.dataValues.cameraName = cameras && cameras.data && cameras.data.list && cameras.data.list[0] && cameras.data.list[0].camera_name
        } else {
          iterator.dataValues.cameraName = ''
        }
      }
      this.success({ data })
    } catch (error) {
      throw new Exception(error.message, error.code, error.transaction)
    }
  }

  /**
   * @summary
   * @description 动环数据展示
   * @Router POST /report/donghuan/search
   */

  @post('/donghuan/search',{description: '巡检问题管理'})
  async donghuanSearch () {
    try {
      const { ctx } = this
      const params = ctx.request.body
      // 根据方法名称获取方法ID
      const msDate = await this.service.queryFunIdService(params)
      const mannerId = msDate && msDate[0] && msDate[0].mId
      params.mannerId = mannerId
      // 获取检测点
      const resultBody = await this.patrolObj.quantityTaskService(params)
      let data = []
      for (const obj of resultBody.list) {
        const modelDataId = obj.dataValues.extendColumn3
        const resultPdms = await this.pdms.donghuanShowPdms({ modelDataId }) || {}
        resultPdms.list = resultPdms.list.map(res => {
          const objValue = res
          objValue.latest_value = obj.dataValues.eventValue
          return objValue
        })
        data = data.concat(resultPdms.list)
      }
      this.success({ data })
    } catch (error) {
      throw new Exception(error.message, error.code, error.transaction)
    }
  }
  /**
   * @summary 报告查询-对象
   * @description 获取报告数据
   * @Router Get /report/obj/list
   */
  @post('/obj/list',{description: '巡检问题管理'})
  async reportObjList () {
    const { ctx } = this
    const data = await this.service.reportListObjService(ctx.request.body)
    this.successItms(data)
  }
  /**
   * @summary 报告查询-任务
   * @description 获取报告数据
   * @Router Get /report/task/list
   */
  @get('/task/list',{description: '巡检问题管理'})
  async reportTaskList () {
    const { ctx } = this
    const params:any = ctx.request.query
    // 是否过滤漏检项，默认是false
    params.isFilterMiss = false
    // 是否过滤没有结论的巡检项，默认是false
    params.isFilterNonResult = true
    const result = await this.ctx.consulCurl(
      '/patrolengine-engine/api/v1/record/taskDetail/query',
      'patrolengine',
      'patrolengine-engine',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          appId: this.ctx.header.appid
        },
        data: params
      }
    )
    const responseData = ctx.helper.bufferToJson(result.data)
    if (responseData && responseData.data && responseData.data.patrolItemInfos) {
      for (const iterator of responseData.data.patrolItemInfos) {
        if (iterator.picUrls) {
          const picIds = iterator.picUrls.split(',')
          const problemImages = []
          for (const i of picIds) {
            if (i) {
              const pic = await this.picture.getRealPic(i)
              problemImages.push(pic)
            }
          }
          iterator.picUrlsImages = problemImages
        } else {
          iterator.picUrlsImages = []
        }
      }
    }
    ctx.helper.throwErrorByOtherComponents(result, responseData.message)
    this.successItms(responseData)
  }
  /**
   * @summary 报告查询-项
   * @description 获取报告数据
   * @Router Get /report/item/list
   */
  @get('/item/list',{description: '巡检问题管理'})
  async reportItemList () {
    const { ctx, app } = this
    const { taskItemId } = ctx.request.query
    const result = await app.consulCurl(
      '/patrolengine-engine/api/v1/record/itemDetail/query',
      'patrolengine',
      'patrolengine-engine',
      {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
          appId: this.ctx.header.appid
        },
        data: { taskItemId }
      }
    )
    const responseData = ctx.helper.bufferToJson(result.data)
    ctx.helper.throwErrorByOtherComponents(result, responseData.message)
    // 获取巡检图片
    const problemImages = []
    if (responseData && responseData.data.picUrls) {
      const picIds = responseData.data.picUrls.split(',')
      for (const i of picIds) {
        if (i) {
          const pic = await this.picture.getRealPic(i)
          problemImages.push(pic)
        }
      }
      responseData.data.picUrlsImages = problemImages
    }
    // 获取整改图片
    const recImages = []
    if (responseData && responseData.data.rectifyPic) {
      const picIds = responseData.data.rectifyPic.split(',')
      for (const i of picIds) {
        if (i) {
          const pic = await this.picture.getRealPic(i)
          recImages.push(pic)
        }
      }
      responseData.data.recImages = recImages
    }
    this.successItms(responseData)
  }
  /**
   * @summary 巡检项报告列表查询
   * @description 用于查询巡检项报告列表
   * @Router Get /report/patrolItem/list
   * @request body reportListPatrolItemRequest *body
   * @response 200 reportListPatrolItemResponse 查询成功
   */
  @post('/patrolItem/list',{description: '用于查询巡检项报告列表'})
  async queryReportListPatrolItem () {
    const { ctx } = this
    // 调用 service 创建一个 topic
    const data = await this.service.getPatrolItemReport(ctx.request.body)
    // 设置响应体和状态码
    this.success(data)
  }

  /**
   * @summary 巡检项报告详情查询
   * @description 用于查询某一个巡检项报告详情
   * @Router Get /report/patrolItem/detail
   * @request body reportDetailPatrolItemRequest *body
   * @response 200 reportDetailPatrolItemResponse 查询成功
   */
  @get('/patrolItem/detail',{description: '用于查询某一个巡检项报告详情'})
  async queryReportDetailPatrolItem () {
    const { ctx } = this
    // 调用 service 创建一个 topic
    const data = await this.service.getPatrolItemDetailReport(ctx.request.query)
    // 设置响应体和状态码
    this.success(data)
  }
  /**
   * @summary 巡检统计报告列表查询
   * @description 巡检统计报告列表
   * @Router Get /report/patrolTemplate/list
   * @request body reportListPatrolTemplateRequest *body
   * @response 200 reportListPatrolTemplateResponse 查询成功
   */
  @post('/patrolTemplate/list',{description: '巡检统计报告列表'})
  async queryReportListPatrolTemplate () {
    const { ctx } = this
    try {
      const data = await this.service.getPatrolStatisticsListReport(ctx.request.body)
      this.operateLog(
        'log.moduleId.report.displayName',
        'log.objectType.model_stats_report.displayName',
        this.ctx.__('report.queryReportListPatrolTemplate'),
        'log.action.query.displayName',
        this.ctx.__('report.queryReportListPatrolTemplateOperateLogSuccess'),
        'log.actionMessageId.query_stats_report_list.message',
        1
      )
      this.success(data)
    } catch (error) {
      this.operateLog(
        'log.moduleId.report.displayName',
        'log.objectType.model_stats_report.displayName',
        this.ctx.__('report.queryReportListPatrolTemplate'),
        'log.action.query.displayName',
        this.ctx.__('report.queryReportListPatrolTemplateOperateLogError'),
        'log.actionMessageId.query_stats_report_list.message',
        0
      )
      throw new Exception(error.message, error.code, error.transaction)
    }
  }

  /**
   * @summary 巡检统计报告详情查询
   * @description 巡检统计报告详情
   * @Router Get /report/patrolTemplate/detail
   * @request body reportDetailPatrolTemplateRequest *body
   * @response 200 reportDetailPatrolTemplateResponse 查询成功
   */
  @get('/patrolTemplate/detail',{description: '巡检统计报告详情'})
  async queryReportDetailPatrolTemplate () {
    const { ctx } = this
    try {
      const data = await this.service.getPatrolStatisticsDetailReport(ctx.request.query)
      this.operateLog(
        'log.moduleId.report.displayName',
        'log.objectType.model_stats_report.displayName',
        this.ctx.__('report.queryReportDetailPatrolTemplate'),
        'log.action.query.displayName',
        this.ctx.__('report.queryReportDetailPatrolTemplateOperateLogSuccess'),
        'log.actionMessageId.query_stats_report_detail.message',
        1
      )
      this.success(data)
    } catch (error) {
      this.operateLog(
        'log.moduleId.report.displayName',
        'log.objectType.model_stats_report.displayName',
        this.ctx.__('report.queryReportDetailPatrolTemplate'),
        'log.action.query.displayName',
        this.ctx.__('report.queryReportDetailPatrolTemplateOperateLogError'),
        'log.actionMessageId.query_stats_report_detail.message',
        0
      )
      throw new Exception(error.message, error.code, error.transaction)
    }
  }
  // /**
  //  * @summary 巡检统计报告下载
  //  * @description 巡检统计报告下载
  //  * @Router Post /patrolTemplate/downReportPdf
  //  */
  // @post('/patrolTemplate/downReportPdf',{description: '巡检问题管理'})
  // async downReportPdf () {
  //   const { ctx } = this
  //   try {
  //     const { problemField, isShowSort } = ctx.request.body
  //     const isShowField = {
  //       itemNameIsShow: problemField.find(v => v.key === 'itemName').isShow,
  //       patrolObjNameIsShow: problemField.find(v => v.key === 'patrolObjName').isShow,
  //       execUserNameIsShow: problemField.find(v => v.key === 'execUserName').isShow,
  //       patrolResultTxtIsShow: problemField.find(v => v.key === 'patrolResultTxt').isShow,
  //       resultDescIsShow: problemField.find(v => v.key === 'resultDesc').isShow,
  //       reviewerIsShow: problemField.find(v => v.key === 'reviewer').isShow,
  //       rectificatorIsShow: problemField.find(v => v.key === 'rectificator').isShow,
  //       rectificatRemarkIsShow: problemField.find(v => v.key === 'rectificatRemark').isShow,
  //       auditorIsShow: problemField.find(v => v.key === 'auditor').isShow
  //     }

  //     const data = await ctx.service.report.getPatrolStatisticsDetailReport(ctx.request.body)
  //     const planDetail = data.dataValues
  //     const typeText = reportTypeFilter(planDetail.reportType, this)
  //     const _filename = `${planDetail.reportCode}_${typeText}`
  //     planDetail.filename = _filename
  //     planDetail.app = this.app
  //     // planDetail.baseUrl = 'http://10.15.66.107:7001'
  //     planDetail.problemField = problemField
  //     planDetail.chartIsShow = planDetail.objTypeList.length > 0
  //     planDetail.objTypeList = JSON.stringify(planDetail.objTypeList)
  //     planDetail.colspan = problemField.filter(v => v.isShow).length
  //     planDetail.isShowSort = isShowSort
  //     planDetail.problemList = planDetail.problemList.map(item => {
  //       return Object.assign({}, item, isShowField)
  //     })
  //     await this.htmlToPdf({
  //       filename: _filename,
  //       html: await ctx.renderView('report-statistics.nj', planDetail)
  //     })
  //     this.operateLog(
  //       'log.moduleId.report.displayName',
  //       'log.objectType.model_stats_report.displayName',
  //       this.ctx.__('report.downReportPdf'),
  //       'log.action.download.displayName',
  //       this.ctx.__('report.downReportPdfOperateLogSuccess'),
  //       'log.actionMessageId.down_stats_report.message',
  //       1
  //     )
  //   } catch (error) {
  //     this.operateLog(
  //       'log.moduleId.report.displayName',
  //       'log.objectType.model_stats_report.displayName',
  //       this.ctx.__('report.downReportPdf'),
  //       'log.action.download.displayName',
  //       this.ctx.__('report.downReportPdfOperateLogError'),
  //       'log.actionMessageId.down_stats_report.message',
  //       0
  //     )
  //     throw new Exception(error.message, error.code, error.transaction)
  //   }
  // }
  // /**
  //  * @summary 巡检统计报告批量下载
  //  * @description 巡检统计报告普良下载
  //  * @Router Post /patrolTemplate/batchDownReportPdf
  //  */
  // @post('/patrolTemplate/batchDownReportPdf',{description: '巡检问题管理'})
  // async batchDownReportPdf () {
  //   const { ctx } = this
  //   try {
  //     const data = Object.assign({}, ctx.request.body, { _that: this })
  //     const result = await ctx.service.report.createPatrolStatisticsReportZip(data)
  //     this.ctx.attachment(result.name)
  //     this.ctx.set('Content-Type', 'application/octet-stream')
  //     this.ctx.body = fs.createReadStream(result.path)
  //     this.operateLog(
  //       'log.moduleId.report.displayName',
  //       'log.objectType.model_stats_report.displayName',
  //       this.ctx.__('report.batchDownReportPdf'),
  //       'log.action.download.displayName',
  //       this.ctx.__('report.batchDownReportPdfOperateLogSuccess'),
  //       'log.actionMessageId.batch_down_stats_report.message',
  //       1
  //     )
  //   } catch (error) {
  //     this.operateLog(
  //       'log.moduleId.report.displayName',
  //       'log.objectType.model_stats_report.displayName',
  //       this.ctx.__('report.batchDownReportPdf'),
  //       'log.action.download.displayName',
  //       this.ctx.__('report.batchDownReportPdfOperateLogError'),
  //       'log.actionMessageId.batch_down_stats_report.message',
  //       0
  //     )
  //     throw new Exception(error.message, error.code, error.transaction)
  //   }
  // }
  // @post('/task/downReportPdf',{description: '巡检问题管理'})
  // async taskDownReportPdf () {
  //   const _this = this
  //   const { ctx } = this
  //   try {
  //     const data = await ctx.service.task.getDetailByTaskId(ctx.request.body)
  //     const data1 = await ctx.service.task.getTaskItemsByTaskIdByBs(Object.assign({}, ctx.request.body))
  //     const flowStatusListClass = [
  //       { label: this.ctx.__('report.toBeCheck'), value: 0, pic: 'patrolDiv-icon examine', class: 'tag-daifuhe' },
  //       { label: this.ctx.__('report.checkSuccess'), value: 1 },
  //       { label: this.ctx.__('report.checkFailed'), value: 2 },
  //       { label: this.ctx.__('report.toBeRectified'), value: 3, pic: 'patrolDiv-icon rectify', class: 'tag-daizhenggai' },
  //       { label: this.ctx.__('report.rectifiedComplete'), value: 4 },
  //       { label: this.ctx.__('report.toBeReview'), value: 5, pic: 'patrolDiv-icon review', class: 'tag-shenghe' },
  //       { label: this.ctx.__('report.reviewSuccess'), value: 6 },
  //       { label: this.ctx.__('report.reviewFailed'), value: 7 },
  //       { label: this.ctx.__('report.completed'), value: 8 },
  //       { label: this.ctx.__('report.completed'), value: 9 }
  //     ]
  //     const judgeElementDiv = function (item) {
  //       const taskItemStatus = item && item.status
  //       const flowStatus = item && item.dataValues.flowStatus
  //       if ((taskItemStatus === 2 && !flowStatus) || (flowStatus === '9' || flowStatus === '8')) {
  //         return _this.ctx.__('report.completed')
  //       } else if (flowStatus && flowStatus !== '9' && flowStatus !== '8') {
  //         const flowStatuObj = flowStatusListClass.find(ele => ele.value.toString() === flowStatus.toString())
  //         const flowStatuLabel = flowStatuObj && flowStatuObj.label
  //         return flowStatuLabel
  //       } else if (!taskItemStatus && !flowStatus) {
  //         return _this.ctx.__('report.toPatrol')
  //       }
  //       return _this.ctx.__('report.toPatrol')

  //     }
  //     const itemPointList = data1.list.map(item => {
  //       return {
  //         regionPathName: item.dataValues.regionPathName,
  //         objTypeName: item.patrolObj && item.patrolObj.partrolObjItem && item.patrolObj.partrolObjItem.patrolObjType && item.patrolObj.partrolObjItem.patrolObjType.objTypeName || '',
  //         patrolObjName: item.patrolObj && item.patrolObj.partrolObjItem && item.patrolObj.partrolObjItem.patrolObjName || '',
  //         patrolItemPath: item.dataValues.patrolItemPath,
  //         ponitList: item.ponitList,
  //         recResult: item.dataValues.recResult,
  //         patrolResult: item.status === 3 ? _this.ctx.__('report.undetected') : item.patrolResult || '--',
  //         status: item.status ? _this.ctx.__('report.toPatrol') : _this.ctx.__('report.unBegin'),
  //         flowStatus: judgeElementDiv(item),
  //         resultDesc: item.dataValues.resultDesc || '--'
  //       }
  //     })
  //     const params = {
  //       patrolTaskName: data.dataValues.patrolTaskName,
  //       patrolPlanName: data.dataValues.patrolPlanName,
  //       psName: data.dataValues.psName,
  //       regionPathName: data.dataValues.regionPathName,
  //       taskType: data.dataValues.taskType,
  //       execType: data.dataValues.execType,
  //       startTime: data.startTime,
  //       patrolObjNum: data.dataValues.patrolObjNum,
  //       patrolPointNum: data.dataValues.patrolPointNum,
  //       normalReusltNum: data.dataValues.normalReusltNum,
  //       problemNum: data.dataValues.problemNum,
  //       missingCount: data.dataValues.missingCount || 0,
  //       problemList: itemPointList
  //     }
  //     await this.htmlToPdf({
  //       filename: data.dataValues.patrolTaskName,
  //       html: await ctx.renderView('task-report.nj', params)
  //     })
  //     this.operateLog(
  //       'log.moduleId.report.displayName',
  //       'log.objectType.model_stats_report.displayName',
  //       this.ctx.__('report.taskDownReportPdf'),
  //       'log.action.download.displayName',
  //       this.ctx.__('report.taskDownReportPdfOperateLogSuccess'),
  //       'log.actionMessageId.down_stats_report.message',
  //       1
  //     )
  //   } catch (error) {
  //     this.operateLog(
  //       'log.moduleId.report.displayName',
  //       'log.objectType.model_stats_report.displayName',
  //       this.ctx.__('report.taskDownReportPdf'),
  //       'log.action.download.displayName',
  //       this.ctx.__('report.taskDownReportPdfOperateLogError'),
  //       'log.actionMessageId.down_stats_report.message',
  //       0
  //     )
  //     throw new Exception(error.message, error.code, error.transaction)
  //   }
  // }

  // @post('/task/batchDownReportPdf',{description: '巡检问题管理'})
  // async taskBatchDownReportPdf () {
  //   const { ctx } = this
  //   try {
  //     const data = Object.assign({}, ctx.request.body, { _that: this })
  //     const result = await this.service.createPatrolTaskReportZip(data)
  //     this.ctx.attachment(result.name)
  //     this.ctx.set('Content-Type', 'application/octet-stream')
  //     this.ctx.body = fs.createReadStream(result.path)
  //     this.operateLog(
  //       'log.moduleId.report.displayName',
  //       'log.objectType.model_stats_report.displayName',
  //       this.ctx.__('report.taskBatchDownReportPdf'),
  //       'log.action.download.displayName',
  //       this.ctx.__('report.taskBatchDownReportPdfOperateLogSuccess'),
  //       'log.actionMessageId.batch_down_stats_report.message',
  //       1
  //     )
  //   } catch (error) {
  //     this.operateLog(
  //       'log.moduleId.report.displayName',
  //       'log.objectType.model_stats_report.displayName',
  //       this.ctx.__('report.taskBatchDownReportPdf'),
  //       'log.action.download.displayName',
  //       this.ctx.__('report.taskBatchDownReportPdfOperateLogError'),
  //       'log.actionMessageId.batch_down_stats_report.message',
  //       0
  //     )
  //     throw new Exception(error.message, error.code, error.transaction)
  //   }
  // }

  @post('/createReport',{description: '巡检问题管理'})
  async creatReport () {
    const data = await this.service.createPatrolStatisticsReport({
      appid: 'eris',
      startTime: '2020-04-01 00:00:00',
      endTime: '2020-04-09 23:59:59',
      reportType: 1
    })
    this.success(data)
  }
  @post('/test/task/deleteStatisticsReport',{description: '巡检问题管理'})
  async deleteStatisticsReportTask () {
    const { ctx } = this
    const data = await this.service.deleteStatisticsReportBeforeTime(ctx.request.body)
    this.success(data)
  }
}
