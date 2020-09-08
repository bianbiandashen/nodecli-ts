/*
 * @作者: bianlian
 * @创建时间: 2019-12-12 15:47:32
 * @Last Modified by: xionghaima
 * @Last Modified time: 2019-12-27 20:19:22
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
    objTypeId: {
      type: STRING(64),
      field: 'obj_type_id',
      allowNull: false,
      primaryKey: true,
      defaultValue: UUIDV1,
      comment: '主键，巡检对象类型ID'
    },
    objTypeName: {
      type: STRING(256),
      field: 'obj_type_name',
      allowNull: true,
      comment: '巡检对象类型名称'
    },
    level: {
      type: INTEGER,
      allowNull: true,
      comment: '巡检对象类型层级'
    },
    rmCode: {
      type: STRING(64),
      field: 'rm_code',
      allowNull: true,
      comment: '资源类型标识'
    },
    isDelete: {
      type: INTEGER,
      allowNull: true,
      field: 'is_delete',
      comment: '是否已删除，0：否，-1：是'
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
    },
    rmColumnName: {
      type: STRING(64),
      allowNull: true,
      field: 'rm_column_name',
      comment: '模型筛选条件'
    },
    rmColumnValue: {
      type: STRING(64),
      allowNull: true,
      field: 'rm_column_value',
      comment: '模型筛选值'
    },
    objNameColumn: {
      type: STRING(64),
      allowNull: true,
      field: 'obj_name_column',
      comment: '巡检对象模型名称字段'
    },
    objUnicodeColumn: {
      type: STRING(64),
      allowNull: true,
      field: 'obj_unicode_column',
      comment: '模型主键'
    },
    regionIndexCode: {
      type: STRING(64),
      allowNull: true,
      field: 'region_index_code',
      comment: '区域ID'
    }
  };
};
