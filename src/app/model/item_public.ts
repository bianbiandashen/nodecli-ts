'use strict';

module.exports = app => {
  const {
    model
  } = app
  const schema = 'public'
  const capitalSchema = app.capitalize(schema)
  const itemSchema = require('../../schema/tb_item')(app)
  const Item = model.define('tb_item', itemSchema, {
    schema
  })
  const {
    Model
  } = require('../core/transactionalDeco/index')
  Item.associate = function() {
    app.model['Item' + capitalSchema].hasMany(app.model['PatrolPoint' + capitalSchema], {
      foreignKey: 'patrolItemId',
      targetKey: 'itemId',
      as: 'patrolPoint'
    })
  }
  class Query {
    app =app
    /**
     * 巡检项查询
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async itemPointModel(params, patrolObjId) {
      const condition = {
        where: params.where,
        include: [
          {
            model: app.model['PatrolPoint' + capitalSchema], // 关联查询
            attributes: ['patrolMethodId'],
            as: 'patrolPoint', // 别名
            required: false,
            where: {
              isDelete: 0,
              patrolObjId
            }
          }
        ]
      }
      const data = await (this as any).findAndCountAll(condition);
      return data
    }
    /**
     * 巡检项查询
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async itemModel(params) {
      const data = await (this as any).findAndCountAll(params);
      return data
    }
    /**
     * 查询巡检计划详情，单条查询
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryDetail(condition) {
      const data = await (this as any).findOne(condition);
      return data
    }

    /**
     * 查询筛选后所有的巡检项
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryManyAll(condition) {
      const data = await (this as any).findAll(condition);
      return data
    }

    /**
     * 查询筛选后所有的巡检项
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryOneById(condition) {
      const data = await (this as any).findOne(condition);
      return data
    }
  }
  Item.query = new Query()
  return Item;
};
