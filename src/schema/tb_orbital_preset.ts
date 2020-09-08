/*
 * @Author: xionghaima
 * @Date: 2019-12-11 11:18:16
 * @Last Modified by: MR.wang
 * @Last Modified time: 2020-02-17 20:00:04
 */

'use strict';

module.exports = app => {
  const {
    STRING,
    INTEGER,
    DATE
  } = app.Sequelize;

  return {

    presetId: {
      type: STRING(64),
      allowNull: false,
      field: 'preset_id',
      primaryKey: true,
      comment: '主键，预置位ID'
    },
    orbitalId: {
      type: STRING(64),
      allowNull: false,
      field: 'orbital_id',
      comment: '轨道机id'
    },
    presetNo: {
      type: INTEGER,
      allowNull: false,
      field: 'preset_no',
      comment: '预置位编号'
    },
    createTime: {
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
    }
  };
};
