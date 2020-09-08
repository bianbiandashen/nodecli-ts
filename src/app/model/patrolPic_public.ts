'use strict'

module.exports = app => {
  const {
    model } = app
  const schema = 'public'
  const patrolPicSchema = require('../../schema/tb_patrol_pic')(app)
  const PatrolPic = model.define('tb_patrol_pic', patrolPicSchema, { schema })
  const { Model } = require('../core/transactionalDeco/index')
  class Query {
    app=app
    @Model
    async createData (params) {
      // createDatacreateDatacreateData
      console.log('createDatacreateData', params)
      return await (this as any).create(params)
    }
    @Model
    async getPicById (picId) {
      const res = await (this as any).query(`
        SELECT * FROM ` + schema + `.TB_PATROL_PIC WHERE PIC_ID = $picId
      `, { bind: { picId } })
      return this.app.toHumpJson(res[0])
    }
    @Model
    async getPicListByIds (picIdArr) {
      const res = await (this as any).query(`
        SELECT * FROM ` + schema + `.TB_PATROL_PIC WHERE PIC_ID in (:picIdArr)
      `, { replacements: { picIdArr } })
      return this.app.toHumpJson(res[0])
    }
    /**
     * 问题图片
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryManyData (condition) {
      const data = await (this as any).findAll(condition)
      return data
    }

  }
  PatrolPic.query = new Query()
  return PatrolPic
}
