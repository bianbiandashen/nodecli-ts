'use strict'

module.exports = app => {
  const { Sequelize, model } = app
  const schema = 'public'
  const capitalSchema = app.capitalize(schema)
  const PatrolTaskPointSchema = require('../../schema/tb_patrol_task_point')(app)
  const PatrolTaskPoint = model.define('tb_patrol_task_point', PatrolTaskPointSchema, { schema })
  const { Model } = require('../core/transactionalDeco/index')

  PatrolTaskPoint.associate = function () {
    app.model['PatrolTaskPoint' + capitalSchema].belongsTo(
      app.model['TaskExecSchema' + capitalSchema],
      {
        foreignKey: 'patrolTaskPointId',
        targetKey: 'taskPointId',
        as: 'taskExecSchema'
      }
    )
    app.model['PatrolTaskPoint' + capitalSchema].belongsTo(app.model['Task' + capitalSchema], {
      foreignKey: 'patrolTaskId',
      targetKey: 'patrolTaskId',
      as: 'Task'
    })
    app.model['PatrolTaskPoint' + capitalSchema].belongsTo(
      app.model['PatrolTaskItem' + capitalSchema],
      {
        foreignKey: 'patrolTaskItemId',
        targetKey: 'patrolTaskItemId',
        as: 'TaskItem'
      }
    )
    app.model['PatrolTaskPoint' + capitalSchema].hasOne(
      app.model['TaskExecSchema' + capitalSchema],
      {
        foreignKey: 'taskPointId',
        targetKey: 'patrolTaskPointId',
        as: 'TaskExec'
      }
    )
    app.model['PatrolTaskPoint' + capitalSchema].belongsTo(
      app.model['PatrolPoint' + capitalSchema],
      {
        foreignKey: 'patrolPointId',
        targetKey: 'patrolPointId',
        as: 'PatrolPoint'
      }
    )
    app.model['PatrolTaskPoint' + capitalSchema].belongsTo(
      app.model['PatrolObjRel' + capitalSchema],
      {
        foreignKey: 'patrolObjRelId',
        targetKey: 'patrolObjRelId',
        as: 'PatrolObjRel'
      }
    )
    app.model['PatrolTaskPoint' + capitalSchema].belongsTo(app.model['PatrolPic' + capitalSchema], {
      foreignKey: 'picUrl',
      targetKey: 'picId',
      as: 'PatrolPic'
    })
  }

  class Query {
    app=app
    /**
     * 查询xx分页列表
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
     * 筛选所有的任务检测点
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryManyAll (condition) {
      const data = await (this as any).findAll(condition)
      return data
    }
    /**
     * 查询统计数量
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryCount (condition) {
      const num = await (this as any).count(condition)
      // 返回统计数量
      return num
    }
    /**
     * 查询某一个检测点详情
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async findOneData (params) {
      const data = await (this as any).findOne(params)
      return data
    }

    @Model
    async mapGetPatrolPointName (params) {
      const { patrolTaskId } = params
      const condition = {
        where: { patrolTaskId },
        include: {
          model: app.model['PatrolPoint' + capitalSchema],
          as: 'PatrolPoint'
        }
      }
      return await (this as any).findAll(condition)
    }

    @Model
    async findOneDataByTask (params) {
      const { patrolPointId } = params
      // 编写查询条件
      const condition = {
        where: { patrol_task_point_id: patrolPointId },
        attributes: [
          [ Sequelize.col('Task.exec_type'), 'taskExecType' ],
          [ Sequelize.col('Task.patrol_task_id'), 'patrolTaskId' ],
          [ Sequelize.col('Task.patrol_task_name'), 'patrolTaskName' ],
          [ Sequelize.col('Task.score_type'), 'scoreType' ],
          [ Sequelize.col('Task.status'), 'taskStatus' ],
          [ Sequelize.col('Task.planItems.patrol_plan_name'), 'patrolPlanName' ],
          [ Sequelize.col('Task.planItems.patrol_plan_id'), 'patrolPlanId' ],
          [ Sequelize.col('Task.planItems.score_num'), 'scoreNum' ],
          [ Sequelize.col('Task.planItems.planSchemaItem.ps_id'), 'psId' ],
          [ Sequelize.col('Task.planItems.planSchemaItem.ps_name'), 'psName' ],
          [ 'patrol_task_item_id', 'patrolTaskItemId' ],
          [ 'point_name', 'pointName' ],
          [ 'status', 'pointStatus' ],
          [ Sequelize.col('TaskExec.status'), 'taskExecStatus' ],
          [ 'exec_user', 'execUser' ],
          [ 'result_desc', 'resultDesc' ],
          [ Sequelize.col('TaskItem.item_name'), 'taskItemName' ],
          [ 'update_time', 'updateTime' ],
          [ 'camera_id', 'cameraId' ],
          [ 'pic_url', 'picUrl' ],
          [ Sequelize.col('PatrolPoint.camera_name'), 'cameraName' ]
        ],
        include: [
          {
            model: app.model['Task' + capitalSchema],
            as: 'Task',
            attributes: [],
            include: {
              model: app.model['PatrolPlan' + capitalSchema],
              attributes: [],
              as: 'planItems',
              include: {
                model: app.model['PlanSchema' + capitalSchema],
                as: 'planSchemaItem',
                attributes: []
              }
            }
          },
          {
            model: app.model['PatrolTaskItem' + capitalSchema],
            as: 'TaskItem',
            attributes: []
          },
          {
            model: app.model['TaskExecSchema' + capitalSchema],
            as: 'TaskExec',
            attributes: []
          },
          {
            model: app.model['PatrolPoint' + capitalSchema],
            as: 'PatrolPoint',
            attributes: []
          }
        ],
        raw: true
      }
      const data = await (this as any).findOne(condition)
      return data
    }

    /**
     * 递归查询
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async findTree (params) {
      // const query = ` with RECURSIVE cte as
      // (
      // select a.* from ` + schema + `.tb_patrol_task_item a,
      // (select patrol_task_item_id from ` + schema + `.tb_patrol_task_point where patrol_task_point_id = $patrolPointId) b
      // where a.patrol_task_item_id=b.patrol_task_item_id
      // union
      // select k.*  from ` + schema + `.tb_patrol_task_item k , cte c where c.patrol_item_id = k.item_parent_id
      // )select distinct on (patrol_item_id) patrol_task_item_id,patrol_item_id,item_parent_id,item_name,patrol_score as score,item_score as max_score from cte`
      const query =
        `with RECURSIVE cte as 
      ( 
      select a.* from ` +
        schema +
        `.tb_patrol_task_item a,
      (select patrol_task_item_id from ` +
        schema +
        `.tb_patrol_task_point where patrol_task_point_id = $patrolPointId) b 
      where a.patrol_task_item_id=b.patrol_task_item_id
      and a.patrol_task_id=$patrolTaskId
      union  
      select k.*  from ` +
        schema +
        `.tb_patrol_task_item k , cte c where c.patrol_item_id = k.item_parent_id
      and k.patrol_task_id=$patrolTaskId
      )select patrol_task_item_id,patrol_item_id,item_parent_id,item_name,is_leaf,level,patrol_score as score,item_score as max_score from cte
      `
      // 这句可以用来直接筛选已提交的巡检项，不过体验不好，改为servicve中追加commited标识了
      // where patrol_task_item_id not in (
      //   select patrol_task_item_id from ` + schema + `.tb_task_exec_result where task_id = $patrolTaskId and status = 99
      // )
      const data = await (this as any).query(query, {
        bind: {
          patrolPointId: params.patrolPointId,
          patrolTaskId: params.patrolTaskId
        }
      })
      return app.toHumpJson(data[0])
    }
    /**
     * 查询任务下关联检测点的分页列表
     * @param {object} { params, pagination } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryDataByTaskGetPointerListByTaskId (params) {
      console.log('================pes model==============')
      const {
        patrolTaskId, patrolObjId, firstItemId, pointerStatus, pageNo, pageSize
      } = params
      if (!patrolTaskId) {
        const error:any = new Error(this.app.ctx.__('model.taskIDMustPassed'))
        error.status = 425
        throw error
      }
      const condition:any = {
        where: { patrolTaskId },
        attributes: [
          [ 'patrol_task_point_id', 'patrolTaskPointId' ],
          [ 'patrol_point_id', 'patrolPointId' ],
          [ 'point_name', 'pointName' ],
          [ 'pic_url', 'picStr' ],
          [ 'patrol_method_id', 'patrolMethodId' ],
          // [Sequelize.col('PatrolPic.pic_url'), 'picUrl'],
          [ Sequelize.col('PatrolPoint.camera_name'), 'cameraName' ],
          'status',
          'patrolResult'
        ],
        include: [
          {
            model: app.model['PatrolPoint' + capitalSchema],
            as: 'PatrolPoint',
            attributes: []
          },
          {
            model: app.model['PatrolObjRel' + capitalSchema],
            as: 'PatrolObjRel',
            attributes: [],
            required: true
          }
          // {
          //   model: app.model['PatrolPic' + capitalSchema],
          //   as: 'PatrolPic',
          //   attributes: []
          // }
        ],
        order: [[ 'createTime', 'DESC' ]],
        raw: true
      }
      // 追加巡检对象筛选条件
      if (patrolObjId) {
        condition.include[1].where = { patrolObjId }
      }
      // 追加巡检项筛选条件
      if (firstItemId) {
        condition.where.patrol_task_item_id = firstItemId
      }
      // 追加检测点状态筛选条件
      if (pointerStatus) {
        condition.where.status = pointerStatus
      }
      if (pageNo && pageSize) {
        condition.limit = pageSize * 1
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
     * 根据计划巡检点位的进度
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */
    @Model
    async getResolveInfoByTaskId (params) {
      const condition = {
        where: { patrolTaskId: params.patrolTaskId },
        attributes: [ 'patrolTaskId' ],
        include: {
          model: app.model['TaskExecSchema' + capitalSchema],
          as: 'TaskExec',
          attributes: [ 'pointResultId', 'taskPointId' ]
        }
      }
      const data = await (this as any).findAll(condition)
      return data
    }
  }
  PatrolTaskPoint.query = new Query()
  return PatrolTaskPoint
}
