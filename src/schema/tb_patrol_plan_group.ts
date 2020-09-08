/*
 * @Author: renxiaojian
 * @Date: 2020-01-20 09:27:26
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-06-28 14:38:14
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
    groupId: {
      type: STRING(64),
      allowNull: false,
      primaryKey: true,
      defaultValue: UUIDV1,
      field: 'group_id',
      comment: '唯一值'
    },
    patrolPlanId: {
      type: STRING(64),
      field: 'patrol_plan_id',
      allowNull: true,
      comment: '巡检计划id'
    },
    groupName: {
      type: STRING(64),
      field: 'group_name',
      allowNull: true,
      comment: '分组名称'
    },
    onceEffective: {
      type: INTEGER,
      field: 'once_effective',
      allowNull: true,
      comment: '单次任务有效期—分组时间'
    },
    taskExecuteCycle: {
      type: INTEGER,
      field: 'task_execute_cycle',
      allowNull: true,
      comment: '任务执行周期 0-按天选择 1-每周 2-每月'
    },
    isDelete: {
      type: INTEGER,
      field: 'is_delete',
      allowNull: true,
      comment: '是否已被删除 0-未删除 1-已删除'
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
