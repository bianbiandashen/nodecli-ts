'use strict';

module.exports = app => {
  const {
    model
  } = app
  const schema = 'public'
  const donghuanSchema = require('../../schema/tb_patrol_point')(app)
  const Donghuan = model.define('tb_patrol_point', donghuanSchema, {
    schema
  })
  const {
    Model
  } = require('../core/transactionalDeco/index')
  class Query {
    app = app
    /**
     * 删除-动环 同步
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async sersorDelMQ(obj, type, model) {
      let query = ''
      const id = obj
      // 环境量
      if (model === 'tb_sensor_info') {
        query = `UPDATE ${type}.tb_patrol_point SET IS_DELETE = $delete WHERE extend_column_3 = $id AND IS_DELETE >= 0`
        // 传感器
      } else if (model === 'tb_transducer') {
        query = `UPDATE ${type}.tb_patrol_point SET IS_DELETE = $delete WHERE device_id = $id AND IS_DELETE >= 0`
        // 设备
      } else if (model === 'tb_pe_device') {
        query = `UPDATE ${type}.tb_patrol_point SET IS_DELETE = $delete WHERE orbital_id = $id AND IS_DELETE >= 0`
      }
      await (this as any).query(
        query, {
          bind: {
            id,
            delete: -1,
            type
          }
        });
    }
    /**
     * 更新-设备
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async updateDeviceMQ(params, type, iteratorName) {
      const { model_data_id } = params
      const { name } = iteratorName
      const query = `
        UPDATE ${type}.tb_patrol_point SET camera_name = $name WHERE extend_column_3 = $model_data_id AND IS_DELETE >= 0
      `
      const result = await (this as any).query(
        query, {
          bind: {
            name,
            model_data_id,
            type
          }
        });
      return this.app.toHumpJson(result[0])
    }
    /**
     * 更新-传感器
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async updateTransducerMQ(params, type, iteratorName) {
      const { model_data_id } = params
      const { name } = iteratorName
      const query = `
        UPDATE ${type}.tb_patrol_point SET extend_column_2 = $name WHERE extend_column_3 = $model_data_id AND IS_DELETE >= 0
      `
      const result = await (this as any).query(
        query, {
          bind: {
            name,
            model_data_id,
            type
          }
        });
      return this.app.toHumpJson(result[0])
    }
    /**
     * 更新-环境量
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async updateSensorMQ(params, type) {
      const { index_code, name, alarm_high, alarm_low, sensor_type } = params
      const query = `
        UPDATE ${type}.tb_patrol_point SET extend_column_4 = $alarm_high, extend_column_5 = $alarm_low, point_name = $name, event_type = $sensor_type WHERE extend_column_3 = $indexCode AND IS_DELETE >= 0
      `
      const result = await (this as any).query(
        query, {
          bind: {
            indexCode: index_code,
            alarm_high,
            alarm_low,
            name,
            sensor_type,
            type
          }
        });
      return this.app.toHumpJson(result[0])
    }

    /**
     * 添加
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async createData(params) {
      return await (this as any).create(params)
    }

    /**
     * 查询所有
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async findAllModel(condition) {
      const data = await (this as any).findAndCountAll(condition) || {};
      const result = {
        total: data.count,
        list: data.rows
      }
      return result;
    }

    /**
     * 更新状态
     * @param {object} { params, fields } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async updateData(params, where) {
      return await (this as any).update(params, {
        where
      });
    }
  }
  Donghuan.query = new Query()
  return Donghuan;
};
