/*
 * @Author: renxiaojian
 * @Date: 2019-12-11 11:17:24
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-03-19 10:28:07
 */
'use strict';

module.exports = app => {
  const {
    model
  } = app
  const schema = 'public'
  const PatrolItemTitleSchema = require('../../schema/tb_item_title')(app)
  const PatrolItemTitle = model.define('tb_item_title', PatrolItemTitleSchema, {
    schema
  })
  const {
    Model
  } = require('../core/transactionalDeco/index')
  class Query {
    app=app
    /**
     * 通过巡检对象类型ID查询巡检项结构
     * @param {object}
     * @return {string} - object
     */
    @Model
    async queryItemTitleManyList(condition) {
      const data = await (this as any).findAll(condition);
      return data
    }
  }
  PatrolItemTitle.query = new Query()
  return PatrolItemTitle;
};
