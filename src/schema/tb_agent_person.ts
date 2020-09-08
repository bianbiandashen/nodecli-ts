/*
 * @作者: bianlian
 * @创建时间: 2019-12-10 20:47:07
 * @Last Modified by: bainlian
 * @Last Modified time: 2020-02-24 19:45:50
 */
// 任务巡检项表
'use strict';

module.exports = app => {
  const {
    STRING,
    DATE,
    INTEGER,
    UUIDV1
  } = app.Sequelize;
  return {
    agentPersonId: {
      type: STRING(48),
      allowNull: false,
      primaryKey: true,
      defaultValue: UUIDV1,
      field: 'agent_person_id',
      comment: '代理记录Id 唯一值'
    },
    submitterUserId: {
      type: STRING(48),
      allowNull: true,
      // primaryKey: true,
      // defaultValue: UUIDV1,
      field: 'submitter_user_id',
      comment: '提交人Id 唯一值'
    },
    agentUserId: {
      type: STRING(48),
      allowNull: true,
      // primaryKey: true,
      // defaultValue: UUIDV1,
      field: 'agent_user_id',
      comment: '代理人Id 唯一值'
    },
    isDelete: {
      type: INTEGER,
      allowNull: true,
      // primaryKey: true,
      defaultValue: 0,
      field: 'is_delete',
      comment: '是否删除'
    },
    recoveryStatus: {
      type: INTEGER,
      allowNull: true,
      defaultValue: 0,
      // defaultValue: UUIDV1,
      field: 'recovery_status',
      comment: '权限回收状态 0-否 1-是'
    },

    startTime: {
      type: DATE,
      field: 'start_time',
      allowNull: true,
      comment: '开始时间'
    },
    endTime: {
      type: DATE,
      allowNull: true,
      field: 'end_time',
      comment: '结束时间'
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