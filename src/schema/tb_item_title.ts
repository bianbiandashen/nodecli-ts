/*
 * @作者: bianlian
 * @创建时间: 2019-12-12 15:47:32
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-07-08 23:38:22
 */


'use strict'

module.exports = app => {
  const {
    STRING,
    DATE,
    UUIDV1,
    INTEGER
  } = app.Sequelize

  return {
    titleId: {
      type: STRING(64),
      field: 'title_id',
      allowNull: false,
      primaryKey: true,
      defaultValue: UUIDV1,
      comment: '主键，巡检项标题ID'
    },
    titleName: {
      type: STRING(256),
      field: 'title_name',
      allowNull: false,
      comment: '巡检项标题名称'
    },
    parentTitle: {
      type: STRING(64),
      field: 'parent_title',
      allowNull: false,
      comment: '上级标题ID'
    },
    relateMonitor: {
      type: INTEGER,
      allowNull: false,
      field: 'relate_monitor',
      comment: '是否可以关联监控点，0：否，1：是'
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
      allowNull: true,
      comment: '最后一次操作时间'
    },
    createTime: {
      type: DATE,
      allowNull: true,
      field: 'create_time',
      comment: '创建时间'
    },
    objTypeId: {
      type: STRING(64),
      field: 'obj_type_id',
      allowNull: false,
      comment: '巡检对象类型ID'
    },
    level: {
      type: INTEGER,
      allowNull: true,
      comment: '层级'
    }
  }
}
