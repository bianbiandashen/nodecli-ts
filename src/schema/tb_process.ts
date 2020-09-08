/*
 * @作者: bianlian
 * @创建时间: 2019-12-12 11:32:02
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-06-11 15:36:24
 */

'use strict'

module.exports = app => {
  const { STRING, DATE, UUIDV1, INTEGER } = app.Sequelize
  // 应用流程配置表
  return {
    processId: {
      type: STRING(64),
      allowNull: false,
      primaryKey: true,
      defaultValue: UUIDV1,
      field: 'process_id',
      comment: '计划流程ID'
    },
    psId: {
      type: STRING(64),
      allowNull: false,
      field: 'ps_id',
      comment: '计划模板ID'
    },
    processType: {
      type: INTEGER,
      allowNull: false,
      field: 'process_type',
      comment: '流程类型，0：巡检，1：复合，2：整改，3：审核'
    },
    transactionStatus: {
      type: INTEGER,
      allowNull: false,
      field: 'transaction_status',
      comment: '状态： 1 待复核 2 待整改 3 待审核'
    },
    executeType: {
      type: INTEGER,
      allowNull: false,
      field: 'execute_type',
      comment: '执行方式，0：智能巡检,，1：线上人工巡检，2：线下人工巡检'
    },
    secondPersonOn: {
      type: INTEGER,
      allowNull: false,
      field: 'second_person_on',
      comment: '执行方式，0：智能巡检,，1：线上人工巡检，2：线下人工巡检'
    },
    inspectorAsReviewer: {
      type: INTEGER,
      allowNull: false,
      field: 'inspector_as_reviewer',
      comment: '是否巡检人作为复核人，0：否，1：是'
    },
    reviewerAsVerifier: {
      type: INTEGER,
      allowNull: false,
      field: 'reviewer_as_verifier',
      comment: '是否复核人作为审核人，0：否，1：是'
    },
    inspectorAsVerfier: {
      type: INTEGER,
      allowNull: false,
      field: 'inspector_as_verfier',
      comment: '是否巡检人作为复核人，0：否，1：是'
    },
    maxFirstConductor: {
      type: INTEGER,
      allowNull: false,
      field: 'max_first_conductor',
      comment: '是否巡检人作为复核人，0：否，1：是'
    },
    maxSecondConductor: {
      type: INTEGER,
      allowNull: false,
      field: 'max_second_conductor',
      comment: '是否巡检人作为复核人，0：否，1：是'
    },
    expireTime: {
      type: INTEGER,
      allowNull: false,
      field: 'expire_time',
      comment: '处理时效时（分钟）'
    },
    extraNextPersonOn: {
      type: INTEGER,
      allowNull: false,
      field: 'extra_next_person_on',
      comment: '额外指定下一级执行人 0 否 1是'
    },
    executorAssignPattern: {
      type: INTEGER,
      allowNull: false,
      field: 'executor_assign_pattern',
      comment: '处理人指定方式 0计划中指定， 1 按角色配置'
    },
    executorAssignStrategy: {
      type: INTEGER,
      allowNull: false,
      field: 'executor_assign_strategy',
      comment: '处理人指定策略 0统一自定 ，1 按对象指定'
    },
    roleId: {
      type: STRING(64),
      allowNull: false,
      field: 'role_id',
      comment: '角色ID'
    },
    regionIsolated: {
      type: INTEGER,
      allowNull: false,
      field: 'region_isolated',
      comment: '是否支持区域隔离，0否，1是'
    },
    allowAdjustExecutor: {
      type: INTEGER,
      allowNull: false,
      field: 'allow_adjust_executor',
      comment: '允许调整执行人，0-否，1-是'
    },
    taskSubmitStrategy: {
      type: INTEGER,
      allowNull: false,
      field: 'task_submit_strategy',
      comment: '任务提交策略，0-无提交按钮，1-有提交按钮'
    },
    taskPersonStrategy: {
      type: INTEGER,
      field: 'task_person_strategy',
      allowNull: false,
      comment: '任务提交策略，0-执行人直接提交，1-指定提交人'
    },
    taskResultEditable: {
      type: INTEGER,
      field: 'task_result_editable',
      allowNull: false,
      comment: '任务是否可编辑 0-否 1-是'
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
    }
  }
}
