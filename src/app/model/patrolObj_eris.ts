module.exports = app => {
  const {  model } = app
  const schema = 'eris'
<<<<<<< HEAD
  const patrolObjSchema = require('../../schema/tb_patrol_obj')(app)
  const PatrolObj = model.define('tb_patrol_obj', patrolObjSchema, { schema })
=======
  // const capitalSchema = app.capitalize(schema)
  const patrolObjSchema = require('../../schema/tb_patrol_obj')(app)
  const PatrolObj = model.define('tb_patrol_obj', patrolObjSchema, { schema })

  // const patrolPoint = Sequelize.import('./patrolPoint.js');

>>>>>>> 2db8c7dc19290909326dc3ef26c4b686c5727c1f
  const { Model } = require('../core/transactionalDeco/index')
  class Query {
    app = app
     /**
     * 巡检对象查询分页列表
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */
    // @inject('Model')
    @Model
    async queryData (condition) {
  
      const data = await (this as any).findAndCountAll(condition)
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