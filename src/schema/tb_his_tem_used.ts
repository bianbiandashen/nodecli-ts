/*
 * @作者: songxiaodong5
 * @创建时间: 2019-1-21 16:47:32
 * @Last Modified by: songxiaodong5
 * @Last Modified time: 2019-1-21 16:47:32
 */
'use strict';
module.exports = app => {
  const {
    STRING,
    DATE,
    UUIDV1,
    JSONB
  } = app.Sequelize;

  return {
    usedId: {
      type: STRING(64),
      field: 'used_id',
      allowNull: false,
      primaryKey: true,
      defaultValue: UUIDV1,
      comment: '历史温度常用变量ID'
    },
    patrolObjId: {
      type: STRING(64),
      field: 'patrol_obj_id',
      allowNull: true,
      comment: '巡检对象ID'
    },
    usedName: {
      type: STRING(64),
      field: 'used_name',
      allowNull: true,
      comment: '常用温度名称'
    },
    usedStartTime: {
      type: DATE,
      field: 'used_start_time',
      allowNull: true,
      comment: '开始时间'
    },
    usedEndTime: {
      type: DATE,
      field: 'used_end_time',
      allowNull: true,
      comment: '结束时间'
    },
    thermometric: {
      type: JSONB,
      allowNull: true,
      comment: '测温位'
    },
    isDelete: {
      type: STRING(4),
      field: 'is_delete',
      allowNull: false,
      comment: '删除标志位（0：未删除，-1：已删除）'
    },
    createTime: {
      type: DATE,
      field: 'create_time',
      allowNull: true,
      comment: '创建时间'
    },
    updateTime: {
      type: DATE,
      field: 'update_time',
      allowNull: true,
      comment: '修改时间'
    }
  };
};
