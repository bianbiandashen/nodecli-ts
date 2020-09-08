'use strict';

module.exports = app => {
  const {
    model
  } = app
  const schema = 'public'
  const sceneDataSchema = require('../../schema/tb_scene_config_params')(app)
  const SceneData = model.define('tb_scene_config_params', sceneDataSchema, {
    schema
  })
  const {
    Model
  } = require('../core/transactionalDeco/index')

  class Query {
    app=app
    /**
     * 场景数据查询
     * @param {object} condition 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async findBySchemaCode(condition) {
      const data = await (this as any).findAll(condition);
      return data
    }
    /**
     * 查询单个场景
     * @param {*} query 查询参数
     */
    @Model
    async queryOnePageConfig(params) {
      const data = await (this as any).findOne({
        where: { appIdentify: params.appId, page: params.page }
      })
      return data.configDetail
    }
    /**
     * 查询巡检任务处理方式
     * @param {*} query 查询参数
     */
    @Model
    async getTaskDealTypeByAppId(query) {
      const data = await (this as any).findOne({
        where: { appIdentify: query.appId, page: 'TaskDetail' }
      })
      return data.scene
    }
  }
  SceneData.query = new Query()
  return SceneData;
};
