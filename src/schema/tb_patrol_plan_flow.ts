/*
 * @Author: renxiaojian
 * @Date: 2019-12-11 11:18:16
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-06-02 16:54:20
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
    planFlowId: {
      type: STRING(64),
      allowNull: false,
      primaryKey: true,
      field: 'plan_flow_id',
      defaultValue: UUIDV1,
      comment: '唯一值'
    },
    processId: {
      type: STRING(64),
      allowNull: true,
      field: 'process_id',
      comment: '巡检模板流程id'
    },
    patrolPlanId: {
      type: STRING(64),
      allowNull: true,
      field: 'patrol_plan_id',
      comment: '巡检计划id'
    },
    processType: {
      type: INTEGER,
      field: 'process_type',
      allowNull: true,
      comment: '流程类型 0：巡检，1：复合，2：整改，3：审核'
    },
    secondPersonOn: {
      type: INTEGER,
      field: 'second_person_on',
      allowNull: true,
      comment: '是否启用第二处理人'
    },
    inspectorAsReviewer: {
      type: INTEGER,
      field: 'inspector_as_reviewer',
      allowNull: true,
      comment: '是否巡检人作为复核人，0：否，1：是'
    },
    reviewerAsVerifier: {
      type: INTEGER,
      field: 'reviewer_as_verifier',
      allowNull: true,
      comment: '是否复核人作为审核人，0：否，1：是'
    },
    inspectorAsVerfier: {
      type: INTEGER,
      field: 'inspector_as_verifier',
      allowNull: true,
      comment: '是否巡检人作为审核人，0：否，1：是'
    },
    maxFirstConductor: {
      type: INTEGER,
      field: 'max_first_conductor',
      allowNull: true,
      comment: '第一处理人最大数'
    },
    maxSecondConductor: {
      type: INTEGER,
      field: 'max_second_conductor',
      allowNull: true,
      comment: '第二处理人最大数'
    },
    firstPersonIds: {
      type: STRING(1024),
      field: 'first_person_ids',
      allowNull: true,
      comment: '第一处理人id集合'
    },
    secondPersonIds: {
      type: STRING(1024),
      field: 'second_person_ids',
      allowNull: true,
      comment: '第二处理人id集合'
    },
    expireTime: {
      type: INTEGER,
      field: 'expire_time',
      allowNull: true,
      comment: '处理时效（分钟）'
    },
    executorAssignPattern: {
      type: INTEGER,
      allowNull: true,
      field: 'executor_assign_pattern',
      comment: '处理人指定方式 0计划中指定， 1 按角色配置'
    },
    executorAssignStrategy: {
      type: INTEGER,
      allowNull: true,
      field: 'executor_assign_strategy',
      comment: '处理人指定策略 0统一自定 ，1 按对象指定'
    },
    roleId: {
      type: STRING(1024),
      allowNull: true,
      field: 'role_id',
      comment: '巡检人角色ID集合'
    },
    regionIsolated: {
      type: INTEGER,
      allowNull: true,
      field: 'region_isolated',
      comment: '是否支持区域隔离，0否，1是'
    },
    submitterIds: {
      type: STRING(1024),
      allowNull: true,
      field: 'submitter_ids',
      comment: '提交人角色ID集合'
    },
    taskPersonStrategy: {
      type: INTEGER,
      allowNull: true,
      field: 'task_person_strategy',
      comment: '任务提交策略，0-执行人直接提交，1-指定提交人'
    },
    allowAdjustExecutor: {
      type: INTEGER,
      allowNull: true,
      field: 'allow_adjust_executor',
      comment: '允许调整执行人，0-否，1-是'
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
