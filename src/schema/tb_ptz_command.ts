/*
 * @Author: xionghaima
 * @Date: 2019-12-11 11:18:16
 * @Last Modified by: bainlian
 * @Last Modified time: 2019-12-12 16:15:09
 */

'use strict';

module.exports = app => {
  const {
    STRING,
    DATE
  } = app.Sequelize;

  return {
    createdTime: {
      type: DATE,
      allowNull: false,
      field: 'create_time',
      comment: '创建时间'
    },
    commandId: {
      type: STRING(32),
      allowNull: false,
      field: 'command_id',
      comment: '主键，指令ID',
      primaryKey: true
    },
    commandCode: {
      type: STRING(64),
      allowNull: false,
      field: 'command_code',
      comment: '指令标识，如GetPtzPos'
    },
    commandParam: {
      type: STRING(256),
      allowNull: true,
      field: 'command_param',
      comment: '指令参数，如预置位信息'
    },
    taskId: {
      type: STRING(32),
      allowNull: false,
      field: 'task_id',
      comment: '所属任务id'
    },
    executeTime: {
      type: DATE,
      allowNull: true,
      field: 'execute_time',
      comment: '执行时间'
    },
    endTime: {
      type: DATE,
      allowNull: true,
      field: 'end_time',
      comment: '结束时间'
    },
    result: {
      type: STRING(256),
      allowNull: true,
      field: 'result',
      comment: '指令执行结果，抓图url等'
    }
  };
};
