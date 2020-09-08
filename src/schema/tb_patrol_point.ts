/*
 * @Author: renxiaojian
 * @Date: 2019-12-11 11:18:16
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-06-04 09:38:35
 */

'use strict'

module.exports = app => {
  const { STRING, INTEGER, DATE, UUIDV1, JSONB } = app.Sequelize

  return {
    patrolPointId: {
      type: STRING(48),
      allowNull: false,
      primaryKey: true,
      field: 'patrol_point_id',
      defaultValue: UUIDV1,
      comment: '主键，巡检点ID'
    },
    pointName: {
      type: STRING(256),
      field: 'point_name',
      allowNull: false,
      comment: '巡检点位名称'
    },
    pointOrder: {
      type: INTEGER,
      field: 'point_order',
      allowNull: true,
      comment: '巡检点位排序号'
    },
    patrolItemId: {
      type: STRING(48),
      field: 'patrol_item_id',
      allowNull: false,
      comment: '巡检项ID'
    },
    patrolObjId: {
      type: STRING(48),
      field: 'patrol_obj_id',
      allowNull: false,
      comment: '巡检对象ID'
    },
    patrolMethodId: {
      type: STRING(48),
      field: 'patrol_method_id',
      allowNull: false,
      comment: '巡检方法ID'
    },
    execUser: {
      type: STRING(256),
      field: 'exec_user',
      allowNull: true,
      comment: '执行人'
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
    picUrl: {
      type: STRING(4096),
      field: 'pic_url',
      allowNull: true,
      comment: '抓拍图片'
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
    },
    isDelete: {
      type: INTEGER,
      allowNull: false,
      field: 'is_delete',
      comment: '是否已删除（0：未删除，-1：已删除）'
    },
    deviceId: {
      type: STRING(48),
      field: 'device_id',
      allowNull: true,
      comment: '设备ID'
    },
    orbitalId: {
      type: STRING(48),
      field: 'orbital_id',
      allowNull: true,
      comment: '轨道机ID'
    },
    execType: {
      type: INTEGER,
      field: 'exec_type',
      allowNull: true,
      comment: '执行类型'
    },
    cameraName: {
      type: STRING(64),
      allowNull: true,
      field: 'camera_name',
      comment: '监控点名称'
    }
  }
}
