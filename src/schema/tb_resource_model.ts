/*
 * @作者: bianlian
 * @创建时间: 2019-12-12 15:47:32
 * @Last Modified by: xionghaima
 * @Last Modified time: 2019-12-29 19:41:48
 */


'use strict';

module.exports = app => {
  const {
    STRING,
    DATE,
    UUIDV1,
    INTEGER
  } = app.Sequelize;

  return {
    rmId: {
      type: STRING(64),
      field: 'rm_id',
      allowNull: false,
      primaryKey: true,
      defaultValue: UUIDV1,
      comment: '主键，巡检对象类型ID'
    },
    rmCode: {
      type: STRING(256),
      field: 'rm_code',
      allowNull: true,
      comment: '资源标识'
    },
    rmType: {
      type: INTEGER,
      field: 'rm_type',
      allowNull: false,
      comment: '资源类型，0：巡检对象类型资源，1：检测点类型资源'
    },
    rmName: {
      type: STRING(64),
      field: 'rm_name',
      allowNull: false,
      comment: '资源名称'
    },
    isDelete: {
      type: INTEGER,
      allowNull: false,
      field: 'is_delete',
      comment: '是否已删除，0：否，-1：是'
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
