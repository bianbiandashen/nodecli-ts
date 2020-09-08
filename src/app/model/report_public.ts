/*
 * @Author: renxiaojian
 * @Date: 2020-01-17 17:55:31
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-06-10 19:47:49
 */
'use strict'

module.exports = app => {
  const { Sequelize,
    model } = app
  const schema = 'public'
  const capitalSchema = app.capitalize(schema)
  const ReportSchema = require('../../schema/tb_report')(app)
  const Report = model.define('tb_report', ReportSchema, { schema })
  const { Model } = require('../core/transactionalDeco/index')
  const { Op } = Sequelize
  class Query {
    app=app
    @Model
    async getMethodIdModel (methodName) {
      const query = `
        SELECT m_id FROM ` + schema + `.tb_inspection_manner WHERE ai_type = $methodName AND IS_DELETE >=0
      `
      const res = await (this as any).query(
        query, {
          bind: {
            schema,
            methodName
          }
        })
      return this.app.toHumpJson(res[0])
    }
    /**
     * 添加xx
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async createData (params) {
      return await (this as any).create(params)
    }
    @Model
    async blukCreate (params) {
      return await (this as any).bulkCreate(params)
    }
    @Model
    async queryAllData (condition) {
      const data = await (this as any).findAll(condition)
      return data
    }
    /**
     * 查询巡检报告分页列表
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryData (pagination, params) {
      const {
        patrolTaskId,
        pageNo,
        pageSize
      } = params
      const condition:any = {
        limit: pageSize * 1,
        offset: (pageNo - 1) * pageSize,
        where: {},
        attributes: [
          'itemName', 'patrolTaskId', 'patrolItemId', 'taskItemReportId',
          'patrolTaskItemId', 'patrolObjRelId', 'patrolResult', 'updateTime', 'createTime'
        ],
        include: [{
          model: app.model['PatrolObjRel' + capitalSchema],
          attributes: [ 'patrolObjRelId' ],
          as: 'patrolObj',
          include: {
            model: app.model['PatrolObj' + capitalSchema],
            as: 'partrolObjItem',
            attributes: [ 'patrolObjName', 'patrolObjId', 'regionPath' ]
          }
        },
        {
          model: app.model['ObjTypeResult' + capitalSchema],
          as: 'itemResult',
          attributes: [ 'orName' ]
        },
        {
          model: app.model['Task' + capitalSchema],
          as: 'Task',
          attributes: [ 'startTime' ]
        },
        {
          model: app.model['TaskExecSchema' + capitalSchema],
          attributes: [ 'pointResultId', 'execUser' ],
          as: 'taskItemExec',
          include: {
            model: app.model['TransactionFlow' + capitalSchema],
            attributes: [ 'status', 'modifier', 'version' ],
            as: 'taskFlowStatus'
          }
        }
        ]
        // distinct: true
        // raw: true
      }
      if (patrolTaskId) condition.where.patrolTaskId = patrolTaskId
      // if (patrolObjName) condition.where.patrolObjName = patrolObjName
      const data = await (this as any).findAndCountAll(condition)
      // 处理返回格式
      const result = {
        total: data.count,
        list: data.rows,
        pageNo: pagination.pageNo,
        pageSize: pagination.pageSize
      }
      return result
    }
    /**
     * 查询巡检统计报告分页列表
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryDataStatistcs (params) {
      const {
        patrolAreaIds,
        createTimeStart,
        createTimeEnd,
        reportType,
        pageNo,
        pageSize
      } = params
      const condition:any = {
        order: [
          [ 'createTime', 'DESC' ]
        ],
        limit: pageSize * 1,
        offset: (pageNo - 1) * pageSize,
        where: { isDelete: { [Op.lt]: 1 } }
      }
      if (!patrolAreaIds) {
        condition.where.patrolAreaIds = { [Op.or]: params.regionIdsArr }
      } else {
        condition.where.patrolAreaIds = patrolAreaIds
      }
      if (reportType) condition.where.reportType = reportType
      if (createTimeStart && createTimeEnd) {
        condition.where.createTime = {
          [Op.between]: [
            new Date(`${createTimeStart}`).getTime(),
            new Date(`${createTimeEnd}`).getTime()
          ]
        }
      }
      const data = await (this as any).findAndCountAll(condition)
      // 处理返回格式
      const result = {
        total: data.count,
        list: data.rows,
        pageNo,
        pageSize
      }
      return result
    }
    /**
     * 删除报告-支持多条 (destroy)
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async deleteData (idsArr) {
      return await (this as any).update({ isDelete: 1 }, { where: { reportId: { [Op.or]: idsArr } } })
    }
    /**
     * 查询报告某个时间点以前的
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryStatistcsDataBeforeTime (params) {
      const res = await (this as any).query(`
      select a.* from ` +
      schema + `.tb_report a
      where
      a.create_time < $beforeTime
      and a.report_type = $reportType
      and a.is_delete = 0
      `, {
        bind: {
          beforeTime: params.beforeTime,
          reportType: params.reportType
        }
      })
      return this.app.toHumpJson(res[0])
    }
    /**
     * 查询巡检报告详情，单条查询
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryStatistcsDetail (condition) {
      const data = await (this as any).findOne(condition)
      return data
    }
    /**
     * 根据时间查询任务信息及巡检项、巡检结论、问题数相关信息
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryStatsReportInfo (params) {
      const res = await (this as any).query(`
      select a.*,
      b.patrol_task_item_id,b.obj_type_id,b.patrol_obj_rel_id,b.is_leaf,
      c.point_result_id,
      d.transaction_id,d.relative_id,d.status as transaction_status,d.version from ` +
      schema + '.tb_patrol_task a,' +
      schema + `.tb_patrol_task_item b
      left join ` + schema + `.tb_task_exec_result c
      on (b.patrol_task_item_id = c.patrol_task_item_id)
      left join ` + schema + `.tb_transaction_flow d
      on(c.point_result_id = d.relative_id and d.is_delete = 0)
      where
      a.task_type != 2
      and a.patrol_task_id = b.patrol_task_id
      and a.create_time between $startTime and $endTime
      `, {
        bind: {
          startTime: params.startTime,
          endTime: params.endTime
        }
      })
      return this.app.toHumpJson(res[0])
    }
    /**
     * 根据任务ID查询巡检问题列表
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryStatsReportProblem (params) {
      const res = await (this as any).query(`
      select
      a.patrol_task_item_id,a.obj_type_id,a.patrol_obj_rel_id,a.item_name,a.obj_type_id,a.path,
      b.point_result_id,b.exec_user,b.patrol_result,b.result_desc,
      c.transaction_id,c.relative_id,c.status,c.version,c.is_delete,c.modifier,c.remark,
      g.obj_type_name,d.or_name,e.patrol_obj_id,f.patrol_obj_name from ` +
      schema + '.tb_patrol_task_item a,' +
      schema + '.tb_obj_type_result d,' +
      schema + '.tb_task_exec_result b,' +
      schema + '.tb_transaction_flow c,' +
      schema + '.tb_patrol_obj_rel e,' +
      schema + '.tb_object_type g,' +
      schema + `.tb_patrol_obj f
      where
      a.patrol_task_id in (:taskIds)
      and a.patrol_task_item_id = b.patrol_task_item_id
      and b.patrol_result = d.or_id
      and b.point_result_id = c.relative_id
      and a.patrol_obj_rel_id = e.patrol_obj_rel_id
      and e.patrol_obj_id = f.patrol_obj_id
      and a.obj_type_id = g.obj_type_id
      and c.status != '9'
      and c.create_time between :startTime and :endTime
      `, {
        replacements: {
          taskIds: params.patrolTaskIds,
          startTime: params.startTime,
          endTime: params.endTime
        }
      }
      )
      return this.app.toHumpJson(res[0])
    }
  }
  Report.query = new Query()
  return Report
}
