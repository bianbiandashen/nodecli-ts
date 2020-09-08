/*
 * @Author: xionghaima
 * @Date: 2019-12-11 11:18:16
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-02-23 10:11:53
 */

'use strict';

module.exports = app => {
  const {
    STRING,
    INTEGER,
    DATE
  } = app.Sequelize;

  return {
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
    },
    bId: {
      type: STRING(64),
      allowNull: false,
      field: 'b_id',
      primaryKey: true,
      comment: '巡检应用ID'
    },
    bussinessName: {
      type: STRING(256),
      allowNull: false,
      field: 'bussiness_name',
      comment: '巡检应用名称'
    },
    mannerList: {
      type: STRING(256),
      allowNull: false,
      field: 'manner_list',
      comment: ''
    },
    identify: {
      type: STRING(64),
      allowNull: false,
      field: 'identify',
      comment: '应用标识'
    },
    schemalist: {
      type: STRING(256),
      allowNull: false,
      field: 'schema_list',
      comment: '模板列表ID集合'
    },
    defaultSchema: {
      type: STRING(64),
      allowNull: false,
      field: 'default_schema',
      comment: '默认模板ID'
    },
    suspendAll: {
      type: INTEGER(2),
      allowNull: false,
      field: 'suspend_all',
      comment: '是否支持一键暂停'
    },
    executeOneByOne: {
      type: INTEGER(2),
      allowNull: false,
      field: 'execute_one_by_one',
      comment: '是否支持顺序执行'
    },
    itemContainsManyProblem: {
      type: INTEGER(2),
      allowNull: false,
      field: 'item_contains_many_problem',
      comment: '是否包含多个问题'
    },
    isSupportRegionDataIsolation: {
      type: INTEGER(2),
      allowNull: false,
      field: 'is_support_region_data_isolation',
      comment: '是否区域数据隔离'
    },
    isDelete: {
      type: INTEGER(2),
      allowNull: false,
      field: 'is_delete',
      comment: '是否已删除，0：否，-1：是'
    }
  };
};
