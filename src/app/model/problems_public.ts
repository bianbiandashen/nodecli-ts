'use strict';

module.exports = app => {
  const {
    Sequelize,
    model
  } = app
  const schema = 'public'
  const capitalSchema = app.capitalize(schema)
  const problemSchema = require('../../schema/tb_problem')(app)
  const Problem = model.define('tb_problem', problemSchema, {
    schema
  })
  const {
    Model
  } = require('../core/transactionalDeco/index')
  const {
    Op
  } = Sequelize
  Problem.associate = function() {
    app.model['Problems' + capitalSchema].belongsTo(app.model['PatrolTaskItem' + capitalSchema], {
      foreignKey: 'patrolTaskItemId',
      targetKey: 'patrolTaskItemId'
    })
    app.model['Problems' + capitalSchema].belongsTo(app.model['TransactionFlow' + capitalSchema], {
      foreignKey: 'problemId',
      targetKey: 'relativeId'
    })
  }


  class Query {
    app=app
    /**
     * 添加xx
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async createData(params) {

      return await (this as any).create(params);
    }
    /**
     * 删除xx
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async deleteData(ids) {
      return await (this as any).destroy({
        where: {
          uuid: {
            [Op.or]: ids
          }
        }
      })
    }
    /**
     * 更新状态
     * @param {object} { params, fields } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async updateData(params, options) {
      return await (this as any).update(params, options);
    }
    /**
     * 查询xx分页列表
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryData(condition) {
      const data = await (this as any).findAndCountAll(condition);
      // 处理返回格式
      const result = {
        total: data.count,
        list: data.rows
      }
      return result;
    }
  }
  Problem.query = new Query()
  return Problem;
};
