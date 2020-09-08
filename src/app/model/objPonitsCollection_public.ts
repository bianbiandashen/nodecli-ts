'use strict';

module.exports = app => {
  const {
    Sequelize,
    model
  } = app
  const schema = 'public'
  const objPonitsCollectionSchema = require('../../schema/tb_obj_ponits_collection')(app)
  const ObjPonitsCollection = model.define('tb_obj_ponits_collection', objPonitsCollectionSchema, {
    schema
  })
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
      return await (this as any).create(...params);

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
          uuid: {
            [Op.or]: params.uuid
          }
        }
      });
    }
    /**
     * 查询xx分页列表
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async queryData(params) {
      const data = await (this as any).findAll(params);
      // 处理返回格式
      const result = {
        total: data.count,
        list: data.rows
      }
      return result;
    }
  }
  ObjPonitsCollection.query = new Query()
  return ObjPonitsCollection;
};
