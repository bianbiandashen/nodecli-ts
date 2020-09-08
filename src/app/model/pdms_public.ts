/*
 * @Author: renxiaojian
 * @Date: 2019-12-11 11:17:24
 * @Last Modified by: xionghaima
 * @Last Modified time: 2020-02-28 11:31:29
 */
'use strict';

module.exports = app => {
  const {
    Sequelize,
    model
  } = app
  const schema = 'public'
  const PdmsRegionSchema = require('../../schema/tb_pdms_region')(app)
  const PdmsRegion = model.define('tb_pdms_region', PdmsRegionSchema, {
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

    @Model
    async getRegionIdsFromFirstRegion(regionId) {
      const result = await (this as any).query(`
      with recursive cte as
      (select a.* from ` + schema + `.tb_pdms_region a
      where
      a.region_id = $regionId
      union all select k.* from ` + schema + `.tb_pdms_region k , cte c where c.region_id = k.parent_region_id)select * from cte 
      `, {
        bind: {
          regionId
        }
      })
      return this.app.toHumpJson(result[0])

    }
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
     * 查询树组织路径
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryTreePathData(condition) {
      const data = await PdmsRegion.findAndCountAll(condition);
      const result = {
        total: data.count,
        list: data.rows
      }
      return result;
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
     * 通过巡检对象id查询巡检对象详情
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryDataById(params) {
      const data = await (this as any).findOne(params);
      return data
    }
  }
  PdmsRegion.query = new Query()
  return PdmsRegion;
};
