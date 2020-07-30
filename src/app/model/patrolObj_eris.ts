module.exports = app => {
  const {  model } = app
  const schema = 'eris'
  // const capitalSchema = app.capitalize(schema)
  const patrolObjSchema = require('../schema/tb_patrol_obj.ts')(app)
  const PatrolObj = model.define('tb_patrol_obj', patrolObjSchema, { schema })
  // const patrolPoint = Sequelize.import('./patrolPoint.js');

  const { Model } = require('../core/transactionalDeco/index')
  // const { Op } = Sequelize
  class Query {
     /**
     * 巡检对象查询分页列表
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */
    // @inject('Model')
    @Model
    async queryData (condition) {
      const data = await this.findAndCountAll(condition)
      // 处理返回格式
      const result = {
        total: data.count,
        list: data.rows
      }
      return result
    }
  }
  PatrolObj.query = new Query()
  return PatrolObj
}
