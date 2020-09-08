'use strict'

module.exports = app => {
  const { model} = app
  const schema = 'public'
  const agentPersonSchema = require('../../schema/tb_agent_person')(app)
  const AgentPerson = model.define('tb_agent_person', agentPersonSchema, { schema })
  const { Model } = require('../core/transactionalDeco/index')
  // PatrolObjRel.associate = function () {
  //   PatrolObjRel.belongsTo(app.model.PatrolObj, {
  //     foreignKey: 'patrolObjId',
  //     targetKey: 'patrolObjId',
  //     as: 'partrolObjItem'
  //   })
  // }
  class Query {
    app = app
    @Model
    async queryDataById2 (params) {
      const { userId } = params
      const res = await (this as any).query(`
      SELECT * FROM ` + schema + `.tb_agent_person where end_time > now()
      AND IS_DELETE = 0
      AND recovery_status = 0
      AND agent_user_id = $userId`, {
        bind: {
          userId,
          isDelete: 0,
          recoveryStatus: 0
        }
      })

      return this.app.toHumpJson(res[0])
    }


    @Model
    async queryDataById1 (params) {
      const { userId } = params
      const res = await (this as any).query(`
      SELECT * FROM ` + schema + `.tb_agent_person where end_time > now()
      AND IS_DELETE = 0
      AND recovery_status = 0
      AND submitter_user_id = $userId`, {
        bind: {
          userId,
          isDelete: 0,
          recoveryStatus: 0
        }
      })

      return this.app.toHumpJson(res[0])
    }

    /**
     * 通过巡检对象id查询巡检任务
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryDataById (params) {
      const data = await (this as any).findAndCountAll(params)
      const result = {
        total: data.count,
        list: data.rows
      }
      return result
    }

    @Model
    async queryOneById (condition) {
      const data = await (this as any).findOne(condition)
      return data
    }

    @Model
    async queryAllData (condition) {
      const data = await (this as any).findAll(condition)
      return data
    }

    @Model
    async queryDataByIdFindAll (params) {
      const data = await (this as any).findAll(params)
      return data
    }

    @Model
    async createData (params = {}) {
      return await (this as any).create(params)
    }
    /**
     * 更新状态
     * @param {object} { params, fields } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async updateData (params) {
      return await (this as any).update(params, { where: { agentPersonId: params.agentPersonId } })
    }
  }
  AgentPerson.query = new Query()
  return AgentPerson
}
