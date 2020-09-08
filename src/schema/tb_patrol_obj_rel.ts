/*
 * @Author: renxiaojian
 * @Date: 2019-12-11 11:18:16
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-08-03 19:27:26
 */

'use strict'

module.exports = app => {
  const {
    STRING,
    INTEGER,
    DATE,
    UUIDV1
  } = app.Sequelize

  return {
    patrolObjRelId: {
      type: STRING(48),
      allowNull: false,
      primaryKey: true,
      field: 'patrol_obj_rel_id',
      defaultValue: UUIDV1,
      comment: '主键，任务对象关系ID'
    },
    patrolObjId: {
      type: STRING(48),
      field: 'patrol_obj_id',
      allowNull: true,
      comment: '巡检对象ID'
    },
    status: {
      type: STRING(48),
      field: 'status',
      allowNull: true,
      comment: '状态（0：未开始，1：已完成）'
    },
    patrolTaskId: {
      type: STRING(48),
      field: 'patrol_task_id',
      allowNull: true,
      comment: '巡检任务ID'
    },
    objOrder: {
      type: INTEGER,
      allowNull: false,
      field: 'obj_order',
      comment: '对象排序'
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
    }
  }
}
