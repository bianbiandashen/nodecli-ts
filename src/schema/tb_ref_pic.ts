/*
 * @作者: songxiaodong
 * @创建时间: 2019-12-11 21:24:47
 * @Last Modified by: bainlian
 * @Last Modified time: 2020-01-06 20:31:11
 */

'use strict';

module.exports = app => {
  const {
    STRING,
    DATE,
    INTEGER,
    UUIDV1
  } = app.Sequelize;

  return {
    refPicId: {
      type: STRING(64),
      allowNull: false,
      primaryKey: true,
      field: 'ref_pic_id',
      defaultValue: UUIDV1,
      comment: '主键，参考图ID'
    },
    itemId: {
      type: STRING(64),
      field: 'item_id',
      allowNull: false,
      comment: '巡检项ID'
    },

    patrolPonitId: {
      type: STRING(64),
      field: 'patrol_point_id',
      allowNull: true,
      comment: '检测点ID'
    },
    refPicUrl: {
      type: STRING(256),
      field: 'ref_pic_url',
      allowNull: false,
      comment: '图片url'
    },
    isDelete: {
      type: INTEGER,
      field: 'is_delete',
      allowNull: false,
      comment: '删除标志位（0：未删除，-1：已删除）'
    },
    createTime: {
      type: DATE,
      field: 'create_time',
      allowNull: false,
      comment: '创建时间'
    },
    updateTime: {
      type: DATE,
      field: 'update_time',
      allowNull: true,
      comment: '修改时间'
    },
    updateUser: {
      type: STRING(64),
      field: 'update_user',
      allowNull: true,
      comment: '修改人'
    },
    refPicExtend1: {
      type: STRING(64),
      field: 'ref_pic_extend_1',
      allowNull: true,
      comment: '扩展字段1'
    },
    refPicExtend2: {
      type: STRING(64),
      field: 'ref_pic_extend_2',
      allowNull: true,
      comment: '扩展字段2'
    },
    patrolObjId: {
      type: STRING(64),
      allowNull: false,
      comment: '巡检对象ID',
      field: 'patrol_obj_id'
    }
  };
};