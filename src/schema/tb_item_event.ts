/*
 * @作者: songxiaodong5
 * @创建时间: 2020-01-06 17:07
 * @Last Modified by: songxiaodong5
 * @Last Modified time: 2020-01-06 17:07
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
    ieId: {
      type: STRING(64),
      field: 'ie_id',
      allowNull: false,
      primaryKey: true,
      defaultValue: UUIDV1,
      comment: '主键ID'
    },
    itemId: {
      type: STRING(64),
      field: 'item_id',
      allowNull: false,
      comment: '巡检项ID'
    },
    orId: {
      type: STRING(256),
      field: 'or_id',
      allowNull: true,
      comment: '执行结果ID'
    },
    eventType: {
      type: STRING(64),
      field: 'event_type',
      allowNull: true,
      comment: '事件类型编号'
    },
    mannerId: {
      type: STRING(64),
      field: 'manner_id',
      allowNull: true,
      comment: '巡检方法ID'
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
    }
  };
};
