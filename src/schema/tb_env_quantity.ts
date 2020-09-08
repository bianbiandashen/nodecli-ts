/*
 * @Author: songxiaodong
 * @Date: 2020-2-7 16:36:16
 * @Last Modified by: songxiaodong
 * @Last Modified time: 2020-2-7 16:36:16
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
    regionId: {
      type: STRING(64),
      field: 'region_id',
      allowNull: true,
      comment: '区域id'
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
    patrolObjId: {
      type: STRING(64),
      field: 'patrol_obj_id',
      allowNull: true,
      comment: '巡检对象ID'
    },
    itemId: {
      type: STRING(64),
      field: 'item_id',
      allowNull: true,
      comment: '巡检项ID'
    },
    deviceName: {
      type: STRING(64),
      field: 'device_name',
      allowNull: true,
      comment: '设备名称'
    },
    senserName: {
      type: STRING(64),
      field: 'senser_name',
      allowNull: true,
      comment: '传感器名称'
    },
    envName: {
      type: STRING(64),
      field: 'env_name',
      allowNull: true,
      comment: '环境量名称'
    },
    envType: {
      type: STRING(64),
      field: 'env_type',
      allowNull: true,
      comment: '环境量类型'
    },
    upLimit: {
      type: STRING(64),
      field: 'up_limit',
      allowNull: true,
      comment: '上限'
    },
    downLimit: {
      type: STRING(64),
      field: 'down_limit',
      allowNull: true,
      comment: '下限'
    },
    isDelete: {
      type: STRING(64),
      field: 'is_delete',
      allowNull: false,
      comment: '删除标志位（0：未删除，-1：已删除）'
    },
    updateUser: {
      type: STRING(64),
      field: 'update_user',
      allowNull: true,
      comment: '修改人'
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
    envExtend1: {
      type: STRING(64),
      field: 'env_extend_1',
      allowNull: true,
      comment: '扩展字段1'
    },
    envExtend2: {
      type: STRING(64),
      field: 'env_extend_2',
      allowNull: true,
      comment: '扩展字段2'
    },
    envExtend3: {
      type: STRING(64),
      field: 'env_extend_3',
      allowNull: true,
      comment: '扩展字段3'
    }
  };
};
