'use strict';

module.exports = app => {
  const {
    STRING,
    DATE,
    UUIDV1
  } = app.Sequelize;

  return {
    uuid: {
      type: STRING(64),
      allowNull: false,
      primaryKey: true,
      defaultValue: UUIDV1,
      comment: '唯一值'
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
    version: {
      type: STRING(64),
      defaultValue: '1.0',
      comment: '版本号'
    },
    key: {
      type: STRING,
      allowNull: false,
      field: 'key',
      comment: '配置项的名称'
    },
    value: {
      type: STRING(32),
      allowNull: false,
      field: 'value',
      comment: '配置项的值'
    }
  };
};
