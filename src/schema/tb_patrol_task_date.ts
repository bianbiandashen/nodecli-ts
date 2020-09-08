/*
 * @Author: renxiaojian
 * @Date: 2019-12-12 12:46:16
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-06-28 14:55:25
 */
'use strict'

module.exports = app => {
  const {
    STRING,
    DATE,
    UUIDV1,
    INTEGER
  } = app.Sequelize

  return {
    taskExecuteId: {
      type: STRING(64),
      allowNull: false,
      primaryKey: true,
      defaultValue: UUIDV1,
      field: 'task_execute_id',
      comment: '唯一值'
    },
    patrolPlanId: {
      type: STRING(64),
      field: 'patrol_plan_id',
      allowNull: true,
      comment: '巡检计划id'
    },
    taskExecuteDate: {
      type: STRING(256),
      field: 'task_execute_date',
      allowNull: true,
      comment: '任务执行日期（每周，每月，按天）'
    },
    taskExecuteTime: {
      type: STRING(64),
      field: 'task_execute_time',
      allowNull: true,
      comment: '任务执行时间 时间格式：（hh:mm）'
    },
    taskEffective: {
      type: INTEGER,
      field: 'task_effective',
      allowNull: true,
      comment: '任务有效期'
    },
    isDelete: {
      type: INTEGER,
      field: 'is_delete',
      allowNull: true,
      comment: '是否已被删除 0-未删除 1-已删除'
    },
    groupId: {
      type: STRING(64),
      field: 'group_id',
      allowNull: true,
      comment: '巡检计划分组ID'
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
    taskStartTimeZone: {
      type: INTEGER,
      field: 'task_start_time_zone',
      allowNull: true,
      comment: '巡检计划分组ID'
    },
    taskStartTimeStamp: {
      type: STRING(64),
      field: 'task_start_time_stamp',
      allowNull: true,
      comment: '巡检计划分组ID'
    }
  }
}
