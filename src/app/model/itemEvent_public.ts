'use strict';

module.exports = app => {
  const {
    model
  } = app
  const schema = 'public'
  const itemEventSchema = require('../../schema/tb_item_event')(app)
  const ItemEvent = model.define('tb_item_event', itemEventSchema, {
    schema
  })
  const {
    Model
  } = require('../core/transactionalDeco/index')
  class Query {
    app=app
    /**
     * 查询巡检方法
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async findModel(params) {
      const data = await (this as any).findAndCountAll(params);
      return data
    }
    @Model
    async queryManner(params) {
      const res = await (this as any).query(`
        select distinct a.item_id,a.manner_id,b.ai_type,b.m_name from ` +
        schema + `.tb_item_event a
        left join ` + schema + `.tb_inspection_manner b
        on(a.manner_id = b.m_id)
        where
        a.item_id = $itemId
        and b.ai_type != ''
        and a.is_delete=0
        and b.is_delete=0 
      `, {
        bind: {
          itemId: params.itemId
        }
      })
      return this.app.toHumpJson(res[0])
    }
  }
  ItemEvent.query = new Query()
  return ItemEvent;
};
