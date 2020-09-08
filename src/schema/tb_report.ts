/*
 * @Author: renxiaojian
 * @Date: 2020-01-17 16:22:46
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-03-31 14:09:34
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
    reportId: {
      type: STRING(64),
      allowNull: false,
      primaryKey: true,
      defaultValue: UUIDV1,
      field: 'report_id',
      comment: '唯一值'
    },
    patrolAreaIds: {
      type: STRING(64),
      field: 'patrol_area_ids',
      allowNull: true,
      comment: '区域Id'
    },
    regionPath: {
      type: STRING(1024),
      field: 'region_path',
      allowNull: true,
      comment: '区域路径'
    },
    patrolTaskIds: {
      type: STRING(4096),
      field: 'patrol_task_ids',
      allowNull: true,
      comment: '巡检任务ID集合'
    },
    reportCode: {
      type: STRING(64),
      field: 'report_code',
      allowNull: true,
      comment: '报告编号'
    },
    reportType: {
      type: INTEGER,
      field: 'report_type',
      allowNull: true,
      comment: '报告类型，1-日报，2-周报，3-月报，4-年报'
    },
    objNum: {
      type: INTEGER,
      field: 'obj_num',
      allowNull: true,
      comment: '巡检对象数量'
    },
    objTypeNum: {
      type: INTEGER,
      field: 'obj_type_num',
      allowNull: true,
      comment: '巡检对象类型数量'
    },
    patrolItemNum: {
      type: INTEGER,
      field: 'patrol_item_num',
      allowNull: true,
      comment: '巡检项数量'
    },
    problemNum: {
      type: INTEGER,
      field: 'problem_num',
      allowNull: true,
      comment: '问题数量'
    },
    noRectifyProblemNum: {
      type: INTEGER,
      field: 'no_rectify_problem_num',
      allowNull: true,
      comment: '未整改问题数量'
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
      allowNull: true,
      comment: '最后一次操作时间'
    },
    createTime: {
      type: DATE,
      allowNull: true,
      field: 'create_time',
      comment: '创建时间'
    },
    createTimeZone: {
      type: STRING(64),
      field: 'create_time_zone',
      allowNull: true,
      comment: '开始时间时区'
    },
    createTimeStamp: {
      type: INTEGER,
      field: 'create_time_stamp',
      allowNull: true,
      comment: '开始时间戳'
    },
    updateTimeZone: {
      type: STRING(64),
      field: 'update_time_zone',
      allowNull: true,
      comment: '更新时间时区'
    },
    updateTimeStamp: {
      type: INTEGER,
      field: 'update_time_stamp',
      allowNull: true,
      comment: '更新时间戳'
    }
  }
}
