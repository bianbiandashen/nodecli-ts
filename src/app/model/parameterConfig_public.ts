'use strict';

module.exports = app => {
  const {
    Sequelize,
    model
  } = app
  const schema = 'public'
  const parameterConfigSchema = require('../../schema/tb_parameter_config')(app)
  const ParameterConfig = model.define('tb_parameter_config', parameterConfigSchema, {
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
     * @return {object|null} - 查找结果
     */
    @Model
    async updateData(params) {
      return await (this as any).update(params, {
        where: {
          key: params.key
        }
      });
    }
    // 单个查询
    @Model
    async queryFindOne(params) {
      return await (this as any).findOne({
        where: {
          key: params.key
        }
      });
    }
    /**
     * 查询xx分页列表
     * @return {object|null} - 查找结果
     */
    @Model
    async queryData() {
      const data = await (this as any).findAndCountAll();
      // 处理返回格式
      const result = {
        list: data.rows
      }
      return result;
    }
  }
  ParameterConfig.query = new Query()
  return ParameterConfig;
};
