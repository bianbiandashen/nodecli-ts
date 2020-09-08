/*
 * @作者: bianlian
 * @创建时间: 2019-12-10 20:47:07
 * @Last Modified by: bainlian
 * @Last Modified time: 2020-01-08 18:57:39
 */
// 任务巡检项表
'use strict';

module.exports = app => {
  const {
    STRING,
    DATE,
    UUIDV1,
    INTEGER
  } = app.Sequelize;

  return {
    problemId: {
      type: STRING(48),
      allowNull: false,
      primaryKey: true,
      defaultValue: UUIDV1,
      field: 'problem_id',
      comment: '问题表Id 唯一值'
    },
    patrolTaskItemId: {
      type: STRING(48),
      allowNull: false,
      defaultValue: UUIDV1,
      field: 'patrol_task_item_id',
      comment: '任务巡检项ID 唯一值'
    },
    ponitResultId: {
      type: STRING(48),
      allowNull: false,
      field: 'ponit_result_id',
      comment: '巡检结论表id'
    },
    patrolItemId: {
      type: STRING(48),
      allowNull: true,
      defaultValue: UUIDV1,
      field: 'patrol_item_id',
      comment: '巡检项ID'
    },
    patrolScore: {
      type: INTEGER(32),
      allowNull: false,
      field: 'patrol_score',
      comment: '巡检结果分数'
    },
    taskPointId: {
      type: STRING(48),
      allowNull: true,
      field: 'task_point_id',
      comment: '任务巡检点位Id'
    },
    patrolResult: {
      allowNull: true,
      type: STRING(256),
      field: 'patrol_result',
      comment: '暂定 但是现在由用户系统配置因此存成字符串方便回显 巡检结论：0-正常 1-异常2-待确定 3-无需处理'
    },
    resultDesc: {
      type: STRING(256),
      allowNull: true,
      field: 'result_desc',
      comment: '巡检备注'
    },
    recResult: {
      type: STRING(256),
      allowNull: true,
      field: 'rec_result',
      comment: '识别结果'
    },
    // resultScore: {
    //   type: INTEGER(32),
    //   allowNull: false,
    //   field: 'result_score',
    //   comment: '巡检结果分数'
    // },
    isRelPatrolPoint: {
      type: INTEGER(32),
      allowNull: true,
      field: 'is_rel_patrol_point',
      comment: '是否关联监测点'
    },
    referencePictures: {
      type: STRING(4096),
      allowNull: true,
      field: 'reference_pictures',
      comment: '参考图片url，逗号隔开'
    },
    execUser: {
      type: STRING(64),
      field: 'exec_user',
      allowNull: true,
      comment: '巡检执行人'
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
