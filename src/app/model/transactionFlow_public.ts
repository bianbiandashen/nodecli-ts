/*
 * @Author: renxiaojian
 * @Date: 2019-12-11 11:17:24
 * @Last Modified by: jiangyan6
 * @Last Modified time: 2020-07-15 11:16:37
 */
'use strict'

module.exports = app => {
  const UUID = require('uuid')
  const { model } = app
  const schema = 'public'
  const capitalSchema = app.capitalize(schema)
  const transactionFlowSchema = require('../../schema/tb_transaction_flow')(app)
  const transactionFlow = model.define('tb_transaction_flow', transactionFlowSchema, { schema })
  const { Model } = require('../core/transactionalDeco/index')
  transactionFlow.associate = function () {
    app.model['TransactionFlow' + capitalSchema].belongsTo(
      app.model['TaskExecSchema' + capitalSchema],
      {
        foreignKey: 'relativeId',
        targetKey: 'pointResultId'
      }
    )
  }
  class Query {
    app=app
    // 分页获取问题
    @Model
    async queryListData (params) {
      const {
        patrolObjName = '', regionPath = '', patrolTaskName = '', patrolPlanName = '', stareDate, endDate, pageNo = 1, pageSize = 20
      } = params
      let dateStr = ''
      if (stareDate && endDate) {
        dateStr = `and b.create_time >= '${stareDate} 00:00:00' and b.create_time <= '${endDate} 24:00:00'`
      } else if (stareDate && !endDate) {
        dateStr = `and b.create_time >= '${stareDate} 00:00:00'`
      } else if (!stareDate && endDate) {
        dateStr = `and b.create_time <= '${endDate} 24:00:00'`
      } else {
        dateStr = ''
      }
      const query = `
      select c.patrol_task_item_id,a.transaction_id,g.patrol_plan_name,f.patrol_task_name,e.region_path,e.patrol_obj_name,c.item_name,h.or_name,b.result_desc,b.create_time,b.exec_user
      from ${schema}.tb_transaction_flow as a 
      left join ${schema}.tb_task_exec_result as b on a.relative_id = b.point_result_id
      left join ${schema}.tb_patrol_task_item as c on b.patrol_task_item_id = c.patrol_task_item_id
      left join ${schema}.tb_patrol_obj_rel as d on c.patrol_obj_rel_id = d.patrol_obj_rel_id
      left join ${schema}.tb_patrol_obj as e on d.patrol_obj_id = e.patrol_obj_id
      left join ${schema}.tb_patrol_task as f on c.patrol_task_id = f.patrol_task_id
      left join ${schema}.tb_patrol_plan as g on f.plan_id = g.patrol_plan_id
      left join ${schema}.tb_obj_type_result as h on b.patrol_result = h.or_id
      where a.is_delete > '-1' and a.status > '2' and a.status != '9'
      and e.region_path like $regionPath
      and e.patrol_obj_name like $patrolObjName
      and f.patrol_task_name like $patrolTaskName
      and g.patrol_plan_name like $patrolPlanName
      ${dateStr}
      order by b.create_time DESC
      limit $limit offset $offset
      `
      const total = `
      select count(*)
      from ${schema}.tb_transaction_flow as a 
      left join ${schema}.tb_task_exec_result as b on a.relative_id = b.point_result_id
      left join ${schema}.tb_patrol_task_item as c on b.patrol_task_item_id = c.patrol_task_item_id
      left join ${schema}.tb_patrol_obj_rel as d on c.patrol_obj_rel_id = d.patrol_obj_rel_id
      left join ${schema}.tb_patrol_obj as e on d.patrol_obj_id = e.patrol_obj_id
      left join ${schema}.tb_patrol_task as f on c.patrol_task_id = f.patrol_task_id
      left join ${schema}.tb_patrol_plan as g on f.plan_id = g.patrol_plan_id
      left join ${schema}.tb_obj_type_result as h on b.patrol_result = h.or_id
      where a.is_delete > '-1' and a.status > '2' and a.status != '9'
      and e.region_path like $regionPath
      and e.patrol_obj_name like $patrolObjName
      and f.patrol_task_name like $patrolTaskName
      and g.patrol_plan_name like $patrolPlanName
      ${dateStr}
      `
      const res = await (this as any).query(
        query, {
          bind: {
            patrolObjName: `%${patrolObjName}%`,
            regionPath: `%${regionPath}%`,
            patrolTaskName: `%${patrolTaskName}%`,
            patrolPlanName: `%${patrolPlanName}%`,
            offset: (pageNo - 1) * pageSize,
            limit: pageSize
          }
        })
      const totalList = await (this as any).query(
        total, {
          bind: {
            patrolObjName: `%${patrolObjName}%`,
            regionPath: `%${regionPath}%`,
            patrolTaskName: `%${patrolTaskName}%`,
            patrolPlanName: `%${patrolPlanName}%`
          }
        }) || []
      const getList = this.app.toHumpJson(res[0]) || []
      if (getList.length) {
        const getStr = `(${getList.map(element => `'${element.transactionId}'`).join()})`
        const item = `select modifier,version,status,transaction_id from ${schema}.tb_transaction_flow where transaction_id in ${getStr} order by version DESC`
        const itemList = await (this as any).query(item, { bind: {} })
        getList.forEach(element => {
          element.flow = []
          this.app.toHumpJson(itemList[0]).forEach(res => {
            if (res.transactionId === element.transactionId) {
              element.flow.push(res)
            }
          })
        })
      }
      const list = {
        list: getList,
        total: (totalList[0] && totalList[0][0] && totalList[0][0].count) || 0
      }
      return list
    }
    @Model
    async queryQuestionsByObjIdAndUserId (
      objectId,
      status,
      orderType,
      pageSize,
      pageNo,
      isAccept,
      userId
    ) {
      console.log('objectIdobjectIdobjectId', objectId)
      console.log('isAccept', isAccept)

      let paramSQL = ''
      if (orderType === '1') {
        paramSQL = ' order by is_accept DESC,create_time ASC'
      } else {
        paramSQL = ' order by is_accept DESC, create_time DESC'
      }
      let isaccSql = ''
      if (isAccept !== null && typeof isAccept !== 'undefined') {
        isaccSql = ' and a.is_accept = $isAccept'
      }
      const nowDate = this.app.dateFormatter(new Date(), 'yyyy-MM-dd hh:mm:ss')
      // select c.* from tb_task_exec_result a ,(
      //   select patrol_task_item_id from (with RECURSIVE cte as
      //       (
      //       select a.* from tb_item a,
      //       tb_patrol_task_item b
      //     where
      //     a.item_id = b.patrol_item_id
      //     and
      //     b.patrol_task_item_id = $firstTaskItemId
      //       union all
      //       select k.*  from tb_item k , cte c where c.item_id = k.parent_item
      //       )select * from cte) b left join tb_patrol_task_item a
      //    on a.patrol_item_id = b.item_id
      //    ) b, tb_transaction_flow c
      //    where
      //    b.patrol_task_item_id = a.patrol_task_item_id
      //    and a.point_result_id = c.relative_id
      //    and c.is_delete >=0
      //    and c.status = $status
      const result = await (this as any).query(
        'select distinct a.* from ' +
          schema +
          `.tb_transaction_flow a,((
          select a.submitter_user_id as valid_agent from ` +
          schema +
          `.tb_agent_person a
          where a.agent_user_id = $userId
          and is_delete = 0
          and recovery_status = 0
          and start_time < $nowDate
          and end_time > $nowDate
          )
          union (
            select $userId as valid_agent
          )) b, ` +
          schema +
          '.tb_task_exec_result c, ' +
          schema +
          '.tb_patrol_task_item d, ' +
          schema +
          '.tb_patrol_task f, ' +
          schema +
          `.tb_patrol_obj_rel e
          where 
          a.relative_id = c.point_result_id
          and f.patrol_task_id = d.patrol_task_id
          and f.exec_type = 2
          and c.patrol_task_item_id = d.patrol_task_item_id
          and d.patrol_obj_rel_id = e.patrol_obj_rel_id
          and e.patrol_obj_id = $objectId
          and
          (
          ','||a.NEXT_HANDLE_PEOPLE||',' like '%,' || b.valid_agent || ',%' 
          )
          and a.is_delete>=0
          and a.status = $status
          ` +
          isaccSql +
          paramSQL,
        {
          bind: {
            objectId,
            status,
            pageSize,
            pageNo,
            isAccept,
            userId,
            nowDate
          }
        }
      )

      console.log('toHumpJsontoHumpJson', this.app.toHumpJson(result[0]))
      return this.app.toHumpJson(result[0])
    }
    @Model
    async findAndCountAllDataSql (condition, userId, status, taskExecList) {
      console.log('---------taskExecList-------------', taskExecList)
      let questionTotal = 0 // 问题总数
      let pendReviewTotal = 0 // 复核总数
      let pendRectifyTotal = 0 // 整改总数
      let pendExamineTotal = 0 // 审核总数
      let pendCompleteTotal = 0 // 完成总数
      let total = 0 // 当前 total
      let list = []
      let count = []
      let quesList = []
      let questionCount = []
      // 分页获取问题列表 status 为空
      const questionList = async () => {
        return await (this as any).query(
          'SELECT * FROM ' +
            schema +
            `.TB_TRANSACTION_FLOW
            where
              (','||next_handle_people||',' like :ilikeUserId
              or ',' || next_copy_people || ',' like :ilikeUserId)
              and relative_id in (:taskExecList)
              and status != '9'
              and is_delete=0
            limit :limit offset :offset`,
          {
            replacements: {
              limit: condition.limit,
              offset: condition.offset,
              ilikeUserId: `%,${userId},%`,
              userId,
              status,
              taskExecList
            }
          }
        )
      }
      // 分页获取问题列表 status 不为空
      const questionStatusList = async () => {
        return await (this as any).query(
          'SELECT * FROM ' +
            schema +
            `.TB_TRANSACTION_FLOW
            where
              (','||next_handle_people||',' like :ilikeUserId
              or ',' || next_copy_people || ',' like :ilikeUserId)
              and relative_id in (:taskExecList)
              and status=:status
              and is_delete=0
            limit :limit offset :offset`,
          {
            replacements: {
              limit: condition.limit,
              offset: condition.offset,
              ilikeUserId: `%,${userId},%`,
              userId,
              status,
              taskExecList
            }
          }
        )
      }
      // 获取问题不同状态的总数
      const questionStatusTotal = async () => {
        return await (this as any).query(
          'SELECT count(*) , status FROM ' +
            schema +
            `.TB_TRANSACTION_FLOW
            where
              (','||next_handle_people||',' like :ilikeUserId
              or ',' || next_copy_people || ',' like :ilikeUserId)
              and relative_id in (:taskExecList)
              and is_delete=0
              and status in('0','3','5','8') 
            group by status`,
          {
            replacements: {
              ilikeUserId: `%,${userId},%`,
              userId,
              status,
              taskExecList
            }
          }
        )
      }
      // admin 放开权限
      // 分页获取问题列表 status 为空
      const adminQuestionList = async () => {
        return await (this as any).query(
          'SELECT * FROM ' +
            schema +
            `.TB_TRANSACTION_FLOW
            where
              relative_id in (:taskExecList)
              and status != '9'
              and is_delete=0
            limit :limit offset :offset`,
          {
            replacements: {
              limit: condition.limit,
              offset: condition.offset,
              ilikeUserId: `%,${userId},%`,
              userId,
              status,
              taskExecList
            }
          }
        )
      }
      // 分页获取问题列表 status 不为空
      const adminQuestionStatusList = async () => {
        return await (this as any).query(
          'SELECT * FROM ' +
            schema +
            `.TB_TRANSACTION_FLOW
            where
              relative_id in (:taskExecList)
              and status=:status
              and is_delete=0
            limit :limit offset :offset`,
          {
            replacements: {
              limit: condition.limit,
              offset: condition.offset,
              ilikeUserId: `%,${userId},%`,
              userId,
              status,
              taskExecList
            }
          }
        )
      }
      // 获取问题不同状态的总数
      const adminQuestionStatusTotal = async () => {
        return await (this as any).query(
          'SELECT count(*) , status FROM ' +
            schema +
            `.TB_TRANSACTION_FLOW
            where
              relative_id in (:taskExecList)
              and is_delete=0
              and status in('0','3','5','8') 
            group by status`,
          {
            replacements: {
              ilikeUserId: `%,${userId},%`,
              userId,
              status,
              taskExecList
            }
          }
        )
      }
      if (userId === 'admin') {
        !status
          ? ([ list, count ] = await Promise.all([ adminQuestionList(), adminQuestionStatusTotal() ]))
          : ([ list, count ] = await Promise.all([ adminQuestionStatusList(), adminQuestionStatusTotal() ]))
      } else {
        !status
          ? ([ list, count ] = await Promise.all([ questionList(), questionStatusTotal() ]))
          : ([ list, count ] = await Promise.all([ questionStatusList(), questionStatusTotal() ]))
      }
      console.log('----------------------------', list, count)
      quesList = list[0]
      questionCount = count[0]

      if (questionCount.length) {
        questionCount.forEach(item => {
          switch (item.status) {
            case '0':
              pendReviewTotal = Number(item.count)
              break
            case '3':
              pendRectifyTotal = Number(item.count)
              break
            case '5':
              pendExamineTotal = Number(item.count)
              break
            case '8':
              pendCompleteTotal = Number(item.count)
              break
            default:
              break
          }
        })
      }
      questionTotal = pendReviewTotal + pendRectifyTotal + pendExamineTotal + pendCompleteTotal
      total = questionTotal
      if (status) {
        switch (status) {
          case '0':
            total = pendReviewTotal
            break
          case '3':
            total = pendRectifyTotal
            break
          case '5':
            total = pendExamineTotal
            break
          case '8':
            total = pendCompleteTotal
            break
          default:
            break
        }
      }
      const result = {
        total,
        list: quesList,
        questionTotal,
        pendReviewTotal,
        pendRectifyTotal,
        pendExamineTotal,
        pendCompleteTotal
      }
      console.log('----------------------------', result)
      return result
    }
    @Model
    async queryVaildAgentList (userId, status) {
      const nowDate = this.app.dateFormatter(new Date(), 'yyyy-MM-dd hh:mm:ss')
      const res = await (this as any).query(
        'select distinct a.* from ' +
          schema +
          `.TB_TRANSACTION_FLOW a,((
            select a.submitter_user_id as valid_agent from ` +
          schema +
          `.tb_agent_person a
            where 
            a.agent_user_id = $userId
            and is_delete = 0
            and recovery_status = 0
            and start_time < $nowDate
            and end_time > $nowDate)
            union (
              select $userId as valid_agent
            )) b
            where 
            (
            ','||a.NEXT_HANDLE_PEOPLE||',' like '%,' || b.valid_agent || ',%'
            )
            and a.is_delete>=0 
            and a.status=$status
            `,
        {
          bind: {
            userId,
            nowDate,
            status
          }
        }
      )
      const result = {
        total: this.app.toHumpJson(res[0]).length,
        list: this.app.toHumpJson(res[0])
      }
      return result
    }
    /**
     * 查询所有数据
     * @param {object} { regionId, status, patrolTaskName } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryData (condition) {
      const data = await (this as any).findAndCountAll(condition)
      // 处理返回格式
      const result = { list: data.rows }
      return result
    }

    @Model
    async createInitData (initStatus, relativeId, execUsers, copyUsers, modifier) {
      // 夏令时创建
      const nowTime = new Date()
      const offset = -(nowTime.getTimezoneOffset() / 60)
      const createTimeZone = offset
      const createTimeStamp = nowTime.getTime()
      const updateTimeZone = offset
      const updateTimeStamp = nowTime.getTime()
      // const params = {}
      // params.version = 1
      // params.status = initStatus
      // params.remark = ''
      // params.nextHandlePeople = execUsers
      // params.nextCopyPeople = copyUsers
      // params.picUrl = ''
      // params.handleInfo = ''
      // params.isDelete = 0
      // const nowDate = this.app.dateFormatter(new Date(), 'yyyy-MM-dd hh:mm:ss')
      // params.modifier = modifier
      // params.relativeId = relativeId
      // params.isAccept = -1
      // return await this.create(params)
      const pk = UUID.v1()
      console.log('initStatus', initStatus)
      console.log('relativeId', relativeId)
      console.log('execUsers', execUsers)
      console.log('copyUsers', copyUsers)
      console.log('modifier', modifier)
      console.log('pk', pk)
      console.log('schema', schema)
      console.log(
        'SQL+++++++++++++++++++++INSERT INTO ' +
          schema +
          ".TB_TRANSACTION_FLOW VALUES ($pk,1,$initStatus,'',$execUsers,$copyUsers,'',' {}',0,$nowDate,$nowDate,$modifier,$relativeId,-1,$createTimeZone,$createTimeStamp,$updateTimeZone,$updateTimeStamp)"
      )
      const nowDate = this.app.dateFormatter(new Date(), 'yyyy-MM-dd hh:mm:ss')
      return await (this as any).query(
        'INSERT INTO ' +
          schema +
          ".TB_TRANSACTION_FLOW VALUES ($pk,1,$initStatus,'',$execUsers,$copyUsers,'','{}',0,$nowDate,$nowDate,$modifier,$relativeId,-1,$createTimeZone,$createTimeStamp,$updateTimeZone,$updateTimeStamp)",
        {
          bind: {
            pk,
            initStatus,
            execUsers,
            copyUsers,
            nowDate,
            relativeId,
            modifier,
            createTimeZone,
            createTimeStamp,
            updateTimeZone,
            updateTimeStamp
          }
        }
      )
    }

    @Model async getTransactionByRelativeId (relativeId) {
      const result = await (this as any).query(
        `
        SELECT * 
        FROM ` +
          schema +
          `.TB_TRANSACTION_FLOW 
        WHERE
        RELATIVE_ID = $relativeId
        AND IS_DELETE >=0
      `,
        { bind: { relativeId } }
      )
      return this.app.toHumpJson(result[0])
    }
    @Model async getNextStatus (currentPreStatus, judge) {
      console.log('getNextStatusgetNextStatusgetNextStatus', currentPreStatus)
      console.log('judgejudgejudgejudge', judge)
      if (currentPreStatus === '3' && judge === 'Deny') {
        throw Error(this.app.ctx.__('model.mustPassedNoDeny'))
      }
      const result = await (this as any).query(
        `
        SELECT * 
        FROM ` +
          schema +
          `.TB_TRANSACTION_TEMPLATE
        WHERE
        TRANSACTION_TEMPLATE_ID = '1'
        AND JUDGEMENT = $judge
        AND CURRENT_STATUS = $currentPreStatus
      `,
        {
          bind: {
            judge,
            currentPreStatus
          }
        }
      )
      return this.app.toHumpJson(result[0])
    }
    @Model async updateTransactionByRelativeId (
      relativeId,
      handledStatus,
      nextPreStatus,
      info,
      execUsers,
      copyUsers,
      modifier
    ) {
      console.log('infofnifof', info)
      const nowDate = this.app.dateFormatter(new Date(), 'yyyy-MM-dd hh:mm:ss')
      const oldRecord = await (this as any).query(
        `
        SELECT * 
        FROM ` +
          schema +
          `.TB_TRANSACTION_FLOW 
        WHERE
        RELATIVE_ID = $relativeId
        AND IS_DELETE >= 0
      `,
        { bind: { relativeId } }
      )
      await (this as any).query(
        `
        UPDATE ` +
          schema +
          `.TB_TRANSACTION_FLOW
        SET IS_DELETE = -1
        WHERE RELATIVE_ID = $relativeId
        AND IS_DELETE = 0
      `,
        { bind: { relativeId } }
      )
      // 夏令时创建
      const nowTime = new Date()
      const offset = -(nowTime.getTimezoneOffset() / 60)
      const createTimeZone = offset
      const createTimeStamp = nowTime.getTime()
      const updateTimeZone = offset
      const updateTimeStamp = nowTime.getTime()
      await (this as any).query(
        'INSERT INTO ' +
          schema +
          '.TB_TRANSACTION_FLOW VALUES ($pk,$version,$status,$remark,$execUsers,$copyUsers,$picUrl,$handleInfo,-1,$nowDate,$nowDate,$modifier,$relativeId,-1,$createTimeZone,$createTimeStamp,$updateTimeZone,$updateTimeStamp)',
        {
          bind: {
            execUsers,
            copyUsers,
            pk: oldRecord[0][0].transaction_id,
            version: oldRecord[0][0].version + 1,
            status: handledStatus,
            remark: info.remark ? info.remark : '',
            picUrl: info.picUrl ? info.picUrl : '',
            handleInfo: info ? JSON.stringify(info) : '{}',
            nowDate,
            relativeId,
            modifier,
            createTimeZone,
            createTimeStamp,
            updateTimeZone,
            updateTimeStamp
          }
        }
      )

      await (this as any).query(
        'INSERT INTO ' +
          schema +
          ".TB_TRANSACTION_FLOW VALUES ($pk,$version,$status,'',$execUsers,$copyUsers,'',$handleInfo,0,$nowDate,$nowDate,$modifier,$relativeId,-1,$createTimeZone,$createTimeStamp,$updateTimeZone,$updateTimeStamp)",
        {
          bind: {
            pk: oldRecord[0][0].transaction_id,
            version: oldRecord[0][0].version + 2,
            status: nextPreStatus,
            execUsers,
            copyUsers,
            handleInfo: '{}',
            nowDate,
            relativeId,
            modifier,
            createTimeZone,
            createTimeStamp,
            updateTimeZone,
            updateTimeStamp
          }
        }
      )
      return 'success'
    }
    @Model async getStepFromPlanSchema (relativeId, nextPreStatus) {
      const result = await (this as any).query(
        'SELECT * FROM ' +
          schema +
          '.TB_PATROL_TASK_ITEM a,' +
          schema +
          '.TB_PATROL_TASK b,' +
          schema +
          '.TB_PROCESS e,' +
          schema +
          '.TB_TASK_EXEC_RESULT f WHERE f.PATROL_TASK_ITEM_ID = a.PATROL_TASK_ITEM_ID AND a.PATROL_TASK_ID = b.PATROL_TASK_ID AND b.PS_ID = e.PS_ID AND e.is_delete = 0 and e.TRANSACTION_STATUS = $nextPreStatus AND f.POINT_RESULT_ID = $relativeId ',
        {
          bind: {
            nextPreStatus,
            relativeId
          }
        }
      )
      return this.app.toHumpJson(result[0])
    }
    @Model async updateNextHandlerByRelativeId (nextHandler, relativeId) {
      const nowDate = this.app.dateFormatter(new Date(), 'yyyy-MM-dd hh:mm:ss')
      const oldRecord = await (this as any).query(
        `
              SELECT *
              FROM ` +
          schema +
          '.TB_TRANSACTION_FLOW WHERE RELATIVE_ID = $relativeId AND IS_DELETE >= 0',
        { bind: { relativeId } }
      )
      await (this as any).query(
        `
              UPDATE ` +
          schema +
          '.TB_TRANSACTION_FLOW SET IS_DELETE = -1 WHERE RELATIVE_ID = $relativeId AND IS_DELETE = 0 ',
        { bind: { relativeId } }
      )
      const Record =
        this.app.toHumpJson(oldRecord[0]) &&
        this.app.toHumpJson(oldRecord[0]).length > 0 &&
        this.app.toHumpJson(oldRecord[0])[0]
        // 夏令时创建
      const nowTime = new Date()
      const offset = -(nowTime.getTimezoneOffset() / 60)
      const createTimeZone = offset
      const createTimeStamp = nowTime.getTime()
      const updateTimeZone = offset
      const updateTimeStamp = nowTime.getTime()
      const result = await (this as any).query(
        'INSERT INTO ' +
          schema +
          '.TB_TRANSACTION_FLOW VALUES ($pk,$version,$status,$remark,$nextHandlePeople,$nextCopyPeople,$picUrl,$handleInfo,0,$createTime,$updateTime,$modifier,$relativeId,0,$createTimeZone,$createTimeStamp,$updateTimeZone,$updateTimeStamp)',
        {
          bind: {
            pk: Record.transactionId,
            version: Record.version + 1,
            status: Record.status,
            remark: Record.remark || '',
            picUrl: Record.picUrl || '',
            handleInfo: Record.handleInfo || '{}',
            createTime: Record.createTime,
            updateTime: nowDate,
            relativeId: Record.relativeId,
            modifier: Record.modifier,
            nextHandlePeople: nextHandler,
            nextCopyPeople: Record.nextCopyPeople || '',
            createTimeZone,
            createTimeStamp,
            updateTimeZone,
            updateTimeStamp
          }
        }
      )
      return this.app.toHumpJson(result[0])
    }
    // 分页获取问题
    @Model async findAndCountAllData (condition) {
      // console.log('++++', condition)
      const data = await (this as any).findAndCountAll(condition)

      // 处理返回格式
      const result = {
        total: data.count,
        list: data.rows
      }
      return result
    }

    /**
     * 添加xx
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model async findOneData (params) {
      const data = await (this as any).findOne(params)
      return data
    }
    // 查询全部数据
    @Model async queryAllData (condition) {
      const data = await (this as any).findAll(condition)
      return data
    }

    /**
     * 计数
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */

    @Model async queryCount (condition) {
      const data = await (this as any).count(condition)
      return data
    }
  }
  transactionFlow.query = new Query()
  return transactionFlow
}
