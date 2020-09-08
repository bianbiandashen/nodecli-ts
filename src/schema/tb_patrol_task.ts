/*
 * @作者: bianlian
 * @创建时间: 2019-12-10 15:54:47
 * @Last Modified by: xionghaima
 * @Last Modified time: 2020-04-21 20:47:20
 */

'use strict'

module.exports = app => {
  const {
    STRING, DATE, UUIDV1, INTEGER
  } = app.Sequelize

  return {
    patrolTaskId: {
      type: STRING(64),
      allowNull: false,
      primaryKey: true,
      field: 'patrol_task_id',
      defaultValue: UUIDV1,
      comment: '唯一值'
    },
    currentPerson: {
      type: STRING(256),
      field: 'current_person',
      allowNull: false,
      comment: '当前处理人，1-第一处理人/2-第二处理人'
    },
    submitPersonIds: {
      type: STRING(256),
      field: 'submit_person_ids',
      allowNull: true,
      comment: '提交人id逗号分割'
    },
    patrolTaskName: {
      type: STRING(64),
      allowNull: true,
      field: 'patrol_task_name',
      comment: '巡检任务名称'
    },
    startTime: {
      type: DATE,
      field: 'start_time',
      allowNull: true,
      comment: '任务开始时间'
    },
    endTime: {
      type: DATE,
      field: 'end_time',
      allowNull: true,
      comment: '任务结束时间'
    },
    status: {
      type: INTEGER(),
      allowNull: true,
      defaultValue: 0,
      comment: '任务状态 0-未开始 1-执行中  3-已完成 4-暂停中 5-已取消'
    },
    timeStatus: {
      type: INTEGER(),
      field: 'time_status',
      allowNull: true,
      defaultValue: 0,
      comment: '时间状态 0-未过期 1-已过期'
    },
    planId: {
      type: STRING(64),
      field: 'plan_id',
      allowNull: true,
      defaultValue: UUIDV1,
      comment: '所属计划ID'
    },
    taskType: {
      type: INTEGER(),
      allowNull: true,
      field: 'task_type',
      defaultValue: 0,
      comment: '0：临时任务， 1 计划任务'
    },
    regionId: {
      type: STRING(64),
      allowNull: true,
      defaultValue: UUIDV1,
      field: 'region_id',
      comment: '所需区域ID'
    },
    psId: {
      type: STRING(64),
      allowNull: true,
      defaultValue: UUIDV1,
      field: 'ps_id',
      comment: '巡查模板ID'
    },
    regionPath: {
      type: STRING(1024),
      field: 'region_path',
      allowNull: true,
      comment: '巡检区域全路径，@隔开'
    },
    execType: {
      type: INTEGER(),
      allowNull: true,
      defaultValue: 1,
      field: 'exec_type',
      comment: '任务状态 0 - 自动巡检 1 - 人工在线巡检 2 - 移动线下巡检'
    },
    patrolObjNum: {
      type: INTEGER(),
      allowNull: true,
      defaultValue: 0,
      field: 'patrol_obj_num',
      comment: '巡检对象数'
    },
    problemNum: {
      type: INTEGER(),
      allowNull: true,
      field: 'problem_num',
      comment: '问题数'
    },
    normalReusltNum: {
      type: INTEGER(),
      allowNull: true,
      field: 'normal_reuslt_num',
      comment: '巡检正常数'
    },
    missingCount: {
      type: INTEGER(),
      allowNull: true,
      field: 'missing_count',
      comment: '漏检数'
    },
    finishObjNum: {
      type: INTEGER(),
      allowNull: true,
      field: 'finish_obj_num',
      comment: '已完成对象数'
    },
    finishPatrolItemNum: {
      type: INTEGER(),
      allowNull: true,
      field: 'finish_patrol_item_num',
      comment: '已完成巡检项数'
    },
    patrolItemNum: {
      type: INTEGER(),
      allowNull: true,
      field: 'patrol_item_num',
      comment: '总巡检项数'
    },
    patrolPointNum: {
      type: INTEGER(),
      allowNull: true,
      field: 'patrol_point_num',
      comment: '巡检点位数'
    },
    updateTime: {
      type: DATE,
      field: 'update_time',
      allowNull: true,
      comment: '最后一次操作时间'
    },
    createTime: {
      type: DATE,
      allowNull: true,
      field: 'create_time',
      comment: '创建时间'
    },
    startTimeZone: {
      type: STRING(16),
      allowNull: true,
      comment: '开始时间时区',
      field: 'start_time_zone'
    },
    startTimeStamp: {
      type: INTEGER(),
      allowNull: true,
      comment: '开始时间戳',
      field: 'start_time_stamp'
    },
    endTimeZone: {
      type: STRING(16),
      allowNull: true,
      comment: '结束时间时区',
      field: 'end_time_zone'
    },
    endTimeStamp: {
      type: INTEGER(),
      allowNull: true,
      comment: '结束时间戳',
      field: 'end_time_stamp'
    }
  }
}
