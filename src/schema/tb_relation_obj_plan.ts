/*
 * @Author: renxiaojian
 * @Date: 2019-12-11 11:18:16
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-01-20 12:21:48
 */

'use strict';

module.exports = app => {
  const {
    STRING,
    INTEGER,
    DATE,
    UUIDV1
  } = app.Sequelize;

  return {
    uuid: {
      type: STRING(64),
      allowNull: false,
      primaryKey: true,
      defaultValue: UUIDV1,
      comment: '唯一值'
    },
    patrolPlanId: {
      type: STRING(64),
      field: 'patrol_plan_id',
      allowNull: false,
      comment: '巡检计划id'
    },
    patrolObjId: {
      type: STRING(64),
      field: 'patrol_obj_id',
      allowNull: false,
      comment: '巡检对象id'
    },
    itemId: {
      type: STRING(64),
      field: 'item_id',
      allowNull: true,
      comment: '巡检项id'
    },
    patrolPointId: {
      type: STRING(64),
      field: 'patrol_point_id',
      allowNull: true,
      comment: '关联监测点id'
    },
    objOrder: {
      type: INTEGER,
      field: 'obj_order',
      allowNull: false,
      comment: '对象排序'
    },
    groupId: {
      type: STRING(64),
      field: 'group_id',
      allowNull: true,
      comment: '巡检计划分组ID'
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
