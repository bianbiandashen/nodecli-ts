/*
 * @Author: xionghaima
 * @Date: 2019-12-11 11:18:16
 * @Last Modified by: xionghaima
 * @Last Modified time: 2019-12-12 16:17:31
 */

'use strict';

module.exports = app => {
  const {
    STRING,
    INTEGER,
    DATE
  } = app.Sequelize;

  return {
    createdTime: {
      type: DATE,
      allowNull: false,
      field: 'create_time',
      comment: '创建时间'
    },
    updateTime: {
      type: DATE,
      allowNull: false,
      field: 'update_time',
      comment: '更新时间'
    },
    mrId: {
      type: STRING(64),
      allowNull: false,
      field: 'mr_id',
      comment: '主键，方法ID',
      primaryKey: true
    },
    mrName: {
      type: STRING(256),
      allowNull: false,
      field: 'mr_name',
      comment: '任务执行结果名称'
    },
    triggerNext: {
      type: INTEGER(32),
      allowNull: false,
      field: 'trigger_next',
      comment: '是否触发下一环节，0：否，1：是 '
    },
    mannerId: {
      type: STRING(64),
      allowNull: false,
      field: 'manner_id',
      comment: '巡检方法编号'
    },
    isDelete: {
      type: INTEGER(2),
      allowNull: false,
      field: 'is_delete',
      comment: '是否已删除，0：否，-1：是'
    }
  };
};
