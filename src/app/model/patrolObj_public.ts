'use strict'

module.exports = app => {
  const { Sequelize, model } = app
  const schema = 'public'
  const capitalSchema = app.capitalize(schema)
  const patrolObjSchema = require('../../schema/tb_patrol_obj')(app)
  const PatrolObj = model.define('tb_patrol_obj', patrolObjSchema, { schema })
  // const patrolPoint = Sequelize.import('./patrolPoint');

  const { Model } = require('../core/transactionalDeco/index')
  const { Op } = Sequelize

  PatrolObj.associate = function () {
    app.model['PatrolObj' + capitalSchema].belongsTo(app.model['PatrolObjType' + capitalSchema], {
      foreignKey: 'objTypeId',
      targetKey: 'objTypeId',
      as: 'patrolObjType'
    })
    // app.model['PatrolObj' + capitalSchema].belongsTo(app.model['PatrolObjRel' + capitalSchema], {
    //   foreignKey: 'patrolObjId',
    //   targetKey: 'patrolObjId',
    //   as: 'patrolObjRel'
    // })
    app.model['PatrolObj' + capitalSchema].hasMany(app.model['PatrolObjRel' + capitalSchema], {
      foreignKey: 'patrolObjId',
      targetKey: 'patrolObjId',
      as: 'patrolObjRelItem'
    })
    app.model['PatrolObj' + capitalSchema].belongsTo(app.model['Item' + capitalSchema], {
      foreignKey: 'objTypeId',
      targetKey: 'objTypeId',
      as: 'itemPath'
    })
    app.model['PatrolObj' + capitalSchema].hasMany(app.model['PatrolPoint' + capitalSchema], {
      foreignKey: 'patrolObjId',
      targetKey: 'patrolObjId',
      as: 'patrolPoint'
    })
    app.model['PatrolObj' + capitalSchema].hasMany(app.model['PunchResult' + capitalSchema], {
      foreignKey: 'patrolObjId',
      targetKey: 'patrolObjId',
      as: 'punchList'
    })
  }
  class Query {
    
    app=app
    @Model
    async deletePlanModel (params, type) {
      const queryObj = `
      delete from ${type}.tb_relation_obj_plan where patrol_obj_id = $objId
      `
      const queryPlan = `
        SELECT patrol_obj_id as patrolobjid FROM ${type}.tb_patrol_obj WHERE model_data_id = $id AND IS_DELETE = '0'
      `
      const resPlan = await (this as any).query(
        queryPlan, {
          bind: {
            id: params,
            type
          }
        })
      const planList = this.app.toHumpJson(resPlan[0])
      if (planList.length > 0) {
        for (const obj of planList) {
          await (this as any).query(
            queryObj, {
              bind: {
                objId: obj.patrolobjid,
                type
              }
            })
        }
      }
      return this.app.toHumpJson()
    }

    // 区域下的任务(晓剑再删我代码,就要请吃饭)
    @Model
    async queryTaskIdByObjTypeAnalysisService (params) {
      const {
        regionIdPath, patrolObjTypeId, startTime, endTime, type
      } = params
      // 查询符合的巡检对象
      const patrolObjCondition:any = {
        where: { isDelete: '0' },
        attributes: [ 'patrolObjId', 'patrolObjName' ],
        include: [
          {
            model: app.model['PatrolObjRel' + capitalSchema],
            attributes: [ 'patrolObjRelId', 'status', 'createTime', 'patrolTaskId' ],
            as: 'patrolObjRelItem',
            where: { createTime: { [Op.between]: [ parseInt(startTime), parseInt(endTime) ] } }
          }
        ]
      }
      if (regionIdPath) {
        if (type) {
          patrolObjCondition.where.regionPath = { [Op.like]: `%${regionIdPath}%` }
        } else {
          patrolObjCondition.where.regionPath = regionIdPath
        }
      }
      if (patrolObjTypeId) {
        patrolObjCondition.where.objTypeId = patrolObjTypeId
      }
      const data = await (this as any).findAll(patrolObjCondition)
      return data
    }


    @Model
    async deleteByRegionModel (params, type) {
      if (params) {
        params = `%${params}%`
      }
      const queryObj = `
      delete from ${type}.tb_relation_obj_plan where patrol_obj_id = $objId
      `
      const queryPlan = `
        SELECT patrol_obj_id as patrolobjid FROM ${type}.tb_patrol_obj WHERE region_path like $reginId
      `
      const query = `
        UPDATE ${type}.tb_patrol_obj SET is_delete = $delete WHERE region_path like $reginId AND IS_DELETE = '0'
      `
      const resPlan = await (this as any).query(
        queryPlan, {
          bind: {
            reginId: params,
            type
          }
        })
      const planList = this.app.toHumpJson(resPlan[0])
      if (planList.length > 0) {
        for (const obj of planList) {
          await (this as any).query(
            queryObj, {
              bind: {
                objId: obj.patrolobjid,
                type
              }
            })
        }
      }
      const res = await (this as any).query(
        query, {
          bind: {
            delete: '-1',
            reginId: params,
            type
          }
        })
      return this.app.toHumpJson(res[0])
    }
    @Model
    async updateModel (params, type, name) {
      const query = `
        UPDATE ${type}.tb_patrol_obj SET patrol_obj_name = $name WHERE model_data_id = $modeldataid AND IS_DELETE = '0'
      `
      const res = await (this as any).query(
        query, {
          bind: {
            name,
            modeldataid: params,
            type
          }
        })
      return this.app.toHumpJson(res[0])
    }
    @Model
    async deleteModel (params, type) {
      const query = `
        UPDATE ${type}.tb_patrol_obj SET is_delete = $delete WHERE model_data_id = $modeldataid AND IS_DELETE = '0'
      `
      const res = await (this as any).query(
        query, {
          bind: {
            delete: '-1',
            modeldataid: params,
            type
          }
        })
      return this.app.toHumpJson(res[0])
    }
    @Model
    async pdmsMqModel () {
      const query = `
        SELECT identify FROM public.tb_bussiness WHERE IS_DELETE >=0
      `
      const res = await (this as any).query(
        query, { bind: {} })
      return this.app.toHumpJson(res[0])
    }
    @Model
    async pdmsMqObjTypeModel (params) {
      let result = []
      for (const obj of params) {
        const query = `
          SELECT manual_sync_tag as manualsynctag, obj_type_id as objTypeId, rm_code as rmCode, obj_unicode_column as objUnicodeColumn, obj_name_column as objNameColumn,rm_column_name as rmcolumnname, rm_column_value as rmcolumnvalue FROM ` + obj + `.tb_object_type WHERE IS_DELETE >=0
        `
        const res = await (this as any).query(
          query, { bind: { obj } })
        result = result.concat(this.app.toHumpJson(res[0]))
      }
      return result
    }
    @Model
    async aitypeModel (params) {
      const { mannerId } = params
      const query = `
      SELECT ai_type as aitype, m_name as mannerName,m_type as mtype FROM ` + schema + `.tb_inspection_manner WHERE m_id = $mannerId AND IS_DELETE >=0
      `
      const res = await (this as any).query(
        query, {
          bind: {
            schema,
            mannerId
          }
        })
      return this.app.toHumpJson(res[0])
    }

    // wad 获取对象类型名称
    async queryMapPatrolObjIdGetObjTypeName (patrolObjIds) {
      const condition = {
        where: {
          patrolObjId: { [Op.or]: patrolObjIds },
          isDelete: '0'
        },
        include: {
          model: app.model['PatrolObjType' + capitalSchema],
          as: 'patrolObjType'
        }
      }
      return await (this as any).findAll(condition)
    }

    // 区域下的巡检项
    @Model
    async queryTaskItemIdByObjTypeAnalysisService (params) {
      const {
        regionIdPath, patrolObjTypeId, startTime, endTime, type
      } = params
      // 查询符合的巡检对象
      const patrolObjCondition:any = {
        where: { isDelete: '0' },
        attributes: [ 'patrolObjId', 'patrolObjName' ],
        include: [
          {
            model: app.model['PatrolObjRel' + capitalSchema],
            attributes: [ 'patrolObjRelId', 'status', 'createTime' ],
            as: 'patrolObjRelItem',
            where: { createTime: { [Op.between]: [ parseInt(startTime), parseInt(endTime) ] } },
            include: [
              {
                model: app.model['PatrolTaskItem' + capitalSchema],
                attributes: [ 'patrolTaskItemId', 'itemScore', 'patrolTaskId' ],
                as: 'patrolTaskItem',
                where: {
                  createTime: { [Op.between]: [ parseInt(startTime), parseInt(endTime) ] },
                  isLeaf: 1
                }
              }
            ]
          }
        ]
      }
      if (regionIdPath) {
        if (type) {
          patrolObjCondition.where.regionPath = { [Op.like]: `%${regionIdPath}%` }
        } else {
          patrolObjCondition.where.regionPath = regionIdPath
        }
      }
      if (patrolObjTypeId) {
        patrolObjCondition.where.objTypeId = patrolObjTypeId
      }
      const data = await (this as any).findAll(patrolObjCondition)
      return data
    }
    @Model
    async queryTaskItemIdAnalysisService (params) {
      const {
        regionId, startTime, endTime, taskId
      } = params
      // 查询符合的巡检对象
      const patrolObjCondition:any = {
        where: { isDelete: '0' },
        attributes: [ 'patrolObjId' ],
        include: [
          {
            model: app.model['PatrolObjRel' + capitalSchema],
            attributes: [ 'patrolObjRelId', 'status', 'createTime' ],
            as: 'patrolObjRelItem',
            where: { createTime: { [Op.between]: [ parseInt(startTime), parseInt(endTime) ] } },
            include: [
              {
                model: app.model['PatrolTaskItem' + capitalSchema],
                attributes: [ 'patrolTaskItemId', 'patrolTaskId' ],
                as: 'patrolTaskItem',
                where: {
                  createTime: { [Op.between]: [ parseInt(startTime), parseInt(endTime) ] },
                  isLeaf: 1
                }
              }
            ]
          }
        ]
      }
      if (taskId) {
        patrolObjCondition.include[0].include[0].where.patrolTaskId = { [Op.in]: taskId }
      }
      if (regionId) {
        patrolObjCondition.where.regionPath = { [Op.like]: `%${regionId}%` }
      }
      const data = await (this as any).findAll(patrolObjCondition)
      return data
    }
    // 边
    @Model
    async queryManyDataByTaskApiObjIdAndName (objName, regionId, objId) {
      const objCondition:any = {
        where: {},
        attributes: [],
        include: {
          model: app.model['PatrolObjRel' + capitalSchema],
          as: 'patrolObjRelItem',
          attributes: [ 'patrolObjRelId' ]
        },
        raw: true
      }
      if (objName && regionId) {
        objCondition.where = {
          [Op.and]: [
            { patrolObjName: { [Op.like]: `%${objName}%` } },
            { regionPath: { [Op.like]: `%${regionId}%` } }
          ]
        }
      } else {
        if (objName) objCondition.where.patrolObjName = { [Op.like]: `%${objName}%` }
        if (regionId) objCondition.where.regionPath = { [Op.like]: `%${regionId}%` }
      }
      if (objId) objCondition.where.patrolObjId = objId
      const data = await (this as any).findAll(objCondition)
      return data
    }

    /**
     * 通过巡检对象id查询巡检对象详情
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryDataById (params) {
      console.log('params++++++++++++++++++++++++++++++objCondition', params)
      const data = await (this as any).findOne(params)
      return data
    }

    /**
     * 通过巡检对象id查询巡检对象详情
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async objectsSingleModel (params) {
      const condition = {
        where: {
          patrolObjId: params.id,
          isDelete: '0'
        },
        include: {
          model: app.model['PatrolObjType' + capitalSchema], // 关联查询
          attributes: [ 'objTypeName' ],
          as: 'patrolObjType' // 别名
        }
      }
      const data = await (this as any).findOne(condition)
      return data
    }
    /**
     * 任晓剑
     * 查询区域下巡检对象
     * @param {object} { params } - 条件 区域ID，包含下级，巡检对象类型集合
     * @return {object|null} - 查找结果
     */
    @Model
    async queryAllDataByPatrolPlan (params) {
      const {
        regionPath, lower, objTypeIds, executeType
      } = params
      const condition:any = {
        where: { isDelete: '0' },
        attributes: [
          'patrolObjId',
          'patrolObjName',
          'patrolObjRegion',
          'regionPath',
          'objTypeId',
          [ Sequelize.col('patrolObjType.obj_type_name'), 'objTypeName' ],
          'updateTime',
          'createTime'
        ],
        include: [
          {
            model: app.model['PatrolObjType' + capitalSchema], // 关联查询
            attributes: [],
            as: 'patrolObjType' // 别名
          }
        ],
        order: [[ 'createTime', 'DESC' ]]
      }
      if (executeType) {
        const executeTypeArr = executeType.split(',').map(item => Number(item))
        // 任务执行方式中，包含线上方式的时候，计划查询巡检对象过滤掉未关联检测点的对象
        if (!executeTypeArr.includes(2)) {
          condition.include.push({
            model: app.model['PatrolPoint' + capitalSchema],
            attributes: [
            // 'patrolMethodId' // 这里属性填空值，下面关联的数据是不需要的，返回的数据中不会显示
            ],
            where: { isDelete: 0 },
            required: true,
            as: 'patrolPoint',
            include: [{
              model: app.model['InspectionManner' + capitalSchema],
              attributes: [ 'mName', 'mType' ],
              where: {
                isDelete: 0,
                mType: { [Op.or]: executeTypeArr } // 巡检对象必须含有检测点符合：第一步选择的任务执行方式与检查点的巡检方法的mType保持一致
              },
              required: true,
              as: 'patrolMethod'
            }]
          })
        }
      }
      if (regionPath) condition.where.regionPath = params.regionPath
      // 包含下级区域
      if (lower === 1) {
        condition.where.regionPath = { [Op.like]: `%${params.regionPath}%` }
      }
      if (objTypeIds) {
        condition.where.objTypeId = { [Op.or]: objTypeIds }
      }
      const data = await (this as any).findAll(condition)
      return data
    }
    /**
     * 通过巡检对象id查询巡检对象详情
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryDataModelTwo (params, pointListIds = []) {
      const pagination = params.page || {}
      const { pageNo, pageSize } = pagination
      const where:any = { isDelete: '0' }
      // 过滤巡检点
      if (pointListIds.length > 0 && params.patrolObjCheckpoint) {
        where.patrolObjId = { [Op.notIn]: pointListIds }
      }
      // 对象id
      if (params.patrolObjId) {
        where.patrolObjId = params.patrolObjId
      }
      // NFC
      if (params.patrolObjNfc) {
        where.patrolObjNfc = params.patrolObjNfc
      }
      // 二维码
      if (params.patrolObjCode) {
        const codeArray = params.patrolObjCode.split('=') || []
        if (codeArray.length > 1) {
          where[codeArray[0]] = codeArray[1]
        } else {
          where.patrolObjCode = params.patrolObjCode
        }
      }
      if (params.regionPath) {
        where.regionPath = params.regionPath
      }
      // 包含下级区域
      if (params.lower === '0') {
        where.regionPath = { [Op.like]: `%${params.regionPath}%` }
      }
      // app权限
      if (params.regionIdLimit) {
        where.regionPath = { [Op.like]: { [Op.any]: params.regionIdLimit } }
      }
      // 巡检对象名称
      if (params.patrolObjName) {
        where.patrolObjName = { [Op.like]: `%${params.patrolObjName}%` }
      }
      // 巡检对象类型
      if (params.objTypeId) {
        where.objTypeId = params.objTypeId
      }
      // modelDataId
      if (params.modelDataId) {
        where.modelDataId = params.modelDataId
      }
      // 模糊分页查询
      const condition:any = {
        where,
        include: [
          {
            model: app.model['PatrolObjType' + capitalSchema], // 关联查询
            attributes: [ 'objTypeName' ],
            as: 'patrolObjType' // 别名
          },
          {
            model: app.model['PatrolPoint' + capitalSchema], // 关联查询
            attributes: [ 'patrolPointId' ],
            as: 'patrolPoint', // 别名
            where: { isDelete: '0' },
            required: false
          }
        ],
        raw: false,
        distinct: true,
        order: [[ 'createTime', 'DESC' ]]
      }
      if (pageNo && pageSize) {
        condition.limit = pageSize
        condition.offset = (pageNo - 1) * pageSize
      }
      const data = await (this as any).findAndCountAll(condition)
      // 处理返回格式
      const result = {
        total: data.count,
        list: data.rows
      }
      return result
    }

    /**
     * 通过巡检对象id查询巡检对象详情
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryDataByQuestionModel (params) {
      const where:any = { isDelete: '0' }
      if (params.regionIdLimit) {
        where.regionPath = { [Op.like]: { [Op.any]: params.regionIdLimit } }
      }
      // 模糊分页查询
      const condition = { where }
      const data = await (this as any).findAll(condition)
      return data
    }

    /**
     * 自定义添加巡检对象
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async createData (params = {}) {
      return await (this as any).create(params)
    }
    /**
     * 批量新增巡检对象
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async createListData (params = []) {
      params = params.map(res => {
        const obj:any = {}
        obj.regionPath = res.regionPath
        obj.patrolObjRegion = res.region_id
        obj.modelDataId = res.modelDataId
        obj.objTypeId = res.objTypeId
        obj.patrolObjName = res.patrolObjName
        obj.isDelete = '0'
        obj.isCustomDevice = '1'
        obj.modelIdentify = res.rmCode
        return obj
      })
      return await (this as any).bulkCreate(params)
    }
    /**
     * 巡检对象查询分页列表
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryData (condition) {
      const data = await (this as any).findAndCountAll(condition)
      // 处理返回格式
      const result = {
        total: data.count,
        list: data.rows
      }
      return result
    }

    /**
     * 分页获取巡检对象
     * @param {object} { params } - 条件
     * @return {object|null} - 列表
     */

    @Model
    async queryList (condition) {
      const data = await (this as any).findAndCountAll(condition)
      const result = {
        total: data.count,
        list: data.rows
      }
      return result
    }

    /**
     * 删除巡检对象
     * @param {object} { params } - 条件
     * @return {object|null} - 删除结果
     */

    @Model
    async deleteData (params) {
      return await (this as any).update(
        { isDelete: '-1' },
        { where: { patrolObjId: { [Op.or]: params.list } } }
      )
    }

    /**
     * 编辑巡查对象接口
     * @param {object} { params } - 条件
     * @return {object|null} - 删除结果
     */

    @Model
    async editPatrolObj (params = {}, where = {}) {
      return await (this as any).update(params, { where })
    }

    /**
     * 删除xx
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async delete2Data (ids) {
      return await (this as any).destroy({ where: { uuid: { [Op.or]: ids } } })
    }
    /**
     * 更新状态
     * @param {object} { params, fields } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async updateData (params) {
      return await (this as any).update(params, { where: { uuid: { [Op.or]: params.uuid } } })
    }
    /**
     * 查询巡检对象的多条
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryManyDataByTaskApiAndObjId (objId, regionId) {
      const objCondition:any = {
        where: {},
        attributes: [],
        include: {
          model: app.model['PatrolObjRel' + capitalSchema],
          as: 'patrolObjRelItem',
          // 王伟58加了一个 patrolTaskId
          attributes: [ 'patrolObjRelId', 'patrolTaskId' ]
        },
        raw: true
      }
      if (objId) objCondition.where.patrolObjId = objId
      if (regionId) objCondition.where.regionPath = { [Op.like]: `%${regionId}%` }
      const data = await (this as any).findAll(objCondition)
      return data
    }
    /**
     * 查询巡检对象的多条
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryManyDataByTaskApi (params) {
      const { regionId, objName, objId } = params
      const condition:any = {
        where: { isDelete: '0' },
        attributes: [],
        include: {
          model: app.model['PatrolObjRel' + capitalSchema],
          as: 'patrolObjRelItem',
          attributes: [ 'patrolObjRelId' ]
        }
      }
      if (objName && regionId) {
        condition.where = {
          [Op.or]: [
            { patrolObjName: { [Op.like]: `%${objName}%` } },
            { regionPath: { [Op.like]: `%${regionId}%` } }
          ]
        }
      } else {
        if (objName) condition.where.patrolObjName = { [Op.like]: `%${objName}%` }
        if (regionId) condition.where.regionPath = { [Op.like]: `%${regionId}%` }
      }
      if (objId) condition.where.modelDataId = objId
      const data = await (this as any).findAll(condition)
      const returnData = []
      for (const elem of data.values()) {
        returnData.push(...elem.patrolObjRelItem)
      }
      return returnData
    }

    /**
     * 查询巡检对象的多条
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryManyData (condition) {
      const data = await (this as any).findAll(condition)
      return data
    }

    @Model
    async queryManyDataByPlan (params) {
      const condition = {
        where: { patrolObjId: { [Op.or]: params } },
        attributes: [
          'patrolObjId',
          'patrolObjName',
          'patrolObjRegion',
          'regionPath',
          'objTypeId',
          [ Sequelize.col('patrolObjType.obj_type_name'), 'objTypeName' ],
          'updateTime',
          'createTime'
        ],
        include: [
          {
            model: app.model['PatrolObjType' + capitalSchema], // 关联查询
            attributes: [],
            as: 'patrolObjType' // 别名
          }
        ],
        order: [[ 'createTime', 'DESC' ]]
      }
      const data = await (this as any).findAll(condition)
      return data
    }

    @Model
    async findAndCountAllData (condition) {
      // console.log('++++', condition)
      const data = await (this as any).findAndCountAll(condition)
      // 处理返回格式
      const result = {
        total: data.count,
        list: data.rows
      }
      return result
    }
    @Model
    async queryOne (condition) {
      const data = await (this as any).findOne(condition)
      return data
    }

    // 下面是数据隔离后的方法

    /**
     * 查询巡检对象的多条
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryManyDataByAnalysisServiceGetProblemRateByObj (params) {
      const { patrolObjId } = params
      const condition = {
        where: { patrolObjId: { [Op.or]: patrolObjId.split(',') } },
        attributes: [],
        include: [
          {
            model: app.model['PatrolObjRel' + capitalSchema],
            attributes: [],
            as: 'patrolObjRel',
            include: [
              {
                model: app.model['PatrolTaskItem' + capitalSchema],
                attributes: [ 'patrolTaskItemId' ],
                as: 'patrolTaskItem'
              }
            ]
          }
        ],
        raw: true
      }
      const data = await (this as any).findAll(condition)
      return data
    }

    /**
     * 查询巡检对象的多条
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryManyDataByAnalysisServiceResultRankService (params) {
      const {
        regionId
      } = params
      // 查询符合的巡检对象
      const patrolObjCondition:any = {
        where: {},
        attributes: [ 'patrolObjId' ],
        include: [
          {
            model: app.model['PatrolObjRel' + capitalSchema],
            attributes: [],
            as: 'patrolObjRelItem',
            include: [
              {
                model: app.model['PatrolTaskItem' + capitalSchema],
                attributes: [ 'patrolTaskItemId', 'path' ],
                as: 'patrolTaskItem'
              }
            ]
          }
        ],
        raw: true
      }
      if (regionId) {
        patrolObjCondition.where.patrolObjRegion = regionId
      }
      const data = await (this as any).findAll(patrolObjCondition)
      return data
    }

    /**
     * 查询巡检对象的多条
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryManyDataByAnalysisServiceDeductionListService (params) {
      const {
        regionId
      } = params
      // 查询符合的巡检对象
      const patrolObjCondition:any = {
        where: {},
        attributes: [],
        include: [
          {
            model: app.model['PatrolObjRel' + capitalSchema],
            attributes: [],
            as: 'patrolObjRel',
            include: [
              {
                model: app.model['PatrolTaskItem' + capitalSchema],
                attributes: [ 'patrolTaskItemId', 'patrolItemId', 'itemName', 'path' ],
                as: 'patrolTaskItem'
              }
            ]
          }
        ],
        raw: true
      }
      if (regionId) {
        patrolObjCondition.where.patrolObjRegion = regionId
      }
      const data = await (this as any).findAll(patrolObjCondition)
      return data
    }

    /**
     * 查询变电站下对象的问题列表
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryDataByIdByQuestionServiceSubstationGetListService (params) {
      console.log('helman', params)
      const { patrolObjId, pageNo, pageSize } = params
      if (!patrolObjId || !pageNo || !pageSize) {
        let error : any = new Error(this.app.ctx.__('model.missingParameters'))
        error.status = 425
        throw error
      }
      const condition = {
        where: { patrolObjId },
        include: [
          {
            model: app.model['PatrolObjRel' + capitalSchema],
            as: 'patrolObjRelItem',
            include: [
              {
                model: app.model['PatrolTaskItem' + capitalSchema],
                as: 'patrolTaskItem',
                include: {
                  model: app.model['TaskExecSchema' + capitalSchema],
                  as: 'taskExecList'
                }
              }
            ]
          }
        ],
        raw: false // 使用hasMany的时候需要聚合一下数据
      }
      const data = await (this as any).findOne(condition)
      return data
    }

    /**
     * 查询社区下图片巡查下对象的问题列表
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryDataByIdByQuestionServiceImgInquireGetListService (params) {
      console.log('helman', params)
      const { patrolObjRegion } = params
      const condition = {
        where: { patrolObjRegion },
        attributes: [ 'patrolObjId' ],
        include: [
          {
            model: app.model['PatrolObjRel' + capitalSchema],
            as: 'patrolObjRelItem',
            attributes: [ 'patrolObjRelId' ],
            include: {
              model: app.model['PatrolTaskItem' + capitalSchema],
              as: 'patrolTaskItem',
              attributes: [ 'patrolTaskItemId' ]
            }
          }
        ],
        raw: false
      }
      const data = await (this as any).findAll(condition)
      return data
    }
  }
  PatrolObj.query = new Query()
  return PatrolObj
}
