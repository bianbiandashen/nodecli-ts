/*
 * @Author: renxiaojian
 * @Date: 2019-12-11 11:18:16
 * @Last Modified by: xionghaima
 * @Last Modified time: 2020-01-03 15:24:41
 */

'use strict';

module.exports = app => {
  const {
    STRING,
    DATE,
    UUIDV1
  } = app.Sequelize;

  return {
    patrolTaskUserId: {
      type: STRING(48),
      allowNull: false,
      primaryKey: true,
      field: 'patrol_task_user_id',
      defaultValue: UUIDV1,
      comment: '主键，任务人员ID'
    },
    userId: {
      type: STRING(48),
      field: 'user_id',
      allowNull: false,
      comment: '人员ID'
    },
    patrolTaskId: {
      type: STRING(48),
      field: 'patrol_task_id',
      allowNull: false,
      comment: '巡检任务ID'
    },
    roleType: {
      type: STRING(256),
      field: 'role_type',
      allowNull: false,
      comment: '人员角色 0-巡检 1-复核 2-整改 3-审核'
    },
    abRole: {
      type: STRING(48),
      field: 'ab_role',
      allowNull: true,
      comment: 'AB角'
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
  };
};
