// 场景数据配置
'use strict';

module.exports = app => {
  const {
    DATE,
    STRING
  } = app.Sequelize;

  return {
    paramId: {
      type: STRING(48),
      allowNull: false,
      primaryKey: true,
      field: 'param_id',
      comment: '主键id 唯一值'
    },
    configDetail: {
      type: STRING(4096),
      allowNull: true,
      field: 'config_detail',
      comment: '配置详情'
    },
    appIdentify: {
      type: STRING(48),
      allowNull: true,
      field: 'app_identify',
      comment: '应用标识'
    },
    page: {
      type: STRING(48),
      allowNull: true,
      field: 'page',
      comment: '页面'
    },
    scene: {
      type: STRING(48),
      allowNull: true,
      field: 'scene',
      comment: '巡检任务处理方式 "byItem" or "byPoint"'
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
