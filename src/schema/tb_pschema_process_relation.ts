/*
 * @作者: bianlian
 * @创建时间: 2019-12-11 21:09:18
 * @Last Modified by: MR.wang
 * @Last Modified time: 2019-12-18 14:12:35
 */

'use strict';

module.exports = app => {
  const {
    STRING,
    DATE,
    UUIDV1
  } = app.Sequelize;
  // 巡检模板流程配置关联表
  return {
    psId: {
      type: STRING(64),
      allowNull: false,
      primaryKey: true,
      defaultValue: UUIDV1,
      field: 'ps_id',
      comment: '计划模板ID'
    },
    precessId: {
      type: STRING(64),
      field: 'process_id',
      allowNull: false,
      comment: '巡检流程配置ID'
    },
    updateTime: {
      type: DATE,
      field: 'update_time',
      allowNull: false,
      comment: '最后一次操作时间'
    },
    createdTime: {
      type: DATE,
      allowNull: false,
      field: 'create_time',
      comment: '创建时间'
    }
  };
};
