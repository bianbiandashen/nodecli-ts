'use strict';

module.exports = app => {
  const {
    Sequelize,
    model
  } = app
  const schema = 'public'
  const capitalSchema = app.capitalize(schema)
  const pauseRecordsSchema = require('../../schema/tb_pause_records')(app)
  const PauseRecords = model.define('tb_pause_records', pauseRecordsSchema, {
    schema
  })
  PauseRecords.associate = function() {
    app.model['PauseRecords' + capitalSchema].belongsTo(app.model['Task' + capitalSchema], {
      foreignKey: 'patrolTaskId',
      targetKey: 'patrolTaskId'
    })
  }

  const {
    Model
  } = require('../core/transactionalDeco/index')
  const {
    Op
  } = Sequelize


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
    async updateData(params) {
      return await (this as any).update(params, {
        where: {
          pauseRecordId: params.pauseRecordId

        }
      });
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
  PauseRecords.query = new Query()
  return PauseRecords;
};
