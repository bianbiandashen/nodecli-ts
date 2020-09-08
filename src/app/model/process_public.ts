'use strict'

module.exports = app => {
  const { model } = app
  const schema = 'public'
  const itemSchema = require('../../schema/tb_process')(app)
  const Process = model.define('tb_process', itemSchema, {
    schema
  })
  const { Model } = require('../core/transactionalDeco/index')
  class Query {
    app=app
    //process_type  0 //巡检 1 复核 2 整改 3 审核
    // 入参 ： taskId ， processType

    @Model
    async getExtraNextPersonOnByTaskId(patrolTaskId, processType) {
      const result = await (this as any).query(
        `SELECT A.extra_next_person_on FROM ` +
          schema +
          `.tb_process A, ` +
          schema +
          `.tb_plan_schema B, ` +
          schema +
          `.tb_PATROL_TASK C 
        where 
        C.patrol_task_id = $patrolTaskId
        AND C.ps_id = B.ps_id
        and B.ps_id = A.ps_id
        and A.process_type = $processType
      `,
        {
          bind: {
            processType,
            patrolTaskId
          }
        }
      )
      this.app.logger.log('　获取任务下得所有对象', result)
      return (
        this.app.toHumpJson(result[0]) &&
        this.app.toHumpJson(result[0]).length > 0 &&
        this.app.toHumpJson(result[0])[0].extraNextPersonOn
      )
    }
    /**
     * 巡检项查询
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryManyData(condition) {
      const data = await (this as any).findAll(condition)
      return data
    }

    @Model
    async queryData(condition) {
      const data = await (this as any).findAndCountAll(condition)
      // 处理返回格式
      const result = {
        total: data.count,
        list: data.rows
      }
      return result
    }
    /**
     * 查询巡检计划详情，单条查询
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryDetail(condition) {
      const data = await (this as any).findOne(condition)
      return data
    }
  }
  Process.query = new Query()
  return Process
}
