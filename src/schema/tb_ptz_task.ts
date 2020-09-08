/*
 * @Author: xionghaima
 * @Date: 2019-12-11 11:18:16
 * @Last Modified by: bainlian
 * @Last Modified time: 2019-12-12 16:12:24
 */

'use strict';

module.exports = app => {
  const {
    STRING,
    INTEGER,
    DATE
  } = app.Sequelize;

  return {
    receiveTime: {
      type: DATE,
      field: 'receive_time',
      allowNull: false,
      comment: '任务接收时间'
    },
    createdTime: {
      type: DATE,
      allowNull: false,
      field: 'create_time',
      comment: '任务发起时间'
    },
    taskId: {
      type: STRING(32),
      primaryKey: true,
      allowNull: false,
      field: 'task_id',
      comment: '主键，任务ID'
    },
    businessCode: {
      type: STRING(48),
      allowNull: false,
      field: 'business_code',
      comment: '业务标识'
    },
    businessPriority: {
      type: INTEGER(4),
      allowNull: true,
      field: 'business_priority',
      comment: '优先级（同一业务允许下发者自带优先级）'
    },
    taskStatus: {
      type: INTEGER(4),
      allowNull: false,
      field: 'task_status',
      comment: '任务状态，0-排队中，1-执行中，2-正常结束，3-异常结束'
    },
    taskResult: {
      type: STRING(256),
      allowNull: true,
      field: 'task_result',
      comment: '任务执行结果'
    }
  };
};
