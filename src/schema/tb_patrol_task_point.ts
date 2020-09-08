/*
 * @Author: renxiaojian
 * @Date: 2019-12-11 11:18:16
 * @Last Modified by: bainlian
 * @Last Modified time: 2020-01-09 15:23:32
 */

'use strict'

module.exports = app => {
  const {
    STRING,
    INTEGER,
    DATE,
    UUIDV1,
    JSONB

  } = app.Sequelize

  return {
    patrolTaskPointId: {
      type: STRING(48),
      allowNull: false,
      primaryKey: true,
      field: 'patrol_task_point_id',
      defaultValue: UUIDV1,
      comment: '主键，任务巡检点ID'
    },
    pointName: {
      type: STRING(256),
      field: 'point_name',
      allowNull: true,
      comment: '巡检点位名称'
    },
    pointOrder: {
      type: INTEGER,
      field: 'point_order',
      allowNull: true,
      comment: '巡检点位排序号'
    },
    patrolTaskItemId: {
      type: STRING(48),
      field: 'patrol_task_item_id',
      allowNull: true,
      comment: '任务巡检项ID'
    },
    patrolTaskId: {
      type: STRING(48),
      field: 'patrol_task_id',
      allowNull: true,
      comment: '巡检任务ID'
    },
    patrolPointId: {
      type: STRING(48),
      field: 'patrol_point_id',
      allowNull: true,
      comment: '监测点ID'
    },
    patrolMethodId: {
      type: STRING(48),
      field: 'patrol_method_id',
      allowNull: true,
      comment: '巡检方法ID'
    },
    device_id: {
      type: STRING(256),
      field: 'exec_user',
      allowNull: true,
      comment: '设备ID'
    },
    cameraId: {
      type: STRING(48),
      field: 'camera_id',
      allowNull: true,
      comment: '监控点ID '
    },
    cameraPtz: {
      type: STRING(512),
      field: 'camera_ptz',
      allowNull: true,
      comment: '预置位PTZ值 '
    },
    cameraPreset: {
      type: STRING(48),
      field: 'camera_preset',
      allowNull: true,
      comment: '预置点编号 '
    },
    trackParams: {
      type: STRING(512),
      field: 'track_params',
      allowNull: true,
      comment: '轨道机参数 '
    },
    modelName: {
      type: STRING(256),
      field: 'model_name',
      allowNull: true,
      comment: '监控点模型名称 '
    },
    patrolResult: {
      type: STRING(256),
      field: 'patrol_result',
      allowNull: true,
      comment: '巡检结论：0-正常 1-异常2-待确定 99-社区中表暂存状态 '
    },
    eventType: {
      type: STRING(256),
      field: 'event_type',
      allowNull: true,
      comment: '事件类型标识/算法标识'
    },
    resultDesc: {
      type: STRING(256),
      field: 'result_desc',
      allowNull: true,
      comment: '巡检备注'
    },
    execType: {
      type: INTEGER(),
      allowNull: true,
      defaultValue: 1,
      field: 'exec_type',
      comment: '任务状态 1 - 自动巡检 2 - 人工在线巡检 3 - 移动线下巡检'
    },
    patrolScore: {
      type: INTEGER(),
      allowNull: true,
      defaultValue: 1,
      field: 'patrol_score',
      comment: '巡检分数'
    },
    patrolObjRelId: {
      type: STRING(48),
      allowNull: true,
      field: 'patrol_obj_rel_id',
      comment: '任务对象关系ID'
    },
    picUrl: {
      type: STRING(4096),
      field: 'pic_url',
      allowNull: true,
      comment: '抓拍图片'
    },
    execUser: {
      type: STRING(48),
      field: 'exec_user',
      allowNull: true,
      comment: '巡检执行人'
    },
    eventValue: {
      type: STRING(48),
      field: 'event_value',
      allowNull: true,
      comment: '事件结果值，如温度，风速等'
    },
    eventDesc: {
      type: STRING(48),
      field: 'event_desc',
      allowNull: true,
      comment: ''
    },
    extendColumn1: {
      type: STRING(48),
      field: 'extend_column_1',
      allowNull: true,
      comment: '扩展字段'
    },
    extendColumn2: {
      type: STRING(48),
      field: 'extend_column_2',
      allowNull: true,
      comment: '扩展字段'
    },
    extendColumn3: {
      type: STRING(48),
      field: 'extend_column_3',
      allowNull: true,
      comment: '扩展字段'
    },
    extendColumn4: {
      type: STRING(48),
      field: 'extend_column_4',
      allowNull: true,
      comment: '扩展字段'
    },
    extendColumn5: {
      type: STRING(48),
      field: 'extend_column_5',
      allowNull: true,
      comment: '扩展字段'
    },
    execResult: {
      type: JSONB,
      field: 'exec_result',
      allowNull: true,
      comment: '兜底字段'
    },
    execTime: {
      type: DATE,
      field: 'exec_time',
      allowNull: true,
      comment: '开始执行时间'
    },
    status: {
      type: INTEGER(32),
      allowNull: true,
      field: 'status',
      defaultValue: 0,
      comment: '状态 0-未开始 1-已完成'
    },
    submitTime: {
      type: DATE,
      field: 'submit_time',
      allowNull: true,
      comment: '结果提交时间'
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
  }
}
