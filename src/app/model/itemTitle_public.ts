'use strict';

module.exports = app => {
  const {
    model
  } = app
  const schema = 'public'
  const itemTitleSchema = require('../../schema/tb_item_title')(app)
  const ItemTitle = model.define('tb_item_title', itemTitleSchema, {
    schema
  })
  const {
    Model
  } = require('../core/transactionalDeco/index')
  class Query {
    app=app
    /**
     * 巡检项标题查询
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async itemTitleModel(params) {
      const data = await (this as any).findAndCountAll(params);
      return data
    }
  }
  ItemTitle.query = new Query()
  return ItemTitle;
};
