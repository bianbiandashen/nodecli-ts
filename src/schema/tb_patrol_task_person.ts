/*
 * @Author: jiangyan6
 * @Date: 2019-12-30 21:58:05
 * @Last Modified by: xionghaima
 * @Last Modified time: 2020-01-15 19:54:18
 * @Desc: 任务人员表
 */
'use strict'

module.exports = app => {
  const { STRING, DATE, UUIDV1, INTEGER } = app.Sequelize

  return {
    patrolTaskPersonId: {
      type: STRING(48),
      allowNull: false,
      primaryKey: true,
      field: 'patrol_task_person_id',
      defaultValue: UUIDV1,
      comment: '主键，任务人员ID'
    },
    patrolTaskId: {
      type: STRING(48),
      field: 'patrol_task_id',
      allowNull: false,
      comment: '巡检任务ID'
    },
    submitPersonIds: {
      type: STRING(256),
      field: 'submit_person_ids',
      allowNull: true,
      comment: '提交人id逗号分割'
    },
    objectId: {
      type: STRING(48),
      field: 'object_id',
      allowNull: false,
      comment: '对象id'
    },
    processType: {
      type: INTEGER,
      field: 'process_type',
      allowNull: true,
      comment: '流程类型，0：巡检，1：复合，2：整改，3：审核'
    },
    expire: {
      type: INTEGER,
      field: 'expire',
      allowNull: true,
      comment: 'expire'
    },
    firstPersonIds: {
      type: STRING(256),
      field: 'first_person_ids',
      allowNull: false,
      comment: '第一执行人id，多个逗号分隔'
    },
    secondPersonIds: {
      type: STRING(256),
      field: 'second_person_ids',
      allowNull: false,
      comment: '第二执行人id，多个逗号分隔'
    },
    currentPerson: {
      type: STRING(256),
      field: 'current_person',
      allowNull: false,
      comment: '当前处理人，1-第一处理人/2-第二处理人'
    },
    updateTime: {
      type: DATE,
      field: 'update_time',
      allowNull: false,
      comment: '最后一次操作时间'
    },
    createTime: {
      type: DATE,
      allowNull: false,
      field: 'create_time',
      comment: '创建时间'
    }
  }
}
