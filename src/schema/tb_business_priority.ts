/*
 * @Author: xionghaima
 * @Date: 2019-12-11 11:18:16
 * @Last Modified by: bainlian
 * @Last Modified time: 2019-12-12 16:20:33
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
      comment: '创建时间'
    },
    businessId: {
      type: STRING(32),
      allowNull: false,
      field: 'business_id',
      primaryKey: true,
      comment: '主键，任务ID'
    },
    businessCode: {
      type: STRING(64),
      allowNull: false,
      field: 'business_code',
      comment: '业务标识'
    },
    businessName: {
      type: STRING(256),
      allowNull: false,
      field: 'business_name',
      comment: '业务名称'
    },
    priority: {
      type: INTEGER(32),
      allowNull: false,
      field: 'priority',
      comment: '优先级，0~100'
    },
    updateUser: {
      type: STRING(64),
      allowNull: true,
      field: 'update_user',
      comment: '修改用户'
    }
  };
};
