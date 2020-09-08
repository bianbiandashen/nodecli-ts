/*
 * @Author: xionghaima
 * @Date: 2019-12-11 11:18:16
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-04-14 11:35:53
 */

'use strict';

module.exports = app => {
  const {
    STRING,
    INTEGER,
    DATE
  } = app.Sequelize;

  return {
    createdTime: {
      type: DATE,
      allowNull: false,
      field: 'create_time',
      comment: '创建时间'
    },
    updateTime: {
      type: DATE,
      allowNull: false,
      field: 'update_time',
      comment: '更新时间'
    },
    mId: {
      type: STRING(64),
      allowNull: false,
      field: 'm_id',
      comment: '主键，方法ID',
      primaryKey: true
    },
    mName: {
      type: STRING(256),
      allowNull: false,
      field: 'm_name',
      comment: '方法名称'
    },
    mType: {
      type: INTEGER(4),
      allowNull: false,
      field: 'm_type',
      comment: '巡检任务执行方式，0：智能巡检，1：线上人工巡检，2：线下人工巡检'
    },
    relateMonitorType: {
      type: STRING(64),
      allowNull: true,
      field: 'relate_monitor_type',
      comment: '关联监测点类型'
    },
    relateEventType: {
      type: STRING(1024),
      allowNull: true,
      field: 'relate_event_type',
      comment: '关联事件类型，使用事件id#事件类型名称表示， 多个用“，”逗号分隔 例如{111#temphigh,222#humhigh}'
    },
    pluginId: {
      type: STRING(256),
      allowNull: true,
      field: 'plugin_Id',
      comment: '插件包路径'
    },
    relateNfc: {
      type: INTEGER(2),
      allowNull: true,
      field: 'relate_nfc',
      comment: '是否关联nfc，0：否,1：是'
    },
    relateQrcode: {
      type: INTEGER(2),
      allowNull: true,
      field: 'relate_qrcode',
      comment: '是否关联二维码，0：否,1：是'
    },
    relateAccessPoint: {
      type: INTEGER(2),
      allowNull: true,
      field: 'relate_access_point',
      comment: '是否关联门禁点，0：否,1：是'
    },
    sustainable: {
      type: INTEGER(2),
      allowNull: true,
      field: 'sustainable',
      comment: ''
    },
    interval: {
      type: INTEGER(8),
      allowNull: true,
      field: 'interval',
      comment: ''
    },
    isNeedPic: {
      type: INTEGER(8),
      allowNull: true,
      field: 'is_need_pic',
      comment: ''
    },
    aiType: {
      type: STRING(16),
      allowNull: true,
      field: 'ai_type',
      comment: ''
    },
    isDelete: {
      type: INTEGER(2),
      allowNull: false,
      field: 'is_delete',
      comment: '是否已删除，0：否，-1：是'
    }
  };
};
