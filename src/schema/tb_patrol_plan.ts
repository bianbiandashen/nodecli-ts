/*
 * @Author: renxiaojian
 * @Date: 2019-12-11 11:18:16
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-07-06 16:38:43
 */

'use strict'

module.exports = app => {
  const {
    STRING,
    INTEGER,
    DATE,
    UUIDV1
  } = app.Sequelize

  return {
    patrolPlanId: {
      type: STRING(64),
      allowNull: false,
      primaryKey: true,
      defaultValue: UUIDV1,
      field: 'patrol_plan_id',
      comment: '唯一值'
    },
    patrolPlanName: {
      type: STRING(32),
      field: 'patrol_plan_name',
      allowNull: true,
      comment: '巡检计划名称'
    },
    psId: {
      type: STRING(64),
      field: 'ps_id',
      allowNull: true,
      comment: '巡检计划模板id'
    },
    patrolPlanStatus: {
      type: INTEGER,
      field: 'patrol_plan_status',
      allowNull: true,
      defaultValue: 1,
      comment: '巡检计划状态 0-停用 1-启用 2-已过期'
    },
    executeType: {
      type: STRING(64),
      field: 'execute_type',
      allowNull: true,
      comment: '任务执行方式 0-智能巡检 1-线上人工巡检 2-线下人工巡检'
    },
    isCmpelCode: {
      type: INTEGER,
      field: 'is_cmpel_code',
      allowNull: true,
      defaultValue: 0,
      comment: '是否强制扫码,1-是，0-否'
    },
    isCapture: {
      type: INTEGER,
      field: 'is_capture',
      allowNull: true,
      defaultValue: 0,
      comment: '是否启用抓图计划,1-是，0-否'
    },
    scoreStatus: {
      type: INTEGER,
      field: 'score_status',
      allowNull: true,
      defaultValue: 0,
      comment: '是否支持评分,1-是，0-否'
    },
    scoreNum: {
      type: INTEGER,
      field: 'score_num',
      allowNull: true,
      comment: '设置的总分'
    },
    patrolAreaIds: {
      type: STRING(1024),
      field: 'patrol_area_ids',
      allowNull: true,
      comment: '巡检区域id集合'
    },
    regionPath: {
      type: STRING(1024),
      field: 'region_path',
      allowNull: true,
      comment: '巡检区域全路径，@隔开'
    },
    onceEffective: {
      type: STRING(64),
      field: 'once_effective',
      allowNull: true,
      comment: '单次任务有效期'
    },
    planEffectiveStart: {
      type: STRING(64),
      field: 'plan_effective_start',
      allowNull: true,
      comment: '计划有效期开始时间'
    },
    planEffectiveEnd: {
      type: STRING(64),
      field: 'plan_effective_end',
      allowNull: true,
      comment: '计划有效期结束时间'
    },
    taskExecuteCycle: {
      type: INTEGER,
      field: 'task_execute_cycle',
      allowNull: true,
      comment: '任务执行周期 0-按天选择 1-每周 2-每月'
    },
    isHasContent: {
      type: INTEGER,
      field: 'is_has_content',
      allowNull: true,
      defaultValue: 1,
      comment: '无巡检内容 0-没有 1-所有（包含有和没有的）'
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
    }, createTimeZone: {
      type: STRING(64),
      field: 'create_time_zone',
      allowNull: true,
      comment: '创建时间时区'
    }, createTimeStamp: {
      type: STRING(64),
      field: 'create_time_stamp',
      allowNull: true,
      comment: '创建时间时间戳'
    }, updateTimeZone: {
      type: STRING(64),
      field: 'update_time_zone',
      allowNull: true,
      comment: '更新时间时区'
    }, updateTimeStamp: {
      type: STRING(64),
      field: 'update_time_stamp',
      allowNull: true,
      comment: '更新时间时间戳'
    }
  }
}
