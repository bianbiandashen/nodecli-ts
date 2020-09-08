'use strict'

module.exports = app => {
  const {
    model
  } = app
  const schema = 'public'
  const patrolTaskUserSchema = require('../../schema/tb_patrol_task_user')(app)
  const patrolTaskUser = model.define('tb_patrol_task_user', patrolTaskUserSchema, {
    schema
  })
  const {
    Model
  } = require('../core/transactionalDeco/index')

  class Query {
    app=app
    /**
     * 查询
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async findOneData(params) {
      const data = await (this as any).findOne(params);
      return data
    }
  }
  patrolTaskUser.query = new Query()
  return patrolTaskUser
}
