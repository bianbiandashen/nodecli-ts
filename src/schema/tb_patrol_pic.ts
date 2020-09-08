/*
 * @作者: songxiaodong
 * @创建时间: 2019-12-11 20:34:47
 * @Last Modified by: xionghaima
 * @Last Modified time: 2020-01-16 17:50:49
 */

'use strict';

module.exports = app => {
  const {
    STRING,
    DATE,
    UUIDV1
  } = app.Sequelize;

  return {
    picId: {
      type: STRING(48),
      allowNull: false,
      primaryKey: true,
      defaultValue: UUIDV1,
      comment: '主键 图片ID',
      field: 'pic_id'
    },
    picUrl: {
      type: STRING(256),
      allowNull: true,
      comment: '图片url',
      field: 'pic_url'
    },
    taskPointId: {
      type: STRING(48),
      allowNull: true,
      comment: '检测点id',
      field: 'task_point_id'
    },
    cameraId: {
      type: STRING(48),
      allowNull: true,
      comment: '摄像头id',
      field: 'camera_id'
    },
    createTime: {
      type: DATE,
      allowNull: true,
      comment: '创建时间',
      field: 'create_time'
    },
    updateTime: {
      type: DATE,
      allowNull: true,
      comment: '更新时间',
      field: 'update_time'
    }

  };
};
