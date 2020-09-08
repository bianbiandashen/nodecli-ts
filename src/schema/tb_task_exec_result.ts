/*
 * @作者: bianlian
 * @创建时间: 2019-12-10 20:47:07
 * @Last Modified by: jiangyan6
 * @Last Modified time: 2020-07-17 15:24:50
 */
// 任务巡检项表
'use strict'

module.exports = app => {
  const {
    STRING,
    DATE,
    UUIDV1,
    TEXT,
    INTEGER
  } = app.Sequelize

  return {
    pageJson: {
      type: TEXT,
      allowNull: true,
      field: 'page_json',
      comment: '用于存放动态表单的业务信息'
    },
    pointResultId: {
      type: STRING(48),
      allowNull: false,
      primaryKey: true,
      defaultValue: UUIDV1,
      field: 'point_result_id',
      comment: '主键id 唯一值'
    },
    taskPointId: {
      type: STRING(48),
      allowNull: true,
      field: 'task_point_id',
      comment: '任务巡检点位Id'
    },
    patrolTaskItemId: {
      type: STRING(48),
      allowNull: true,
      field: 'patrol_task_item_id',
      comment: '任务巡检项ID'
    },
    isIntoNextStep: {
      type: INTEGER(32),
      field: 'is_into_nextstep',
      allowNull: true,
      comment: '需要进入下一级 0-不进入 1-进入'
    },
    picUrls: {
      type: STRING(48),
      allowNull: true,
      // defaultValue: UUIDV1,
      field: 'pic_urls',
      comment: '巡检图片url，逗号隔开'
    },
    patrolResult: {
      type: STRING(48),
      allowNull: true,
      field: 'patrol_result',
      comment: '巡检结果'
    },
    status: {
      type: INTEGER(32),
      allowNull: true,
      field: 'status',
      defaultValue: 0,
      comment: '执行状态 0-未开始 1-已完成 2-执行错误 99-编辑保存状态'
    },
    patrolScore: {
      type: INTEGER(32),
      allowNull: true,
      field: 'patrol_score',
      comment: '巡检结果分数'
    },
    resultDesc: {
      type: STRING(256),
      allowNull: true,
      field: 'result_desc',
      comment: '巡检备注'
    },
    nextHandlePeople: {
      type: STRING(1024),
      field: 'next_handle_people',
      allowNull: true,
      comment: '下一处理人id，逗号分隔'
    },
    nextCopyPeople: {
      type: STRING(1024),
      field: 'next_copy_people',
      allowNull: true,
      comment: '下一抄送人id，逗号分隔'
    },
    recResult: {
      type: STRING(256),
      allowNull: true,
      field: 'rec_result',
      comment: '识别结果'
    },
    referencePictures: {
      type: STRING(4096),
      allowNull: true,
      field: 'reference_pictures',
      comment: '参考图片url，逗号隔开'
    },
    eventCode: {
      type: STRING(64),
      field: 'event_code',
      allowNull: true,
      comment: '事件码'
    },
    taskId: {
      type: STRING(64),
      field: 'task_id',
      allowNull: false,
      comment: '巡检任务id'
    },
    eventValue: {
      type: STRING(64),
      field: 'event_value',
      allowNull: true,
      comment: '事件值'
    },
    execUser: {
      type: STRING(48),
      field: 'exec_user',
      allowNull: true,
      comment: '执行用户'
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
