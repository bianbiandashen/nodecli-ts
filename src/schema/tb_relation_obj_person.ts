/*
 * @Author: renxiaojian
 * @Date: 2020-01-20 13:58:05
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-01-20 15:05:58
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
    relationId: {
      type: STRING(64),
      allowNull: false,
      primaryKey: true,
      field: 'relation_id',
      defaultValue: UUIDV1,
      comment: '唯一值'
    },
    planFlowId: {
      type: STRING(64),
      field: 'plan_flow_id',
      allowNull: false,
      comment: '计划流程的id'
    },
    patrolObjId: {
      type: STRING(64),
      field: 'patrol_obj_id',
      allowNull: false,
      comment: '巡检对象id'
    },
    personIds: {
      type: STRING(1024),
      field: 'person_ids',
      allowNull: true,
      comment: '对象关联人员id集合'
    },
    isDelete: {
      type: INTEGER,
      field: 'is_delete',
      allowNull: false,
      defaultValue: 0,
      comment: '是否已被删除 0-未删除 1-已删除'
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
    }
  };
};
