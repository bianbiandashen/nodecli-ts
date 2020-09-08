/*
 * @作者: bianlian
 * @创建时间: 2019-12-11 21:09:18
 * @Last Modified by: bainlian
 * @Last Modified time: 2020-02-15 19:42:28
 */

'use strict'

module.exports = app => {
  const { STRING, INTEGER, DATE, UUIDV1 } = app.Sequelize

  return {
    pauseRecordId: {
      type: STRING(64),
      allowNull: false,
      primaryKey: true,
      defaultValue: UUIDV1,
      field: 'pause_record_id',
      comment: '唯一值'
    },
    patrolTaskId: {
      type: STRING(64),
      field: 'patrol_task_id',
      allowNull: false,
      comment: '巡检任务id'
    },
    execUser: {
      type: STRING(64),
      field: 'exec_user',
      allowNull: false,
      comment: '执行人'
    },
    status: {
      type: INTEGER(32),
      allowNull: false,
      field: 'status',
      comment: '执行方式 状态 0-暂停 1-恢复 2 取消'
    },
    updateTime: {
      type: DATE,
      field: 'update_time',
      allowNull: false,
      comment: '最后一次操作时间'
    },
    remark: {
      type: STRING(64),
      allowNull: false,
      comment: '备注'
    },
    createTime: {
      type: DATE,
      allowNull: false,
      field: 'create_time',
      comment: '创建时间'
    }
  }
}
