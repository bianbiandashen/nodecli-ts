/*
 * @作者: bianlian
 * @创建时间: 2019-12-12 15:47:32
 * @Last Modified by: bainlian
 * @Last Modified time: 2020-01-11 17:07:05
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
    itemId: {
      type: STRING(64),
      field: 'item_id',
      allowNull: false,
      primaryKey: true,
      defaultValue: UUIDV1,
      comment: '巡检项id'
    },
    parentItem: {
      type: STRING(64),
      field: 'parent_item',
      allowNull: false,
      comment: '上级项ID'
    },
    itemContent: {
      type: STRING(64),
      field: 'item_content',
      allowNull: false,
      comment: '巡检项名称或描述'
    },
    itemOrder: {
      type: INTEGER(32),
      field: 'item_order',
      allowNull: true,
      comment: '巡检项排列序号'
    },
    itemScore: {
      type: INTEGER(32),
      field: 'item_score',
      allowNull: false,
      comment: '巡检项分数'
    },
    objTypeId: {
      type: STRING(64),
      field: 'obj_type_id',
      allowNull: false,
      comment: '巡检对象类型编号'
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
    },
    path: {
      type: STRING(128),
      allowNull: true,
      comment: '创建时间'
    },
    level: {
      type: INTEGER(2),
      allowNull: true,
      comment: '第几级巡检项'
    }
  };
};