'use strict'

module.exports = app => {
  const { model } = app
  const schema = 'public'
  const patrolTaskPersonSchema = require('../../schema/tb_patrol_task_person')(app)
  const patrolTaskPerson = model.define('tb_patrol_task_person', patrolTaskPersonSchema, {
    schema
  })
  const { Model } = require('../core/transactionalDeco/index')
  class Query {
    app=app
    @Model
    async queryTaskPersonByUserId(userId, process_type) {
      const replacementsParams = {
        process_type: process_type.split(','),
        userId,
        nowDate: this.app.dateFormatter(new Date(), 'yyyy-MM-dd hh:mm:ss')
      }
      const result = await (this as any).query(
        'select distinct a.patrol_task_id from ' +
          schema +
          `.tb_patrol_task_person A , 
        (
        (
        select a.submitter_user_id as valid_agent from ` +
          schema +
          `.tb_agent_person a
        where
        a.agent_user_id = :userId
        and is_delete = 0
        and recovery_status = 0
        and start_time < :nowDate
        and end_time > :nowDate
        )
        union (
          select :userId as valid_agent
        ))
        B 
        where 
        (
        ',' || A.current_person || ',' like '%,' ||b.valid_agent||',%'
        )
        and a.process_type in (:process_type) `,
        {
          replacements: replacementsParams
        }
      )
      return this.app.toHumpJson(result[0])
    }

    // 查询 给这个人抄送了任务结论的任务id 集合

    @Model
    async getPatrolTaskIdsByCopyPerson(userId) {
      const result = await (this as any).query(
        'select distinct e.patrol_task_id from ' +
          schema +
          '.tb_task_exec_result c, ' +
          schema +
          '.tb_patrol_task_item d, ' +
          schema +
          `.tb_patrol_task e 
        where 
        c.patrol_task_item_id = d.patrol_task_item_id
        and e.patrol_task_id = d.patrol_task_id 
        and
        (
        ',' || c.next_copy_people || ',' like '%,' ||$userId||',%'
        )`,
        {
          bind: {
            userId
          }
        }
      )
      return this.app.toHumpJson(result[0])
    }
    /**
     * 查询所有数据
     * @param {object} { regionId, status, patrolTaskName } - 条件
     * @return {object|null} - 查找结果
     */

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
     * 查询任务下所有人员
     * @param {object} { patrolTaskId } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryManyAll(condition) {
      const data = await (this as any).findAll(condition)
      // 处理返回格式
      return data
    }
    @Model
    async queryDetail(condition) {
      const data = await (this as any).findOne(condition)
      return data
    }
    // 查询巡检流程
    @Model
    async queryList(condition) {
      const data = await (this as any).findAll(condition)
      return data
    }
  }
  patrolTaskPerson.query = new Query()
  return patrolTaskPerson
}
