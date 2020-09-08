/*
 * @Author: renxiaojian
 * @Date: 2020-01-03 20:16:09
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-01-03 21:12:10
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
    orId: {
      type: STRING(64),
      field: 'or_id',
      allowNull: false,
      primaryKey: true,
      defaultValue: UUIDV1,
      comment: '主键，方法ID'
    },
    orName: {
      type: STRING(256),
      field: 'or_name',
      allowNull: true,
      comment: '任务执行结果名称'
    },
    triggerNext: {
      type: INTEGER,
      field: 'trigger_next',
      allowNull: true,
      comment: '是否触发下一环节，0：否，1：是 '
    },
    objTypeId: {
      type: STRING(64),
      field: 'obj_type_id',
      allowNull: true,
      comment: '巡检方法编号'
    },
    order: {
      type: INTEGER,
      field: 'order',
      allowNull: true,
      comment: '排列顺序'
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
