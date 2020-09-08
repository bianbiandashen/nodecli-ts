'use strict'
import {  Context, inject, provide, Application} from 'midway';
import { 
  IAnalysisService,
} from '../app/interface/analysisInterface';
const Sequelize = require('sequelize')
const { Op } = Sequelize
const moment = require('moment')
const { Transactional } = require('../app/core/transactionalDeco')

@provide('analysisService')
export class AnalysisService implements IAnalysisService {

  @inject()
  ctx: Context;
  app: Application;

  /**
   * 巡检对象的问题率
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async getProblemRateByObj (params:any = {}): Promise<any> {
    const { startTime, endTime } = params
    const res = await (this  as  any).query(
      'PatrolObjRel',
      'queryManyDataByAnalysisServiceGetProblemRateByObj',
      [ params ]
    )
    const patrolTaskItemArr = res.map(item => {
      return item.patrolTaskItem
    })
    const patrolTaskItemIdArr = []
    for (const elem of patrolTaskItemArr.values()) {
      patrolTaskItemIdArr.push(...elem)
    }
    let patrolTaskItemId = null
    patrolTaskItemId = patrolTaskItemIdArr.map(item => item.patrolTaskItemId)
    // 求出被复合失败的问题
    let checkfalse = null
    const checkfalseRes = await (this  as  any).query('TransactionFlow', 'queryAllData', [
      {
        where: {
          isDelete: 0,
          status: { [Op.in]: [ '9', '0' ] }
        },
        attributes: [ 'relativeId' ]
      }
    ])
    if (checkfalseRes && checkfalseRes.length > 0) checkfalse = checkfalseRes.map(v => v.relativeId)

    const condition1:any = {
      where: { updateTime: {} },
      attributes: [ 'isIntoNextStep' ]
    }
    if (patrolTaskItemId) {
      condition1.where.patrolTaskItemId = { [Op.or]: patrolTaskItemId }
    }
    if (checkfalse) condition1.where.pointResultId = { [Op.notIn]: checkfalse }
    if (startTime && endTime) {
      condition1.where.updateTime = { [Op.between]: [ startTime, endTime ] }
    }
    const data = await (this  as  any).query('TaskExecSchema', 'findAndCountAllData', [ condition1 ])
    const Nextstep = data.list.filter(item => {
      if (item.isIntoNextStep && item.isIntoNextStep === 1) {
        return item
      }
    })
    let rate = ''
    if (data.total === 0 || Nextstep.length === 0) {
      rate = '0%'
    } else {
      rate = parseInt(((Nextstep.length * 1000) / data.total).toFixed()) / 10 + '%'
    }
    return rate
  }

  /**
   * 根据区域和巡检对象模板查问题率
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async getProblemRateByObjTypeAndRegionId (params:any = {}): Promise<any> {
    const appid = this.ctx.header.appid
    const {
      regionIdPath,checkfalse
    } = params
    let itemId = null
    let taskId = null
    let itemNum = 0
    if (regionIdPath) {
      const patrolItemIdData = await (this  as  any).query('PatrolObj', 'queryTaskItemIdByObjTypeAnalysisService', [ params ])
      const arr1 = patrolItemIdData.map(item => item.patrolObjRelItem)
      const arr2 = []
      for (const elem of arr1.values()) {
        arr2.push(...elem)
      }
      const arr3 = arr2.map(item => item.patrolTaskItem)
      const arr4 = []
      for (const elem of arr3.values()) {
        arr4.push(...elem)
      }
      const arr5 = arr4
      itemNum = arr5.length
      itemId = arr5.map(item => item.patrolTaskItemId)
      taskId = arr5.map(item => item.patrolTaskId)
    }
    // 图片巡查是问题了除以监控点的个数,求出监测点的个数
    if (appid === 'pps') {
      const newSetItemId = new Set(taskId)
      const ItemIdArray = [ ...newSetItemId ]
      itemNum = await (this  as  any).query('PatrolTaskPoint', 'queryCount', [{
        where: {patrolTaskId: { [Op.in]: ItemIdArray }}
      }])
    }
    const resultCondition:any = {
      where: {
        patrolTaskItemId: { [Op.in]: itemId },
        status: { [Op.not]: 99 }
      }
    }
    if (checkfalse) resultCondition.where.pointResultId = { [Op.notIn]: checkfalse }
    resultCondition.where.isIntoNextStep = 1
    // 求出问题条数
    const res1 = await (this  as  any).query('TaskExecSchema', 'queryCount', [ resultCondition ])
    const data = {
      problemNum: res1,
      itemNum,
      rate: ''
    }
    if (data.problemNum === 0 || data.itemNum === 0) {
      data.rate = '0%'
    } else {
      data.rate = parseInt(((data.problemNum * 1000) / data.itemNum).toFixed()) / 10 + '%'
    }
    return data
  }

  /**
   * 获取问题率&巡检覆盖率
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async getProblemRate (params:any = {}): Promise<any> {
    const {
      patrolTemplateId, regionId, startTime, endTime
    } = params
    const appid = this.ctx.header.appid
    let taskId = null
    // 根据计划模板求出任务
    if (patrolTemplateId && patrolTemplateId !== '') {
      const taskIdRes = await (this  as  any).query('Task', 'queryAllDataByAnalysisServiceGetCompletionRate', [
        params
      ])
      if (taskIdRes) taskId = taskIdRes.list.map(item => item.patrolTaskId)
    }

    let itemId = null
    let itemNum = 0
    const objRel = []
    let newParams = null
    if (taskId) {
      newParams = Object.assign({}, params, { taskId })
    } else {
      newParams = Object.assign({}, params)
    }
    // 根据区域 -> 巡检对象 -> 巡检项
    if (regionId) {
      const patrolItemIdData = await (this  as  any).query('PatrolObj', 'queryTaskItemIdAnalysisService', [ newParams ])
      const arr1 = patrolItemIdData.map(item => item.patrolObjRelItem)
      const arr2 = []
      for (const elem of arr1.values()) {
        arr2.push(...elem)
        objRel.push(...elem)
      }
      const arr3 = arr2.map(item => item.patrolTaskItem)
      const arr4 = []
      for (const elem of arr3.values()) {
        arr4.push(...elem)
      }
      const arr5 = arr4
      itemNum = arr5.length
      // if (!taskId ){
      taskId = arr5.map(item => item.patrolTaskId)
      // } else {
      //   taskId.push(...arr5.map(item => item.patrolTaskId))
      // }
      itemId = arr5.map(item => item.patrolTaskItemId)
    }
    // 图片巡查是问题了除以监控点的个数,求出监测点的个数
    if (appid === 'pps') {
      const newSetItemId = new Set(taskId)
      const ItemIdArray = [ ...newSetItemId ]
      itemNum = await (this  as  any).query('PatrolTaskPoint', 'queryCount', [{
        where: {patrolTaskId: { [Op.in]: ItemIdArray }}
      }])
    }
    // 求出被复合失败的问题
    let checkfalse = null
    const checkfalseRes = await (this  as  any).query('TransactionFlow', 'queryAllData', [
      {
        where: {
          isDelete: 0,
          status: '9'
        },
        attributes: [ 'relativeId' ]
      }
    ])
    if (checkfalseRes && checkfalseRes.length > 0) checkfalse = checkfalseRes.map(v => v.relativeId)
    const resultCondition:any = {
      where: {
        patrolTaskItemId: { [Op.in]: itemId },
        status: { [Op.not]: 99 }
      }
    }
    if (taskId) resultCondition.where.taskId = { [Op.in]: taskId }
    if (checkfalse) resultCondition.where.pointResultId = { [Op.notIn]: checkfalse }
    resultCondition.where.isIntoNextStep = 1
    // 求出问题条数
    const res1 = await (this  as  any).query('TaskExecSchema', 'queryCount', [ resultCondition ])
    let finishObjectNum = 0

    const objRel1 = objRel.filter(elem => (parseInt(endTime) >= moment(elem.createTime).valueOf() && moment(elem.createTime).valueOf() >= parseInt(startTime)))

    for (const elem of objRel1.values()) {
      if (elem.status === 2) {
        finishObjectNum++
      }
    }
    const data = {
      problemNum: res1,
      itemNum,
      rate: '',
      finishObjectNum,
      objectNum: objRel.length,
      objectRate: ''
    }
    if (data.problemNum === 0 || data.itemNum === 0) {
      data.rate = '0%'
    } else {
      data.rate = parseInt(((data.problemNum * 1000) / data.itemNum).toFixed()) / 10 + '%'
    }
    // 巡检覆盖率
    if (data.finishObjectNum === 0 || data.objectNum === 0) {
      data.objectRate = '0%'
    } else {
      data.objectRate = parseInt(((data.finishObjectNum * 1000) / data.objectNum).toFixed()) / 10 + '%'
    }
    return data
  }

  /**
   * 获取整改完成率
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async getCompletionRate (params:any = {}): Promise<any> {
    const {
      patrolTemplateId, regionId
    } = params
    let taskId = null
    // 根据计划模板求出任务
    if (patrolTemplateId && patrolTemplateId !== '') {
      const taskIdRes = await (this  as  any).query('Task', 'queryAllDataByAnalysisServiceGetCompletionRate', [
        params
      ])
      if (taskIdRes) taskId = taskIdRes.list.map(item => item.patrolTaskId)
    }

    let itemId = null
    const objRel = []
    let newParams = null
    if (taskId) {
      newParams = Object.assign({}, params, { taskId })
    } else {
      newParams = Object.assign({}, params)
    }
    // 根据区域 -> 巡检对象 -> 巡检项
    if (regionId) {
      const patrolItemIdData = await (this  as  any).query('PatrolObj', 'queryTaskItemIdAnalysisService', [
        newParams
      ])
      const arr1 = patrolItemIdData.map(item => item.patrolObjRelItem)
      for (const elem of arr1.values()) {
        objRel.push(...elem)
      }
      const arr3 = objRel.map(item => item.patrolTaskItem)
      const arr4 = []
      for (const elem of arr3.values()) {
        arr4.push(...elem)
      }
      itemId = arr4.map(item => item.patrolTaskItemId)
    }
    // 求出被复合失败的问题
    let checkfalse = null
    const checkfalseRes = await (this  as  any).query('TransactionFlow', 'queryAllData', [
      {
        where: {
          isDelete: 0,
          status: '9'
        },
        attributes: [ 'relativeId' ]
      }
    ])
    if (checkfalseRes && checkfalseRes.length > 0) checkfalse = checkfalseRes.map(v => v.relativeId)
    // 根据巡检项查出问题
    const resultCondition:any = {
      where: {
        patrolTaskItemId: { [Op.in]: itemId },
        status: { [Op.not]: 99 },
        isIntoNextStep: 1
      },
      attributes: [ 'pointResultId' ]
    }
    if (taskId) resultCondition.where.taskId = { [Op.in]: taskId }
    if (checkfalse) resultCondition.where.pointResultId = { [Op.notIn]: checkfalse }
    // 求出巡检项条数
    const res = await (this  as  any).query('TaskExecSchema', 'findAndCountAllData', [ resultCondition ])
    const problemSum = res.total // 问题总数
    const taskResultList = res.list // 和任务关联的巡检结果
    const haha = {}
    const flow = {}
    for (let i = 0; i < taskResultList.length; i++) {
      if (taskResultList[i].pointResultId) {
        const arr = await (this  as  any).query('TransactionFlow', 'queryAllData', [
          {
            order: [[ 'createTime', 'DESC' ]],
            where: { relativeId: taskResultList[i].pointResultId },
            attributes: [ 'status', 'createTime' ]
          }
        ])
        flow[taskResultList[i].pointResultId] = arr
        haha[taskResultList[i].pointResultId] = arr.map(item => item.status)
      }
    }

    let completionNum = 0 // 整改问题的个数
    const relativeIdArr = [] // 整改通过的b_transaction_flow 的relativeId
    for (const flow1 in haha) {
      // 3:待整改,4:整改通过
      if (haha[flow1].includes('3') && haha[flow1].includes('8')) {
        completionNum++
        // 存储已经整改通过的 relativeId
        relativeIdArr.push(flow1)
      }
    }
    let continueT:number  = 0
    // 计算每一个整改通过的时间
    for (const elem of relativeIdArr.values()) {
      let st:any = false
      let endt:any = false
      for (const e of flow[elem].values()) {
        if (e.status === '8') {
          endt = e.createTime
        } else if (e.status === '3') {
          st = e.createTime
        }
      }
      if (st && endt) {
        let s1:any = new Date(endt)
        let s2:any = new Date(st)
        continueT += (s1 - s2) / 60000
      }
    }
    let rate = '0%' // 整改完成率
    if (problemSum === 0 || completionNum === 0) {
      rate = '0%'
    } else {
      rate = parseInt(((completionNum * 1000) / problemSum).toFixed()) / 10 + '%'
    }
    return {
      problemNum: problemSum,
      completionNum,
      rate,
      continueTime: parseInt((continueT / completionNum).toFixed())
    }
  }

  /**
   * 获取超时率
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async timeoutRateService (params:any = {}): Promise<any> {
    const {
      patrolTemplateId, regionId, startTime, endTime
    } = params
    // 根据区域找到符合的taskid
    let taskIdArr = null
    if (regionId && regionId !== '') {
      const patrolItemIdData = await (this  as  any).query('PatrolObj', 'queryManyDataByTaskApiAndObjId', [
        null,
        regionId
      ])
      let taskIdArr1 = null
      if (patrolItemIdData) { taskIdArr1 = patrolItemIdData.map(item => item['patrolObjRelItem.patrolTaskId']) }
      if (taskIdArr1) taskIdArr = taskIdArr1.filter(item => item !== null)
    }

    const condition:any = {
      where: {planId: { [Op.not]: null }},
      attributes: [ 'timeStatus' ]
    }
    if (taskIdArr) {
      condition.where.patrolTaskId = { [Op.in]: taskIdArr }
    }
    if (patrolTemplateId && patrolTemplateId !== '') {
      condition.where.psId = patrolTemplateId
    }
    if (startTime && endTime) {
      condition.where.createTime = { [Op.between]: [ parseInt(startTime), parseInt(endTime) ] }
    }
    const { list } = await (this  as  any).query('Task', 'queryAllData', [ condition ])
    const data = {
      taskNum: list.length,
      timeOutNum: 0,
      rate: ''
    }
    for (const elem of list.values()) {
      if (elem.timeStatus === 1) {
        data.timeOutNum++
      }
    }
    if (data.taskNum === 0 || data.timeOutNum === 0) {
      data.rate = '0%'
    } else {
      data.rate = parseInt(((data.timeOutNum * 1000) / data.taskNum).toFixed()) / 10 + '%'
    }
    return data
  }

  /**
   * 获取超时排行榜
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async timeoutRankService (params:any = {}): Promise<any> {
    const { ctx } = this
    const { regionId } = params
    // 根据区域找到符合的taskid
    let taskIdArr = null
    if (regionId && regionId !== '') {
      const patrolItemIdData = await (this  as  any).query('PatrolObj', 'queryManyDataByTaskApiAndObjId', [
        null,
        regionId
      ])
      let taskIdArr1 = null
      if (patrolItemIdData) { taskIdArr1 = patrolItemIdData.map(item => item['patrolObjRelItem.patrolTaskId']) }
      if (taskIdArr1) taskIdArr = taskIdArr1.filter(item => item !== null)
    }
    const newParams = Object.assign({}, params, { taskIdArr })
    const { list } = await (this  as  any).query('Task', 'queryAllDataByAnalysisServiceTimeoutRankService', [
      newParams
    ])

    const uerObj = {}
    for (const elem of list.values()) {
      if (elem.dataValues.execCurrentPerson) {
        const personIdArr = elem.dataValues.execCurrentPerson.split(',')
        const taskId = elem.dataValues.patrolTaskId
        for (const personId of personIdArr.values()) {
          if (uerObj[personId]) {
            if (!(uerObj[personId].taskIds.includes(taskId))) {
              uerObj[personId].value++
              uerObj[personId].taskIds.push(taskId)
            }
          } else {
            const person = await ctx.service.pdms.getUsersByUserIds([ personId ], (this  as  any).transaction)
            uerObj[personId] = {
              id: personId,
              name: person.list[0].personName,
              value: 1,
              taskIds: [ taskId ]
            }
          }
        }
      }
    }
    const uerArr = []
    for (const i in uerObj) {
      uerArr.push(uerObj[i])
    }

    function f (a, b) {
      // 排序函数
      return -(a.value - b.value)
    }
    uerArr.sort(f)
    const sortUerArr = uerArr.slice(0, 5)
    // const rankPersonIds = sortUerArr.map(item => item.id)
    // const res = await ctx.service.pdms.getUsersByUserIds('fdsadf',(this  as  any).transaction)
    return sortUerArr
  }

  /**
   * 获取问题率对比表
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async problemRateContrastService (params:any = {}): Promise<any> {
    const {
      regionIdPath, patrolObjTypeId, startTime, endTime, type
    } = params
    let xAxis = []
    const hourRangArr = []

    if (type && startTime && endTime) {
      if (type === 'day') {
        const hourRang = [
          parseInt(startTime.slice(11, 13)),
          parseInt(endTime.slice(11, 13)),
          startTime.slice(0, 11)
        ]
        const add0 = m => {
          return m < 10 ? '0' + m : m
        }
        const set = () => {

          if (hourRang[0] === 0) {
            xAxis.push(add0(hourRang[0]) + ':00')
            hourRangArr.push({
              s: hourRang[2] + '00:00:00',
              e: hourRang[2] + '00:00:00'
            })
            hourRang[0] += 1
            set()
          }
          if (hourRang[0] <= hourRang[1] && hourRang[0] !== 0) {
            xAxis.push(add0(hourRang[0]) + ':00')
            if (hourRang[0] === 24) {
              hourRangArr.push({
                s: hourRang[2] + add0(hourRang[0] - 1) + ':00:01',
                e: hourRang[2] + add0(hourRang[0] - 1) + ':59:59'
              })
            } else {
              hourRangArr.push({
                s: hourRang[2] + add0(hourRang[0] - 1) + ':00:01',
                e: hourRang[2] + add0(hourRang[0]) + ':00:00'
              })
            }
            hourRang[0] += 1
            set()
          }
        }
        set()
      } else if (type === 'week' || type === 'month') {
        function getDay (day1, day2) {
          const getDate = function (str) {
            const tempDate = new Date()
            const list = str.split('-')
            tempDate.setFullYear(list[0])
            tempDate.setMonth(list[1] - 1)
            tempDate.setDate(list[2])
            return tempDate
          }
          let date1 = getDate(day1)
          let date2 = getDate(day2)
          if (date1 > date2) {
            const tempDate = date1
            date1 = date2
            date2 = tempDate
          }
          date1.setDate(date1.getDate() + 1)
          const dateArr = []
          let i = 0

          while (
            !(
              date1.getFullYear() == date2.getFullYear() &&
              date1.getMonth() == date2.getMonth() &&
              date1.getDate() == date2.getDate()
            )
          ) {
            let dayStr = date1.getDate().toString()
            let dayMonth = (date1.getMonth() + 1).toString()
            if (dayStr.length === 1) {
              dayStr = '0' + dayStr
            }
            if (dayMonth.length === 1) {
              dayMonth = '0' + dayMonth
            }
            dateArr[i] = date1.getFullYear() + '-' + dayMonth + '-' + dayStr
            i++
            date1.setDate(date1.getDate() + 1)
          }
          dateArr.splice(0, 0, day1)
          dateArr.push(day2)
          return dateArr
        }
        if (startTime === endTime) {
          xAxis = [ startTime ]
        } else {
          xAxis = getDay(startTime, endTime)
        }
        for (const elem of xAxis.values()) {
          hourRangArr.push({
            s: elem + ' 00:00:00',
            e: elem + ' 23:59:59'
          })
        }
      } else {
        const monthRang = [
          parseInt(startTime.slice(5, 7)),
          parseInt(endTime.slice(5, 7)),
          startTime.slice(0, 4)
        ]
        const add0 = m => {
          return m < 10 ? '0' + m : m
        }
        const smallMonth = [ 4, 6, 9, 11 ]

        function getMonthDays (year, month) {
          const stratDate:any = new Date(year, month - 1, 1),
            endData:any = new Date(year, month, 1)
          const days = (endData - stratDate) / (1000 * 60 * 60 * 24)
          return days
        }
        const monthSet = () => {
          if (monthRang[0] <= monthRang[1]) {
            xAxis.push(monthRang[2] + '-' + add0(monthRang[0]))
            if (monthRang[0] === 2) {
              hourRangArr.push({
                s: monthRang[2] + '-' + add0(monthRang[0]) + '-01 00:00:00',
                e:
                  monthRang[2] +
                  '-' +
                  add0(monthRang[0]) +
                  '-' +
                  getMonthDays(parseInt(monthRang[2]), 2) +
                  ' 23:59:59'
              })
            } else {
              hourRangArr.push({
                s: monthRang[2] + '-' + add0(monthRang[0]) + '-01 00:00:00',
                e:
                  monthRang[2] +
                  '-' +
                  add0(monthRang[0]) +
                  (smallMonth.includes(monthRang[0]) ? '-30 23:59:59' : '-31 23:59:59')
              })
            }

            monthRang[0] += 1
            monthSet()
          }
        }
        monthSet()
      }
    }
    const rate = {}
    if (regionIdPath) {
      // 求出被复合失败的问题
      let checkfalse = null
      const checkfalseRes = await (this  as  any).query('TransactionFlow', 'queryAllData', [
        {
          where: {
            isDelete: 0,
            status: '9'
          },
          attributes: [ 'relativeId' ]
        }
      ])
      if (checkfalseRes && checkfalseRes.length > 0) checkfalse = checkfalseRes.map(v => v.relativeId)

      const regionIdArr = regionIdPath.split(',')
      for (const elem of regionIdArr.values()) {
        rate[elem] = []
        for (const item of hourRangArr.values()) {
          const res = await this.getProblemRateByObjTypeAndRegionId({
            checkfalse,
            patrolObjTypeId,
            regionIdPath: elem,
            startTime: moment(item.s).valueOf(),
            endTime: moment(item.e).valueOf()
          })
          rate[elem].push(parseFloat(res.rate))

        }
        // }
      }
    }
    return {
      hourRangArr,
      rate,
      x: xAxis
    }
  }

  /**
   * 获取问题率对比表
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async resultRankService (params:any = {}): Promise<any> {
    const {
      regionIdPath
    } = params
    Object.assign(params, { type: true })
    const params1 = Object.assign({}, params, { type: true })
    const objKeyValue = []
    if (regionIdPath) {
      // 获取区域下的巡检对象
      const patrolItemIdData = await (this  as  any).query('PatrolObj', 'queryTaskItemIdByObjTypeAnalysisService', [ params1 ])
      for (const elem of patrolItemIdData.values()) {
        const arr1 = elem.patrolObjRelItem.map(v => v.patrolTaskItem)
        const arr2 = []
        for (const s of arr1.values()) {
          arr2.push(...s)
        }
        const arr3 = arr2.map(v => v.patrolTaskItemId)
        objKeyValue.push({
          id: elem.patrolObjId,
          name: elem.patrolObjName,
          score: 0,
          taskItemIds: arr3
        })
      }
    }

    const sum = (arr = []) => {
      let sum = 0
      for (const s of arr.values()) {
        sum += s.patrolScore
      }
      return sum
    }
    // 查询巡检分数
    const ascData = []
    const descData = []
    for (const elem of objKeyValue.values()) {
      const { list } = await (this  as  any).query('TaskExecSchema', 'findAndCountAllData', [
        {
          where: {
            patrolTaskItemId: { [Op.in]: elem.taskItemIds },
            status: { [Op.not]: 99 }
          },
          attributes: [ 'patrolScore' ]
        }
      ])
      const sums = sum(list)
      ascData.push({
        itemContent: elem.name,
        itemId: elem.id,
        score: sums
      })
      descData.push({
        itemContent: elem.name,
        itemId: elem.id,
        score: sums
      })
    }
    function asc (a, b) {
      // 排序函数
      return a.score - b.score
    }
    function desc (a, b) {
      // 排序函数
      return -(a.score - b.score)
    }
    ascData.sort(asc)
    descData.sort(desc)
    const arr1 = ascData.slice(0, 5)
    const arr2 = descData.slice(0, 5)
    return {
      ascData: arr1,
      descData: arr2
    }
  }

  /**
   * 巡检项打分表格
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async deductionListService (params:any = {}): Promise<any> {
    const { ctx } = this
    const {
      regionIdPath, pageNo, pageSize
    } = params
    const params1 = Object.assign({}, params, { type: true })
    const taskIds = []
    if (regionIdPath) {
      // 获取区域下的巡检对象
      const patrolItemIdData = await (this  as  any).query('PatrolObj', 'queryTaskIdByObjTypeAnalysisService', [ params1 ])
      for (const elem of patrolItemIdData.values()) {
        const arr1 = elem.patrolObjRelItem.map(v => v.patrolTaskId)
        // let arr2 = []
        // for (let s of arr1.values()) {
        //   arr2.push(...s)
        // }
        // let arr3 = arr2.map(v => v.patrolTaskItemId)
        taskIds.push(...arr1)
      }
    }
    if (taskIds.length === 0) {
      return {
        list: [],
        total: 0,
        pageNo,
        pageSize
      }
    }
    const taskIdsSetArr = [ ...new Set(taskIds) ]
    const data1 = await (this  as  any).query('TaskExecSchema', 'queryResultList', [{ pageNo, pageSize, taskItemIds: taskIdsSetArr }])
    const list = []
    for (const elem of data1.rows.values()) {
      let itenPathStr = ''
      if (elem.patrolTaskItem && elem.patrolTaskItem.path) {
        const namePath = await ctx.service.item.itemPathNameService(
          { path: elem.patrolTaskItem.path },
          (this  as  any).transaction
        )
        const namePathArr = namePath.split('/')
        const namePathArr1 = [
          namePathArr[1],
          namePathArr[2]
        ]
        itenPathStr = namePathArr1.join('/')
      }
      list.push({
        patrolTaskItemId: elem.patrolTaskItemId,
        itemName: elem.patrolTaskItem && elem.patrolTaskItem.itemName || '-',
        score: (elem.patrolScore || elem.patrolScor === 0) ? elem.patrolScore : '-',
        itemPath: itenPathStr,
        psName: elem.patrolTask.psIdTransPsName.psName || '-',
        resultDesc: elem.resultDesc || '-'
      })
    }
    return {
      taskIdsSetArr: taskIdsSetArr.length,
      list,
      total: data1.count,
      pageNo,
      pageSize
    }
  }

  /**
   * 获取问题率(通过任务巡检项)
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async getProblemRateByItemId (params:any = {}): Promise<any> {
    const { itemId, startTime, endTime,taskId } = params
    const resultCondition:any = {
      where: {patrolTaskItemId: { [Op.in]: itemId }}
    }
    if (taskId) resultCondition.where.taskId = { [Op.in]: taskId }
    if (startTime && endTime) {
      resultCondition.where.createTime = { [Op.between]: [ parseInt(startTime), parseInt(endTime) ] }
    }
    // 求出巡检项条数
    const res = await (this  as  any).query('TaskExecSchema', 'queryCount', [ resultCondition ])
    resultCondition.where.isIntoNextStep = 1
    // 求出问题条数
    const res1 = await (this  as  any).query('TaskExecSchema', 'queryCount', [ resultCondition ])
    const data = {
      problemNum: res1,
      itemNum: res,
      rate: ''
    }
    if (data.problemNum === 0 || data.itemNum === 0) {
      data.rate = '0%'
    } else {
      data.rate = parseInt(((data.problemNum * 1000) / data.itemNum).toFixed()) / 10 + '%'
    }
    return data
  }
}
