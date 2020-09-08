import {  Context, inject, provide,Application} from 'midway';
import { IQuestionManageService } from '../app/interface/questionManageInterface';
import { IpdmsService } from '../app/interface/pdmsInterface';
import { ICommonService } from '../app/interface/commonInterface';
import { ITransactionFlowService } from '../app/interface/transactionFlowInterface';
import { IpatrolTaskItemService } from '../app/interface/patrolTaskItemInterface';
const Sequelize = require('sequelize')
const { Op } = Sequelize
const { Transactional } = require('../app/core/transactionalDeco/index')

@provide('questionManageService')
export class QuestionManageService implements IQuestionManageService{
  @inject()
  ctx: Context;
  app: Application;
  @inject('pdmsService')
  serviceIpdms: IpdmsService;

  @inject('commonService')
  serviceICommon: ICommonService;

  @inject('transactionFlowService')
  serviceItransactionFlow: ITransactionFlowService;

  @inject('patrolTaskItemService')
  serviceIpatrolTaskItem: IpatrolTaskItemService;

  /**
   * 查询区域下的所有巡检对象
   * @param {object} params
   * @return {string} - list
   */
  @Transactional
  async getQuestionService (condition:any = {}): Promise<any> {
    const data = await (this as any).query('TransactionFlow', 'queryListData', [ condition ])
    for (const obj of data.list) {
      let pathStr = ''
      for (const regionId of obj.regionPath.split('@')) {
        if (regionId) {
          const resultPath =
              (await this.serviceIpdms.getRegionInfo({ regionId }, (this as any).transaction)) || {}
          if (pathStr) {
            pathStr = pathStr + '/' + resultPath.regionName
          } else {
            pathStr = resultPath.regionName
          }
        }
      }
      obj.regionPath = pathStr
    }
    return data
  }
  /**
   * 查询区域下的所有巡检对象
   * @param {object} params
   * @return {string} - list
   */

  @Transactional
  async getObjList (params:any): Promise<any> {
    const { patrolObjRegion, patrolObjName, objTypeId } = params
    const condition:any = {
      where: {},
      raw: false
    }
    if (patrolObjRegion) {
      condition.where.regionPath = { [Op.iLike]: `%%${patrolObjRegion}%%` }
    }
    if (patrolObjName) {
      condition.where.patrolObjName = { [Op.iLike]: `%%${patrolObjName}%%` }
    }
    if (objTypeId) {
      condition.where.objTypeId = objTypeId
    }
    try {
      const data = await (this as any).query('PatrolObj', 'queryManyData', [ condition ])
      return data
    } catch (error) {
      // console.log('问题管理下获取全部巡检对象', error)
      throw error
    }
  }

  /**
   * 通过relativeId 获取 patrolTaskItemId taskPointId
   * @param {object} params
   * @return {string} - list
   */

  async getPatrolTaskId (params:any): Promise<any> {
    const { relativeId } = params
    const condition = {
      where: { pointResultId: relativeId },
      raw: false
    }
    try {
      const data = await (this as any).query('TaskExecSchema', 'queryDetail', [ condition ])
      return data
    } catch (error) {
      console.log('获取结论表的任务巡检项或任务检测点id', error)
      throw error
    }
  }

  /**
   * 问题图片列表
   * @param {object} params
   * @return {string} - list
   */

  @Transactional
  async getQuestionImg (params:any): Promise<any> {
    const { relativeId,
      processType,
      onlyImgLength // 1是只查询图片长度,其他是不查
    } = params
    if (!relativeId) {
      const error:any = new Error(this.ctx.__('questionManage.paramsLost'))
      error.status = 425
      throw error
    }
    const condition = {
      where: { pointResultId: relativeId },
      raw: true
    }
    let result = []
    if (processType === '4') {
      try {
        const data = await (this as any).query('TransactionFlow', 'queryAllData', [
          {
            where: {
              relativeId,
              status: '4'
            },
            order: [[ 'version', 'DESC' ]]
          }
        ])
        if (data[0].picUrl) {
          result = await (this as any).query('PatrolPic', 'queryManyData', [
            { where: { picId: { [Op.or]: data[0].picUrl && data[0].picUrl.split(',') } } }
          ])
        }
      } catch (error) {
        console.log('问题管理，获取图片列表', error)
        throw error
      }
    } else {
      try {
        const data = await (this as any).query('TaskExecSchema', 'queryDetail', [ condition ])
        console.log('问题管理，获取图片列表a', data.picUrls)
        if (data.picUrls) {
          result = await (this as any).query('PatrolPic', 'queryManyData', [
            { where: { picId: { [Op.or]: data.picUrls && data.picUrls.split(',') } } }
          ])
        }
      } catch (error) {
        console.log('问题管理，获取图片列表', error)
        throw error
      }
    }
    console.log('图片返回列表', result)
    // 每一项图片url都要通过asw服务获取真实url地址后需要改成调用寻址后的接口
    // onlyImgLength标定此接口要不要去查真实的图片url(用于问题列表内是否展示图片icon)
    if (onlyImgLength && onlyImgLength === 1) {
      return result.length
    }
    if (result && result.length) {
      for (const item of result) {
        try {
          const data = await this.serviceICommon.getImageUrlForBS(item.picUrl, (this as any).transaction)
          item.picUrl = data
        } catch (error) {
          console.error(error)
          throw error
        }
      }
    }
    return result
  }

  /**
   * @param {relativeId, taskPointId, patrolTaskItemId} params
   * 获取模板流程的记录
   */
  @Transactional
  async getPsProcess (params:any = {}): Promise<any> {
    try {
      const data = await (this as any).query(
        'TaskExecSchema',
        'queryDataByTaskIdByQuestionServiceGetProcess',
        [ params ]
      )
      return data
    } catch (error) {
      console.log('获取模板进程', error)
      throw error
    }
  }

  /**
   * 获取下一步处理人流程
   * @param {object} params
   * @return {string} - list
   */

  @Transactional
  async getQuestionNextHandlePrerson (params:any = {}, transaction?:any): Promise<any> {
    try {
      const data = await (this as any).query(
        'TaskExecSchema',
        'queryDataByTaskIdByQuestionServicePersonList',
        [ params ]
      )
      console.log('ceshsdsadsdsdsds', data.firstPersonIds)
      const firstPersonIds = (data && data.firstPersonIds && data.firstPersonIds.split(',')) || ''
      // const secondPersonIds = data.secondPersonIds && data.secondPersonIds.split(',')
      const userIds = []
      if (firstPersonIds) {
        const userList = await this.serviceIpdms.getUserInfoList(firstPersonIds, (this as any).transaction)
        userList.forEach(item => {
          userIds.push(item.userId)
        })
        console.log('userListheleman', userIds, userList)
      }
      return {
        userIds
      }
    } catch (error) {
      console.log('问题管理获取下一步处理人', error)
      throw error
    }
  }

  /**
   * 分页查询区域下的巡检对象
   * @param {object} params
   * @return {string} - list
   */

  @Transactional
  async getObjPage (params:any): Promise<any> {
    const {
      patrolObjRegion, patrolObjName, pageNo, pageSize
    } = params
    const condition:any = {
      where: { isDelete: '0' },
      attributes: [ 'patrolObjName', 'patrolObjId' ],
      raw: false
      // raw: false // 使用hasMany的时候需要聚合一下数据
    }
    if (patrolObjRegion) {
      condition.where.patrolObjRegion = patrolObjRegion
    }
    if (patrolObjName) {
      condition.where.patrolObjName = { [Op.iLike]: `%%${patrolObjName}%%` }
    }
    if (pageNo || pageSize) {
      condition.limit = pageSize * 1
      condition.offset = (pageNo - 1) * pageSize
    }
    try {
      const data = await (this as any).query('PatrolObj', 'queryList', [ condition ])
      if (data.list && data.list.length) {
        for (const item of data.list) {
          const res = await (this as any).query('PatrolObjRel', 'getTaskCreate', [ item ])
          console.log('dsadaevc', res)
          if (res && res.length) {
            item.dataValues.taskCreateTime = res[0].dataValues.patrolTask.createTime
          } else {
            item.dataValues.taskCreateTime = ''
          }
        }
      }
      return data
    } catch (error) {
      console.log('问题管理分页查询区域下的巡检对象', error)
      throw error
    }
  }

  /**
   * 查询对象下的检测点
   * @param {object} params
   * @return {string} - list
   */

  @Transactional
  async getPoint (params:any): Promise<any> {
    // edit by bian 给个默认值 static

    // 静态地图 mapType 传 static 主地图传gais

    const { patrolObjId, mapType = 'static' } = params

    if (!patrolObjId) {
      const error:any = new Error(this.ctx.__('questionManage.paramsLost'))
      error.status = 425
      throw error
    }
    const condition = {
      where: {
        patrolObjId,
        isDelete: 0
      },
      order: [[ 'pointOrder' ]]
      // raw: false // 使用hasMany的时候需要聚合一下数据
    }
    try {
      let data = await (this as any).query('PatrolPoint', 'queryDataByIdFindAll', [ condition ])
      const point = []
      const patrolPoint = []
      console.log('---------------------', data)
      if (data.length) {
        const hash = {}
        data = data.reduce((cur, pre) => {
          hash[pre.cameraId] ? '' : (hash[pre.cameraId] = true && cur.push(pre))
          return cur
        }, [])
        for (const item of data) {
          const wadUrl = `/pdms/api/v1/model/${item.modelName}_${mapType}_geom/records`
          console.log('wadUrl 详细调用url ++++++++++++++++++', wadUrl)
          if (item.isDelete !== '-1') {
            const result = await this.ctx.consulCurl(wadUrl, 'pdms', 'pdmsweb', {
              method: 'POST',
              data: {
                pageNo: 1,
                pageSize: 1000,
                fields: 'geom',
                filedOptions: [
                  {
                    fieldName: 'model_data_id',
                    fieldValue: item.cameraId,
                    type: 'eq'
                  }
                ]
              }
            })
            const res = this.ctx.helper.bufferToJson(result.data)
            if (res.data.list && res.data.list.length) {
              const geom = res.data.list[0].geom
              const geomPoint = geom.substring(6, geom.length - 1)

              // edit by bian  方便线路直接通过一个数组获取所有数据
              const Zone = {
                longitude: parseFloat(geomPoint.split(' ')[0]),
                latitude: parseFloat(geomPoint.split(' ')[1]),
                name: item.cameraName
              }
              item.ponit = Zone
              patrolPoint.push(item)

              // ===================================
              point.push({
                longitude: parseFloat(geomPoint.split(' ')[0]),
                latitude: parseFloat(geomPoint.split(' ')[1]),
                name: item.cameraName
              })
            } else {
              patrolPoint.push(item)
            }
          }
        }
      }
      return {
        patrolPoint,
        point
      }
    } catch (error) {
      console.log('问题管理获取巡检对象下的检测点，社区一键巡查用到', error)
      throw error
    }
  }

  /**
   * 查询所有的对象类型
   * @param {object} params
   * @return {string} - list
   */

  @Transactional
  async getAllObjType (params:any = {}): Promise<any> {
    const data = await (this as any).query('PatrolObjType', 'queryAllData', [ params ])
    return data
  }

  /**
   * 查询 问题list
   * @param {object} params
   * @return {string} - list
   */

  @Transactional
  async getQuestionList (params:any): Promise<any> {
    debugger
    const { ctx } = this
    const {
      executeType, // 执行方式: 自动.线上人工,线下人工
      pageSize,
      pageNo,
      status
    } = params
    // 新增巡检执行方式查询条件,此条件可以过滤通过executeType过滤计划从而求出计划对应的taskId,作为查询条件传入 TaskExecSchema表中查询
    let taskIdArr = null
    if ((executeType || executeType === 0) && executeType !== '') {
      const taskList = []
      const planRes = await (this as any).query('PatrolPlan', 'getPlanByExecuteType', [{ executeType }])
      for (const elem of planRes.values()) {
        if (elem.taskList.length > 0) {
          taskList.push(...elem.taskList)
        }
      }
      if (taskList.length > 0) {
        taskIdArr = taskList.map(item => {
          return item.patrolTaskId
        })
      }
      if (taskIdArr) {
        if (taskIdArr.length === 0) {
          // 次巡检方式下没有计划,直接返回空
          return []
        }
        Object.assign(params, { taskIdArr })
      } else {
        return []
      }
    }
    if (!pageSize || !pageNo) {
      const error:any = new Error(this.ctx.__('questionManage.paramsLost'))
      error.status = 425
      throw error
    }
    // console.log('--------------------------------------', ctx.header)
    const userId = ctx.getUserId() || ctx.header.currentuserid
    const _this:any = this
    // 获取巡检对象下所在区域
    function getRegionPathName (regionPath) {
      return _this.serviceIpdms.treePath(regionPath, _this.transaction)
    }
    // 获取监控点， 考评项， 问题描述， 巡查时间
    function getInspectionRemark (item) {
      return _this.query(
        'TaskExecSchema',
        'queryDataByIdByQuestionServiceImgInquireGetInspectionRemark',
        [ item ]
      )
    }
    // 获取巡检对象下问题list
    function getQuestion (condition, userId, status, taskExecList) {
      return _this.query('TransactionFlow', 'findAndCountAllDataSql', [
        condition,
        userId,
        status,
        taskExecList
      ])
    }

    // 图片巡查 获取任务巡检项id
    async function getPatrolTaskItem (params) {
      const {
        itemId, patrolObjId, path, patrolObjRegion
      } = params
      let pointResultIds = []
      if (patrolObjId) {
        const [ questionData, patrolObjRelData ] = await Promise.all([
          _this.query('TaskExecSchema', 'queryAllQuestion', [ params ]),
          _this.query('PatrolObjRel', 'queryDataByIdByQuestionServiceImgInquireGetListService', [
            params
          ])
        ])
        // console.log('+++++++++++++++++++++++++过度时间', new Date(), questionData, patrolObjRelData)
        if (itemId) {
          if (questionData.length) {
            const filterQuestion = []
            questionData.forEach(item => {
              if (item.dataValues.path.includes(path)) {
                filterQuestion.push(item)
              }
            })
            if (filterQuestion.length) {
              filterQuestion.forEach(item => {
                patrolObjRelData.forEach(itm => {
                  if (itm.dataValues.patrolObjRelId === item.dataValues.patrolObjRelId) {
                    pointResultIds.push(item.dataValues.pointResultId)
                  }
                })
              })
            }
          }
          // console.log('++++++++++++++++++', pointResultIds)
        } else {
          debugger
          if (questionData.length) {
            questionData.forEach(item => {
              patrolObjRelData.forEach(itm => {
                if (itm.dataValues.patrolObjRelId === item.dataValues.patrolObjRelId) {
                  pointResultIds.push(item.dataValues.pointResultId)
                  return
                }
              })
            })
          }
        }
      } else if (patrolObjRegion) {
        const [ questionData, patrolObjRelData ] = await Promise.all([
          _this.query('TaskExecSchema', 'queryAllQuestion', [ params ]),
          _this.query('PatrolObj', 'queryDataByIdByQuestionServiceImgInquireGetListService', [
            params
          ])
        ])
        if (questionData.length) {
          questionData.forEach(item => {
            patrolObjRelData.forEach(itm => {
              if (itm.dataValues.patrolObjRelItem.length) {
                itm.dataValues.patrolObjRelItem.forEach(subItem => {
                  if (subItem.dataValues.patrolObjRelId === item.dataValues.patrolObjRelId) {
                    pointResultIds.push(item.dataValues.pointResultId)
                  }
                })
              }
            })
          })
        }
      } else {
        pointResultIds = []
      }
      return pointResultIds
    }
    async function getPointResultIds (pointResultIds, params) {
      const { regionPath } = params
      const transactionFlowCondition = {
        limit: pageSize * 1,
        offset: (pageNo - 1) * pageSize
      }
      const problem = await getQuestion(transactionFlowCondition, userId, status, pointResultIds)
      let regionPathName = ''
      if (regionPath) {
        regionPathName = await getRegionPathName(regionPath)
      }
      if (problem.total) {
        for (const item of problem.list) {
          // quesImg  问题图片,dealImg:整改图片
          const [ data, userName, rectifyOpinion ] = await Promise.all([
            getInspectionRemark(item),
            item.next_handle_people
              ? _this.serviceIpdms.getUserInfoList(
                item.next_handle_people.split(','),
                _this.transaction
              )
              : [],
            item.status > 3
              ? _this.query('TransactionFlow', 'findOneData', [
                {
                  where: {
                    status: '4',
                    relativeId: item.relative_id
                  },
                  order: [[ 'version', 'DESC' ]]
                }
              ])
              : ''
          ])
          if (data.dataValues.patrolTaskItem.dataValues.path) {
            item.itemPathName = await _this.serviceICommon.partrolItemsPath(
              data.dataValues.patrolTaskItem.dataValues.path,
              _this.transaction
            )
          }
          if (rectifyOpinion) {
            item.rectifyOpinion = rectifyOpinion.remark
            item.dealImg = rectifyOpinion.picUrl || ''
          } else {
            item.rectifyOpinion = '--'
            item.dealImg = ''
          }
          const userNameList = []
          // console.log('userNameuserNamuserNamee', userName)
          userName.forEach(item => {
            userNameList.push(item.userName)
          })
          // userName 执行人也是处理人
          item.userName = userNameList.join(',')
          item.resultDesc = data.resultDesc
          item.pointName =
            data.dataValues.patrolTaskPoint &&
            data.dataValues.patrolTaskPoint.dataValues.PatrolPoint &&
            data.dataValues.patrolTaskPoint.dataValues.PatrolPoint.dataValues.cameraName
          item.patrolScore = data.patrolScore
          item.startTime = data.dataValues.createTime
          item.execType =
            data.dataValues.patrolTask && data.dataValues.patrolTask.dataValues.execType
          item.itemId =
            data.dataValues.patrolTaskItem && data.dataValues.patrolTaskItem.dataValues.patrolItemId
          item.patrolTaskItemId =
            data.dataValues.patrolTaskItem &&
            data.dataValues.patrolTaskItem.dataValues.patrolTaskItemId
          item.pointPatrolTaskItemId =
            data.dataValues.patrolTaskPoint &&
            data.dataValues.patrolTaskPoint.dataValues.patrolTaskItemId
          item.regionPathName = regionPathName
          item.quesImg = data.dataValues.picUrls || ''
          item.patrolTaskName =
            data.dataValues.patrolTask && data.dataValues.patrolTask.patrolTaskName
          item.patrolPlanName =
            data.dataValues.patrolTask &&
            data.dataValues.patrolTask.planItems &&
            data.dataValues.patrolTask.planItems.patrolPlanName
          item.patrolPlanId = data.dataValues.patrolTask && data.dataValues.patrolTask.planId
          item.cameraName =
            data.dataValues.patrolTaskPoint && data.dataValues.patrolTaskPoint.pointName
          item.objName =
            data.dataValues.patrolTaskItem &&
            data.dataValues.patrolTaskItem.patrolObj &&
            data.dataValues.patrolTaskItem.patrolObj.partrolObjItem &&
            data.dataValues.patrolTaskItem.patrolObj.partrolObjItem.patrolObjName
          if (item.execType === 0 && data.dataValues.eventCode) {
            item.alarmType = await _this.serviceIpdms.getEventTypeOptions(
              { dictCodeOrDictName: data.dataValues.eventCode },
              _this.transaction
            )
          }
        }
        // 按钮权限
        problem.list.forEach(item => {
          if (userId === 'admin') {
            item.isShow = true
          } else {
            if (item.next_handle_people) {
              if (item.next_handle_people.split(',').includes(userId)) {
                item.isShow = true
              } else {
                item.isShow = false
              }
            } else {
              item.isShow = false
            }
          }
        })
      }
      return problem
    }
    // 获取问题
    const pointResultIds = await getPatrolTaskItem(params)
    if (pointResultIds.length) {
      return getPointResultIds(pointResultIds, params)
    }
    return {
      list: [],
      questionTotal: 0,
      pendReviewTotal: 0,
      pendRectifyTotal: 0,
      pendExamineTotal: 0,
      pendCompleteTotal: 0,
      total: 0
    }
  }

  /**
   * 查看社区巡查考评对象下的全部巡检项
   */

  @Transactional
  async getInspectionItemAll (params:any): Promise<any> {
    const { patrolObjId, objTypeId, itemContent } = params
    if (!patrolObjId) {
      const error:any = new Error(this.ctx.__('questionManage.paramsLost'))
      error.status = 425
      throw error
    }
    const condition:any = {
      where: {
        objTypeId,
        level: 1
      }
    }
    if (itemContent) {
      const _itemContent = itemContent.replace(/%/g, '\\%').replace(/_/g, '\\_')
      condition.where.itemContent = { [Op.iLike]: `%%${_itemContent}%%` }
    }
    console.log('筛选获取巡检项', itemContent)
    const result = await (this as any).query('Item', 'queryManyAll', [ condition ])
    console.log('eeeeeeeee', result)
    return result
  }

  /**
   * 通过关联点获取问题所有流程按照问题版本大小倒叙排列
   */

  @Transactional
  async getQuestionTrans (params:any): Promise<any> {
    const { relativeId, taskPointId, patrolTaskItemId } = params
    const condition:any = {
      where: { status: { [Op.notILike]: '%%9%%' } },
      order: [[ 'version', 'DESC' ]]
    }
    const _this:any = this
    if (relativeId) {
      condition.where.relativeId = relativeId
    }
    let data = []
    let taskExec:any = {}
    if (relativeId) {
      [ data, taskExec ] = await Promise.all([
        (this as any).query('TransactionFlow', 'queryAllData', [ condition ]),
        (this as any).query('TaskExecSchema', 'queryQuestionTransPatrolMethod', [
          { relativeId }
        ])
      ])
    } else if (taskPointId) {
      taskExec = await (this as any).query('TaskExecSchema', 'queryQuestionTransPatrolMethod', [
        { taskPointId }
      ])
    } else {
      taskExec = await (this as any).query('TaskExecSchema', 'queryQuestionTransPatrolMethod', [
        { patrolTaskItemId }
      ])
    }
    async function name (params) {
      console.log('通过userIds获取人员信息', params)
      if (params) {
        const data = await _this.serviceIpdms.getUserInfoList(
          params && params.split(','),
          _this.transaction
        )
        return data
      }
      return []
    }
    if (data && data.length) {
      for (const item of data) {
        const [ modifierName, nextHandlePeopleName, nextCopyPeopleName ] = await Promise.all([
          name(item.modifier),
          name(item.nextHandlePeople),
          name(item.nextCopyPeople)
        ])
        item.dataValues.modifierName = []
        item.dataValues.nextHandlePeopleName = []
        item.dataValues.nextCopyPeopleName = []
        modifierName.forEach(itm => {
          item.dataValues.modifierName.push(itm.userName)
        })
        nextHandlePeopleName.forEach(itm => {
          item.dataValues.nextHandlePeopleName.push(itm.userName)
        })
        nextCopyPeopleName.forEach(itm => {
          item.dataValues.nextCopyPeopleName.push(itm.userName)
        })
        if (item.dataValues.eventCode) {
          item.dataValues.eventCodeName = await this.serviceIpdms.getEventTypeOptions({ dictCodeOrDictName: item.dataValues.eventCode })
        } else {
          item.dataValues.eventCodeName = null
        }
        item.dataValues.nextCopyPeopleName =
          (item.dataValues.nextCopyPeopleName.length &&
            item.dataValues.nextCopyPeopleName.join(',')) ||
          '--'
        item.dataValues.nextHandlePeopleName =
          (item.dataValues.nextHandlePeopleName.length &&
            item.dataValues.nextHandlePeopleName.join(',')) ||
          '--'
        item.dataValues.modifierName =
          (item.dataValues.modifierName.length && item.dataValues.modifierName.join(',')) || '--'
      }
    }

    // 统一到结论表拿到问题的诞生的数据
    if (taskExec) {
      const [ modifierName, nextHandlePeopleName, nextCopyPeopleName ] = await Promise.all([
        name(taskExec.execUser),
        name(taskExec.nextHandlePeople),
        name(taskExec.nextCopyPeople)
      ])
      taskExec.dataValues.modifierName = []
      taskExec.dataValues.nextHandlePeopleName = []
      taskExec.dataValues.nextCopyPeopleName = []
      modifierName.forEach(item => {
        taskExec.dataValues.modifierName.push(item.userName)
      })
      nextHandlePeopleName.forEach(item => {
        taskExec.dataValues.nextHandlePeopleName.push(item.userName)
      })
      nextCopyPeopleName.forEach(item => {
        taskExec.dataValues.nextCopyPeopleName.push(item.userName)
      })
      if (taskExec.dataValues.eventCode) {
        taskExec.dataValues.eventCodeName = await this.serviceIpdms.getAiEventTypeName({ dictCodeOrDictName: taskExec.dataValues.eventCode })
      } else {
        taskExec.dataValues.eventCodeName = null
      }
      taskExec.dataValues.nextCopyPeopleName =
        (taskExec.dataValues.nextCopyPeopleName.length &&
          taskExec.dataValues.nextCopyPeopleName.join(',')) ||
        '--'
      taskExec.dataValues.nextHandlePeopleName =
        (taskExec.dataValues.nextHandlePeopleName.length &&
          taskExec.dataValues.nextHandlePeopleName.join(',')) ||
        '--'
      taskExec.dataValues.modifierName =
        (taskExec.dataValues.modifierName.length && taskExec.dataValues.modifierName.join(',')) ||
        '--'
      taskExec.dataValues.itemName =
        taskExec.dataValues.patrolTaskItem && taskExec.dataValues.patrolTaskItem.itemName
      taskExec.dataValues.patrolTaskItem = null
      data.push(taskExec)
    }

    return data
  }

  @Transactional
  async getSingleQuestionDetail (params:any): Promise<any> {
    const { relativeId } = params
    const data = await (this as any).query(
      'TaskExecSchema',
      'queryDataByIdByQuestionServiceImgInquireGetInspectionRemark',
      [
        { relative_id: relativeId }
      ]
    )
    if (data.dataValues.patrolTaskItem && data.dataValues.patrolTaskItem.dataValues.path) {
      const itemPathName = await this.serviceICommon.partrolItemsPath(
        data.dataValues.patrolTaskItem.dataValues.path,
        (this as any).transaction
      )
      data.dataValues.itemPathName = itemPathName
    }
    console.log('=======问题单条记录=======', data)
    return data
  }

  /**
   * 图片巡查一键巡查创建临时任务
   */

  @Transactional
  async temporaryTask (params:any): Promise<any> {
    const { patrolObjId, executePersonIds } = params
    const result = await this.ctx.consulCurl(
      '/patrolengine-execute/api/v1/task/create/pps',
      'patrolengine',
      'patrolengine-execute',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          appId: this.ctx.header.appid
        },
        data: {
          patrolObjId,
          executePersonIds
        }
      }
    )
    const resultData = result && result.data && this.ctx.helper.bufferToJson(result.data)
    console.log('图片巡查一键巡查创建临时任务', resultData)
    if (resultData.code !== '0') {
      const error:any = new Error(this.ctx.__('questionManage.firstSetcamera'))
      error.status = 425
      throw error
    }
    return resultData
  }

  /**
   * wad 异步树
   */

  @Transactional
  async asyncRegionTree (params:any): Promise<any> {
    const data = await this.serviceIpdms.asyncTreeByLimit((this as any).transaction)
    console.log('wadReturn', data)
    return data
  }

  /**
   * @summary wad 区域树-模糊查询
   */

  @Transactional
  async asyncTreeSearch (params:any): Promise<any> {
    return await this.serviceIpdms.asyncTreeSearchByLimit((this as any).transaction)
  }

  /**
   * pdms
   * 根据组织获取该组织下的人员列表
   */

  @Transactional
  async getUserListByOrgId (params:any): Promise<any> {
    const data = await this.serviceIpdms.getUserListByOrgId(params, (this as any).transaction)
    console.log('wadReturn', data)
    return data
  }

  /**
   * upm
   * 根据roleId获取该角色下的人员列表信息
   */

  @Transactional
  async getPersonListByRoleId (params:any): Promise<any> {
    const data = await this.serviceIpdms.getPersonListByRoleId(params, (this as any).transaction)
    console.log('wadReturn', data)
    return data
  }

  /**
   * 获取全部角色列表
   */

  @Transactional
  async getAllRoles (params:any): Promise<any> {
    const data = await this.serviceIpdms.getAllRoles(params, (this as any).transaction)
    console.log('wadReturn', data)
    return data
  }

  /**
   * 用户名userId获取该用户的有权限的组织
   * @param {array} { userId }
   * @return {object|null} - 组织列表
   */

  @Transactional
  async asyncOrgTreeByLimit (params:any): Promise<any> {
    const data = await this.serviceIpdms.asyncOrgTreeByLimit((this as any).transaction)
    console.log('wadReturn', data)
    return data
  }

  /**
   * 用户名userId获取该用户的有权限的组织
   * @param {array} { userId }
   * @return {object|null} - 组织列表
   */

  @Transactional
  async asyncOrgTreeSearchByLimit (params:any): Promise<any> {
    const data = await this.serviceIpdms.asyncOrgTreeSearchByLimit((this as any).transaction)
    console.log('wadReturn', data)
    return data
  }
  /**
   * 批量复核问题
   * @param {array}
   * @return {object|null}
   */
  @Transactional
  async batchReview (params:any,Exception:any): Promise<any> {
    const { ctx } = this
    try {
      const relativeIdArr = params.relativeIdArr
      const judge = params.result === 1 ? 'Pass' : 'Deny'
      const info = params.resultDesc
      const copyUsers = params.ccUsers.join(',')
      const modifier = ctx.getUserId() || ctx.request.header.currentuserid
      for (const elem of relativeIdArr.values()) {
        // 获取下一步执行人
        const arr = await this.getQuestionNextHandlePrerson({
          relativeId: elem.relativeId,
          processType: 2,
          patrolObjId: elem.patrolObjId
        }, (this as any).transaction)
        await this.serviceItransactionFlow.nextStep(
          elem.relativeId,
          judge, // 是否进入下一流程  是 pass 否 Deny
          info, // 备注
          arr.userIds.join(','), // 下一步执行人
          copyUsers, // 抄送人
          modifier, // 用户
          '0' // 当前问题状态
        )
      }
      console.log(
        '问题处理结论提交完成，准备发送待办和消息的MQ，结论提交后返回结果为：',
        ctx.request.body
      )
      for (const elem of relativeIdArr.values()) {
        const params = { pointResultIds: [ elem.relativeId ] }
        await this.serviceIpatrolTaskItem.createTlnc(params)
      }
    } catch (error) {
      throw new Exception(error.message, error.code, error.transaction)
    }
  }
}