/*
 * @Author: xionghaima
 * @Date: 2019-12-11 11:18:16
 * @Last Modified by: bainlian
 * @Last Modified time: 2019-12-12 16:38:20
 */

'use strict';

module.exports = app => {
  const {
    STRING,
    DATE
  } = app.Sequelize;

  return {
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
    },
    psId: {
      type: STRING(64),
      allowNull: false,
      primaryKey: true,
      field: 'ps_id',
      comment: '计划模板ID'
    },
    bId: {
      type: STRING(64),
      allowNull: false,
      field: 'b_id',
      comment: '巡检应用ID'
    }
  };
};
