/*
 * @Author: renxiaojian
 * @Date: 2019-12-11 11:18:16
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-02-25 17:13:53
 */

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
    parentRegionId: {
      type: STRING(64),
      field: 'parent_region_id',
      allowNull: true,
      comment: '区域父级id'
    },
    regionId: {
      type: STRING(64),
      field: 'region_id',
      allowNull: true,
      comment: '区域id'
    },
    modelDataId: {
      type: STRING(64),
      field: 'model_data_id',
      allowNull: true,
      comment: '模型id'
    },
    regionName: {
      type: STRING(64),
      field: 'region_name',
      allowNull: true,
      comment: '区域名称'
    },
    regionPath: {
      type: STRING(4096),
      field: 'region_path',
      allowNull: true,
      comment: '区域路径'
    },
    description: {
      type: STRING(64),
      field: 'description',
      allowNull: true,
      comment: '区域描述'
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
  };
};
